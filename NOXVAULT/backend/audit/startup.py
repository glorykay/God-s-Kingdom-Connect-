import platform
import subprocess

def get_startup_programs():
    """
    Returns startup programs depending on OS.
    Cross‑platform safe.
    """

    os_name = platform.system()

    if os_name == "Windows":
        return _windows_startup()
    elif os_name == "Darwin":
        return _macos_startup()
    elif os_name == "Linux":
        return _linux_startup()
    else:
        return {"error": "Unsupported OS"}


def _windows_startup():
    try:
        output = subprocess.check_output(
            ["powershell", "-Command", "Get-CimInstance Win32_StartupCommand | Select-Object Name, Command | ConvertTo-Json"],
            text=True
        )
        import json
        return json.loads(output)
    except Exception as e:
        return {"error": str(e)}


def _macos_startup():
    try:
        output = subprocess.check_output(
            ["osascript", "-e", 'tell application "System Events" to get the name of every login item'],
            text=True
        )
        return output.split(",")
    except Exception as e:
        return {"error": str(e)}


def _linux_startup():
    try:
        output = subprocess.check_output(
            ["ls", "/etc/init.d"],
            text=True
        )
        return output.splitlines()
    except Exception as e:
        return {"error": str(e)}
