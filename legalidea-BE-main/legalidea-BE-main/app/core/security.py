"""Security helpers for hashing and JWT handling."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

BCRYPT_SHA256_PREFIX = "bcrypt_sha256$"


class TokenDecodeError(Exception):
    """Raised when an incoming JWT cannot be decoded."""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")

    if hashed_password.startswith(BCRYPT_SHA256_PREFIX):
        stored_hash = hashed_password.removeprefix(BCRYPT_SHA256_PREFIX).encode("utf-8")
        return bcrypt.checkpw(_bcrypt_sha256_secret(password_bytes), stored_hash)

    # Legacy hashes were produced by Passlib's raw bcrypt scheme.
    try:
        return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))
    except ValueError:
        return bcrypt.checkpw(password_bytes[:72], hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")
    hashed = bcrypt.hashpw(_bcrypt_sha256_secret(password_bytes), bcrypt.gensalt())
    return f"{BCRYPT_SHA256_PREFIX}{hashed.decode('utf-8')}"


def _bcrypt_sha256_secret(password_bytes: bytes) -> bytes:
    return sha256(password_bytes).hexdigest().encode("ascii")


def create_access_token(*, subject: str | int, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    expire_after = expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    now = datetime.now(timezone.utc)
    payload = {"sub": str(subject), "iat": now, "exp": now + expire_after}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_admin_access_token(*, subject: str, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    expire_after = expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "scope": "admin",
        "iat": now,
        "exp": now + expire_after,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise TokenDecodeError from exc
