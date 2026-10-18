import psutil

def get_storage_info():
    """
    Returns detailed storage information:
    - All partitions
    - Total / used / free space
    - Usage percentage
    - File system type
    """

    storage = []

    for part in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(part.mountpoint)

            storage.append({
                "device": part.device,
                "mount_point": part.mountpoint,
                "file_system": part.fstype,
                "total_gb": round(usage.total / 1e9, 2),
                "used_gb": round(usage.used / 1e9, 2),
                "free_gb": round(usage.free / 1e9, 2),
                "percent_used": usage.percent
            })

        except PermissionError:
            # Some system partitions cannot be accessed
            storage.append({
                "device": part.device,
                "mount_point": part.mountpoint,
                "file_system": part.fstype,
                "error": "Permission denied"
            })
        except Exception as e:
            storage.append({
                "device": part.device,
                "mount_point": part.mountpoint,
                "file_system": part.fstype,
                "error": str(e)
            })

    return {
        "count": len(storage),
        "partitions": storage
    }
