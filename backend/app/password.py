import asyncio
import secrets
import string
from concurrent.futures import ThreadPoolExecutor
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from dotenv import load_dotenv
import os


load_dotenv()

PH_CONFIG = {
    "time_cost": int(os.getenv("ARGON2_TIME_COST", 3)),
    "memory_cost": int(os.getenv("ARGON2_MEMORY_COST", 65536)),
    "parallelism": int(os.getenv("ARGON2_PARALLELISM", 4)),
    "hash_len": int(os.getenv("ARGON2_HASH_LEN", 32)),
    "salt_len": int(os.getenv("ARGON2_SALT_LEN", 16))
}

ph = PasswordHasher(**PH_CONFIG)
executor = ThreadPoolExecutor()


def _generate_secure_password(length: int = 16) -> str:
    """
    Synchronous core logic for password generation.
    Guarantees at least one char of each required type.
    """

    if length < 10:
        raise ValueError("Password length must be at least 10 characters")

    specials = "._-"
    alphabet = string.ascii_letters + string.digits + specials

    password_chars = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice(specials),
    ]
    password_chars += [secrets.choice(alphabet) for _ in range(length - 4)]

    secrets.SystemRandom().shuffle(password_chars)

    return "".join(password_chars)


async def generate_password(length: int = 16) -> str:
    """
    Asynchronously generates a cryptographically secure password.
    """

    return _generate_secure_password(length)


async def hasher(plaintext_password: str) -> str:
    """
    Hashes the password using Argon2 in a separate thread
    to prevent blocking the main asyncio event loop.
    """

    loop = asyncio.get_running_loop()
    hashed_password = await loop.run_in_executor(executor, ph.hash, plaintext_password)
    return hashed_password


async def login(hash_from_db: str, user_input_password: str) -> bool:
    """
    Verifies a plaintext password against a hash from the database.
    This operation runs in a separate thread to avoid blocking.
    """

    loop = asyncio.get_running_loop()
    try:
        await loop.run_in_executor(
            executor, ph.verify, hash_from_db, user_input_password
        )
        return True
    except VerifyMismatchError:
        return False
    except Exception:
        return False


async def check_password(user_entered_password: str) -> bool:
    """
    Validates password complexity based on standard requirements.
    Minimum 10 characters, with at least one uppercase, one lowercase,
    one digit, and one special character.
    """

    if len(user_entered_password) < 10:
        return False

    has_upper = any(c in string.ascii_uppercase for c in user_entered_password)
    has_lower = any(c in string.ascii_lowercase for c in user_entered_password)
    has_digit = any(c in string.digits for c in user_entered_password)
    has_special = any(c in string.punctuation for c in user_entered_password)

    return all([has_upper, has_lower, has_digit, has_special])