import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlmodel import Session, select
from app.core.database import get_db
from app.core.auth import get_current_user
from models import User, UserDocument

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("", response_model=List[dict])
def get_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    statement = select(UserDocument).where(UserDocument.user_id == current_user.id)
    docs = db.exec(statement).all()
    result = []
    for doc in docs:
        file_url = doc.file_url or ""
        if file_url and not (file_url.startswith("http") or file_url.startswith("data:")):
            if file_url.startswith("/uploads/"):
                file_url = f"https://vidyaschool.vercel.app/api/documents/serve?docId={doc.id}"
            else:
                file_url = f"https://vidyaschool.vercel.app{file_url}"

        result.append({
            "id": doc.id,
            "docType": doc.doc_type,
            "doc_type": doc.doc_type,
            "docName": doc.doc_name,
            "doc_name": doc.doc_name,
            "fileUrl": file_url,
            "file_url": file_url,
            "fileName": doc.file_name,
            "file_name": doc.file_name,
            "fileType": doc.file_type,
            "file_type": doc.file_type,
            "fileSize": doc.file_size,
            "file_size": doc.file_size,
            "status": doc.status or "Uploaded"
        })
    return result

@router.post("")
async def upload_document(
    file: UploadFile = File(...),
    docType: str = Form(...),
    docName: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    content = await file.read()
    file_size = len(content)
    
    import base64
    b64_str = base64.b64encode(content).decode('utf-8')
    mime_type = file.content_type or "application/pdf"
    data_url = f"data:{mime_type};base64,{b64_str}"
    
    statement = select(UserDocument).where(
        UserDocument.user_id == current_user.id,
        UserDocument.doc_type == docType
    )
    existing = db.exec(statement).first()
    
    if existing:
        existing.file_url = data_url
        existing.file_name = file.filename or docName
        existing.file_type = mime_type
        existing.file_size = file_size
        existing.status = "uploaded"
        existing.updated_at = datetime.utcnow()
        db.add(existing)
        db.commit()
        db.refresh(existing)
        doc_obj = existing
    else:
        new_doc = UserDocument(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            doc_type=docType,
            doc_name=docName,
            file_url=data_url,
            file_name=file.filename or docName,
            file_type=mime_type,
            file_size=file_size,
            status="uploaded",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        doc_obj = new_doc

    return {
        "success": True,
        "id": doc_obj.id,
        "docType": doc_obj.doc_type,
        "docName": doc_obj.doc_name,
        "fileUrl": doc_obj.file_url,
        "fileName": doc_obj.file_name,
        "fileType": doc_obj.file_type,
        "fileSize": doc_obj.file_size,
        "status": doc_obj.status
    }

@router.delete("")
def delete_document(
    docType: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    statement = select(UserDocument).where(
        UserDocument.user_id == current_user.id,
        UserDocument.doc_type == docType
    )
    existing = db.exec(statement).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"success": True, "message": "Document deleted"}
    
    return {"success": False, "message": "Document not found"}
