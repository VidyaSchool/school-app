import json
import re
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from pydantic import BaseModel
from sqlmodel import Session, select, desc
from app.core.database import get_db
from app.core.auth import decode_session_token, get_utc_now
from models import CustomPage, User, Session as SessionModel

router = APIRouter(tags=["page-builder"])

class SavePageRequest(BaseModel):
    uid: str
    title: Optional[str] = "Responsive Elementor Page"
    slug: Optional[str] = None
    widgets: Optional[Union[List[Any], Dict[str, Any]]] = []
    status: Optional[str] = "published"
    author_id: Optional[str] = None

class UpdatePageMetaRequest(BaseModel):
    uid: str
    title: Optional[str] = None
    slug: Optional[str] = None
    status: Optional[str] = None

import os
import uuid

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB maximum upload limit
ALLOWED_EXTENSIONS = {
    "pdf", "png", "jpg", "jpeg", "webp", "gif", "mp4", "webm",
    "doc", "docx", "xls", "xlsx"
}
ALLOWED_MIME_TYPES = {
    "application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif",
    "video/mp4", "video/webm", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

INTERNAL_SERVICE_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "vidyaschool-secure-internal-sync-key")

def get_optional_user_id(request: Request, db: Session) -> Optional[str]:
    """Helper to extract user_id if valid session exists, otherwise return None without raising 401."""
    try:
        raw_token = request.cookies.get("better-auth.session_token") or request.cookies.get("__Secure-better-auth.session_token")
        token = decode_session_token(raw_token)
        if not token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = decode_session_token(auth_header.split(" ", 1)[1])
        if token:
            db_session = db.query(SessionModel).filter(SessionModel.token == token).first()
            if db_session and db_session.expires_at >= get_utc_now():
                return db_session.user_id
    except Exception as e:
        print("[page_builder] Error extracting optional user:", e)
    return None

def verify_admin_or_service(request: Request, db: Session) -> Optional[str]:
    """Verify that request is authenticated as an admin user or verified internal Next.js service proxy."""
    # 1. Check internal service key
    internal_key = request.headers.get("X-Internal-Service-Key")
    if internal_key and internal_key == INTERNAL_SERVICE_SECRET:
        return "internal-service"

    # 2. Check user session and admin role
    user_id = get_optional_user_id(request, db)
    if user_id:
        user = db.get(User, user_id)
        if user and (user.role == "admin" or getattr(user, "is_admin", False)):
            return user.id

    raise HTTPException(
        status_code=401,
        detail="Unauthorized: Admin session or verified service credentials required"
    )

def check_is_admin_or_service(request: Request, db: Session) -> bool:
    """Helper to safely check if caller has admin or service credentials without raising exception."""
    try:
        verify_admin_or_service(request, db)
        return True
    except HTTPException:
        return False

def sanitize_slug(text: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return cleaned or "custom-page"

# --- List or Get Page ---
@router.get("/api/page-builder")
@router.get("/api/admin/page-builder")
async def get_pages(
    request: Request,
    uid: Optional[str] = Query(default=None),
    id: Optional[str] = Query(default=None),
    slug: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    is_admin = check_is_admin_or_service(request, db)
    if "/admin/" in request.url.path and not is_admin:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Admin session or verified service credentials required"
        )

    target_id = uid or id

    if target_id or slug:
        statement = select(CustomPage)
        if target_id:
            statement = statement.where(CustomPage.id == target_id)
        elif slug:
            statement = statement.where(CustomPage.slug == slug)

        page = db.exec(statement).first()
        if not page:
            return {"found": False, "message": "Page not found in database"}

        # Draft pages can only be viewed by authenticated admins/service
        if page.status != "published" and not is_admin:
            return {"found": False, "message": "Page not found in database"}

        parsed_widgets: Any = []
        try:
            parsed_widgets = json.loads(page.widgets_json or "[]")
        except Exception:
            parsed_widgets = []

        return {
            "found": True,
            "page": {
                "uid": page.id,
                "id": page.id,
                "title": page.title,
                "slug": page.slug,
                "status": page.status,
                "widgets": parsed_widgets,
                "authorId": page.author_id,
                "createdAt": page.created_at.isoformat(),
                "updatedAt": page.updated_at.isoformat(),
            }
        }

    # If no ID/slug specified, this is an admin dashboard listing operation
    if not is_admin:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Admin credentials required to list custom pages"
        )

    statement = select(CustomPage).order_by(desc(CustomPage.updated_at))
    all_pages = db.exec(statement).all()

    return {
        "success": True,
        "pages": [
            {
                "uid": p.id,
                "id": p.id,
                "name": p.title,
                "title": p.title,
                "slug": p.slug,
                "status": p.status or "published",
                "createdAt": p.created_at.isoformat(),
                "updatedAt": p.updated_at.isoformat(),
            }
            for p in all_pages
        ]
    }

@router.get("/api/page-builder/{identifier}")
async def get_page_by_identifier(
    identifier: str,
    request: Request,
    db: Session = Depends(get_db)
):
    statement = select(CustomPage).where(
        (CustomPage.id == identifier) | (CustomPage.slug == identifier)
    )
    page = db.exec(statement).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    is_admin = check_is_admin_or_service(request, db)
    if page.status != "published" and not is_admin:
        raise HTTPException(status_code=404, detail="Page not found")

    parsed_widgets: Any = []
    try:
        parsed_widgets = json.loads(page.widgets_json or "[]")
    except Exception:
        parsed_widgets = []

    return {
        "found": True,
        "page": {
            "uid": page.id,
            "id": page.id,
            "title": page.title,
            "slug": page.slug,
            "status": page.status,
            "widgets": parsed_widgets,
            "authorId": page.author_id,
            "createdAt": page.created_at.isoformat(),
            "updatedAt": page.updated_at.isoformat(),
        }
    }

# --- Save or Update Page ---
@router.post("/api/page-builder")
@router.post("/api/admin/page-builder")
async def save_page(
    body: SavePageRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    if not body.uid or not body.uid.strip():
        raise HTTPException(status_code=400, detail="Page UID is required")

    caller_id = verify_admin_or_service(request, db)
    author_id = (caller_id if caller_id != "internal-service" else None) or body.author_id or "admin"

    page_title = (body.title or "").strip() or "Responsive Elementor Page"
    raw_slug = (body.slug or "").strip() or sanitize_slug(page_title)
    page_slug = sanitize_slug(raw_slug)

    widgets_str = json.dumps(body.widgets if body.widgets is not None else [])
    page_status = body.status or "published"
    now = datetime.utcnow()

    # Check if page already exists
    statement = select(CustomPage).where(CustomPage.id == body.uid)
    existing_page = db.exec(statement).first()

    if existing_page:
        existing_page.title = page_title
        existing_page.slug = page_slug
        existing_page.widgets_json = widgets_str
        existing_page.status = page_status
        existing_page.updated_at = now
        if author_id and not existing_page.author_id:
            existing_page.author_id = author_id

        db.add(existing_page)
        db.commit()
        db.refresh(existing_page)

        return {
            "success": True,
            "message": "Page updated successfully",
            "uid": existing_page.id,
            "id": existing_page.id,
            "title": existing_page.title,
            "slug": existing_page.slug,
            "status": existing_page.status,
            "updatedAt": existing_page.updated_at.isoformat()
        }
    else:
        new_page = CustomPage(
            id=body.uid,
            title=page_title,
            slug=page_slug,
            widgets_json=widgets_str,
            author_id=author_id,
            status=page_status,
            created_at=now,
            updated_at=now
        )
        db.add(new_page)
        db.commit()
        db.refresh(new_page)

        return {
            "success": True,
            "message": "Page created and saved successfully",
            "uid": new_page.id,
            "id": new_page.id,
            "title": new_page.title,
            "slug": new_page.slug,
            "status": new_page.status,
            "updatedAt": new_page.updated_at.isoformat()
        }

# --- Update Page Metadata (Title, Slug, Status) ---
@router.patch("/api/page-builder")
@router.patch("/api/admin/page-builder")
async def update_page_meta(
    body: UpdatePageMetaRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    verify_admin_or_service(request, db)

    if not body.uid:
        raise HTTPException(status_code=400, detail="Page UID is required")

    statement = select(CustomPage).where(CustomPage.id == body.uid)
    page = db.exec(statement).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    if body.title is not None:
        page.title = body.title.strip() or page.title
    if body.slug is not None:
        page.slug = sanitize_slug(body.slug)
    if body.status is not None:
        page.status = body.status

    page.updated_at = datetime.utcnow()
    db.add(page)
    db.commit()
    db.refresh(page)

    return {
        "success": True,
        "message": "Page metadata updated",
        "uid": page.id,
        "title": page.title,
        "slug": page.slug,
        "status": page.status
    }

# --- Delete Page ---
@router.delete("/api/page-builder")
@router.delete("/api/admin/page-builder")
async def delete_page(
    request: Request,
    uid: Optional[str] = Query(default=None),
    id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    verify_admin_or_service(request, db)

    target_id = uid or id
    if not target_id:
        raise HTTPException(status_code=400, detail="Page UID is required")

    statement = select(CustomPage).where(CustomPage.id == target_id)
    page = db.exec(statement).first()
    if not page:
        return {"success": True, "message": "Page already deleted or does not exist"}

    db.delete(page)
    db.commit()

    return {"success": True, "message": "Page deleted successfully", "uid": target_id}


# --- S3 Asset Upload for Tables, Buttons, PDFs, Videos ---
@router.post("/api/page-builder/upload")
@router.post("/api/admin/page-builder/upload")
async def upload_asset(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    verify_admin_or_service(request, db)

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    filename = file.filename.strip()
    raw_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    content_type = (file.content_type or "application/octet-stream").lower()

    if raw_ext not in ALLOWED_EXTENSIONS or content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Disallowed file format (.{raw_ext}). Allowed formats: PDF, PNG, JPG, WEBP, GIF, MP4, WEBM, DOC, DOCX, XLS, XLSX"
        )

    # Enforce stream reading size limit to prevent memory exhaustion / DoS
    CHUNK_SIZE = 1024 * 1024  # 1MB chunks
    total_read = 0
    chunks = []
    while True:
        chunk = await file.read(CHUNK_SIZE)
        if not chunk:
            break
        total_read += len(chunk)
        if total_read > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE // (1024 * 1024)}MB"
            )
        chunks.append(chunk)

    content = b"".join(chunks)

    aws_region = os.getenv("AWS_REGION", "ap-south-1")
    aws_key = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_bucket = os.getenv("AWS_S3_BUCKET_NAME", "")

    if not (aws_key and aws_secret and aws_bucket):
        raise HTTPException(status_code=500, detail="AWS S3 credentials not configured on backend")

    try:
        import boto3
        import asyncio
        s3 = boto3.client(
            "s3",
            region_name=aws_region,
            aws_access_key_id=aws_key,
            aws_secret_access_key=aws_secret,
        )
        clean_base = re.sub(r"[^a-zA-Z0-9_-]+", "-", filename.rsplit(".", 1)[0]).strip("-").lower()
        folder = "page-builder/assets"
        if "pdf" in content_type:
            folder = "page-builder/pdfs"
        elif "video" in content_type:
            folder = "page-builder/videos"
        elif "image" in content_type:
            folder = "page-builder/images"

        key = f"{folder}/{uuid.uuid4().hex[:12]}-{clean_base[:32]}.{raw_ext}"

        await asyncio.to_thread(
            s3.put_object,
            Bucket=aws_bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
            ContentDisposition=f'inline; filename="{clean_base[:32]}.{raw_ext}"'
        )
        url = f"https://{aws_bucket}.s3.{aws_region}.amazonaws.com/{key}"
        return {
            "success": True,
            "fileUrl": url,
            "url": url,
            "fileName": filename,
            "key": key
        }
    except Exception as e:
        print("[S3 PageBuilder Upload Error]:", e)
        raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")
