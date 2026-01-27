const DEV_MODE = false; // Set to false for production

const scriptURL = "https://script.google.com/macros/s/AKfycbwpSUI8zSMeNiDLoLdqNRWmJuOw3HIRR2Txev_YXnX782TW6zcL0yXeJglCiJ9qLmA/exec";

// working script = Deployment HWTR-1
// const scriptURL = "https://script.google.com/macros/s/AKfycbylJMo7GXUndNLUjxvCfUu1pQ0UpQH0OL9MeG71a0zyVFZ0wQ41RGoYKVhC8HFdhJZQBQ/exec";

// working script = Deployment 1-26-2026-rev6
// const scriptURL = "https://script.google.com/macros/s/AKfycbwyAIPb1OXyEWjau0-3OM4_e5FWLr-wuBHTx0otEzPABLomL5FRi4BsPs39bF1VfClA/exec";


let loadedRows = [];
let selectedPackage = "";

// Toast notification system
function showToast(message, type = 'info') {
  const icons = { 
    success: '✅', 
    error: '❌', 
    info: 'ℹ️' 
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="icon">${icons[type]}</div>
    <div>${message}</div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}



function setLoginLoading(isLoading) {
  const btn = document.getElementById("buttonDiv");
  const spinner = document.getElementById("loginSpinner");

  if (!btn || !spinner) return;

  if (isLoading) {
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.5";
    spinner.style.display = "block";
  } else {
    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1";
    spinner.style.display = "none";
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

// Image preview
function previewImage(event) {
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

  const reader = new FileReader();
  reader.onload = e => img.src = e.target.result;
  reader.readAsDataURL(file);

  uploadDiv.classList.add("has-image");
  if (placeholder) placeholder.style.display = "none";
}




// Form validation
function validateForm() {
  const date = document.getElementById("date").value;
  const volume = document.getElementById("volume").value;
  const waste = document.getElementById("waste").value;
  const hasImage = document
    .querySelector(".photo-upload")
    .classList.contains("has-image");

  if (!date) return false;
  if (!volume) return false;
  if (!waste) return false;
  if (!hasImage) return false;

  return true;
}



// Add entry
async function addEntry() {
  
  const token = localStorage.getItem("userToken");
  if (!token) {
  showToast("Session expired. Please log in again.", "error");
  showSection("login-section");
  return;
  }

  
  if (!validateForm()) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  if (!selectedPackage) {
    showToast('No package selected', 'error');
    return;
  }

  showToast('Uploading entry...', 'info');

  const photoInput = document.getElementById("photo");
  const file = photoInput.files[0];

  let fileData = null;

  if (file) {
    fileData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(",")[1]);
      reader.readAsDataURL(file);
    });
  }

  const rowData = {
  package: selectedPackage,
  date: document.getElementById('date').value,
  volume: document.getElementById('volume').value,
  waste: document.getElementById('waste').value,
  token: localStorage.getItem("userToken"), // 🔐 AUTH
  imageByte: fileData,
  imageName: `Waste_${Date.now()}.png`
};


  try {
       await fetch(scriptURL, {
    method: "POST",
    body: JSON.stringify(rowData)
  });



    showToast('Entry saved successfully!', 'success');


   // Reset form
    document.getElementById('date').value = '';
    document.getElementById('volume').value = '';
    document.getElementById('waste').value = '';

    const photoInput = document.getElementById("photo");
    photoInput.value = '';

    const uploadDiv = document.querySelector('.photo-upload');
    uploadDiv.classList.remove('has-image');

    const img = uploadDiv.querySelector("img");
    if (img) img.remove();

    const placeholder = uploadDiv.querySelector('.placeholder');
    if (placeholder) placeholder.style.display = "block";

    document.getElementById('modal').classList.add('active');
  } catch (err) {
    showToast('Failed to upload entry', 'error');
    console.error(err);
  }
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
  setLoginLoading(true);

  const responsePayload = parseJwt(response.credential);
  const email = responsePayload.email.toLowerCase();

  try {
    const checkURL = `${scriptURL}?email=${encodeURIComponent(email)}`;
    const res = await fetch(checkURL);
    const data = await res.json();

    if (data.status === "Approved") {
      localStorage.setItem("userToken", data.token);

      setLoginLoading(false);     // 👈 STOP SPINNER FIRST
      showSection("package-section"); // 👈 THEN SHOW PACKAGE

      showToast(`Welcome, ${responsePayload.name}!`, "success");
    } 
    else if (data.status === "Rejected") {
      setLoginLoading(false);
      showToast("Access denied by admin", "error");
    } 
    else {
      setLoginLoading(false);
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

    // 🔐 Simulate a valid session token (must exist in Users sheet as Approved)
    localStorage.setItem("userToken", "DEV_TOKEN");

    setTimeout(() => {
      showSection('package-section');
      showToast('Dev mode active - Auth bypassed', 'info');
    }, 100);

  } else {
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: "648943267004-cgsr4bhegtmma2jmlsekjtt494j8cl7f.apps.googleusercontent.com",
        callback: handleCredentialResponse
      });

      google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large", width: "250" }
      );
    } else {
      console.error("Google Identity not loaded");
      showToast('Login service unavailable', 'error');
    }
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








