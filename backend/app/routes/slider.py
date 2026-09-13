from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
from app.core.database import get_db
from typing import Literal, Optional
from app.core.auth import require_role
from models import User

router = APIRouter(tags=["slider"])

class SliderImageRequest(BaseModel):
    id: int
    url: str
    title: str
    enabled: bool
    target_audience: str = "all"  # "all", "students", "teachers"
    target_classes: str = "all"  # "all" or comma-separated class IDs
    description: Optional[str] = None
    badge: Optional[str] = None
    link: Optional[str] = None
    cta_text: Optional[str] = None

def format_slider_image(img, index: int = 0) -> dict:
    """Enrich slider image with contextual title, badge, description, and action CTA for hero slider."""
    title = (getattr(img, 'title', None) or "").strip()
    target_audience = getattr(img, 'target_audience', 'all') or 'all'
    target_classes = getattr(img, 'target_classes', 'all') or 'all'
    lower_title = title.lower()

    # Dynamic contextual metadata for hero slider
    badge = "VidyaSchool Campus"
    description = "Empowering students with quality education, modern facilities, and a supportive community dedicated to excellence."
    cta_text = "Explore Campus"
    link = "/#students"

    if "online" in lower_title:
        badge = "Digital Campus Platform"
        description = "Access digital classroom resources, attendance, fee portals, and academic progress reports all in one connected platform."
        cta_text = "Student Portal"
        link = "/login"
    elif "leader" in lower_title or "future" in lower_title:
        badge = "Future Leaders"
        description = "Developing ethical leadership, creative thinking, and innovation in every child for tomorrow's challenges."
        cta_text = "About VidyaSchool"
        link = "/#about"
    elif "excellence" in lower_title:
        badge = "Academic Excellence"
        description = "A rigorous, inspiring curriculum supported by modern laboratories, arts programs, and dedicated mentorship."
        cta_text = "Explore Academics"
        link = "/#about"
    elif target_audience == "students" or "student" in lower_title:
        student_descriptions = [
            "Fostering academic excellence, creative expression, and collaborative growth in a nurturing learning community.",
            "Hands-on learning, modern science and computer labs, and passionate mentorship preparing students for global success.",
            "Vibrant campus life with athletics, performing arts, robotics, and community initiatives shaping well-rounded individuals.",
        ]
        badge = "Student Life & Learning"
        description = student_descriptions[index % len(student_descriptions)]
        cta_text = "View Gallery"
        link = "/gallery"
    elif target_audience == "teachers":
        badge = "Distinguished Faculty"
        description = "Passionate, highly qualified educators committed to guiding every child toward their fullest academic and personal potential."
        cta_text = "Meet Our Team"
        link = "/#principal"

    return {
        "id": img.id,
        "url": img.url,
        "title": title,
        "description": getattr(img, 'description', None) or description,
        "badge": getattr(img, 'badge', None) or badge,
        "link": getattr(img, 'link', None) or link,
        "cta_text": getattr(img, 'cta_text', None) or cta_text,
        "enabled": img.enabled,
        "target_audience": target_audience,
        "target_classes": target_classes,
        "order": getattr(img, 'order', index + 1),
    }

# Public endpoints for mobile app and frontend
@router.get("/api/slider/images")
async def get_slider_images(role: str = "all", student_class: str = None, db: Session = Depends(get_db)):
    """Get enabled slider images filtered by role (or 'all') and optionally by student class"""
    from models import SliderImage
    images = db.exec(
        select(SliderImage)
        .where(SliderImage.enabled == True)
        .order_by(SliderImage.order)
    ).all()
    
    # If no images exist, create defaults
    if not images:
        defaults = [
            SliderImage(id=1, url="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800", title="Welcome to Vidya School", enabled=True, order=1, target_audience="all", target_classes="all"),
            SliderImage(id=2, url="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800", title="Excellence in Education", enabled=True, order=2, target_audience="students", target_classes="all"),
            SliderImage(id=3, url="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800", title="Building Future Leaders", enabled=True, order=3, target_audience="teachers", target_classes="all")
        ]
        for img in defaults:
            db.add(img)
        db.commit()
        db.refresh(defaults[0])
        images = defaults
    
    # Filter by role
    filtered_images = []
    for img in images:
        target = getattr(img, 'target_audience', 'all')
        target_classes = getattr(img, 'target_classes', 'all')
        
        # Check role match
        role_match = (
            role == "all" or
            target == "all" or 
            target == f"{role}s" or 
            (role == "teacher" and target == "teachers") or 
            (role == "librarian" and target == "teachers") or 
            (role == "student" and target == "students")
        )
        
        # If role matches and it's a student, also check class
        if role_match:
            if role == "student" and student_class and target_classes != "all":
                # Check if student's class is in the target classes list
                class_list = target_classes.split(",")
                if student_class in class_list:
                    filtered_images.append(img)
            else:
                # For non-students, teachers, or "all" classes
                filtered_images.append(img)
    
    return [format_slider_image(img, idx) for idx, img in enumerate(filtered_images)]

@router.get("/api/public/slider-images")
async def get_public_slider_images(db: Session = Depends(get_db)):
    """Get all slider images (for admin panel) - alias endpoint"""
    return await get_all_slider_images(db)

@router.get("/api/slider/images/all")
async def get_all_slider_images(db: Session = Depends(get_db)):
    """Get all slider images (for admin panel)"""
    from models import SliderImage
    images = db.exec(select(SliderImage).order_by(SliderImage.order)).all()
    
    # If no images exist, create defaults
    if not images:
        defaults = [
            SliderImage(id=1, url="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800", title="Welcome to Vidya School", enabled=True, order=1, target_audience="all", target_classes="all"),
            SliderImage(id=2, url="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800", title="Excellence in Education", enabled=True, order=2, target_audience="students", target_classes="all"),
            SliderImage(id=3, url="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800", title="Building Future Leaders", enabled=True, order=3, target_audience="teachers", target_classes="all")
        ]
        for img in defaults:
            db.add(img)
        db.commit()
        db.refresh(defaults[0])
        images = defaults
    
    return [format_slider_image(img, idx) for idx, img in enumerate(images)]

@router.post("/api/slider/images")
@router.post("/api/admin/slider-images")
async def update_slider_images(images: list[SliderImageRequest], current_user: User = Depends(require_role(["admin"])), db: Session = Depends(get_db)):
    """Update slider images (admin only)"""
    from models import SliderImage
    
    # Delete all existing images
    existing = db.exec(select(SliderImage)).all()
    for img in existing:
        db.delete(img)
    
    # Add new images
    for idx, img_data in enumerate(images):
        new_img = SliderImage(
            id=img_data.id,
            url=img_data.url,
            title=img_data.title,
            enabled=img_data.enabled,
            target_audience=img_data.target_audience,
            target_classes=img_data.target_classes,
            order=idx + 1,
            updated_at=datetime.utcnow()
        )
        db.add(new_img)
    
    db.commit()
    
    return {"success": True, "images": [format_slider_image(i, idx) for idx, i in enumerate(images)]}
