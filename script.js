// ---------- Helpers ----------
const form = document.getElementById("regForm");
const MAX_FILE_SIZE = 2 * 1024 * 1024;          // 2 MB
const ALLOWED_EXT = ["png", "jpg", "jpeg", "pdf"]; // allowed file extensions

function get(id) { return document.getElementById(id).value.trim(); }

// Show (or clear) an error message under a field
function setError(id, message) {
  document.getElementById(id + "Error").textContent = message;
  const input = document.getElementById(id);
  if (input) input.classList.toggle("invalid", message !== "");
  return message !== "";   // true when there IS an error
}

// Calculate age from a date string
function getAge(dateString) {
  const birth = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ---------- Date of birth: no future dates + live age ----------
const dobInput = document.getElementById("dob");
dobInput.max = new Date().toISOString().split("T")[0];

dobInput.addEventListener("input", function () {
  document.getElementById("age").textContent = dobInput.value ? getAge(dobInput.value) + " years old" : "—";
});

// ---------- "None" lab cannot be combined with other labs ----------
const labBoxes = document.querySelectorAll("input[name=labs]");
labBoxes.forEach(function (box) {
  box.addEventListener("change", function () {
    if (box.id === "noLab" && box.checked) {
      labBoxes.forEach(function (b) { if (b !== box) b.checked = false; });
    } else if (box.checked) {
      document.getElementById("noLab").checked = false;
    }
  });
});

// ---------- Validation ----------
function validate() {
  let hasError = false;
  const check = function (id, message) { if (setError(id, message)) hasError = true; };

  // Full name
  const name = get("name");
  check("name", !/^[A-Za-z.\-' ]{2,}$/.test(name) ? "Enter your full name (letters only)." : "");

  // LRN: exactly 12 digits
  check("lrn", !/^\d{12}$/.test(get("lrn")) ? "LRN must be exactly 12 digits." : "");

  // Date of birth + age eligibility
  let dobMsg = "";
  if (!get("dob")) dobMsg = "Select your date of birth.";
  else if (getAge(get("dob")) < 16) dobMsg = "You must be at least 16 years old to enroll.";
  check("dob", dobMsg);

  // Mobile: 11 digits, starts with 09
  check("mobile", !/^09\d{9}$/.test(get("mobile")) ? "Enter 11 digits starting with 09." : "");

  // Emails
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let instMsg = "";
  if (!emailPattern.test(get("instEmail"))) instMsg = "Enter a valid email.";
  else if (!get("instEmail").toLowerCase().endsWith(".edu.ph")) instMsg = "Email must end in .edu.ph.";
  check("instEmail", instMsg);

  let persMsg = "";
  if (!emailPattern.test(get("persEmail"))) persMsg = "Enter a valid email.";
  else if (get("persEmail").toLowerCase() === get("instEmail").toLowerCase()) persMsg = "Must be different from your institutional email.";
  check("persEmail", persMsg);

  // Password strength + confirmation
  const pw = document.getElementById("pw").value;
  let pwMsg = "";
  if (pw.length < 😎 pwMsg = "Use at least 8 characters.";
  else if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) pwMsg = "Mix uppercase and lowercase letters.";
  else if (!/\d/.test(pw)) pwMsg = "Add at least one number.";
  else if (!/[^A-Za-z0-9]/.test(pw)) pwMsg = "Add at least one symbol.";
  check("pw", pwMsg);
  check("pw2", document.getElementById("pw2").value !== pw || pw === "" ? "Passwords do not match." : "");

  // Program
  check("program", get("program") === "" ? "Choose your degree program." : "");

  // Radio buttons
  const year = document.querySelector("input[name=year]:checked");
  const status = document.querySelector("input[name=status]:checked");
  check("year", year ? "" : "Select your year level.");
  check("status", status ? "" : "Select your enrollment status.");

  // Units (3-24, regular students need 15+)
  const units = Number(get("units"));
  let unitsMsg = "";
  if (get("units") === "" || !Number.isInteger(units) || units < 3 || units > 24) unitsMsg = "Enter whole units from 3 to 24.";
  else if (status && status.value === "Regular" && units < 15) unitsMsg = "Regular students need at least 15 units.";
  check("units", unitsMsg);

  // GWA (1.00 - 5.00)
  const gwa = Number(get("gwa"));
  check("gwa", get("gwa") === "" || gwa < 1 || gwa > 5 ? "GWA must be between 1.00 and 5.00." : "");

  // Labs: at least one checkbox
  const labs = document.querySelectorAll("input[name=labs]:checked");
  check("labs", labs.length === 0 ? "Select at least one option." : "");

  // File: required, extension, size
  const file = document.getElementById("file").files[0];
  let fileMsg = "";
  if (!file) fileMsg = "Upload a photo or proof of grades.";
  else if (!ALLOWED_EXT.includes(file.name.split(".").pop().toLowerCase())) fileMsg = "Only PNG, JPG or PDF files are allowed.";
  else if (file.size > MAX_FILE_SIZE) fileMsg = "File is too large. Maximum is 2 MB.";
  check("file", fileMsg);

  // Essay
  check("essay", get("essay").length < 50 ? "Write at least 50 characters." : "");

  // Emergency contact
  check("ecName", !/^[A-Za-z.\-' ]{2,}$/.test(get("ecName")) ? "Enter a valid contact name." : "");
  let ecMsg = "";
  if (!/^09\d{9}$/.test(get("ecTel"))) ecMsg = "Enter 11 digits starting with 09.";
  else if (get("ecTel") === get("mobile")) ecMsg = "Use a different number from your own.";
  check("ecTel", ecMsg);

  // Terms
  check("terms", document.getElementById("terms").checked ? "" : "You must accept the terms.");

  return !hasError;
}

// ---------- Submit: validate, then show modal ----------
form.addEventListener("submit", function (event) {
  event.preventDefault();               // stop page reload
  if (!validate()) {
    document.querySelector(".invalid, .error:not(:empty)").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const labs = Array.from(document.querySelectorAll("input[name=labs]:checked")).map(function (b) { return b.value; });
  const file = document.getElementById("file").files[0];

  const rows = [
    ["Full name", get("name")],
    ["Student ID / LRN", get("lrn")],
    ["Date of birth", get("dob") + " (age " + getAge(get("dob")) + ")"],
    ["Mobile", get("mobile")],
    ["Institutional email", get("instEmail")],
    ["Personal email", get("persEmail")],
    ["Password", "•".repeat(document.getElementById("pw").value.length)],
    ["Program", get("program")],
    ["Year level", document.querySelector("input[name=year]:checked").value],
    ["Status", document.querySelector("input[name=status]:checked").value],
    ["Units", get("units")],
    ["GWA", Number(get("gwa")).toFixed(2)],
    ["Lab courses", labs.join(", ")],
    ["Uploaded file", file.name + " (" + (file.size / 1024).toFixed(1) + " KB)"],
    ["Background", get("essay")],
    ["Emergency contact", get("ecName") + " – " + get("ecTel")]
  ];

  // textContent keeps user input safe from HTML injection
  const table = document.getElementById("summary");
  table.innerHTML = "";
  rows.forEach(function (row) {
    const tr = table.insertRow();
    tr.insertCell().textContent = row[0];
    tr.insertCell().textContent = row[1];
    tr.cells[0].outerHTML = "<th>" + row[0] + "</th>";
  });

  document.getElementById("modal").showModal();
});

document.getElementById("closeModal").addEventListener("click", function () {
  document.getElementById("modal").close();
  form.reset();
  document.getElementById("age").textContent = "—";
});

// Clear error messages when the form is reset
form.addEventListener("reset", function () {
  document.querySelectorAll(".error").forEach(function (e) { e.textContent = ""; });
  document.querySelectorAll(".invalid").forEach(function (e) { e.classList.remove("invalid"); });
});
Compose
Write to Ramwin Gabiana
