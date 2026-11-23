import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from main import build_default_fee_installments, decode_session_token
from app.routes.fees import generate_receipt_qr_data_url


def test_decode_session_token_unquotes_percent_encoded_cookie_values():
    encoded_token = "abc%2Fdef%3Dghi"

    assert decode_session_token(encoded_token) == "abc/def=ghi"


def test_decode_session_token_strips_signature_suffix_from_better_auth_cookie():
    cookie_value = "token.signature"

    assert decode_session_token(cookie_value) == "token"


def test_build_default_fee_installments_creates_academic_month_rows():
    installments = build_default_fee_installments("student-1", year=2026)

    assert len(installments) == 12
    assert [inst.month for inst in installments[:3]] == ["January", "February", "March"]
    assert installments[0].year == "2026"
    assert installments[0].status == "pending"


def test_build_default_fee_installments_parses_academic_year_strings():
    installments = build_default_fee_installments("student-1", academic_year="25-26")

    assert len(installments) == 12
    assert installments[0].year == "2026"
    assert installments[-1].year == "2026"


def test_generate_receipt_qr_data_url_returns_png_data_url():
    data_url = generate_receipt_qr_data_url("VIDYA-SCHOOL|RECEIPT:REC-2026-ABC123")

    assert data_url.startswith("data:image/png;base64,")
    assert len(data_url) > 30
