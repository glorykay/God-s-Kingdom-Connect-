import platform
import subprocess
from datetime import datetime
from typing import Dict, Any, List


def get_event_logs() -> Dict[str, Any]:
    """
    Cross‑platform event log collector.
    Returns last 50 security/system events depending on OS.
    """

    os_name = platform.system()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "OS": os_name,
        "events": _get_logs_by_os(os_name)
    }


# ---------------------------------------------------------
# OS ROUTER
# ---------------------------------------------------------

def _get_logs_by_os(os_name: str) -> List[Dict[str, Any]]:
    try:
        if os_name == "Windows":
            return _windows_event_logs()

        elif os_name == "Darwin":
            return _macos_event_logs()

        elif os_name == "Linux":
            return _linux_event_logs()

        else:
            return [{"error": "Unsupported OS"}]

    except Exception as e:
        return [{"error": str(e)}]


# ---------------------------------------------------------
# WINDOWS EVENT LOGS
# ---------------------------------------------------------

def _windows_event_logs() -> List[Dict[str, Any]]:
    """
    Uses PowerShell to fetch last 50 Security log entries.
    """
    try:
        cmd = [
            "powershell",
            "-Command",
            "Get-WinEvent -LogName Security -MaxEvents 50 | "
            "Select-Object TimeCreated, Id, LevelDisplayName, Message | ConvertTo-Json"
        ]

        output = subprocess.check_output(cmd, text=True)
        return _safe_json_parse(output)

    except Exception as e:
        return [{"error": f"Windows Event Log error: {e}"}]


# ---------------------------------------------------------
# macOS EVENT LOGS
# ---------------------------------------------------------

def _macos_event_logs() -> List[Dict[str, Any]]:
    """
    Uses macOS unified logging system.
    """
    try:
        cmd = [
            "log", "show",
            "--style", "json",
            "--last", "1h"
        ]

        output = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)
        lines = output.splitlines()

        events = []
        for line in lines[:50]:  # Limit to 50 entries
            events.append({"raw": line})

        return events

    except Exception as e:
        return [{"error": f"macOS log error: {e}"}]


# ---------------------------------------------------------
# LINUX EVENT LOGS
# ---------------------------------------------------------

def _linux_event_logs() -> List[Dict[str, Any]]:
    """
    Uses journalctl to fetch last 50 system events.
    """
    try:
        cmd = ["journalctl", "-n", "50", "-o", "json"]

        output = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)
        lines = output.splitlines()

        events = []
        for line in lines:
            events.append({"raw": line})

        return events

    except Exception as e:
        return [{"error": f"Linux journal error: {e}"}]


# ---------------------------------------------------------
# SAFE JSON PARSER
# ---------------------------------------------------------

def _safe_json_parse(raw: str):
    """
    Safely parse PowerShell JSON output.
    """
    import json

    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return [data]
        return data
    except:
        return [{"raw": raw}]
