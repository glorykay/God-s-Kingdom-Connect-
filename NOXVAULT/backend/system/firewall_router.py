from fastapi import APIRouter
import subprocess
import platform

router = APIRouter(
    prefix="/firewall",
    tags=["Firewall"]
)

# ------------------------------------------------------------
# GET FIREWALL STATUS (macOS, Linux, Windows)
# ------------------------------------------------------------

def get_firewall_status():
    system = platform.system().lower()

    try:
        # macOS firewall status
        if system == "darwin":
            output = subprocess.check_output(
                ["/usr/libexec/ApplicationFirewall/socketfilterfw", "--getglobalstate"],
                stderr=subprocess.STDOUT
            ).decode()
            return {"system": "macOS", "status": output.strip()}

        # Linux firewall status (ufw)
        elif system == "linux":
            try:
                output = subprocess.check_output(
                    ["ufw", "status"],
                    stderr=subprocess.STDOUT
                ).decode()
                return {"system": "Linux", "status": output.strip()}
            except Exception:
                return {"system": "Linux", "status": "ufw not installed or not accessible"}

        # Windows firewall status
        elif system == "windows":
            output = subprocess.check_output(
                ["netsh", "advfirewall", "show", "allprofiles"],
                stderr=subprocess.STDOUT
            ).decode()
            return {"system": "Windows", "status": output.strip()}

        else:
            return {"error": "Unsupported OS"}

    except Exception as e:
        return {"error": str(e)}

# ------------------------------------------------------------
# API ROUTES
# ------------------------------------------------------------

@router.get("/status")
def firewall_status():
    """
    Returns the current firewall status depending on OS.
    """
    return get_firewall_status()


@router.get("/rules")
def firewall_rules():
    """
    Returns firewall rules depending on OS.
    """
    system = platform.system().lower()

    try:
        if system == "darwin":
            output = subprocess.check_output(
                ["/usr/libexec/ApplicationFirewall/socketfilterfw", "--listapps"],
                stderr=subprocess.STDOUT
            ).decode()
            return {"system": "macOS", "rules": output.splitlines()}

        elif system == "linux":
            output = subprocess.check_output(
                ["ufw", "status", "numbered"],
                stderr=subprocess.STDOUT
            ).decode()
            return {"system": "Linux", "rules": output.splitlines()}

        elif system == "windows":
            output = subprocess.check_output(
                ["netsh", "advfirewall", "firewall", "show", "rule", "name=all"],
                stderr=subprocess.STDOUT
            ).decode()
            return {"system": "Windows", "rules": output.splitlines()}

        else:
            return {"error": "Unsupported OS"}

    except Exception as e:
        return {"error": str(e)}
