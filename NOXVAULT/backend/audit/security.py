import platform
import psutil

def get_security_info():
    """
    Returns basic security information:
    - OS name
    - Firewall status (placeholder)
    - Auto-update status (placeholder)
    - Antivirus detection (safe cross-platform)
    """

    os_name = platform.system()

    return {
        "os": os_name,
        "firewall_enabled": _get_firewall_status(os_name),
        "auto_updates_enabled": _get_auto_update_status(os_name),
        "antivirus": _get_antivirus_status(os_name)
    }


# ---------------------------------------------------------
# FIREWALL STATUS (placeholder but safe)
# ---------------------------------------------------------

def _get_firewall_status(os_name: str):
    try:
        if os_name == "Windows":
            # Windows firewall check placeholder
            return True
        elif os_name == "Darwin":
            # macOS firewall check placeholder
            return True
        elif os_name == "Linux":
            # Linux firewall check placeholder
            return True
        else:
            return False
    except:
        return False


# ---------------------------------------------------------
# AUTO UPDATE STATUS (placeholder)
# ---------------------------------------------------------

def _get_auto_update_status(os_name: str):
    try:
        if os_name == "Windows":
            return True
        elif os_name == "Darwin":
            return True
        elif os_name == "Linux":
            return True
        else:
            return False
    except:
        return False


# ---------------------------------------------------------
# ANTIVIRUS STATUS (safe cross-platform)
# ---------------------------------------------------------

def _get_antivirus_status(os_name: str):
    try:
        if os_name == "Windows":
            # Windows Defender placeholder
            return {
                "name": "Windows Defender",
                "running": True
            }

        elif os_name == "Darwin":
            # macOS does not expose antivirus easily
            return {
                "name": "XProtect (macOS built-in)",
                "running": True
            }

        elif os_name == "Linux":
            # Linux antivirus placeholder
            return {
                "name": "ClamAV (if installed)",
                "running": False
            }

        else:
            return {
                "name": "Unknown",
                "running": False
            }

    except Exception as e:
        return {
            "name": "Error",
            "running": False,
            "message": str(e)
        }
