import platform
from typing import Dict


def detect_platform() -> Dict[str, str]:
    """
    Detects the current operating system and architecture.
    Used by NOXVAULT agents to load OS-specific modules.
    """

    system = platform.system()
    release = platform.release()
    version = platform.version()
    architecture = platform.machine()

    if system == "Linux":
        os_family = "linux"
    elif system == "Darwin":
        os_family = "macos"
    elif system == "Windows":
        os_family = "windows"
    else:
        os_family = "unknown"

    return {
        "system": system,
        "os_family": os_family,
        "release": release,
        "version": version,
        "architecture": architecture
    }


def is_linux() -> bool:
    return platform.system() == "Linux"


def is_macos() -> bool:
    return platform.system() == "Darwin"


def is_windows() -> bool:
    return platform.system() == "Windows"
