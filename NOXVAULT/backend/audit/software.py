import psutil

def get_installed_software():
    """
    Returns a list of running applications and processes.
    This is the closest cross‑platform way to detect installed software
    without OS‑specific package managers.
    """

    software_list = []

    for proc in psutil.process_iter(['pid', 'name', 'exe', 'cmdline']):
        try:
            info = proc.info
            software_list.append({
                "pid": info.get("pid"),
                "name": info.get("name"),
                "executable": info.get("exe"),
                "cmdline": info.get("cmdline"),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return {
        "count": len(software_list),
        "running_software": software_list
    }
