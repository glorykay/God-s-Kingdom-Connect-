"""
file_utils.py
NOXVAULT File Utility Module
Provides safe file reading, writing, JSON handling, hashing, and directory creation.
"""

import os
import json
import hashlib


# -----------------------------
# Directory Utilities
# -----------------------------

def ensure_directory(path: str):
    """Create directory if it does not exist."""
    if not os.path.exists(path):
        os.makedirs(path)


# -----------------------------
# File Existence
# -----------------------------

def file_exists(path: str) -> bool:
    """Check if a file exists."""
    return os.path.isfile(path)


# -----------------------------
# Safe File Reading
# -----------------------------

def read_file(path: str) -> str:
    """Read a file safely and return its contents as text."""
    if not file_exists(path):
        return ""

    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return ""


# -----------------------------
# Safe File Writing
# -----------------------------

def write_file(path: str, content: str):
    """Write text to a file safely."""
    ensure_directory(os.path.dirname(path))

    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
    except Exception as e:
        print(f"[FILE_UTILS ERROR] {e}")


# -----------------------------
# JSON Helpers
# -----------------------------

def load_json(path: str):
    """Load JSON safely and return Python object."""
    if not file_exists(path):
        return {}

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_json(path: str, data):
    """Save Python object as JSON safely."""
    ensure_directory(os.path.dirname(path))

    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"[FILE_UTILS ERROR] {e}")


# -----------------------------
# Hashing
# -----------------------------

def sha256_file(path: str):
    """Return SHA256 hash of a file, or None if unreadable."""
    if not file_exists(path):
        return None

    try:
        with open(path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception:
        return None


if __name__ == "__main__":
    # Manual test
    test_path = "backend/logs/test_file.txt"
    write_file(test_path, "Hello NOXVAULT")
    print("File written:", read_file(test_path))

    print("SHA256:", sha256_file(test_path))

    save_json("backend/logs/test.json", {"ok": True})
    print("JSON loaded:", load_json("backend/logs/test.json"))
