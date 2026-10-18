/* ============================
   SYSTEM AUDIT DATA (STATIC DEMO)
   ============================ */

   // 1. Load data from backend
async function loadAuditData() {
    const response = await fetch("http://localhost:8000/audit");
    const auditData = await response.json();
    populateUI(auditData);
}

loadAuditData();

// 2. Populate UI with backend data
function populateUI(auditData) {

    // HEADER
    document.getElementById("header-computer").textContent =
        "Computer: " + auditData.computer;

    document.getElementById("header-ip").textContent =
        "IP Address: " + auditData.ip;

    document.getElementById("header-date").textContent =
        "Audit Date: " + auditData.auditDate;

    // SUMMARY CARDS
    document.getElementById("total-findings").textContent =
        auditData.summary.totalFindings;

    document.getElementById("critical-count").textContent =
        auditData.summary.critical;

    document.getElementById("warning-count").textContent =
        auditData.summary.warnings;

    document.getElementById("info-count").textContent =
        auditData.summary.informational;

    document.getElementById("security-score").textContent =
        auditData.summary.securityScore + "%";

    document.getElementById("security-score-bar").style.width =
        auditData.summary.securityScore + "%";

    // TOP 5 CRITICAL ISSUES
    const criticalList = document.getElementById("critical-list");
    criticalList.innerHTML = "";
    auditData.topCriticalIssues.forEach(issue => {
        const li = document.createElement("li");
        li.textContent = issue;
        criticalList.appendChild(li);
    });

    // TABLES
    fillTable("system-info-table", auditData.systemInfo);
    fillTable("security-policies-table", auditData.securityPolicies);
    fillTable("network-summary-table", auditData.networkSummary);
    fillTable("user-accounts-table", auditData.userAccounts);
    fillTable("installed-software-table", auditData.installedSoftware);
    fillTable("storage-summary-table", auditData.storageSummary);

    // EVENTS
    const eventsBody = document.querySelector("#critical-events-table tbody");
    eventsBody.innerHTML = "";
    auditData.criticalEvents.forEach(ev => {
        const row = `
            <tr>
                <td>${ev.time}</td>
                <td>${ev.id}</td>
                <td>${ev.source}</td>
                <td>${ev.desc}</td>
            </tr>
        `;
        eventsBody.innerHTML += row;
    });

    // PIE CHART
    const ctx = document.getElementById("userAccountsChart");
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Active", "Disabled", "Expired", "Admin"],
            datasets: [{
                data: [
                    auditData.userAccounts["Active Accounts"],
                    auditData.userAccounts["Disabled Accounts"],
                    auditData.userAccounts["Expired Accounts"],
                    auditData.userAccounts["Admin Accounts"]
                ],
                backgroundColor: [
                    "#3b82f6",
                    "#f87171",
                    "#fbbf24",
                    "#10b981"
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}


const auditData = {
    computer: "WIN-7G8J21Q7K2I",
    ip: "192.168.1.10",
    auditDate: "25-05-2024 10:30:45",

    summary: {
        totalFindings: 126,
        critical: 5,
        warnings: 18,
        informational: 103,
        securityScore: 72
    },

    topCriticalIssues: [
        "SMBv1 Protocol is enabled — Critical",
        "Windows Firewall is disabled — Critical",
        "Missing Security Updates — Critical",
        "Weak Password Policy — Critical",
        "Guest Account is enabled — Critical"
    ],

    systemInfo: {
        "OS Name": "Windows 10 Pro",
        "OS Version": "10.0.19045 Build 19045",
        "System Type": "64-bit Operating System",
        "Computer Name": "WIN-7G8J21Q7K2I",
        "Domain / Workgroup": "WORKGROUP",
        "Logged In User": "Administrator",
        "Audit Time": "25-05-2024 10:30:45"
    },

    securityPolicies: {
        "Password Policy": "Strong",
        "Firewall": "Disabled",
        "Antivirus": "Enabled",
        "Windows Update": "Some updates missing",
        "User Account Control (UAC)": "Enabled"
    },

    networkSummary: {
        "IP Address": "192.168.1.10",
        "MAC Address": "00-0C-29-8B-1D-4E",
        "Open Ports": "12",
        "Active Connections": "12",
        "Firewall Status": "Disabled"
    },

    userAccounts: {
        "Total Accounts": 12,
        "Active Accounts": 8,
        "Disabled Accounts": 2,
        "Expired Accounts": 1,
        "Admin Accounts": 1
    },

    installedSoftware: {
        "Total Installed Programs": 78,
        "Outdated Programs": 6,
        "Recently Installed (30 days)": 4,
        "Unauthorized Programs": 2
    },

    storageSummary: {
        "Total Disk Space": "237.37 GB",
        "Used Space": "142.38 GB (59%)",
        "Free Space": "94.99 GB (41%)",
        "Drives": "C:\\ (237.37 GB NTFS)"
    },

    criticalEvents: [
        {
            time: "25-05-2024 10:25:31",
            id: "4625",
            source: "Microsoft Windows security",
            desc: "Failed login attempt for user ‘admin’"
        },
        {
            time: "25-05-2024 10:25:31",
            id: "7045",
            source: "Service Control Manager",
            desc: "Service ‘Remote Registry’ failed to start"
        },
        {
            time: "25-05-2024 10:09:39",
            id: "10016",
            source: "DistributedCOM",
            desc: "DCOM permission issue"
        },
        {
            time: "25-05-2024 10:09:39",
            id: "7045",
            source: "Service Control Manager",
            desc: "Windows firewall service stopped"
        },
        {
            time: "25-05-2024 10:09:39",
            id: "7036",
            source: "Microsoft Windows security",
            desc: "System audit policy changed"
        }
    ]
};


/* ============================
   POPULATE HEADER
   ============================ */

document.getElementById("header-computer").textContent =
    "Computer: " + auditData.computer;

document.getElementById("header-ip").textContent =
    "IP Address: " + auditData.ip;

document.getElementById("header-date").textContent =
    "Audit Date: " + auditData.auditDate;


/* ============================
   SUMMARY CARDS
   ============================ */

document.getElementById("total-findings").textContent =
    auditData.summary.totalFindings;

document.getElementById("critical-count").textContent =
    auditData.summary.critical;

document.getElementById("warning-count").textContent =
    auditData.summary.warnings;

document.getElementById("info-count").textContent =
    auditData.summary.informational;

document.getElementById("security-score").textContent =
    auditData.summary.securityScore + "%";

document.getElementById("security-score-bar").style.width =
    auditData.summary.securityScore + "%";


/* ============================
   TOP 5 CRITICAL ISSUES
   ============================ */

const criticalList = document.getElementById("critical-list");

auditData.topCriticalIssues.forEach(issue => {
    const li = document.createElement("li");
    li.textContent = issue;
    criticalList.appendChild(li);
});


/* ============================
   TABLE BUILDER
   ============================ */

function fillTable(tableId, dataObj) {
    const table = document.getElementById(tableId);
    table.innerHTML = "";

    Object.entries(dataObj).forEach(([key, value]) => {
        const row = `
            <tr>
                <td>${key}</td>
                <td>${value}</td>
            </tr>
        `;
        table.innerHTML += row;
    });
}

fillTable("system-info-table", auditData.systemInfo);
fillTable("security-policies-table", auditData.securityPolicies);
fillTable("network-summary-table", auditData.networkSummary);
fillTable("user-accounts-table", auditData.userAccounts);
fillTable("installed-software-table", auditData.installedSoftware);
fillTable("storage-summary-table", auditData.storageSummary);


/* ============================
   CRITICAL EVENTS TABLE
   ============================ */

const eventsBody = document.querySelector("#critical-events-table tbody");

auditData.criticalEvents.forEach(ev => {
    const row = `
        <tr>
            <td>${ev.time}</td>
            <td>${ev.id}</td>
            <td>${ev.source}</td>
            <td>${ev.desc}</td>
        </tr>
    `;
    eventsBody.innerHTML += row;
});


/* ============================
   USER ACCOUNTS PIE CHART
   ============================ */

const ctx = document.getElementById("userAccountsChart");

new Chart(ctx, {
    type: "pie",
    data: {
        labels: ["Active", "Disabled", "Expired", "Admin"],
        datasets: [{
            data: [
                auditData.userAccounts["Active Accounts"],
                auditData.userAccounts["Disabled Accounts"],
                auditData.userAccounts["Expired Accounts"],
                auditData.userAccounts["Admin Accounts"]
            ],
            backgroundColor: [
                "#3b82f6",
                "#f87171",
                "#fbbf24",
                "#10b981"
            ]
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: "bottom" }
        }
    }
});

const auditData = {
  "computer": "WIN-7G8J21Q7K2I",
  "ip": "192.168.1.10",
  "auditDate": "25-05-2024 10:30:45",
  "summary": {
    "totalFindings": 126,
    "critical": 5,
    "warnings": 18,
    "informational": 103,
    "securityScore": 72
  }
  // ...
};

// 3. Helper function
function fillTable(tableId, dataObj) {
    const table = document.getElementById(tableId);
    table.innerHTML = "";

    Object.entries(dataObj).forEach(([key, value]) => {
        const row = `
            <tr>
                <td>${key}</td>
                <td>${value}</td>
            </tr>
        `;
        table.innerHTML += row;
    });
}
