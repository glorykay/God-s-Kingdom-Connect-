import psutil

def list_processes():
    """
    Returns a list of all running processes with:
    - PID
    - Name
    - Status
    - CPU usage
    - Memory usage
    - Executable path (if available)
    """

    processes = []

    for proc in psutil.process_iter(['pid', 'name', 'status', 'cpu_percent', 'memory_percent', 'exe']):
        try:
            info = proc.info
            processes.append({
                "pid": info.get("pid"),
                "name": info.get("name"),
                "status": info.get("status"),
                "cpu_percent": info.get("cpu_percent"),
                "memory_percent": info.get("memory_percent"),
                "executable": info.get("exe")
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return {
        "count": len(processes),
        "processes": processes
    }
