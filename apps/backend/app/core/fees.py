import re
import uuid
from datetime import date, datetime
from typing import List, Optional

from models import FeeInstallment

ACADEMIC_MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]


def parse_academic_year(academic_year: Optional[str | int] = None) -> int:
    if isinstance(academic_year, int):
        return academic_year

    if not academic_year:
        return datetime.utcnow().year

    normalized = str(academic_year).strip()
    if not normalized:
        return datetime.utcnow().year

    if re.fullmatch(r"\d{2}-\d{2}", normalized):
        _, suffix = normalized.split("-", 1)
        return int(f"20{suffix}")

    if re.fullmatch(r"\d{4}-\d{2,4}", normalized):
        _, suffix = normalized.split("-", 1)
        if len(suffix) == 2:
            return int(f"20{suffix}")
        return int(suffix)

    if re.fullmatch(r"\d{4}/\d{2}", normalized):
        _, suffix = normalized.split("/", 1)
        return int(f"20{suffix}")

    try:
        return int(normalized)
    except ValueError:
        return datetime.utcnow().year


def build_default_fee_installments(user_id: str, year: Optional[int] = None, academic_year: Optional[str | int] = None) -> List[FeeInstallment]:
    current_year = year or parse_academic_year(academic_year)
    installments: List[FeeInstallment] = []
    for index, month in enumerate(ACADEMIC_MONTHS, start=1):
        installments.append(
            FeeInstallment(
                id=str(uuid.uuid4()),
                user_id=user_id,
                month=month,
                year=str(current_year),
                amount=15000,
                due_date=date(current_year, index, 10),
                status="pending",
            )
        )
    return installments
