from typing import List, Optional
from pydantic import BaseModel


class PayFeesRequest(BaseModel):
    installment_ids: List[str]
    payment_method: str


class CreateFeeRequest(BaseModel):
    student_id: Optional[str] = None
    student_class: Optional[str] = None
    student_section: Optional[str] = None
    month: str
    year: str
    amount: int
    due_date: str


class UpdateFeeStatusRequest(BaseModel):
    status: str
    paid_date: Optional[str] = None
    receipt_no: Optional[str] = None
    payment_method: Optional[str] = None
    amount: Optional[int] = None
