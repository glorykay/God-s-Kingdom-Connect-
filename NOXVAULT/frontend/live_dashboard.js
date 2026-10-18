const socket = new WebSocket("ws://127.0.0.1:8001/ws/noxvault-console");

socket.onopen = () => {
    console.log("Connected to NOXVAULT WebSocket");
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received payload:", data);

    document.getElementById("systemAuditBox").textContent =
        JSON.stringify(data.system_health, null, 2);

    document.getElementById("networkAuditBox").textContent =
        JSON.stringify(data.threat_events, null, 2);

    document.getElementById("firewallAuditBox").textContent =
        JSON.stringify(data.firewall_stats, null, 2);

    document.getElementById("securityAuditBox").textContent =
        JSON.stringify(data.threat_summary, null, 2);

    document.getElementById("trafficAuditBox").textContent =
        JSON.stringify(data.asset_os_distribution, null, 2);

    document.getElementById("vulnerabilityAuditBox").textContent =
        JSON.stringify(data.vuln_counts, null, 2);

    updateCharts(data);
};

socket.onclose = () => {
    console.log("WebSocket connection closed");
};

socket.onerror = (error) => {
    console.error("WebSocket error:", error);
};

let iocChart, alertChart, severityChart;

function updateCharts(data) {
    // IOC BAR CHART
    if (!iocChart) {
        iocChart = new Chart(document.getElementById("iocBarChart"), {
            type: "bar",
            data: {
                labels: Object.keys(data.asset_os_distribution),
                datasets: [{
                    label: "Assets",
                    data: Object.values(data.asset_os_distribution),
                    backgroundColor: [
                        "rgba(59, 130, 246, 0.8)",
                        "rgba(234, 179, 8, 0.8)",
                        "rgba(239, 68, 68, 0.8)"
                    ],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    } else {
        iocChart.data.datasets[0].data = Object.values(data.asset_os_distribution);
        iocChart.update();
    }

    // ALERT LINE CHART
    if (!alertChart) {
        alertChart = new Chart(document.getElementById("alertLineChart"), {
            type: "line",
            data: {
                labels: data.threat_events.map(e => e.ts),
                datasets: [{
                    label: "Alerts",
                    data: data.threat_events.map(e => e.severity.length),
                    borderColor: "rgba(59, 130, 246, 1)",
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    tension: 0.35,
                    fill: true
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    } else {
        alertChart.data.labels = data.threat_events.map(e => e.ts);
        alertChart.data.datasets[0].data = data.threat_events.map(e => e.severity.length);
        alertChart.update();
    }

    // SEVERITY DONUT CHART
    if (!severityChart) {
        severityChart = new Chart(document.getElementById("severityDonutChart"), {
            type: "doughnut",
            data: {
                labels: ["Critical", "High", "Medium", "Low"],
                datasets: [{
                    data: [
                        data.threat_summary.critical,
                        data.threat_summary.high,
                        data.threat_summary.medium,
                        data.threat_summary.low
                    ],
                    backgroundColor: [
                        "rgba(239, 68, 68, 0.9)",
                        "rgba(249, 115, 22, 0.9)",
                        "rgba(234, 179, 8, 0.9)",
                        "rgba(34, 197, 94, 0.9)"
                    ]
                }]
            },
            options: {
                cutout: "60%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "#9ca3af", font: { size: 11 } }
                    }
                }
            }
        });
    } else {
        severityChart.data.datasets[0].data = [
            data.threat_summary.critical,
            data.threat_summary.high,
            data.threat_summary.medium,
            data.threat_summary.low
        ];
        severityChart.update();
    }
}
