import platform
import subprocess
import psutil
from typing import Dict, Any, List
import json

def get_user_summary() -> Dict[str, Any]:
    os_name = platform.system()

    return {
        "OS": os_name,
        "logged_in_users": _get_logged_in_users(),
        "local_users": _get_local_users(os_name),
        "admin_users": _get_admin_users(os_name)
    }

def _get_logged_in_users() -> List[Dict[str, Any]]:
    try:
        users = []
        for u in psutil.users():
            users.append({
                "name": u.name,
                "terminal": u.terminal,
                "host": u.host,
                "started": u.started,
                "pid": u.pid
            })
        return users
    except Exception as e:
        return [{"error": str(e)}]

def _get_local_users(os_name: str) -> List[str]:
    try:
        if os_name == "Windows":
            return _windows_local_users()
        elif os_name == "Darwin":
            return _macos_local_users()
        elif os_name == "Linux":
            return _linux_local_users()
        else:
            return ["Unsupported OS"]
    except Exception as e:
        return [f"Error: {e}"]

def _windows_local_users() -> List[str]:
    try:
        output = subprocess.check_output(
            ["powershell", "-Command", "Get-LocalUser | Select-Object Name | ConvertTo-Json"],
            text=True
        )
        return _safe_json_parse(output)
    except:
        return ["Unable to query Windows local users"]

def _macos_local_users() -> List[str]:
    try:
        output = subprocess.check_output(
            ["dscl", ".", "list", "/Users"],
            text=True
        )
        return output.splitlines()
    except:
        return ["Unable to query macOS users"]

def _linux_local_users() -> List[str]:
    try:
        output = subprocess.check_output(
            ["cut", "-d:", "-f1", "/etc/passwd"],
            text=True
        )
        return output.splitlines()
    except:
        return ["Unable to query Linux users"]

def _get_admin_users(os_name: str) -> List[str]:
    try:
        if os_name == "Windows":
            return _windows_admin_users()
        elif os_name == "Darwin":
            return _macos_admin_users()
        elif os_name == "Linux":
            return _linux_admin_users()
        else:
            return ["Unsupported OS"]
    except Exception as e:
        return [f"Error: {e}"]

def _windows_admin_users() -> List[str]:
    try:
        output = subprocess.check_output(
            ["net", "localgroup", "Administrators"],
            text=True
        )
        lines = output.splitlines()
        return lines[4:-2]
    except:
        return ["Unable to query Windows admin users"]

def _macos_admin_users() -> List[str]:
    try:
        output = subprocess.check_output(
            ["dscl", ".", "read", "/Groups/admin", "GroupMembership"],
            text=True
        )
        return output.replace("GroupMembership:", "").split()
    except:
        return ["Unable to query macOS admin users"]

def _linux_admin_users() -> List[str]:
    try:
        output = subprocess.check_output(
            ["getent", "group", "sudo"],
            text=True
        )
        return output.split(":")[-1].strip().split(",")
    except:
        return ["Unable to query Linux sudo users"]

def _safe_json_parse(raw: str):
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return [data.get("Name", "Unknown")]
        return [item.get("Name", "Unknown") for item in data]
    except:
        return ["Unknown"]
