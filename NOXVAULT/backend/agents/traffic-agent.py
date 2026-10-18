import psutil
from datetime import datetime

def run_traffic_scan():
    """
    Collects basic network traffic statistics using psutil.
    Returns a dictionary with upload/download totals and per-interface data.
    """

    try:
        net_io = psutil.net_io_counters(pernic=True)
        traffic_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "interfaces": {}
        }

        for interface, stats in net_io.items():
            traffic_data["interfaces"][interface] = {
                "bytes_sent": stats.bytes_sent,
                "bytes_recv": stats.bytes_recv,
                "packets_sent": stats.packets_sent,
                "packets_recv": stats.packets_recv,
                "errin": stats.errin,
                "errout": stats.errout,
                "dropin": stats.dropin,
                "dropout": stats.dropout
            }

        return traffic_data

    except Exception as e:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }
