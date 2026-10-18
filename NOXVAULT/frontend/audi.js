// ------------------------------
// Load System Audit Data
// ------------------------------
async function loadSystemAudit() {
    const res = await fetch("http://127.0.0.1:8000/system-audit");
    const data = await res.json();

    // Header
    document.getElementById("header-computer").textContent = "Computer: " + data.computer;
    document.getElementById("header-ip").textContent = "IP Address: " + data.ip_address;
    document.getElementById("header-date").textContent = "Audit Date: " + data.timestamp;

    // Summary cards
    document.getElementById("total-findings").textContent = data.total_findings;
    document.getElementById("critical-count").textContent = data.critical_issues;
    document.getElementById("warning-count").textContent = data.warnings;
    document.getElementById("info-count").textContent = data.informational;
    document.getElementById("security-score").textContent = data.security_score + "%";
    document.getElementById("security-score-bar").style.width = data.security_score + "%";

    // Top 5 critical issues
    fillCriticalList(data.top_critical);

    // Fill tables
    fillTable("system-info-table", data.system_info);
    fillTable("security-policies-table", data.security_policies);
    fillTable("network-summary-table", data.network_summary);
    fillTable("user-accounts-table", data.user_accounts);
    fillTable("installed-software-table", data.installed_software);
    fillTable("storage-summary-table", data.storage);

    // Events
    fillEvents("critical-events-table", data.events);

    // User accounts chart
    loadUserChart(data.user_accounts);
}

// ------------------------------
// Helper: Fill key-value tables
// ------------------------------
function fillTable(id, obj) {
    const table = document.getElementById(id);
    table.innerHTML = "";

    for (const key in obj) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${key}</td><td>${obj[key]}</td>`;
        table.appendChild(row);
    }
}

// ------------------------------
// Helper: Fill critical issues
// ------------------------------
function fillCriticalList(list) {
    const ul = document.getElementById("critical-list");
    ul.innerHTML = "";

    list.slice(0, 5).forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${item.severity}</strong> — ${item.description}`;
        ul.appendChild(li);
    });
}

// ------------------------------
// Helper: Fill events table
// ------------------------------
function fillEvents(id, events) {
    const tbody = document.querySelector(`#${id} tbody`);
    tbody.innerHTML = "";

    events.forEach(ev => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${ev.time}</td>
            <td>${ev.event_id}</td>
            <td>${ev.source}</td>
            <td>${ev.description}</td>
        `;
        tbody.appendChild(row);
    });
}

// ------------------------------
// User Accounts Chart
// ------------------------------
function loadUserChart(users) {
    const ctx = document.getElementById("userAccountsChart");
    const enabled = users.filter(u => u.enabled).length;
    const disabled = users.length - enabled;

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Enabled", "Disabled"],
            datasets: [{
                data: [enabled, disabled],
                backgroundColor: ["#2ea043", "#ff4d4d"]
            }]
        }
    });
}

// ------------------------------
// Sidebar Navigation
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".sidebar-menu li").forEach((item, index) => {
        item.addEventListener("click", () => {

            // Highlight active item
            document.querySelectorAll(".sidebar-menu li")
                .forEach(li => li.classList.remove("active"));
            item.classList.add("active");

            // Scroll to matching section
            const sections = document.querySelectorAll(".main section");
            if (sections[index]) {
                sections[index].scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});

// ------------------------------
// Print Report
// ------------------------------
document.getElementById("btn-print").addEventListener("click", () => {
    window.print();
});

// ------------------------------
// Export Report (JSON)
// ------------------------------
document.getElementById("btn-export-json")?.addEventListener("click", async () => {
    const res = await fetch("http://127.0.0.1:8000/system-audit");
    const data = await res.json();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "system_audit_report.json";
    a.click();
});

// ------------------------------
// Export Report (PDF)
// ------------------------------
document.getElementById("btn-export").addEventListener("click", () => {
    const element = document.querySelector(".main"); // Export entire audit content

    const options = {
        margin: 0.5,
        filename: "system_audit_report.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    };

    html2pdf().set(options).from(element).save();
});
