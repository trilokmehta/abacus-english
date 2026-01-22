// CONFIGURATION
const SUPABASE_URL = "https://moktlyeoljidtjbokqne.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1va3RseWVvbGppZHRqYm9rcW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTIwODQsImV4cCI6MjA4NDU4ODA4NH0.ZnDXCZi58_srExZVLjMTsZVdrF-MyOpDDv27vVx_K5k";

const studentClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allStudentsCache = [];

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // Only run if elements exist (prevents errors on other pages)
  if (document.getElementById("branch-filter")) loadBranches();
  if (document.getElementById("student-table-body")) loadStudents();

  const singleForm = document.getElementById("single-form");
  if (singleForm) singleForm.addEventListener("submit", handleSingleAdd);
});

// --- 1. LOAD DATA ---
async function loadBranches() {
  const { data, error } = await studentClient.from("branches").select("*");
  if (error) console.error("Error loading branches:", error);

  const ids = ["branch-filter", "m-branch", "bulk-branch"];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (id === "branch-filter")
      el.innerHTML = '<option value="all">All Branches</option>';
    else el.innerHTML = "";

    if (data) {
      data.forEach((b) => {
        el.innerHTML += `<option value="${b.id}">${b.name}</option>`;
      });
    }
  });
}

async function loadStudents() {
  const tbody = document.getElementById("student-table-body");
  tbody.innerHTML =
    '<tr><td colspan="8" style="text-align:center">Loading...</td></tr>';

  const branchId = document.getElementById("branch-filter").value;
  const status = document.getElementById("status-filter").value;

  let query = studentClient
    .from("students")
    .select(`*, branches ( name )`)
    .order("created_at", { ascending: false });

  if (branchId !== "all") query = query.eq("branch_id", branchId);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  const { data, error } = await query;
  if (error) {
    alert("Error: " + error.message);
    return;
  }

  allStudentsCache = data;
  renderTable(data);
}

function renderTable(students) {
  const tbody = document.getElementById("student-table-body");
  document.getElementById("student-count").textContent =
    `${students.length} Records Found`;
  tbody.innerHTML = "";

  if (students.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center; padding:20px;">No students found.</td></tr>';
    return;
  }

  students.forEach((s) => {
    const statusClass = s.is_active ? "active-bdg" : "inactive-bdg";
    const statusText = s.is_active ? "Active" : "Inactive";

    const row = `
            <tr>
                <td><strong>${s.name}</strong><br><small style="color:#888">${s.father_name || ""}</small></td>
                <td>${s.phone}</td>
                <td>${s.branches?.name || "Unknown"}</td>
                <td>${s.school_name || "-"}</td>
                <td>₹${s.fee_amount}</td>
                <td>${s.billing_day}th</td>
                <td>
                    <span class="status-toggle ${statusClass}" onclick="toggleStatus('${s.id}', ${s.is_active})">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <button class="action-btn" title="View/Edit" onclick="openStudentDetail('${s.id}')">edit</button>
                </td>
            </tr>
        `;
    tbody.innerHTML += row;
  });
}

// --- 2. SEARCH ---
function filterLocal() {
  const term = document.getElementById("search-input").value.toLowerCase();
  const filtered = allStudentsCache.filter(
    (s) =>
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term)) ||
      (s.father_name && s.father_name.toLowerCase().includes(term)),
  );
  renderTable(filtered);
}

// --- 3. ADD SINGLE STUDENT (UPDATED) ---
async function handleSingleAdd(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = "Saving...";
  btn.disabled = true;

  const newStudent = {
    branch_id: document.getElementById("m-branch").value,
    name: document.getElementById("m-name").value,
    phone: document.getElementById("m-phone").value,
    fee_amount: document.getElementById("m-fee").value,
    billing_day: document.getElementById("m-day").value,
    // NEW FIELDS
    father_name: document.getElementById("m-father").value,
    school_name: document.getElementById("m-school").value,
    sibling_name: document.getElementById("m-sibling").value,
    current_education: document.getElementById("m-edu").value,
    parent_education: document.getElementById("m-parent-edu").value,
    is_active: true,
  };

  const { error } = await studentClient.from("students").insert(newStudent);

  if (error) {
    alert("Error: " + error.message);
  } else {
    closeModal("add-modal");
    document.getElementById("single-form").reset();
    loadStudents();
  }
  btn.textContent = originalText;
  btn.disabled = false;
}

// --- 4. BULK UPLOAD (UPDATED) ---
function downloadCSVTemplate() {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    "Student Name,Phone,Fee,Day,Father Name,School,Sibling,Current Edu,Parent Edu\n" +
    "Rahul Sharma,9999999999,5000,8,Rajesh Sharma,DPS Delhi,None,10th,Graduate";

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "student_upload_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function processBulk() {
  const branchId = document.getElementById("bulk-branch").value;
  const rawText = document.getElementById("bulk-text").value;

  if (!rawText.trim()) return alert("Please paste data first.");

  const lines = rawText.split("\n");
  const studentsToAdd = [];

  lines.forEach((line) => {
    if (!line.trim()) return;
    const parts = line.includes("\t") ? line.split("\t") : line.split(",");

    // We now expect more columns, but will work with min 3
    if (parts.length >= 3) {
      const name = parts[0].trim();
      if (name.toLowerCase().includes("student name")) return; // Skip Header

      studentsToAdd.push({
        branch_id: branchId,
        name: name,
        phone: parts[1] ? parts[1].trim() : "",
        fee_amount: parseInt(parts[2]?.trim()) || 0,
        billing_day: parseInt(parts[3]?.trim()) || 1,
        // NEW FIELDS (Optional in CSV)
        father_name: parts[4] ? parts[4].trim() : "",
        school_name: parts[5] ? parts[5].trim() : "",
        sibling_name: parts[6] ? parts[6].trim() : "",
        current_education: parts[7] ? parts[7].trim() : "",
        parent_education: parts[8] ? parts[8].trim() : "",
        is_active: true,
      });
    }
  });

  if (studentsToAdd.length === 0) return alert("Format incorrect.");

  if (!confirm(`Ready to upload ${studentsToAdd.length} students?`)) return;

  const { error } = await studentClient.from("students").insert(studentsToAdd);

  if (error) {
    alert("Upload Failed: " + error.message);
  } else {
    alert(`Successfully added ${studentsToAdd.length} students!`);
    closeModal("bulk-modal");
    document.getElementById("bulk-text").value = "";
    loadStudents();
  }
}

// --- UTILS ---
async function toggleStatus(id, currentStatus) {
  if (confirm(currentStatus ? "Mark as Inactive?" : "Re-activate student?")) {
    await studentClient
      .from("students")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    loadStudents();
  }
}

window.openModal = function (id) {
  document.getElementById(id).style.display = "flex";
};
window.closeModal = function (id) {
  document.getElementById(id).style.display = "none";
};
window.openStudentDetail = function (id) {
  window.location.href = `student-detail.html?id=${id}`;
};
window.filterLocal = filterLocal;
window.loadStudents = loadStudents;
window.processBulk = processBulk;
window.downloadCSVTemplate = downloadCSVTemplate;
window.toggleStatus = toggleStatus;
