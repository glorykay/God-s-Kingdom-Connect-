import psutil
import time


def run_traffic_audit():
    """
    Basic network traffic audit.
    SAFE: No packet sniffing, no deep inspection.
    Only reads OS-level counters.
    """

    try:
        # Capture initial network I/O
        io_start = psutil.net_io_counters()
        time.sleep(1)  # 1-second sample window
        io_end = psutil.net_io_counters()

        bytes_sent_per_sec = io_end.bytes_sent - io_start.bytes_sent
        bytes_recv_per_sec = io_end.bytes_recv - io_start.bytes_recv

        return {
            "status": "ok",
            "message": "Traffic audit executed",
            "checks": {
                "bytes_sent_per_sec": bytes_sent_per_sec,
                "bytes_received_per_sec": bytes_recv_per_sec,
                "total_bytes_sent": io_end.bytes_sent,
                "total_bytes_received": io_end.bytes_recv,
                "packets_sent": io_end.packets_sent,
                "packets_received": io_end.packets_recv,
                "error_in": io_end.errin,
                "error_out": io_end.errout,
                "drop_in": io_end.dropin,
                "drop_out": io_end.dropout
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
