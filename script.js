let loadedRows = [];
let selectedPackage = "";
let compressedImageBase64 = "";
let pendingRequestId = null;
let toastQueue = [];
let activeToast = null;
window.isUploading = false;


const DEV_MODE = false; // Set to false for production

const scriptURL = "https://script.google.com/macros/s/AKfycby_xEM6AoFpFPUBc3jZlJCD4dywit-JqLLmOKS6psgH--Qbqc3nT0BVCs5QoRfmpgFQ/exec";
// const scriptURL = "https://script.google.com/macros/s/AKfycbyzlxISJwaO6O_pWauC9dYT7TPz3NKs6i3h9imFMntB5uTVdf31reibQAzFaLJoS9eJ/exec";


// Waste-Log-Auth-V3
// Working script = Deployement V3-rev1
// const scriptURL = "https://script.google.com/macros/s/AKfycbwpSUI8zSMeNiDLoLdqNRWmJuOw3HIRR2Txev_YXnX782TW6zcL0yXeJglCiJ9qLmA/exec";


// Waste-Log-Auth-V2
// working script = Deployment HWTR-1
// const scriptURL = "https://script.google.com/macros/s/AKfycbylJMo7GXUndNLUjxvCfUu1pQ0UpQH0OL9MeG71a0zyVFZ0wQ41RGoYKVhC8HFdhJZQBQ/exec";


// Waste-Log-Auth-V1
// working script = Deployment 1-26-2026-rev6
// const scriptURL = "https://script.google.com/macros/s/AKfycbwyAIPb1OXyEWjau0-3OM4_e5FWLr-wuBHTx0otEzPABLomL5FRi4BsPs39bF1VfClA/exec";


// Toast notification system
let toastQueue = [];
let activeToast = null;

function showToast(message, type = "info", options = {}) {
  toastQueue.push({ message, type, options });
  if (!activeToast) processToastQueue();
}

function processToastQueue() {
  if (toastQueue.length === 0) return;

  const { message, type, options } = toastQueue.shift();
  activeToast = createToast(message, type, options);
}

function createToast(message, type, options) {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const spinnerHTML = options.spinner
    ? `<div class="toast-icon"><div class="toast-spinner"></div></div>`
    : `<div class="toast-icon">${icons[type]}</div>`;

  toast.innerHTML = `
    ${spinnerHTML}
    <div class="toast-message">${message}</div>
    <div class="toast-progress"></div>
  `;

  document.body.appendChild(toast);

  let startX = 0;
  toast.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  toast.addEventListener("touchmove", e => {
    const delta = e.touches[0].clientX - startX;
    if (delta > 0) toast.style.transform = `translateX(${delta}px)`;
  });
  toast.addEventListener("touchend", e => {
    const delta = e.changedTouches[0].clientX - startX;
    if (delta > 100) dismissToast(toast);
    else toast.style.transform = "";
  });

  let duration = options.persistent ? null : 3000;
  if (duration) {
    const bar = toast.querySelector(".toast-progress");
    bar.style.animation = `toastProgress ${duration}ms linear forwards`;

    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

function dismissToast(toast) {
  toast.style.animation = "slideInRight 0.3s ease-out reverse";
  setTimeout(() => {
    toast.remove();
    activeToast = null;
    processToastQueue();
  }, 300);
}





function setLoginLoading(isLoading) {
  const btn = document.getElementById("buttonDiv");
  const loadingUI = document.getElementById("loginLoadingUI");

  if (!btn || !loadingUI) return;

  if (isLoading) {
    btn.style.display = "none";
    loadingUI.style.display = "flex";
  } else {
    btn.style.display = "flex";
    loadingUI.style.display = "none";
  }
}



// Section management
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Package selection
function selectPackage(pkg, el) {
  document.querySelectorAll('.package-card')
    .forEach(c => c.classList.remove('selected'));

  el.classList.add('selected');
  selectedPackage = pkg;
}

function confirmPackage() {
  if (!selectedPackage) {
    alert("Please select a package first.");
    return;
  }

  showSection("menu-section");
}


function backToPackage() {
  selectedPackage = "";
  document.querySelectorAll('.package-card')
    .forEach(c => c.classList.remove('selected'));
  showSection("package-section");
}


function showMenu() {
  showSection('menu-section');
}

function showLogForm() {
  showSection('form-section');
  document.getElementById('date').valueAsDate = new Date();
}

function showHistoryView() {
  showSection('history-section');
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  document.getElementById('toDate').valueAsDate = today;
  document.getElementById('fromDate').valueAsDate = weekAgo;
}

// Image Compression
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const MAX_WIDTH = 1024;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = height * (MAX_WIDTH / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
      resolve(compressedBase64);
    };

    img.onerror = reject;
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

// Image preview
async function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const uploadDiv = document.querySelector('.photo-upload');
  const placeholder = uploadDiv.querySelector('.placeholder');

  let img = uploadDiv.querySelector("img");
  if (!img) {
    img = document.createElement("img");
    img.className = "photo-preview";
    uploadDiv.appendChild(img);
  }

  // 🔥 COMPRESS HERE
  const compressedBase64 = await compressImage(file);

  // Save for upload later
  compressedImageBase64 = compressedBase64;

  // Preview compressed image
  img.src = compressedBase64;

  uploadDiv.classList.add("has-image");
  if (placeholder) placeholder.style.display = "none";
}



// Form validation
function validateForm() {
  const date = document.getElementById("date").value;
  const volume = document.getElementById("volume").value;
  const waste = document.getElementById("waste").value;

  if (!date) return false;
  if (!volume) return false;
  if (!waste) return false;

  // ✅ NEW: validate using compressed image, not UI class
  if (!compressedImageBase64) return false;

  return true;
}


// Timeout Helper
function fetchWithTimeout(resource, options = {}, timeout = 30000) {
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Upload timeout")), timeout)
    )
  ]);
}


// Add entry
async function addEntry() {

  if (window.isUploading) return;
  window.isUploading = true;

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;

  let uploadToast;
  let slowTimer;

  try {
    const token = localStorage.getItem("userToken");
    if (!token) {
      showToast("Session expired. Please log in again.", "error");
      showSection("login-section");
      return;
    }

    if (!validateForm()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (!selectedPackage) {
      showToast("No package selected", "error");
      return;
    }

    if (!compressedImageBase64) {
      showToast("Photo not ready. Please take photo again.", "error");
      return;
    }

    uploadToast = showToast("Uploading entry...", "info", { 
      persistent: true,
      spinner: true
    });

    if (!pendingRequestId) {
      pendingRequestId = crypto.randomUUID();
    }

    
    const rowData = {
      requestId: pendingRequestId,
      package: selectedPackage,
      date: document.getElementById("date").value,
      volume: document.getElementById("volume").value,
      waste: document.getElementById("waste").value,
      token: token,
      imageByte: compressedImageBase64.split(",")[1],
      imageName: `Waste_${Date.now()}.jpg`
    };

    // Slow warning
    slowTimer = setTimeout(() => {
      showToast("Still uploading… please wait", "info");
    }, 8000);

    const res = await fetchWithTimeout(scriptURL, {
      method: "POST",
      body: JSON.stringify(rowData)
    }, 30000);


    clearTimeout(slowTimer);

    const result = await res.json();

    // 🔐 backend-trusted error handling
    if (result.error === "Duplicate request") {
      uploadToast.remove();
      showToast("Entry already saved.", "success");
      resetFormAfterSuccess();
      return;
    }


    if (!res.ok || result.error) {
      throw new Error(result.error || "Server error");
    }
    
    uploadToast.remove();
    showToast("Entry saved successfully!", "success");
    resetFormAfterSuccess();



    // Reset form
    document.getElementById("date").value = "";
    document.getElementById("volume").value = "";
    document.getElementById("waste").value = "";

    const photoInput = document.getElementById("photo");
    photoInput.value = null;
    compressedImageBase64 = "";

    const uploadDiv = document.querySelector(".photo-upload");
    uploadDiv.classList.remove("has-image");

    const img = uploadDiv.querySelector("img");
    if (img) img.remove();

    const placeholder = uploadDiv.querySelector(".placeholder");
    if (placeholder) placeholder.style.display = "block";

    document.getElementById("modal").classList.add("active");

  } catch (err) {
    if (uploadToast) uploadToast.remove();
    if (slowTimer) clearTimeout(slowTimer);

    if (err.message === "Upload timeout") {
      showToast("Upload timed out. Please try again.", "error");
    } else {
      showToast(err.message || "Failed to upload entry", "error");
    }

    console.error(err);

  } finally {
    window.isUploading = false;
    submitBtn.disabled = false;
    if (slowTimer) clearTimeout(slowTimer);
  }
}


// Resets form aftersuccesss
function resetFormAfterSuccess() {
  pendingRequestId = null;

  document.getElementById("date").value = "";
  document.getElementById("volume").value = "";
  document.getElementById("waste").value = "";

  const photoInput = document.getElementById("photo");
  photoInput.value = null;
  compressedImageBase64 = "";

  const uploadDiv = document.querySelector(".photo-upload");
  uploadDiv.classList.remove("has-image");

  const img = uploadDiv.querySelector("img");
  if (img) img.remove();

  const placeholder = uploadDiv.querySelector(".placeholder");
  if (placeholder) placeholder.style.display = "block";

  document.getElementById("modal").classList.add("active");
}




function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

// Load history
async function loadHistory() {
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;

  document.getElementById("exportBtn").disabled = true; // 👈 ADD THIS

  if (!from || !to) {
    showToast('Please select a date range', 'error');
    return;
  }

  if (!selectedPackage) {
    showToast('No package selected', 'error');
    return;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffDays = (toDate - fromDate) / (1000 * 60 * 60 * 24);

  if (diffDays > 31) {
    showToast('Date range must be 31 days or less', 'error');
    return;
  }

  document.getElementById('loading').style.display = 'block';
  document.getElementById('table-container').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';

  const url = `${scriptURL}?package=${selectedPackage}&from=${from}&to=${to}`;

  try {
    const res = await fetch(url);
    const rows = await res.json();
    loadedRows = rows; // 👈 save for export

    document.getElementById('loading').style.display = 'none';

    if (rows.error) {
      showToast(rows.error, 'error');
      document.getElementById('empty-state').style.display = 'block';
      return;
    }

    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (rows.length <= 1) {
      document.getElementById('empty-state').style.display = 'block';
      return;
    }

    document.getElementById('table-container').style.display = 'block';
    document.getElementById("exportBtn").disabled = false; // enable export



    rows.slice(1).forEach(r => {
      const date = new Date(r[0]).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      const imgUrl = convertDriveLink(r[5]);

      let imageUrl = "";
      if (r[5]) {
        const match = r[5].match(/\/d\/([^/]+)/);
        if (match) {
          imageUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
      }
      
      const photoLink = imageUrl
        ? `<a class="photo-link" onclick="openImageModal('${imageUrl}')">View</a>`
        : '—';



      const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${date}</td>
            <td>${r[1]}</td>
            <td>${r[2]}</td>
            <td>${r[4]}</td>
            <td>${photoLink}</td>
            `;
            tbody.appendChild(tr);
          });
  } catch (err) {
    document.getElementById('loading').style.display = 'none';
    showToast('Error loading data', 'error');
    console.error(err);
  }
}

// G Drive URL converter
function convertDriveLink(url) {
  if (!url) return "";

  // Extract file ID
  const match = url.match(/\/d\/([^/]+)/);
  if (!match) return url;

  const fileId = match[1];
  return `https://drive.google.com/uc?id=${fileId}`;
}


// Export to XLSX
async function exportExcel() {
  const btn = document.getElementById("exportBtn");

  if (!loadedRows || loadedRows.length <= 1) {
    showToast("No data to export", "error");
    return;
  }

  // UX: prevent spam clicking
  btn.disabled = true;
  btn.textContent = "Exporting...";

  try {
    // Clone rows so we don’t modify original
    const rows = JSON.parse(JSON.stringify(loadedRows));

    // Beautify header row
    rows[0] = ["Date", "Volume (kg)", "Waste Name", "Package", "User", "Photo Link", "System Timestamp"];

    // Format dates
    for (let i = 1; i < rows.length; i++) {
  rows[i][0] = new Date(rows[i][0]).toLocaleDateString("en-US");

  // Format system timestamp (column G = index 6)
      if (rows[i][6]) {
        rows[i][6] = new Date(rows[i][6]).toLocaleString("en-US");
      }
    }


    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Auto column width
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 40 },
      { wch: 15 },
      { wch: 30 },
      { wch: 80 },
      { wch: 22 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");

    const filename = `waste_log_${selectedPackage}_${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`;

    XLSX.writeFile(workbook, filename);

    showToast("Excel exported successfully!", "success");

  } catch (err) {
    console.error(err);
    showToast("Export failed", "error");
  } finally {
    // Restore button
    btn.disabled = false;
    btn.textContent = "Export to Excel (XLSX)";
  }
}



// Parse JWT token
function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

// Google login handler
async function handleCredentialResponse(response) {
  setLoginLoading(true);   // ✅ start spinner ONLY after click

  const responsePayload = parseJwt(response.credential);
  const email = responsePayload.email.toLowerCase();

  try {
    const checkURL = `${scriptURL}?email=${encodeURIComponent(email)}`;
    const res = await fetch(checkURL);
    const data = await res.json();

    setLoginLoading(false); // stop spinner

    if (data.status === "Approved") {
      localStorage.setItem("userToken", data.token);
      showSection("package-section");
      showToast(`Welcome, ${responsePayload.name}!`, "success");
    } 
    else if (data.status === "Rejected") {
      showToast("Access denied by admin", "error");
    } 
    else {
      showToast("Awaiting admin approval", "info");
    }

  } catch (err) {
    console.error(err);
    setLoginLoading(false);
    showToast("Connection error", "error");
  }
}






// Initialize
window.onload = function() {

  if (DEV_MODE) {
    console.warn('⚠️ DEV MODE ENABLED');

    // Fake valid session
    localStorage.setItem("userToken", "DEV_TOKEN");

    // Force UI state
    document.querySelectorAll('.section')
      .forEach(s => s.classList.remove('active'));

    document.getElementById('package-section').classList.add('active');

    showToast('Dev mode active - Auth bypassed', 'info');

    return; // ⛔ STOP here, do NOT run Google code
  }

  // NORMAL MODE (Google Sign-In)
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: "648943267004-cgsr4bhegtmma2jmlsekjtt494j8cl7f.apps.googleusercontent.com",
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    google.accounts.id.renderButton(
      document.getElementById("buttonDiv"),
      { theme: "outline", size: "large", width: "250" }
    );
  } else {
    console.error("Google Identity not loaded");
    showToast('Login service unavailable', 'error');
  }
};


// modal function
function openImageModal(url) {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("modalImage");

  // Extract file ID from any Drive link
  const match = url.match(/[-\w]{25,}/);
  if (!match) {
    showToast("Invalid image link", "error");
    return;
  }

  const fileId = match[0];

  // Thumbnail URL (Drive allows this)
  const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;

  img.src = directUrl;
  modal.style.display = "flex";
}


function closeImageModal() {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("modalImage");

  img.src = "";
  modal.style.display = "none";
}

































