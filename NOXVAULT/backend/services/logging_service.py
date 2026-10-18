"""
logging_service.py
Centralized JSON logging for NOXVAULT backend and agents.
"""

import json
import os
from datetime import datetime

LOG_FILE = "backend/logs/noxvault.log"


def ensure_log_directory():
    """Create logs/ directory if missing."""
    log_dir = os.path.dirname(LOG_FILE)
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)


def write_log(entry: dict):
    """
    Write a JSON log entry to the log file.
    Automatically adds timestamp and ensures safe writes.
    """

    ensure_log_directory()

    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **entry
    }

    try:
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print(f"[LOGGING ERROR] {e}")


def log_info(message: str, **details):
    """Write an INFO log entry."""
    write_log({
        "level": "INFO",
        "message": message,
        "details": details
    })


def log_warning(message: str, **details):
    """Write a WARNING log entry."""
    write_log({
        "level": "WARNING",
        "message": message,
        "details": details
    })


def log_error(message: str, **details):
    """Write an ERROR log entry."""
    write_log({
        "level": "ERROR",
        "message": message,
        "details": details
    })


if __name__ == "__main__":
    # Manual test
    log_info("Logging service test", module="logging_service")
    log_warning("This is a warning test", module="logging_service")
    log_error("This is an error test", module="logging_service")

    print("Test logs written to backend/logs/noxvault.log")
