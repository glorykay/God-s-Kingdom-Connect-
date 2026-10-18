async function initCharts() {
    const API = "http://127.0.0.1:8000/api";

    // Fetch all chart + audit data in parallel
    const [trafficRes, auditRes, vulnRes, firewallRes, healthRes] = await Promise.all([
        fetch(`${API}/network-traffic`).then(r => r.json()),
        fetch(`${API}/network-audit`).then(r => r.json()),
        fetch(`${API}/vulnerabilities`).then(r => r.json()),
        fetch(`${API}/firewall`).then(r => r.json()),
        fetch(`${API}/system-health`).then(r => r.json())
    ]);

    console.log("AUDIT DATA:", auditRes);

    // -----------------------------
    // UPDATE AUDIT MODULE BOXES
    // -----------------------------
    document.getElementById("systemAuditBox").textContent =
        JSON.stringify(healthRes.system_health, null, 2);

    document.getElementById("networkAuditBox").textContent =
        JSON.stringify(auditRes.threat_events, null, 2);

    document.getElementById("firewallAuditBox").textContent =
        JSON.stringify(firewallRes.firewall_stats, null, 2);

    document.getElementById("securityAuditBox").textContent =
        JSON.stringify(auditRes.threat_summary, null, 2);

    document.getElementById("trafficAuditBox").textContent =
        JSON.stringify(trafficRes.asset_os_distribution, null, 2);

    document.getElementById("vulnerabilityAuditBox").textContent =
        JSON.stringify(vulnRes.vuln_counts, null, 2);

    // -----------------------------
    // IOC BAR CHART (asset OS distribution)
    // -----------------------------
    new Chart(document.getElementById("iocBarChart"), {
        type: "bar",
        data: {
            labels: Object.keys(trafficRes.asset_os_distribution),
            datasets: [{
                label: "Assets",
                data: Object.values(trafficRes.asset_os_distribution),
                backgroundColor: [
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(234, 179, 8, 0.8)",
                    "rgba(239, 68, 68, 0.8)",
                    "rgba(34, 197, 94, 0.8)",
                    "rgba(168, 85, 247, 0.8)"
                ],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });

    // -----------------------------
    // ALERT LINE CHART (threat events)
    // -----------------------------
    new Chart(document.getElementById("alertLineChart"), {
        type: "line",
        data: {
            labels: auditRes.threat_events.map(e => e.ts),
            datasets: [{
                label: "Alerts",
                data: auditRes.threat_events.map(e => e.severity.length),
                borderColor: "rgba(59, 130, 246, 1)",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                tension: 0.35,
                fill: true
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });

    // -----------------------------
    // SEVERITY DONUT CHART
    // -----------------------------
    new Chart(document.getElementById("severityDonutChart"), {
        type: "doughnut",
        data: {
            labels: ["Critical", "High", "Medium", "Low"],
            datasets: [{
                data: [
                    auditRes.threat_summary.critical,
                    auditRes.threat_summary.high,
                    auditRes.threat_summary.medium,
                    auditRes.threat_summary.low
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
}