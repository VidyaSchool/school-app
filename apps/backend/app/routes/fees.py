import base64
import hashlib
import hmac
import json
import os
import struct
import uuid
import zlib
from datetime import datetime, timedelta, timezone

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)
from typing import Any, Dict, Optional
from urllib import error as urllib_error
from urllib import request as urllib_request
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.core.fees import build_default_fee_installments
from app.core.schemas import PayFeesRequest
from models import FeeInstallment, User, UserProfile, Session as DbSession

router = APIRouter()

def _read_secret(name: str) -> str | None:
    """Read from env var first, then Render secret file fallback."""
    val = os.getenv(name)
    if val:
        return val
    try:
        with open(f"/etc/secrets/{name}") as f:
            return f.read().strip() or None
    except OSError:
        return None


def _get_razorpay_creds():
    return _read_secret("RAZORPAY_KEY_ID"), _read_secret("RAZORPAY_KEY_SECRET")


def generate_receipt_qr_data_url(payload: str) -> str:
    width = 160
    height = 160
    payload_bytes = payload.encode("utf-8")
    pixels: list[list[int]] = []

    for y in range(height):
        row: list[int] = []
        for x in range(width):
            seed = (x * 23 + y * 17 + sum(payload_bytes)) % 31
            dark = seed < 11 or ((x + y) % 7 == 0 and (seed % 5) == 0)
            row.extend([0, 0, 0] if dark else [255, 255, 255])
        pixels.append(row)

    png_bytes = _build_png(width, height, pixels)
    return "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")


def _build_png(width: int, height: int, pixels: list[list[int]]) -> bytes:
    raw = b"".join(b"\x00" + bytes(row) for row in pixels)
    compressed = zlib.compress(raw)

    def chunk(chunk_type: bytes, data: bytes) -> bytes:
        return struct.pack("!I", len(data)) + chunk_type + data + struct.pack("!I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack("!IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", compressed)
        + chunk(b"IEND", b"")
    )


def _serialize_installment(inst: FeeInstallment) -> dict[str, Any]:
    qr_data_url = None
    if inst.status == "paid" and inst.receipt_no:
        qr_data_url = generate_receipt_qr_data_url(f"{inst.receipt_no}|{inst.user_id}|{inst.month}-{inst.year}")

    return {
        "id": inst.id,
        "user_id": inst.user_id,
        "month": inst.month,
        "year": inst.year,
        "amount": inst.amount,
        "due_date": inst.due_date.isoformat() if inst.due_date else None,
        "status": inst.status,
        "paid_date": inst.paid_date.isoformat() if inst.paid_date else None,
        "receipt_no": inst.receipt_no,
        "payment_method": inst.payment_method,
        "created_at": inst.created_at.isoformat() if inst.created_at else None,
        "updated_at": inst.updated_at.isoformat() if inst.updated_at else None,
        "qr_data_url": qr_data_url,
    }


def _mark_installments_paid(db: Session, installments: list[FeeInstallment], payment_method: str, receipt_no: str | None = None) -> dict[str, Any]:
    receipt_no = receipt_no or f"REC-2026-{uuid.uuid4().hex[:6].upper()}"
    paid_date = datetime.utcnow().date()

    for inst in installments:
        if inst.status == "paid":
            continue
        inst.status = "paid"
        inst.paid_date = paid_date
        inst.receipt_no = receipt_no
        inst.payment_method = payment_method
        inst.updated_at = datetime.utcnow()
        db.add(inst)

    db.commit()
    return {"success": True, "receipt_no": receipt_no, "paid_date": paid_date}


def _create_razorpay_order(amount: int, receipt: str, notes: dict[str, Any] | None = None) -> dict[str, Any]:
    RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET = _get_razorpay_creds()
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        return {
            "order_id": f"mock_order_{uuid.uuid4().hex[:12]}",
            "amount": amount,
            "currency": "INR",
            "mock_payment": True,
            "detail": "Using mock payment mode.",
        }

    if amount < 100:
        raise HTTPException(status_code=400, detail="Minimum Razorpay amount is 100 paise")

    payload_dict = {"amount": amount, "currency": "INR", "receipt": receipt}
    if notes:
        payload_dict["notes"] = notes
    payload = json.dumps(payload_dict).encode("utf-8")
    auth = base64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode("utf-8")).decode("utf-8")
    request = urllib_request.Request(
        "https://api.razorpay.com/v1/orders",
        data=payload,
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib_request.urlopen(request, timeout=10) as response:
            resp_data = json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        if exc.code == 401:
            return {
                "order_id": f"mock_order_{uuid.uuid4().hex[:12]}",
                "amount": amount,
                "currency": "INR",
                "mock_payment": True,
                "detail": "Using mock payment mode because Razorpay credentials are not accepted in this environment.",
            }
        raise HTTPException(status_code=500, detail=f"Razorpay order creation failed: {detail}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Razorpay order creation failed: {str(exc)}") from exc

    return {"order_id": resp_data.get("id"), "amount": resp_data.get("amount"), "currency": resp_data.get("currency")}


@router.get("/api/fees/receipt/{receipt_no}")
def verify_receipt(receipt_no: str, db: Session = Depends(get_db)):
    inst = db.query(FeeInstallment).filter(FeeInstallment.receipt_no == receipt_no, FeeInstallment.status == "paid").first()
    if not inst:
        raise HTTPException(status_code=404, detail="Receipt not found")
    user = db.query(User).filter(User.id == inst.user_id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == inst.user_id).first()
    return {
        "receipt_no": inst.receipt_no,
        "student_name": user.name if user else "Unknown",
        "username": profile.username if profile else None,
        "admission_number": profile.admission_number if profile else None,
        "class": profile.class_ if profile else None,
        "section": profile.section if profile else None,
        "month": inst.month,
        "year": inst.year,
        "amount": inst.amount,
        "paid_date": inst.paid_date.isoformat() if inst.paid_date else None,
        "payment_method": inst.payment_method,
        "status": inst.status,
    }


def calculate_student_net_monthly_fee(user_id: str, db: Session) -> int:
    from models import UserProfile
    import json

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    class_str = profile.class_ if (profile and profile.class_ and profile.class_ != "none") else "10"

    structure_row = _get_or_init_structure_by_key(class_str, db)
    components = json.loads(structure_row.components) if structure_row else []

    base_monthly = 0
    for comp in components:
        amt = int(comp.get("amount", 0))
        period = comp.get("billingPeriod", "Monthly")
        if period == "Monthly":
            base_monthly += amt
        elif period == "Quarterly":
            base_monthly += round(amt / 3)
        elif period == "Annually":
            base_monthly += round(amt / 12)

    uses_transport = is_transport_user(profile.transport_mode if profile else None)
    transport_fee = structure_row.transport_fee if (uses_transport and structure_row) else 0

    return base_monthly + transport_fee


@router.get("/api/fees")
def get_my_fees(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    net_monthly = calculate_student_net_monthly_fee(user.id, db)
    installments = db.query(FeeInstallment).filter(FeeInstallment.user_id == user.id).order_by(FeeInstallment.due_date).all()
    
    if not installments:
        from app.core.fees import ACADEMIC_MONTHS
        from datetime import date as _date
        current_year = datetime.utcnow().year
        installments = []
        for idx, month in enumerate(ACADEMIC_MONTHS, start=1):
            inst = FeeInstallment(
                id=str(uuid.uuid4()),
                user_id=user.id,
                month=month,
                year=str(current_year),
                amount=net_monthly,
                due_date=_date(current_year, idx, 10),
                status="pending",
            )
            installments.append(inst)
        db.add_all(installments)
        db.commit()
    else:
        # Sync pending/overdue installment amounts to net_monthly
        updated = False
        for inst in installments:
            if inst.status != "paid" and inst.amount != net_monthly:
                inst.amount = net_monthly
                db.add(inst)
                updated = True
        if updated:
            db.commit()

    return [_serialize_installment(inst) for inst in installments]


@router.post("/api/fees/pay")
def pay_fees(req: PayFeesRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    installment_ids = req.installment_ids
    installments = db.query(FeeInstallment).filter(
        FeeInstallment.id.in_(installment_ids),
        FeeInstallment.user_id == user.id,
    ).all()

    if not installments:
        raise HTTPException(status_code=404, detail="Installments not found")

    return _mark_installments_paid(db, installments, req.payment_method or "Card / Online")


@router.post("/api/create-order")
def create_order(payload: dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    installment_ids = payload.get("installment_ids") or []
    amount = payload.get("amount")
    receipt = payload.get("receipt") or f"FEE-{user.id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    receipt = receipt[:40]

    if not isinstance(installment_ids, list) or not installment_ids:
        raise HTTPException(status_code=400, detail="Select at least one installment")

    installments = db.query(FeeInstallment).filter(
        FeeInstallment.id.in_(installment_ids),
        FeeInstallment.user_id == user.id,
    ).all()

    if len(installments) != len(installment_ids):
        raise HTTPException(status_code=404, detail="Selected installments were not found")

    if amount is None:
        raise HTTPException(status_code=400, detail="Missing amount")

    try:
        amount_value = int(amount)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Amount must be a number") from exc

    notes = {
        "installment_ids": ",".join(map(str, installment_ids)),
        "user_id": str(user.id),
    }
    order = _create_razorpay_order(amount_value, receipt, notes)
    return {
        **order,
        "receipt": receipt,
        "installment_ids": installment_ids,
        "key_id": _get_razorpay_creds()[0],
    }


@router.post("/api/verify-payment")
def verify_payment(payload: dict[str, Any], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _, RAZORPAY_KEY_SECRET = _get_razorpay_creds()
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay secret is not configured")

    order_id = payload.get("order_id")
    payment_id = payload.get("payment_id")
    signature = payload.get("signature")
    installment_ids = payload.get("installment_ids") or []

    if not order_id or not payment_id or not signature or not installment_ids:
        raise HTTPException(status_code=400, detail="Missing payment verification fields")

    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        f"{order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=400, detail="Payment signature mismatch")

    installments = db.query(FeeInstallment).filter(
        FeeInstallment.id.in_(installment_ids),
        FeeInstallment.user_id == user.id,
    ).all()

    if not installments:
        raise HTTPException(status_code=404, detail="Installments not found")

    return _mark_installments_paid(db, installments, payload.get("payment_method", "Razorpay"))


@router.post("/api/razorpay/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")
    _, key_secret = _get_razorpay_creds()
    RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET") or key_secret

    if not RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay webhook secret is not configured")

    expected_signature = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=400, detail="Webhook signature mismatch")

    try:
        body_json = json.loads(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc

    event = body_json.get("event")
    if event in ("order.paid", "payment.captured"):
        # Try to get notes from order, then payment
        order_entity = body_json.get("payload", {}).get("order", {}).get("entity", {})
        payment_entity = body_json.get("payload", {}).get("payment", {}).get("entity", {})
        notes = order_entity.get("notes") or payment_entity.get("notes") or {}
        
        installment_ids_str = notes.get("installment_ids")
        if installment_ids_str:
            try:
                installment_ids = [int(i.strip()) for i in installment_ids_str.split(",") if i.strip()]
            except (ValueError, TypeError):
                installment_ids = []
            
            if installment_ids:
                installments = db.query(FeeInstallment).filter(
                    FeeInstallment.id.in_(installment_ids)
                ).all()
                if installments:
                    payment_id = payment_entity.get("id") or "Webhook"
                    payment_method = payment_entity.get("method") or "Razorpay"
                    _mark_installments_paid(
                        db,
                        installments,
                        payment_method=f"{payment_method} (Webhook: {payment_id})"
                    )

    return {"received": True}


@router.get("/api/admin/fees/{student_id}")
def get_student_fees(student_id: str, admin: User = Depends(require_role(["admin", "account"])), db: Session = Depends(get_db)):
    installments = db.query(FeeInstallment).filter(FeeInstallment.user_id == student_id).order_by(FeeInstallment.due_date).all()
    return [_serialize_installment(inst) for inst in installments]


from pydantic import BaseModel as AdminPayFeesBaseModel

class AdminPayFeesRequest(AdminPayFeesBaseModel):
    student_id: str
    installment_ids: list[str]
    payment_method: str

@router.post("/api/admin/fees/pay")
def admin_pay_fees(req: AdminPayFeesRequest, admin: User = Depends(require_role(["admin", "account"])), db: Session = Depends(get_db)):
    installments = db.query(FeeInstallment).filter(
        FeeInstallment.id.in_(req.installment_ids),
        FeeInstallment.user_id == req.student_id,
    ).all()

    if not installments:
        raise HTTPException(status_code=404, detail="Installments not found")

    receipt_no = f"REC-2026-{uuid.uuid4().hex[:6].upper()}"
    return _mark_installments_paid(db, installments, req.payment_method, receipt_no)


@router.get("/api/admin/fee-management")
def get_fee_management(
    admin: User = Depends(require_role(["admin", "account"])),
    db: Session = Depends(get_db)
):
    results = db.query(FeeInstallment, User, UserProfile).join(
        User, FeeInstallment.user_id == User.id
    ).join(
        UserProfile, User.id == UserProfile.user_id
    ).all()
    
    installments = []
    for inst, u, p in results:
        installments.append({
            "id": inst.id,
            "amount": inst.amount,
            "status": inst.status,
            "month": inst.month,
            "year": inst.year,
            "dueDate": inst.due_date.isoformat() if inst.due_date else None,
            "paidDate": inst.paid_date.isoformat() if inst.paid_date else None,
            "paymentMethod": inst.payment_method,
            "studentName": u.name,
            "studentId": u.id,
            "class": p.class_,
            "section": p.section,
        })
        
    return installments



# ─── Default fee amounts per class (tuition only) ──────────────────────────
CLASSES_ORDER = ["Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
_DEFAULT_CLASS_FEES_BY_KEY = {
    "Nursery": 6000,
    "KG": 6000,
    "1": 8000, "2": 8000, "3": 8000, "4": 8000, "5": 8000,
    "6": 10000, "7": 10000, "8": 10000,
    "9": 12000, "10": 12000,
    "11": 15000, "12": 15000,
}
_CLASS_KEY_TO_NUM = {
    "Nursery": -1,
    "KG": 0,
    **{str(i): i for i in range(1, 13)}
}
_CLASS_NUM_TO_KEY = {v: k for k, v in _CLASS_KEY_TO_NUM.items()}
_DEFAULT_TRANSPORT_FEE = 2000


def is_transport_user(transport_mode: Optional[str]) -> bool:
    """Return True ONLY if transport_mode explicitly indicates school transport (bus/van/school_transport).
    Returns False for walking, walk, self, self_transport, foot, none, empty or null."""
    if not transport_mode:
        return False
    mode = str(transport_mode).strip().lower()
    non_transport_modes = {
        "none", "", "walking", "walk", "self", "self_transport",
        "self transport", "on_foot", "foot", "private", "no", "personal"
    }
    return mode not in non_transport_modes


def _serialize_structure(row) -> dict:
    import json
    key = getattr(row, "class_name", None) or _CLASS_NUM_TO_KEY.get(row.class_num, str(row.class_num))
    return {
        "classKey": key,
        "classNum": row.class_num,
        "className": f"Class {key}" if key.isdigit() else key,
        "components": json.loads(row.components),
        "transportFee": row.transport_fee,
        "updatedAt": row.updated_at.isoformat() + "Z",
    }


def _get_or_init_structure_by_key(class_key: str, db: Session):
    from models import FeeStructure
    import json, uuid as _uuid
    num = _CLASS_KEY_TO_NUM.get(str(class_key), 10)
    row = db.query(FeeStructure).filter(
        (FeeStructure.class_name == str(class_key)) | (FeeStructure.class_num == num)
    ).first()
    if row:
        return row

    tuition = _DEFAULT_CLASS_FEES_BY_KEY.get(str(class_key), 8000)
    default_components = [
        {"id": f"c{class_key}-1", "name": "Tuition Fee", "amount": tuition, "billingPeriod": "Monthly"},
        {"id": f"c{class_key}-2", "name": "Computing & Activity Access", "amount": 500, "billingPeriod": "Monthly"},
        {"id": f"c{class_key}-3", "name": "Co-Curricular Activities", "amount": 1000, "billingPeriod": "Monthly"},
        {"id": f"c{class_key}-4", "name": "Examination Fee", "amount": 1500, "billingPeriod": "Quarterly"},
    ]
    row = FeeStructure(
        id=str(_uuid.uuid4()),
        class_num=num,
        class_name=str(class_key),
        components=json.dumps(default_components),
        transport_fee=_DEFAULT_TRANSPORT_FEE,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _get_or_init_structure(class_num: int, db: Session):
    key = _CLASS_NUM_TO_KEY.get(class_num, str(class_num))
    return _get_or_init_structure_by_key(key, db)


@router.get("/api/admin/fee-structures")
def get_fee_structures(admin: User = Depends(require_role(["admin", "account"])), db: Session = Depends(get_db)):
    """Return fee structure config for all classes (Nursery, KG, 1-12) in 1 single optimized DB query."""
    from models import FeeStructure
    import json, uuid as _uuid

    existing_rows = db.query(FeeStructure).all()
    by_key = {}
    for r in existing_rows:
        key = getattr(r, "class_name", None) or _CLASS_NUM_TO_KEY.get(r.class_num, str(r.class_num))
        by_key[key] = r

    result = []
    to_create = []
    for class_key in CLASSES_ORDER:
        row = by_key.get(class_key)
        if not row:
            num = _CLASS_KEY_TO_NUM.get(class_key, 10)
            tuition = _DEFAULT_CLASS_FEES_BY_KEY.get(class_key, 8000)
            default_components = [
                {"id": f"c{class_key}-1", "name": "Tuition Fee", "amount": tuition, "billingPeriod": "Monthly"},
                {"id": f"c{class_key}-2", "name": "Computing & Activity Access", "amount": 500, "billingPeriod": "Monthly"},
                {"id": f"c{class_key}-3", "name": "Co-Curricular Activities", "amount": 1000, "billingPeriod": "Monthly"},
                {"id": f"c{class_key}-4", "name": "Examination Fee", "amount": 1500, "billingPeriod": "Quarterly"},
            ]
            row = FeeStructure(
                id=str(_uuid.uuid4()),
                class_num=num,
                class_name=class_key,
                components=json.dumps(default_components),
                transport_fee=_DEFAULT_TRANSPORT_FEE,
            )
            to_create.append(row)
            by_key[class_key] = row

        result.append(_serialize_structure(row))

    if to_create:
        db.add_all(to_create)
        db.commit()

    return result


class SaveFeeStructureRequest(BaseModel):
    components: list = []
    transportFee: int = 0


@router.put("/api/admin/fee-structures/{class_id}")
def save_fee_structure(
    class_id: str,
    body: SaveFeeStructureRequest,
    admin: User = Depends(require_role(["admin", "account"])),
    db: Session = Depends(get_db),
):
    """Save (overwrite) the fee structure for a specific class (Nursery, KG, 1..12) and auto-update student fee installments."""
    import json
    from models import FeeStructure

    num = _CLASS_KEY_TO_NUM.get(str(class_id), 10)
    row = db.query(FeeStructure).filter(
        (FeeStructure.class_name == str(class_id)) | (FeeStructure.class_num == num)
    ).first()

    if not row:
        row = _get_or_init_structure_by_key(str(class_id), db)

    row.components = json.dumps(body.components)
    row.transport_fee = body.transportFee
    row.class_name = str(class_id)
    row.updated_at = datetime.utcnow()
    db.add(row)
    db.commit()
    db.refresh(row)

    # Auto-apply updated fee structure to all students in this class
    try:
        apply_req = ApplyFeeStructureRequest(classKeys=[str(class_id)])
        apply_fee_structures(body=apply_req, admin=admin, db=db)
    except Exception as exc:
        print(f"Auto-apply fee structure failed for class {class_id}: {exc}")

    return _serialize_structure(row)


class ApplyFeeStructureRequest(BaseModel):
    classKeys: list[str] = []   # e.g. ["Nursery", "KG", "10"]
    classNums: list[int] = []   # legacy compatibility
    year: Optional[str] = None  # e.g. "2026"


@router.post("/api/admin/fee-structures/apply")
def apply_fee_structures(
    body: ApplyFeeStructureRequest,
    admin: User = Depends(require_role(["admin", "account"])),
    db: Session = Depends(get_db),
):
    """
    Generate / update monthly FeeInstallment rows for every student whose class matches target classes.
    Uses BATCH database queries for maximum performance.
    """
    import json
    from models import FeeStructure

    target_classes = body.classKeys if body.classKeys else [str(c) for c in body.classNums]
    if not target_classes:
        target_classes = CLASSES_ORDER

    current_year = int(body.year) if body.year else datetime.utcnow().year

    # Load structures in ONE query
    existing_structures = db.query(FeeStructure).all()
    structures = {}
    for r in existing_structures:
        key = getattr(r, "class_name", None) or _CLASS_NUM_TO_KEY.get(r.class_num, str(r.class_num))
        structures[key] = r

    # Get all target students with profiles in ONE query
    results = (
        db.query(User, UserProfile)
        .join(UserProfile, User.id == UserProfile.user_id)
        .filter(User.role == "student", UserProfile.class_.in_(target_classes))
        .all()
    )

    if not results:
        return {"success": True, "studentsProcessed": 0, "installmentsCreated": 0, "installmentsUpdated": 0}

    student_ids = [u.id for u, _ in results]

    # Batch fetch existing installments for all students in ONE query
    existing_installments_list = (
        db.query(FeeInstallment)
        .filter(
            FeeInstallment.user_id.in_(student_ids),
            FeeInstallment.year == str(current_year)
        )
        .all()
    )

    # Index existing installments by (user_id, month)
    existing_map = {(inst.user_id, inst.month): inst for inst in existing_installments_list}

    from app.core.fees import ACADEMIC_MONTHS
    from datetime import date as _date

    to_add = []
    created_count = 0
    updated_count = 0

    for u, profile in results:
        class_str = profile.class_
        row = structures.get(class_str)
        if not row:
            try:
                row = _get_or_init_structure_by_key(class_str, db)
                structures[class_str] = row
            except Exception:
                continue

        components = json.loads(row.components)
        uses_transport = is_transport_user(profile.transport_mode)

        monthly_amount = 0
        for comp in components:
            amt = int(comp.get("amount", 0))
            period = comp.get("billingPeriod", "Monthly")
            if period == "Monthly":
                monthly_amount += amt
            elif period == "Quarterly":
                monthly_amount += round(amt / 3)
            elif period == "Annually":
                monthly_amount += round(amt / 12)

        if uses_transport:
            monthly_amount += row.transport_fee

        if monthly_amount <= 0:
            continue

        for idx, month in enumerate(ACADEMIC_MONTHS, start=1):
            due = _date(current_year, idx, 10)
            existing = existing_map.get((u.id, month))
            if existing:
                if existing.status == "paid":
                    continue
                existing.amount = monthly_amount
                existing.due_date = due
                existing.updated_at = datetime.utcnow()
                db.add(existing)
                updated_count += 1
            else:
                inst = FeeInstallment(
                    id=str(uuid.uuid4()),
                    user_id=u.id,
                    month=month,
                    year=str(current_year),
                    amount=monthly_amount,
                    due_date=due,
                    status="pending",
                )
                to_add.append(inst)
                created_count += 1

    if to_add:
        db.add_all(to_add)

    db.commit()

    # Send notifications to students whose class fee structures updated
    from main import send_notification_to_user
    for u, profile in results:
        try:
            title = "Fee Structure Updated"
            body = f"The academic fee structure for Class {profile.class_} has been updated. Please review your pending installments in the Fee module."
            # We run this asynchronously using the existing helper which logs history and sends FCM/Socket
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.ensure_future(send_notification_to_user(u.id, title, body, db))
                else:
                    loop.run_until_complete(send_notification_to_user(u.id, title, body, db))
            except RuntimeError:
                pass  # No event loop available, skip notification
        except Exception as notif_err:
            print(f"Failed to send update notification to user {u.id}: {notif_err}")

    return {
        "success": True,
        "studentsProcessed": len(results),
        "installmentsCreated": created_count,
        "installmentsUpdated": updated_count,
    }


@router.get("/api/student/fee-breakdown")
def get_student_fee_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return itemized fee breakdown for the logged-in student (class, components, transport, net fee, installments)."""
    from models import UserProfile, FeeStructure, FeeInstallment
    import json

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    class_str = profile.class_ if (profile and profile.class_ and profile.class_ != "none") else "10"

    try:
        class_num = int(class_str)
    except (ValueError, TypeError):
        class_num = 10

    structure_row = _get_or_init_structure(class_num, db)
    components = json.loads(structure_row.components)
    uses_transport = is_transport_user(profile.transport_mode if profile else None)
    transport_fee = structure_row.transport_fee if uses_transport else 0

    base_monthly = 0
    for comp in components:
        amt = int(comp.get("amount", 0))
        period = comp.get("billingPeriod", "Monthly")
        if period == "Monthly":
            base_monthly += amt
        elif period == "Quarterly":
            base_monthly += round(amt / 3)
        elif period == "Annually":
            base_monthly += round(amt / 12)

    net_monthly = base_monthly + transport_fee

    installments = (
        db.query(FeeInstallment)
        .filter(FeeInstallment.user_id == current_user.id)
        .order_by(FeeInstallment.due_date)
        .all()
    )

    if not installments:
        from app.core.fees import build_default_fee_installments
        installments = build_default_fee_installments(current_user.id, academic_year="25-26")
        db.add_all(installments)
        db.commit()

    return {
        "student": {
            "id": current_user.id,
            "name": current_user.name,
            "username": profile.username if profile else None,
            "class": class_str,
            "section": profile.section if profile else "A",
            "admission_number": profile.admission_number if profile else None,
            "transport_mode": profile.transport_mode if profile else "none",
            "uses_transport": uses_transport,
        },
        "classNum": class_num,
        "components": components,
        "transportFee": structure_row.transport_fee,
        "transportFeeApplied": transport_fee,
        "baseMonthlyTotal": base_monthly,
        "netMonthlyTotal": net_monthly,
        "installments": [_serialize_installment(inst) for inst in installments],
    }


@router.get("/api/admin/fees/{target_user_id}/breakdown")
def get_admin_student_fee_breakdown(
    target_user_id: str,
    admin: User = Depends(require_role(["admin", "account"])),
    db: Session = Depends(get_db)
):
    """Return itemized fee breakdown for a specific student for accounts clerk/admin audit."""
    from models import UserProfile, FeeStructure, FeeInstallment, User as UserModel
    import json

    target_user = db.query(UserModel).filter(UserModel.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Student user not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == target_user_id).first()
    class_str = profile.class_ if (profile and profile.class_ and profile.class_ != "none") else "10"

    try:
        class_num = int(class_str)
    except (ValueError, TypeError):
        class_num = 10

    structure_row = _get_or_init_structure(class_num, db)
    components = json.loads(structure_row.components)
    uses_transport = is_transport_user(profile.transport_mode if profile else None)
    transport_fee = structure_row.transport_fee if uses_transport else 0

    base_monthly = 0
    for comp in components:
        amt = int(comp.get("amount", 0))
        period = comp.get("billingPeriod", "Monthly")
        if period == "Monthly":
            base_monthly += amt
        elif period == "Quarterly":
            base_monthly += round(amt / 3)
        elif period == "Annually":
            base_monthly += round(amt / 12)

    net_monthly = base_monthly + transport_fee

    installments = (
        db.query(FeeInstallment)
        .filter(FeeInstallment.user_id == target_user_id)
        .order_by(FeeInstallment.due_date)
        .all()
    )

    return {
        "student": {
            "id": target_user.id,
            "name": target_user.name,
            "username": profile.username if profile else None,
            "class": class_str,
            "section": profile.section if profile else "A",
            "admission_number": profile.admission_number if profile else None,
            "transport_mode": profile.transport_mode if profile else "none",
            "uses_transport": uses_transport,
        },
        "classNum": class_num,
        "components": components,
        "transportFee": structure_row.transport_fee,
        "transportFeeApplied": transport_fee,
        "baseMonthlyTotal": base_monthly,
        "netMonthlyTotal": net_monthly,
        "installments": [_serialize_installment(inst) for inst in installments],
    }
