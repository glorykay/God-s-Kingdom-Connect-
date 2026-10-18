from fastapi import APIRouter
import psutil
from datetime import datetime

router = APIRouter(
    prefix="/traffic",
    tags=["Network Traffic"]
)

# ------------------------------------------------------------
# GET LIVE NETWORK TRAFFIC STATS
# ------------------------------------------------------------

def get_network_traffic():
    counters = psutil.net_io_counters()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "bytes_sent": counters.bytes_sent,
        "bytes_recv": counters.bytes_recv,
        "packets_sent": counters.packets_sent,
        "packets_recv": counters.packets_recv,
        "errin": counters.errin,
        "errout": counters.errout,
        "dropin": counters.dropin,
        "dropout": counters.dropout
    }

# ------------------------------------------------------------
# GET PER-INTERFACE TRAFFIC
# ------------------------------------------------------------

def get_interface_traffic():
    stats = psutil.net_io_counters(pernic=True)
    result = {}

    for iface, data in stats.items():
        result[iface] = {
            "bytes_sent": data.bytes_sent,
            "bytes_recv": data.bytes_recv,
            "packets_sent": data.packets_sent,
            "packets_recv": data.packets_recv,
            "errin": data.errin,
            "errout": data.errout,
            "dropin": data.dropin,
            "dropout": data.dropout
        }

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "interfaces": result
    }

# ------------------------------------------------------------
# API ROUTES
# ------------------------------------------------------------

@router.get("/live")
def traffic_live():
    """
    Returns live network traffic statistics.
    """
    return get_network_traffic()


@router.get("/interfaces")
def traffic_interfaces():
    """
    Returns traffic stats for each network interface.
    """
    return get_interface_traffic()
