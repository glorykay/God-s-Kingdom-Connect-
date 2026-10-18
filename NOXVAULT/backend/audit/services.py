import psutil

def get_services():
    """
    Returns a list of running system services / daemons / background tasks.
    Cross‑platform safe using psutil.
    """

    services = []

    for proc in psutil.process_iter(['pid', 'name', 'status', 'username', 'exe']):
        try:
            info = proc.info
            services.append({
                "pid": info.get("pid"),
                "name": info.get("name"),
                "status": info.get("status"),
                "user": info.get("username"),
                "executable": info.get("exe")
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return {
        "count": len(services),
        "services": services
    }
