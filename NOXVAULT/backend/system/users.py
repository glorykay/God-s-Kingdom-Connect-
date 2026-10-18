from fastapi import APIRouter
import platform
import subprocess
import psutil
from datetime import datetime

router = APIRouter(
    prefix="/users",
    tags=["System Users"]
)

# ------------------------------------------------------------
# LOGGED-IN USERS
# ------------------------------------------------------------

def get_logged_in_users():
    try:
        users = psutil.users()
        return [
            {
                "name": u.name,
                "terminal": u.terminal,
                "host": u.host,
                "started": u.started
            }
            for u in users
        ]
    except Exception as e:
        return [{"error": str(e)}]

# ------------------------------------------------------------
# LOCAL USER ACCOUNTS (macOS, Linux, Windows)
# ------------------------------------------------------------

def get_local_users():
    system = platform.system().lower()

    try:
        # macOS
        if system == "darwin":
            output = subprocess.check_output(
                ["dscl", ".", "list", "/Users"],
                text=True
            )
            return output.splitlines()

        # Linux
        elif system == "linux":
            output = subprocess.check_output(
                ["cut", "-d:", "-f1", "/etc/passwd"],
                text=True
            )
            return output.splitlines()

        # Windows
        elif system == "windows":
            output = subprocess.check_output(
                ["powershell", "-Command", "Get-LocalUser | Select-Object Name | ConvertTo-Json"],
                text=True
            )
            import json
            data = json.loads(output)
            if isinstance(data, dict):
                return [data.get("Name", "Unknown")]
            return [item.get("Name", "Unknown") for item in data]

        else:
            return ["Unsupported OS"]

    except Exception as e:
        return [f"Error: {e}"]

# ------------------------------------------------------------
# ADMIN / SUDO USERS
# ------------------------------------------------------------

def get_admin_users():
    system = platform.system().lower()

    try:
        # macOS admin group
        if system == "darwin":
            output = subprocess.check_output(
                ["dscl", ".", "read", "/Groups/admin", "GroupMembership"],
                text=True
            )
            return output.replace("GroupMembership:", "").split()

        # Linux sudo group
        elif system == "linux":
            output = subprocess.check_output(
                ["getent", "group", "sudo"],
                text=True
            )
            return output.split(":")[-1].strip().split(",")

        # Windows Administrators group
        elif system == "windows":
            output = subprocess.check_output(
                ["net", "localgroup", "Administrators"],
                text=True
            )
            lines = output.splitlines()
            return lines[4:-2]  # Extract user list

        else:
            return ["Unsupported OS"]

    except Exception as e:
        return [f"Error: {e}"]

# ------------------------------------------------------------
# FULL USER SUMMARY
# ------------------------------------------------------------

def get_user_summary():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "os": platform.system(),
        "logged_in_users": get_logged_in_users(),
        "local_users": get_local_users(),
        "admin_users": get_admin_users()
    }

# ------------------------------------------------------------
# API ROUTES
# ------------------------------------------------------------

@router.get("/summary")
def users_summary():
    """
    Returns full user audit summary.
    """
    return get_user_summary()


@router.get("/logged-in")
def users_logged_in():
    """
    Returns currently logged-in users.
    """
    return get_logged_in_users()


@router.get("/local")
def users_local():
    """
    Returns local system accounts.
    """
    return get_local_users()


@router.get("/admins")
def users_admins():
    """
    Returns admin/sudo users.
    """
    return get_admin_users()
