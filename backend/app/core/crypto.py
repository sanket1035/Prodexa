import base64
import hashlib

from cryptography.fernet import Fernet

from app.core.config import settings


def _fernet() -> Fernet:
    # Key derived from SESSION_SECRET so one secret is enough for local dev.
    # For production, set a strong SESSION_SECRET and rotate it deliberately.
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.session_secret.encode()).digest())
    return Fernet(key)


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    return _fernet().decrypt(value.encode()).decode()
