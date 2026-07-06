/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const gasCodeGS = `/**
 * ==========================================
 * Code.gs - Backend KasMasjid (e-Kas)
 * Google Apps Script Web App
 * ==========================================
 * 
 * Skenario Deployment:
 * 1. Buat Google Spreadsheet baru, beri nama "DB_KasMasjid"
 * 2. Buat sheet berikut di dalamnya:
 *    - "Users" (Kolom: Email, Nama, Role, Status, TanggalDaftar)
 *    - "Kas_Masuk" (Kolom: ID, Tanggal, Kategori, Keterangan, Nominal, BuktiURL, InputOleh, Timestamp)
 *    - "Kas_Keluar" (Kolom: ID, Tanggal, Kategori, Keterangan, Nominal, BuktiURL, InputOleh, Timestamp)
 *    - "Inventaris_Logistik" (Kolom: ID, Tanggal, NamaBarang, JenisLogistik, Kategori, Volume, Satuan, SumberPeruntukan, Keterangan, InputOleh, Timestamp)
 *    - "Rapat_Pengajuan" (Kolom: ID, Tanggal, Judul, Deskripsi, EstimasiBiaya, Status, DiajukanOleh, DisetujuiOleh, Timestamp)
 *    - "Kategori" (Kolom: NamaKategori, Jenis)
 * 3. Isi baris pertama sheet "Users" dengan email Anda sebagai 'Super Admin'
 * 4. Buka Ekstensi > Apps Script, hapus semua kode bawaan, lalu paste kode ini.
 * 5. Ganti SPREADSHEET_ID di bawah ini dengan ID spreadsheet Anda.
 * 6. Klik "Terapkan" (Deploy) > "Terapkan Baru" (New Deployment) > Pilih tipe "Aplikasi Web" (Web App)
 *    - Jalankan sebagai: "Saya" (Me - pemilik Google Sheets)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)
 */

const SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI";

// Ambil spreadsheet database
function getDb() {
  if (SPREADSHEET_ID === "MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI") {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Inisialisasi Database (Membuat sheet jika belum ada)
function setupDatabase() {
  const ss = getDb();
  
  const tables = {
    "Users": ["Email", "Nama", "Role", "Status", "TanggalDaftar"],
    "Kas_Masuk": ["ID", "Tanggal", "Kategori", "Keterangan", "Nominal", "BuktiURL", "InputOleh", "Timestamp"],
    "Kas_Keluar": ["ID", "Tanggal", "Kategori", "Keterangan", "Nominal", "BuktiURL", "InputOleh", "Timestamp"],
    "Inventaris_Logistik": ["ID", "Tanggal", "NamaBarang", "JenisLogistik", "Kategori", "Volume", "Satuan", "SumberPeruntukan", "Keterangan", "InputOleh", "Timestamp"],
    "Rapat_Pengajuan": ["ID", "Tanggal", "Judul", "Deskripsi", "EstimasiBiaya", "Status", "DiajukanOleh", "DisetujuiOleh", "Timestamp"],
    "Kategori": ["NamaKategori", "Jenis"]
  };
  
  for (let sheetName in tables) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(tables[sheetName]);
      
      // Beri contoh data jika Users baru
      if (sheetName === "Users") {
        const userEmail = Session.getActiveUser().getEmail();
        sheet.appendRow([userEmail, "Pengurus Utama DKM", "Super Admin", "Aktif", new Date().toISOString().split('T')[0]]);
      }
      if (sheetName === "Kategori") {
        sheet.appendRow(["Infak Jumat", "Masuk"]);
        sheet.appendRow(["Kotak Amal Harian", "Masuk"]);
        sheet.appendRow(["Donasi Khusus", "Masuk"]);
        sheet.appendRow(["Kebersihan & Sarpras", "Keluar"]);
        sheet.appendRow(["Penyaluran Zakat & Bansos", "Keluar"]);
        sheet.appendRow(["Insentif Marbot & Imam", "Keluar"]);
      }
    }
  }
  return "Inisialisasi database berhasil!";
}

// Menghandle Web App UI
function doGet(e) {
  // Cek apakah meminta halaman publik
  const isPublic = e && e.parameter && e.parameter.page === 'public';
  
  const templateName = isPublic ? 'PublicIndex' : 'Index';
  let htmlOutput;
  try {
    htmlOutput = HtmlService.createTemplateFromFile(templateName).evaluate();
  } catch(err) {
    // Fallback jika hanya ada 1 file index.html
    htmlOutput = HtmlService.createTemplateFromFile('Index').evaluate();
  }
  
  htmlOutput.setTitle("KasMasjid — Amanah & Transparan")
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
            .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return htmlOutput;
}

// Helper: Cek role user berdasarkan email sesi Google
function checkRole(email) {
  const ss = getDb();
  const sheet = ss.getSheetByName("Users");
  if (!sheet) return "Jemaah"; // Default ke publik jika belum di-setup
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === email.toLowerCase() && data[i][3] === "Aktif") {
      return data[i][2]; // Mengembalikan role
    }
  }
  return "Jemaah";
}

// Ambil info user aktif
function getActiveUserInfo() {
  const email = Session.getActiveUser().getEmail();
  const role = checkRole(email);
  
  // Ambil nama
  const ss = getDb();
  const sheet = ss.getSheetByName("Users");
  let nama = "Pengunjung";
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toLowerCase() === email.toLowerCase()) {
        nama = data[i][1];
        break;
      }
    }
  }
  
  let scriptUrl = "";
  try {
    scriptUrl = ScriptApp.getService().getUrl();
  } catch (err) {
    // fallback
  }
  
  return { email: email, nama: nama, role: role, scriptUrl: scriptUrl };
}

// Helper: Ambil data sheet sebagai Array of Objects
function getSheetDataAsObjects(sheetName) {
  const ss = getDb();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    results.push(obj);
  }
  return results;
}

// HELPER: Caching Sederhana
const cache = CacheService.getScriptCache();

function clearAllCache() {
  try {
    cache.removeAll(["dashboard_data", "public_laporan_7", "public_laporan_30"]);
  } catch(e) {}
}

// ----------------------------------------------------
// CORE API - KAS MASUK
// ----------------------------------------------------
function getKasMasukList() {
  const user = getActiveUserInfo();
  if (user.role === "Jemaah") throw new Error("Akses ditolak: Anda tidak memiliki wewenang.");
  return getSheetDataAsObjects("Kas_Masuk");
}

function addKasMasuk(formData) {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin" && user.role !== "Bendahara 1") {
    throw new Error("Akses ditolak: Hanya Bendahara 1 atau Super Admin yang dapat mencatat kas masuk.");
  }
  
  const ss = getDb();
  const sheet = ss.getSheetByName("Kas_Masuk");
  const id = "M-" + Math.floor(1000 + Math.random() * 9000);
  const timestamp = new Date().toISOString();
  
  sheet.appendRow([
    id,
    formData.tanggal,
    formData.kategori,
    formData.keterangan,
    parseFloat(formData.nominal),
    formData.buktiUrl || "",
    user.email,
    timestamp
  ]);
  
  clearAllCache();
  return { success: true, id: id };
}

// ----------------------------------------------------
// CORE API - KAS KELUAR
// ----------------------------------------------------
function getKasKeluarList() {
  const user = getActiveUserInfo();
  if (user.role === "Jemaah") throw new Error("Akses ditolak.");
  return getSheetDataAsObjects("Kas_Keluar");
}

function addKasKeluar(formData) {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin" && user.role !== "Bendahara 2") {
    throw new Error("Akses ditolak: Hanya Bendahara 2 atau Super Admin yang dapat mencatat kas keluar.");
  }
  
  const ss = getDb();
  const sheet = ss.getSheetByName("Kas_Keluar");
  const id = "K-" + Math.floor(1000 + Math.random() * 9000);
  const timestamp = new Date().toISOString();
  
  sheet.appendRow([
    id,
    formData.tanggal,
    formData.kategori,
    formData.keterangan,
    parseFloat(formData.nominal),
    formData.buktiUrl || "",
    user.email,
    timestamp
  ]);
  
  clearAllCache();
  return { success: true, id: id };
}

// ----------------------------------------------------
// CORE API - LOGISTIK / INVENTARIS
// ----------------------------------------------------
function getInventarisList() {
  const user = getActiveUserInfo();
  if (user.role === "Jemaah") throw new Error("Akses ditolak.");
  return getSheetDataAsObjects("Inventaris_Logistik");
}

function addInventaris(formData) {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin" && user.role !== "Sekretaris") {
    throw new Error("Akses ditolak: Hanya Sekretaris atau Super Admin yang dapat mencatat logistik.");
  }
  
  const ss = getDb();
  const sheet = ss.getSheetByName("Inventaris_Logistik");
  const id = "INV-" + Math.floor(1000 + Math.random() * 9000);
  const timestamp = new Date().toISOString();
  
  sheet.appendRow([
    id,
    formData.tanggal,
    formData.namaBarang,
    formData.jenisLogistik, // "Masuk" atau "Keluar"
    formData.kategori,
    parseFloat(formData.volume),
    formData.satuan,
    formData.sumberPeruntukan,
    formData.keterangan,
    user.email,
    timestamp
  ]);
  
  clearAllCache();
  return { success: true, id: id };
}

// ----------------------------------------------------
// CORE API - RAPAT & PENGAJUAN
// ----------------------------------------------------
function getProposalsList() {
  const user = getActiveUserInfo();
  if (user.role === "Jemaah") throw new Error("Akses ditolak.");
  return getSheetDataAsObjects("Rapat_Pengajuan");
}

function addProposal(formData) {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin" && user.role !== "Sekretaris") {
    throw new Error("Akses ditolak: Hanya Sekretaris atau Super Admin yang dapat membuat draf pengajuan.");
  }
  
  const ss = getDb();
  const sheet = ss.getSheetByName("Rapat_Pengajuan");
  const id = "RAP-" + Math.floor(1000 + Math.random() * 9000);
  const timestamp = new Date().toISOString();
  
  sheet.appendRow([
    id,
    formData.tanggal,
    formData.judul,
    formData.deskripsi,
    parseFloat(formData.estimasiBiaya),
    formData.status || "Draft", // Draft -> Diajukan -> Disetujui/Ditolak
    user.email,
    "", // Disetujui Oleh (kosong awal)
    timestamp
  ]);
  
  return { success: true, id: id };
}

function updateProposalStatus(id, newStatus) {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin" && user.role !== "Ketua DKM") {
    throw new Error("Akses ditolak: Hanya Ketua DKM atau Super Admin yang dapat menyetujui anggaran.");
  }
  
  const ss = getDb();
  const sheet = ss.getSheetByName("Rapat_Pengajuan");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getCell(i + 1, 6).setValue(newStatus); // Kolom status (indeks 6)
      sheet.getCell(i + 1, 8).setValue(user.email); // Kolom disetujuiOleh (indeks 8)
      return { success: true };
    }
  }
  throw new Error("Pengajuan tidak ditemukan.");
}

// ----------------------------------------------------
// CORE API - LAPORAN PUBLIK (SERVER-SIDE MASKING)
// ----------------------------------------------------
function getPublicLaporan(daysRange) {
  const cacheKey = "public_laporan_" + daysRange;
  const cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const kasMasuk = getSheetDataAsObjects("Kas_Masuk");
  const kasKeluar = getSheetDataAsObjects("Kas_Keluar");
  
  const filterDate = new Date();
  filterDate.setDate(filterDate.getDate() - (daysRange || 30));
  
  const combined = [];
  
  // Satukan Kas Masuk
  kasMasuk.forEach(function(item) {
    const tgl = new Date(item.Tanggal);
    if (tgl >= filterDate) {
      combined.push({
        id: item.ID,
        tanggal: item.Tanggal,
        kategori: item.Kategori,
        keterangan: item.Keterangan,
        masuk: parseFloat(item.Nominal) || 0,
        keluar: 0,
        timestamp: item.Timestamp
      });
    }
  });
  
  // Satukan Kas Keluar
  kasKeluar.forEach(function(item) {
    const tgl = new Date(item.Tanggal);
    if (tgl >= filterDate) {
      combined.push({
        id: item.ID,
        tanggal: item.Tanggal,
        kategori: item.Kategori,
        keterangan: item.Keterangan,
        masuk: 0,
        keluar: parseFloat(item.Nominal) || 0,
        timestamp: item.Timestamp
      });
    }
  });
  
  // Urutkan berdasarkan tanggal & timestamp
  combined.sort(function(a, b) {
    const dA = new Date(a.tanggal);
    const dB = new Date(b.tanggal);
    if (dA.getTime() !== dB.getTime()) return dA.getTime() - dB.getTime();
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
  
  // SERVER-SIDE MASKING (Sesuai Syarat PRD)
  // Masking jemaah dhuafa/mustahik secara server-side agar PII tidak pernah sampai di client.
  const sensitiveKeywords = [
    "bantuan", "fakir", "miskin", "zakat fitrah", 
    "mustahik", "dhuafa", "santunan", "anak yatim", "yatim"
  ];
  
  const maskedCombined = combined.map(function(item) {
    let lowerDesc = item.keterangan.toLowerCase();
    let containsSensitive = sensitiveKeywords.some(function(keyword) {
      return lowerDesc.indexOf(keyword) !== -1;
    });
    
    let isZakat = item.kategori.toLowerCase().indexOf("zakat") !== -1 || 
                    item.keterangan.toLowerCase().indexOf("zakat") !== -1;
                    
    let cleanKeterangan = item.keterangan;
    let cleanKategori = item.kategori;
    
    if (containsSensitive) {
      if (item.masuk > 0) {
        cleanKeterangan = "Penerimaan Zakat / Dana Sosial Keumatan (Identitas Disamarkan)";
        cleanKategori = "Zakat & Sosial";
      } else {
        cleanKeterangan = "Penyaluran Bantuan Sosial Keumatan (Identitas Disamarkan)";
        cleanKategori = "Sosial & Santunan";
      }
    }
    
    return {
      id: item.id,
      tanggal: item.tanggal,
      kategori: cleanKategori,
      keterangan: cleanKeterangan,
      masuk: item.masuk,
      keluar: item.keluar
    };
  });
  
  // Hitung saldo berjalan setelah di-sort
  let runningBalance = 0;
  // Hitung saldo awal (sebelum range hari ini)
  let prevMasuk = 0;
  let prevKeluar = 0;
  
  // Kas masuk kumulatif
  kasMasuk.forEach(function(item) {
    const tgl = new Date(item.Tanggal);
    if (tgl < filterDate) {
      prevMasuk += (parseFloat(item.Nominal) || 0);
    }
  });
  // Kas keluar kumulatif
  kasKeluar.forEach(function(item) {
    const tgl = new Date(item.Tanggal);
    if (tgl < filterDate) {
      prevKeluar += (parseFloat(item.Nominal) || 0);
    }
  });
  
  runningBalance = prevMasuk - prevKeluar;
  const initialSaldoAwal = runningBalance;
  
  const finalReport = maskedCombined.map(function(item) {
    runningBalance += (item.masuk - item.keluar);
    item.saldoBerjalan = runningBalance;
    return item;
  });
  
  const responseData = {
    saldoAwal: initialSaldoAwal,
    laporan: finalReport,
    totalMasuk: finalReport.reduce((acc, curr) => acc + curr.masuk, 0),
    totalKeluar: finalReport.reduce((acc, curr) => acc + curr.keluar, 0),
    saldoAkhir: runningBalance
  };
  
  // Simpan di cache selama 5 menit
  try {
    cache.put(cacheKey, JSON.stringify(responseData), 300);
  } catch(e) {}
  
  return responseData;
}

// ----------------------------------------------------
// CORE API - DASHBOARD ADMIN (SUMMARIZED)
// ----------------------------------------------------
function getAdminDashboardData() {
  const user = getActiveUserInfo();
  if (user.role === "Jemaah") throw new Error("Akses ditolak.");
  
  const cacheKey = "dashboard_data";
  const cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const kasMasuk = getSheetDataAsObjects("Kas_Masuk");
  const kasKeluar = getSheetDataAsObjects("Kas_Keluar");
  const inventaris = getSheetDataAsObjects("Inventaris_Logistik");
  const proposals = getSheetDataAsObjects("Rapat_Pengajuan");
  
  const totalMasuk = kasMasuk.reduce((sum, item) => sum + (parseFloat(item.Nominal) || 0), 0);
  const totalKeluar = kasKeluar.reduce((sum, item) => sum + (parseFloat(item.Nominal) || 0), 0);
  const saldoKas = totalMasuk - totalKeluar;
  
  // Hitung logistik barang masuk & keluar
  const totalInventarisUnit = inventaris.length;
  
  // Statistik Pengajuan
  const totalProposal = proposals.length;
  const pendingProposal = proposals.filter(p => p.Status === "Diajukan").length;
  
  const dashboard = {
    saldoKas: saldoKas,
    totalMasuk: totalMasuk,
    totalKeluar: totalKeluar,
    totalInventarisUnit: totalInventarisUnit,
    totalProposal: totalProposal,
    pendingProposal: pendingProposal,
    userRole: user.role,
    userEmail: user.email,
    userNama: user.nama
  };
  
  try {
    cache.put(cacheKey, JSON.stringify(dashboard), 300);
  } catch(e) {}
  
  return dashboard;
}

// ----------------------------------------------------
// CORE API - USER MANAGEMENT (SUPER ADMIN ONLY)
// ----------------------------------------------------
function getUsersList() {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin") throw new Error("Akses ditolak: Hanya Super Admin yang dapat mengakses data pengguna.");
  return getSheetDataAsObjects("Users");
}

function addUser(newUser) {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin") throw new Error("Akses ditolak.");
  
  const ss = getDb();
  const sheet = ss.getSheetByName("Users");
  
  // Cek jika email sudah terdaftar
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === newUser.email.toLowerCase()) {
      throw new Error("Email ini sudah terdaftar sebagai pengurus.");
    }
  }
  
  sheet.appendRow([
    newUser.email,
    newUser.nama,
    newUser.role,
    newUser.status || "Aktif",
    new Date().toISOString().split('T')[0]
  ]);
  
  return { success: true };
}

function updateUser(targetEmail, updatedData) {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin") throw new Error("Akses ditolak.");
  
  const ss = getDb();
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === targetEmail.toLowerCase()) {
      sheet.getRange(i + 1, 2).setValue(updatedData.nama);
      sheet.getRange(i + 1, 3).setValue(updatedData.role);
      sheet.getRange(i + 1, 4).setValue(updatedData.status);
      return { success: true };
    }
  }
  throw new Error("User tidak ditemukan.");
}

function deleteUser(targetEmail) {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin") throw new Error("Akses ditolak.");
  if (user.email.toLowerCase() === targetEmail.toLowerCase()) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
  }
  
  const ss = getDb();
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === targetEmail.toLowerCase()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error("User tidak ditemukan.");
}

// ----------------------------------------------------
// API - DELETE RECORD (SUPER ADMIN ONLY BYPASS)
// ----------------------------------------------------
function deleteRecord(sheetName, recordId) {
  const user = getActiveUserInfo();
  if (user.role !== "Super Admin") {
    throw new Error("Akses ditolak: Hanya Super Admin yang berwenang menghapus data transaksi.");
  }
  
  const ss = getDb();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Tabel tidak ditemukan.");
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === recordId) {
      sheet.deleteRow(i + 1);
      clearAllCache();
      return { success: true };
    }
  }
  throw new Error("Data tidak ditemukan.");
}

// Ambil Kategori list
function getCategories() {
  return getSheetDataAsObjects("Kategori");
}
`;

export const gasIndexHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>KasMasjid — Amanah, Rapi, & Transparan</title>
  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Alpine.js untuk state management ringan -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800" x-data="kasMasjidApp()">

  <!-- NAVBAR -->
  <nav class="bg-emerald-800 text-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <div class="flex items-center space-x-3">
          <div class="bg-emerald-600 p-2 rounded-lg text-emerald-100 font-bold text-lg shadow">🕌</div>
          <div>
            <span class="font-bold text-lg tracking-tight block">KasMasjid</span>
            <span class="text-xs text-emerald-200 block -mt-1">e-Kas & Logistik DKM</span>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="text-right hidden sm:block">
            <span class="block text-sm font-semibold" x-text="user.nama">...</span>
            <span class="block text-xs text-emerald-200" x-text="'Peran: ' + user.role">...</span>
          </div>
          <div class="bg-emerald-700/50 px-3 py-1.5 rounded-full text-xs font-mono" x-text="user.email">...</div>
        </div>
      </div>
    </div>
  </nav>

  <!-- CONTENT WRAPPER -->
  <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-8">
    
    <!-- AUTHENTICATION CHECK -->
    <template x-if="user.role === 'Jemaah'">
      <div class="bg-white rounded-2xl shadow-xl p-8 max-w-lg mx-auto text-center border border-slate-100">
        <div class="text-5xl mb-4 animate-bounce">🔒</div>
        <h3 class="text-xl font-bold text-slate-900">Akses Terkunci</h3>
        
        <!-- JIKA EMAIL TERDETEKSI ADA -->
        <template x-if="user.email">
          <p class="text-slate-500 mt-2 text-sm leading-relaxed">
            Akun Google Anda <span class="font-mono text-emerald-600 font-semibold" x-text="user.email"></span> belum terdaftar atau tidak aktif di sistem pengurus KasMasjid.
          </p>
        </template>
        
        <!-- JIKA EMAIL KOSONG (KARENA SETTING DEPLOYMENT EXECUTE AS ME) -->
        <template x-if="!user.email">
          <div class="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-900 leading-relaxed">
            <div class="font-bold flex items-center space-x-1.5 mb-1 text-rose-800 text-[13px]">
              <span>⚠️</span>
              <span>Penting: Email Anda Terdeteksi Kosong oleh Aplikasi!</span>
            </div>
            <p class="mb-2 font-medium text-rose-950">
              Hal ini terjadi karena konfigurasi deployment Google Apps Script dipasang dengan opsi <b>"Jalankan sebagai: Saya (Me / Pemilik)"</b>, sehingga Google menyembunyikan identitas/email pengguna lain demi privasi.
            </p>
            <div class="border-t border-rose-200/50 pt-2 mt-2">
              <p class="font-bold text-rose-800 mb-1">Cara Mengatasi agar Pengurus Lain bisa Login:</p>
              <ol class="list-decimal pl-4 space-y-1 text-slate-700 font-normal">
                <li>Buka editor Google Apps Script proyek ini.</li>
                <li>Klik tombol <b>Terapkan (Deploy)</b> di kanan atas &gt; pilih <b>Kelola Penerapan (Manage Deployments)</b>.</li>
                <li>Klik tombol <b>Edit (ikon pensil)</b> pada versi penerapan aktif Anda.</li>
                <li>Ubah bagian <b>"Jalankan sebagai" (Execute as)</b> dari <i>"Saya" (Me)</i> menjadi <b>"User yang mengakses aplikasi web" (User accessing the web app)</b>.</li>
                <li>Pastikan <b>"Siapa yang memiliki akses" (Who has access)</b> diatur ke <b>"Siapa saja" (Anyone)</b>.</li>
                <li>Klik <b>Terapkan (Deploy)</b>.</li>
              </ol>
            </div>
            <p class="mt-2 font-semibold text-rose-800">
              *Catatan: File Google Spreadsheet "DB_KasMasjid" juga wajib dibagikan (Share) dengan akses minimal "Pelihat" (Viewer) ke email pengurus lainnya agar sistem dapat diakses oleh mereka.
            </p>
          </div>
        </template>

        <div class="mt-6 p-4 bg-amber-50 rounded-lg text-left text-xs text-amber-800 border border-amber-200" x-show="user.email">
          <strong>Perhatian:</strong> Silakan hubungi <b>Super Admin</b> atau Sekretaris DKM untuk mendaftarkan email Google ini agar Anda bisa login dan mengelola kas.
        </div>
        
        <div class="mt-6 flex flex-col space-y-3">
          <!-- TOMBOL MASUK SEBAGAI TAMU -->
          <a :href="user.scriptUrl ? user.scriptUrl + '?page=public' : '#'" 
             @click="if (!user.scriptUrl) { openPublicUrl(); $event.preventDefault(); }"
             target="_top" 
             class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow flex items-center justify-center space-x-2 cursor-pointer">
            <span>🔓 Masuk sebagai Tamu (Laporan Publik)</span>
          </a>
          
          <a :href="getLogoutUrl()" target="_top" class="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition shadow-sm block text-center cursor-pointer">
            🔄 Logout & Ganti Akun Google
          </a>
          
          <button @click="window.location.reload()" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium py-2.5 px-4 rounded-xl text-sm transition">
            Perbarui Halaman
          </button>
        </div>
      </div>
    </template>

    <!-- MAIN APP INTERFACE (IF REGISTERED) -->
    <template x-if="user.role !== 'Jemaah'">
      <div>
        
        <!-- TOP STATS BAR -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Saldo Kas Masjid</span>
            <span class="text-2xl font-bold text-emerald-700 mt-1 block" x-text="formatRupiah(dashboard.saldoKas)">Rp 0</span>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Kas Masuk</span>
            <span class="text-2xl font-bold text-blue-600 mt-1 block" x-text="formatRupiah(dashboard.totalMasuk)">Rp 0</span>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Pengeluaran</span>
            <span class="text-2xl font-bold text-red-500 mt-1 block" x-text="formatRupiah(dashboard.totalKeluar)">Rp 0</span>
          </div>
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Logistik & Pengajuan</span>
            <span class="text-2xl font-bold text-slate-700 mt-1 block" x-text="dashboard.totalInventarisUnit + ' Barang | ' + dashboard.pendingProposal + ' Butuh Approval'">0</span>
          </div>
        </div>

        <!-- MODULE TABS -->
        <div class="hidden md:flex space-x-2 border-b border-slate-200 mb-8 overflow-x-auto pb-1">
          <button @click="currentTab = 'ringkasan'" :class="currentTab === 'ringkasan' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'" class="py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition">
            📊 Ringkasan
          </button>
          
          <!-- Tab Kas Masuk (Super Admin atau Bendahara 1) -->
          <button @click="currentTab = 'masuk'; fetchKasMasuk()" :class="currentTab === 'masuk' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'" class="py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition">
            📈 Kas Masuk
          </button>
          
          <!-- Tab Kas Keluar (Super Admin atau Bendahara 2) -->
          <button @click="currentTab = 'keluar'; fetchKasKeluar()" :class="currentTab === 'keluar' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'" class="py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition">
            📉 Kas Keluar
          </button>
          
          <!-- Tab Logistik (Super Admin atau Sekretaris) -->
          <button @click="currentTab = 'logistik'; fetchInventaris()" :class="currentTab === 'logistik' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'" class="py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition">
            📦 Logistik & Inventaris
          </button>
          
          <!-- Tab Rapat & Pengajuan (Semua tapi approval dibatasi) -->
          <button @click="currentTab = 'rapat'; fetchProposals()" :class="currentTab === 'rapat' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'" class="py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition">
            📝 Rapat & Pengajuan
          </button>
          
          <!-- Tab User (Super Admin Only) -->
          <template x-if="user.role === 'Super Admin'">
            <button @click="currentTab = 'user'; fetchUsers()" :class="currentTab === 'user' ? 'border-emerald-600 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'" class="py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition">
              👥 Kelola User
            </button>
          </template>
        </div>

        <!-- NOTIFICATION TOAST -->
        <div x-show="toast.show" x-transition class="fixed bottom-5 right-5 z-50 p-4 rounded-xl text-white shadow-lg flex items-center space-x-3 transition-all" :class="toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'">
          <span x-text="toast.type === 'error' ? '❌' : '✅'"></span>
          <span class="text-sm font-medium" x-text="toast.message"></span>
        </div>

        <!-- LOADING SPINNER -->
        <div x-show="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <span class="ml-3 text-sm text-slate-500">Memproses data backend...</span>
        </div>

        <div x-show="!loading">

          <!-- TAB 1: RINGKASAN -->
          <div x-show="currentTab === 'ringkasan'" class="space-y-6">
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h4 class="text-lg font-bold text-slate-900 mb-2">Selamat datang di KasMasjid</h4>
              <p class="text-slate-500 text-sm leading-relaxed max-w-3xl">
                Ini adalah portal administrasi internal DKM. Anda masuk dengan akun <b x-text="user.email"></b> sebagai <b class="text-emerald-700" x-text="user.role"></b>. Peran Anda membatasi modul apa saja yang bisa Anda edit demi kepatuhan Syariah dan pencegahan kesalahan input.
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Hak Akses Peran Card -->
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h5 class="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Hak Akses Peran Anda</h5>
                <div class="space-y-3">
                  <div class="flex justify-between items-center py-2 border-b border-slate-100">
                    <span class="text-sm font-medium text-slate-600">Mencatat Kas Masuk</span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" :class="canEditKasMasuk() ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'" x-text="canEditKasMasuk() ? 'Diizinkan' : 'Terkunci'"></span>
                  </div>
                  <div class="flex justify-between items-center py-2 border-b border-slate-100">
                    <span class="text-sm font-medium text-slate-600">Mencatat Kas Keluar</span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" :class="canEditKasKeluar() ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'" x-text="canEditKasKeluar() ? 'Diizinkan' : 'Terkunci'"></span>
                  </div>
                  <div class="flex justify-between items-center py-2 border-b border-slate-100">
                    <span class="text-sm font-medium text-slate-600">Kelola Logistik / Inventaris</span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" :class="canEditLogistik() ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'" x-text="canEditLogistik() ? 'Diizinkan' : 'Terkunci'"></span>
                  </div>
                  <div class="flex justify-between items-center py-2 border-b border-slate-100">
                    <span class="text-sm font-medium text-slate-600">Persetujuan (Approval) Anggaran</span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" :class="canApproveAnggaran() ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'" x-text="canApproveAnggaran() ? 'Diizinkan' : 'Terkunci'"></span>
                  </div>
                </div>
              </div>

              <!-- Halaman Publik QR Code Link -->
              <div class="bg-emerald-900 text-emerald-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h5 class="font-bold text-sm uppercase tracking-wider text-emerald-300 mb-2">Halaman Transparansi Jemaah</h5>
                  <p class="text-xs text-emerald-200 leading-relaxed">
                    Halaman ini dapat diakses oleh jemaah tanpa login. Seluruh data sensitif dhuafa dan penerima bantuan disamarkan secara otomatis di server.
                  </p>
                </div>
                <div class="mt-6 flex items-center space-x-3">
                  <button @click="openPublicUrl()" class="bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-sm px-4 py-2.5 rounded-xl transition shadow">
                    Buka Laporan Publik (Tanpa Login) 🔗
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: KAS MASUK -->
          <div x-show="currentTab === 'masuk'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-bold text-slate-900">Catatan Kas Masuk</h4>
              <button x-show="canEditKasMasuk()" @click="showAddMasukModal = true" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition">
                + Catat Kas Masuk
              </button>
            </div>

            <!-- TABEL KAS MASUK -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th class="p-4">Tanggal</th>
                      <th class="p-4">Kategori</th>
                      <th class="p-4">Keterangan</th>
                      <th class="p-4 text-right">Nominal</th>
                      <th class="p-4">Oleh</th>
                      <th class="p-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template x-for="item in kasMasuk" :key="item.ID">
                      <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                        <td class="p-4 whitespace-nowrap" x-text="formatDate(item.Tanggal)"></td>
                        <td class="p-4 font-semibold text-slate-900" x-text="item.Kategori"></td>
                        <td class="p-4" x-text="item.Keterangan"></td>
                        <td class="p-4 text-right font-mono font-bold text-emerald-700" x-text="formatRupiah(item.Nominal)"></td>
                        <td class="p-4 text-xs font-mono text-slate-500" x-text="item.InputOleh"></td>
                        <td class="p-4">
                          <button x-show="user.role === 'Super Admin'" @click="deleteRecord('Kas_Masuk', item.ID)" class="text-red-600 hover:text-red-800 font-semibold text-xs">Hapus</button>
                          <span x-show="user.role !== 'Super Admin'" class="text-xs text-slate-400 italic">No Action</span>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 3: KAS KELUAR -->
          <div x-show="currentTab === 'keluar'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-bold text-slate-900">Catatan Pengeluaran (Kas Keluar)</h4>
              <button x-show="canEditKasKeluar()" @click="showAddKeluarModal = true" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition">
                + Catat Kas Keluar
              </button>
            </div>

            <!-- TABEL KAS KELUAR -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th class="p-4">Tanggal</th>
                      <th class="p-4">Kategori</th>
                      <th class="p-4">Keterangan</th>
                      <th class="p-4 text-right">Nominal</th>
                      <th class="p-4">Oleh</th>
                      <th class="p-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template x-for="item in kasKeluar" :key="item.ID">
                      <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                        <td class="p-4 whitespace-nowrap" x-text="formatDate(item.Tanggal)"></td>
                        <td class="p-4 font-semibold text-slate-900" x-text="item.Kategori"></td>
                        <td class="p-4" x-text="item.Keterangan"></td>
                        <td class="p-4 text-right font-mono font-bold text-red-600" x-text="formatRupiah(item.Nominal)"></td>
                        <td class="p-4 text-xs font-mono text-slate-500" x-text="item.InputOleh"></td>
                        <td class="p-4">
                          <button x-show="user.role === 'Super Admin'" @click="deleteRecord('Kas_Keluar', item.ID)" class="text-red-600 hover:text-red-800 font-semibold text-xs">Hapus</button>
                          <span x-show="user.role !== 'Super Admin'" class="text-xs text-slate-400 italic">No Action</span>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 4: LOGISTIK / INVENTARIS -->
          <div x-show="currentTab === 'logistik'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-bold text-slate-900">Inventaris Logistik (Non-Keuangan)</h4>
              <button x-show="canEditLogistik()" @click="showAddLogistikModal = true" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition">
                + Catat Logistik Baru
              </button>
            </div>

            <!-- TABEL INVENTARIS -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th class="p-4">Tanggal</th>
                      <th class="p-4">Nama Barang</th>
                      <th class="p-4">Mutasi</th>
                      <th class="p-4">Kategori</th>
                      <th class="p-4">Volume / Satuan</th>
                      <th class="p-4">Sumber / Peruntukan</th>
                      <th class="p-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template x-for="item in inventaris" :key="item.ID">
                      <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                        <td class="p-4 whitespace-nowrap" x-text="formatDate(item.Tanggal)"></td>
                        <td class="p-4 font-semibold text-slate-900">
                          <span x-text="item.NamaBarang"></span>
                          <span class="block text-xs font-normal text-slate-500" x-text="item.Keterangan"></span>
                        </td>
                        <td class="p-4">
                          <span class="px-2 py-0.5 rounded text-xs font-bold" :class="item.JenisLogistik === 'Masuk' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'" x-text="item.JenisLogistik"></span>
                        </td>
                        <td class="p-4 text-slate-500" x-text="item.Kategori"></td>
                        <td class="p-4 font-bold" x-text="item.Volume + ' ' + item.Satuan"></td>
                        <td class="p-4 text-xs" x-text="item.SumberPeruntukan"></td>
                        <td class="p-4">
                          <button x-show="user.role === 'Super Admin'" @click="deleteRecord('Inventaris_Logistik', item.ID)" class="text-red-600 hover:text-red-800 font-semibold text-xs">Hapus</button>
                          <span x-show="user.role !== 'Super Admin'" class="text-xs text-slate-400 italic">No Action</span>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 5: RAPAT & PENGAJUAN -->
          <div x-show="currentTab === 'rapat'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-bold text-slate-900">Hasil Rapat & Pengajuan Dana</h4>
              <button x-show="canEditLogistik()" @click="showAddProposalModal = true" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition">
                + Buat Pengajuan Baru
              </button>
            </div>

            <!-- DAFTAR PENGAJUAN -->
            <div class="grid grid-cols-1 gap-6">
              <template x-for="item in proposals" :key="item.ID">
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div class="space-y-1 max-w-2xl">
                    <div class="flex items-center space-x-2">
                      <span class="px-2 py-0.5 rounded text-xs font-bold font-mono bg-slate-100 text-slate-600" x-text="item.ID"></span>
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" 
                            :class="item.Status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700' : (item.Status === 'Ditolak' ? 'bg-red-50 text-red-700' : (item.Status === 'Diajukan' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'))" 
                            x-text="item.Status"></span>
                    </div>
                    <h5 class="text-base font-bold text-slate-900" x-text="item.Judul"></h5>
                    <p class="text-sm text-slate-500 leading-relaxed" x-text="item.Deskripsi"></p>
                    <div class="text-xs text-slate-400 pt-1">
                      Diajukan oleh: <span x-text="item.DiajukanOleh"></span> | Tanggal: <span x-text="formatDate(item.Tanggal)"></span>
                      <template x-if="item.DisetujuiOleh">
                        <span> | Disetujui: <span class="font-semibold text-emerald-700" x-text="item.DisetujuiOleh"></span></span>
                      </template>
                    </div>
                  </div>
                  
                  <div class="text-right flex flex-col items-end justify-between min-w-[200px]">
                    <div>
                      <span class="text-xs text-slate-400 block">Estimasi Anggaran</span>
                      <span class="text-xl font-mono font-bold text-slate-800" x-text="formatRupiah(item.EstimasiBiaya)">Rp 0</span>
                    </div>
                    
                    <!-- APPROVAL BUTTONS (Ketua DKM & Super Admin) -->
                    <div class="mt-3 flex space-x-2" x-show="canApproveAnggaran() && item.Status === 'Diajukan'">
                      <button @click="updateProposalStatus(item.ID, 'Disetujui')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                        Setujui ✓
                      </button>
                      <button @click="updateProposalStatus(item.ID, 'Ditolak')" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                        Tolak ✗
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- TAB 6: KELOLA USER -->
          <div x-show="currentTab === 'user'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-bold text-slate-900">Kelola Pengurus (User DKM)</h4>
              <button @click="showAddUserModal = true" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition">
                + Tambah Pengurus
              </button>
            </div>

            <!-- TABEL USER -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th class="p-4">Email Google</th>
                      <th class="p-4">Nama Lengkap</th>
                      <th class="p-4">Peran (Role)</th>
                      <th class="p-4">Status</th>
                      <th class="p-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template x-for="item in users" :key="item.Email">
                      <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                        <td class="p-4 font-mono text-emerald-700" x-text="item.Email"></td>
                        <td class="p-4 font-bold text-slate-900" x-text="item.Nama"></td>
                        <td class="p-4">
                          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700" x-text="item.Role"></span>
                        </td>
                        <td class="p-4">
                          <span class="px-2 py-0.5 rounded text-xs font-bold" :class="item.Status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'" x-text="item.Status"></span>
                        </td>
                        <td class="p-4">
                          <button @click="deleteUser(item.Email)" class="text-red-600 hover:text-red-800 font-semibold text-xs">Hapus</button>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        <!-- MOBILE BOTTOM NAVIGATION BAR -->
        <div class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/85 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-4 py-2.5 flex justify-around items-center">
          <button
            @click="currentTab = 'ringkasan'"
            :class="currentTab === 'ringkasan' ? 'text-emerald-700 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'"
            class="flex flex-col items-center space-y-1 transition duration-200 cursor-pointer"
          >
            <span class="text-lg">📊</span>
            <span class="text-[10px] tracking-tight font-medium">Ringkasan</span>
          </button>

          <button
            @click="currentTab = 'masuk'; fetchKasMasuk()"
            :class="currentTab === 'masuk' ? 'text-emerald-700 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'"
            class="flex flex-col items-center space-y-1 transition duration-200 cursor-pointer"
          >
            <span class="text-lg">📈</span>
            <span class="text-[10px] tracking-tight font-medium font-bold">Kas Masuk</span>
          </button>

          <button
            @click="currentTab = 'keluar'; fetchKasKeluar()"
            :class="currentTab === 'keluar' ? 'text-emerald-700 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'"
            class="flex flex-col items-center space-y-1 transition duration-200 cursor-pointer"
          >
            <span class="text-lg">📉</span>
            <span class="text-[10px] tracking-tight font-medium font-bold">Kas Keluar</span>
          </button>

          <button
            @click="currentTab = 'logistik'; fetchInventaris()"
            :class="currentTab === 'logistik' ? 'text-emerald-700 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'"
            class="flex flex-col items-center space-y-1 transition duration-200 cursor-pointer"
          >
            <span class="text-lg">📦</span>
            <span class="text-[10px] tracking-tight font-medium font-bold">Logistik</span>
          </button>

          <button
            @click="currentTab = 'rapat'; fetchProposals()"
            :class="currentTab === 'rapat' ? 'text-emerald-700 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'"
            class="flex flex-col items-center space-y-1 transition duration-200 cursor-pointer"
          >
            <span class="text-lg">📝</span>
            <span class="text-[10px] tracking-tight font-medium font-bold">Rapat</span>
          </button>

          <template x-if="user.role === 'Super Admin'">
            <button
              @click="currentTab = 'user'; fetchUsers()"
              :class="currentTab === 'user' ? 'text-emerald-700 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'"
              class="flex flex-col items-center space-y-1 transition duration-200 cursor-pointer"
            >
              <span class="text-lg">👥</span>
              <span class="text-[10px] tracking-tight font-medium font-bold">User</span>
            </button>
          </template>
        </div>

      </div>
    </template>

  </main>

  <!-- MODALS SECTION -->
  <!-- 1. MODAL ADD KAS MASUK -->
  <div x-show="showAddMasukModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
    <div @click.away="showAddMasukModal = false" class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
      <div class="flex justify-between items-center border-b pb-2">
        <h5 class="font-bold text-lg text-slate-900">Catat Kas Masuk Baru</h5>
        <button @click="showAddMasukModal = false" class="text-slate-400 hover:text-slate-600 font-bold">×</button>
      </div>
      <form @submit.prevent="submitKasMasuk()">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Tanggal</label>
            <input type="date" x-model="formMasuk.tanggal" required class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Kategori</label>
            <select x-model="formMasuk.kategori" required class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
              <template x-for="cat in filterCategories('Masuk')" :key="cat.NamaKategori">
                <option :value="cat.NamaKategori" x-text="cat.NamaKategori"></option>
              </template>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Keterangan</label>
            <input type="text" x-model="formMasuk.keterangan" required placeholder="Contoh: Infak jumat dari kotak utama..." class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Nominal (Rupiah)</label>
            <input type="number" x-model="formMasuk.nominal" required placeholder="500000" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Bukti URL (Opsional)</label>
            <input type="text" x-model="formMasuk.buktiUrl" placeholder="https://..." class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button type="button" @click="showAddMasukModal = false" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl">Batal</button>
          <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl">Simpan Transaksi</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 2. MODAL ADD KAS KELUAR -->
  <div x-show="showAddKeluarModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
    <div @click.away="showAddKeluarModal = false" class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
      <div class="flex justify-between items-center border-b pb-2">
        <h5 class="font-bold text-lg text-slate-900">Catat Kas Keluar Baru</h5>
        <button @click="showAddKeluarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">×</button>
      </div>
      <form @submit.prevent="submitKasKeluar()">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Tanggal</label>
            <input type="date" x-model="formKeluar.tanggal" required class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Kategori</label>
            <select x-model="formKeluar.kategori" required class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
              <template x-for="cat in filterCategories('Keluar')" :key="cat.NamaKategori">
                <option :value="cat.NamaKategori" x-text="cat.NamaKategori"></option>
              </template>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Keterangan</label>
            <input type="text" x-model="formKeluar.keterangan" required placeholder="Contoh: Pembelian sabun & sapu marbot..." class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Nominal (Rupiah)</label>
            <input type="number" x-model="formKeluar.nominal" required placeholder="250000" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Bukti URL (Opsional)</label>
            <input type="text" x-model="formKeluar.buktiUrl" placeholder="https://..." class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button type="button" @click="showAddKeluarModal = false" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl">Batal</button>
          <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl">Simpan Transaksi</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 3. MODAL ADD LOGISTIK -->
  <div x-show="showAddLogistikModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
    <div @click.away="showAddLogistikModal = false" class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
      <div class="flex justify-between items-center border-b pb-2">
        <h5 class="font-bold text-lg text-slate-900">Catat Inventaris Logistik</h5>
        <button @click="showAddLogistikModal = false" class="text-slate-400 hover:text-slate-600 font-bold">×</button>
      </div>
      <form @submit.prevent="submitLogistik()">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Tanggal</label>
            <input type="date" x-model="formLogistik.tanggal" required class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Nama Barang</label>
            <input type="text" x-model="formLogistik.namaBarang" required placeholder="Contoh: Mushaf Al-Qur'an..." class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase">Jenis Mutasi</label>
              <select x-model="formLogistik.jenisLogistik" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
                <option value="Masuk">Masuk</option>
                <option value="Keluar">Keluar</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase">Kategori</label>
              <input type="text" x-model="formLogistik.kategori" required placeholder="Kebutuhan Ibadah" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase">Volume (Jumlah)</label>
              <input type="number" x-model="formLogistik.volume" required placeholder="10" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase">Satuan</label>
              <input type="text" x-model="formLogistik.satuan" required placeholder="Pcs / Buku / Roll" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Sumber / Peruntukan</label>
            <input type="text" x-model="formLogistik.sumberPeruntukan" required placeholder="Wakaf Bapak Ridwan / Dibagikan ke jemaah" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Keterangan Spesifikasi</label>
            <input type="text" x-model="formLogistik.keterangan" placeholder="Kertas tebal kualitas tinggi..." class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button type="button" @click="showAddLogistikModal = false" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl">Batal</button>
          <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl">Simpan Logistik</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 4. MODAL ADD USER -->
  <div x-show="showAddUserModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
    <div @click.away="showAddUserModal = false" class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
      <div class="flex justify-between items-center border-b pb-2">
        <h5 class="font-bold text-lg text-slate-900">Tambah Pengurus DKM</h5>
        <button @click="showAddUserModal = false" class="text-slate-400 hover:text-slate-600 font-bold">×</button>
      </div>
      <form @submit.prevent="submitUser()">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Email Google (Wajib Akun Riil)</label>
            <input type="email" x-model="formUser.email" required placeholder="nama@gmail.com" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
            <input type="text" x-model="formUser.nama" required placeholder="Haji Budi Santoso" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Peran / Hak Akses</label>
            <select x-model="formUser.role" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
              <option value="Super Admin">Super Admin</option>
              <option value="Bendahara 1">Bendahara 1 (Kas Masuk Only)</option>
              <option value="Bendahara 2">Bendahara 2 (Kas Keluar Only)</option>
              <option value="Sekretaris">Sekretaris (Logistik & Rapat Only)</option>
              <option value="Ketua DKM">Ketua DKM (Audit & Approval Only)</option>
            </select>
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button type="button" @click="showAddUserModal = false" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl">Batal</button>
          <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl">Tambah Pengurus</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 5. MODAL ADD PROPOSAL -->
  <div x-show="showAddProposalModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center p-4 z-50">
    <div @click.away="showAddProposalModal = false" class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
      <div class="flex justify-between items-center border-b pb-2">
        <h5 class="font-bold text-lg text-slate-900">Buat Pengajuan Dana Baru</h5>
        <button @click="showAddProposalModal = false" class="text-slate-400 hover:text-slate-600 font-bold">×</button>
      </div>
      <form @submit.prevent="submitProposal()">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Tanggal Rapat / Usulan</label>
            <input type="date" x-model="formProposal.tanggal" required class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Judul Pengadaan / Proyek</label>
            <input type="text" x-model="formProposal.judul" required placeholder="Contoh: Pembelian Karpet Utama..." class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Deskripsi & Keperluan Detail</label>
            <textarea x-model="formProposal.deskripsi" required rows="3" placeholder="Deskripsikan merk, kuantitas, dan manfaat bagi jemaah..." class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Estimasi Biaya (Rupiah)</label>
            <input type="number" x-model="formProposal.estimasiBiaya" required placeholder="1500000" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase">Alur Pengajuan Awal</label>
            <select x-model="formProposal.status" class="mt-1 w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-emerald-600">
              <option value="Draft">Draft (Disimpan saja)</option>
              <option value="Diajukan">Diajukan langsung (Butuh Persetujuan Ketua DKM)</option>
            </select>
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button type="button" @click="showAddProposalModal = false" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl">Batal</button>
          <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl">Simpan Proposal</button>
        </div>
      </form>
    </div>
  </div>

  <!-- JAVASCRIPT LOGIC -->
  <script>
    function kasMasjidApp() {
      return {
        // App State
        currentTab: 'ringkasan',
        loading: true,
        user: { email: '', nama: '', role: 'Jemaah' },
        dashboard: { saldoKas: 0, totalMasuk: 0, totalKeluar: 0, totalInventarisUnit: 0, totalProposal: 0, pendingProposal: 0 },
        
        // Data Collections
        kasMasuk: [],
        kasKeluar: [],
        inventaris: [],
        proposals: [],
        users: [],
        categories: [],
        
        // Modals
        showAddMasukModal: false,
        showAddKeluarModal: false,
        showAddLogistikModal: false,
        showAddUserModal: false,
        showAddProposalModal: false,
        
        // Forms
        formMasuk: { tanggal: new Date().toISOString().split('T')[0], kategori: '', keterangan: '', nominal: '', buktiUrl: '' },
        formKeluar: { tanggal: new Date().toISOString().split('T')[0], kategori: '', keterangan: '', nominal: '', buktiUrl: '' },
        formLogistik: { tanggal: new Date().toISOString().split('T')[0], namaBarang: '', jenisLogistik: 'Masuk', kategori: '', volume: '', satuan: '', sumberPeruntukan: '', keterangan: '' },
        formUser: { email: '', nama: '', role: 'Bendahara 1' },
        formProposal: { tanggal: new Date().toISOString().split('T')[0], judul: '', deskripsi: '', estimasiBiaya: '', status: 'Draft' },
        
        toast: { show: false, message: '', type: 'success' },

        init() {
          // Inisialisasi awal, tarik user dan kategori
          this.fetchActiveUser();
        },

        showToast(msg, type = 'success') {
          this.toast.message = msg;
          this.toast.type = type;
          this.toast.show = true;
          setTimeout(() => { this.toast.show = false; }, 4000);
        },

        // Fetch User Aktif Google
        fetchActiveUser() {
          this.loading = true;
          google.script.run
            .withSuccessHandler((user) => {
              this.user = user;
              if (user.role !== 'Jemaah') {
                this.fetchDashboard();
                this.fetchCategories();
              } else {
                this.loading = false;
              }
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .getActiveUserInfo();
        },

        fetchDashboard() {
          google.script.run
            .withSuccessHandler((dash) => {
              this.dashboard = dash;
              this.loading = false;
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .getAdminDashboardData();
        },

        fetchCategories() {
          google.script.run
            .withSuccessHandler((cats) => {
              this.categories = cats;
              // Set default kategori di form jika ada
              const masukCats = this.filterCategories('Masuk');
              if (masukCats.length > 0) this.formMasuk.kategori = masukCats[0].NamaKategori;
              const keluarCats = this.filterCategories('Keluar');
              if (keluarCats.length > 0) this.formKeluar.kategori = keluarCats[0].NamaKategori;
            })
            .getCategories();
        },

        filterCategories(jenis) {
          return this.categories.filter(c => c.Jenis === jenis);
        },

        // API GETTERS
        fetchKasMasuk() {
          this.loading = true;
          google.script.run
            .withSuccessHandler((data) => {
              this.kasMasuk = data;
              this.loading = false;
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .getKasMasukList();
        },

        fetchKasKeluar() {
          this.loading = true;
          google.script.run
            .withSuccessHandler((data) => {
              this.kasKeluar = data;
              this.loading = false;
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .getKasKeluarList();
        },

        fetchInventaris() {
          this.loading = true;
          google.script.run
            .withSuccessHandler((data) => {
              this.inventaris = data;
              this.loading = false;
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .getInventarisList();
        },

        fetchProposals() {
          this.loading = true;
          google.script.run
            .withSuccessHandler((data) => {
              this.proposals = data;
              this.loading = false;
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .getProposalsList();
        },

        fetchUsers() {
          this.loading = true;
          google.script.run
            .withSuccessHandler((data) => {
              this.users = data;
              this.loading = false;
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .getUsersList();
        },

        // FORM SUBMITTERS
        submitKasMasuk() {
          this.loading = true;
          google.script.run
            .withSuccessHandler(() => {
              this.showToast("Kas masuk berhasil dicatat!");
              this.showAddMasukModal = false;
              this.resetForm('formMasuk');
              this.fetchDashboard();
              this.fetchKasMasuk();
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .addKasMasuk(this.formMasuk);
        },

        submitKasKeluar() {
          this.loading = true;
          google.script.run
            .withSuccessHandler(() => {
              this.showToast("Kas keluar berhasil dicatat!");
              this.showAddKeluarModal = false;
              this.resetForm('formKeluar');
              this.fetchDashboard();
              this.fetchKasKeluar();
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .addKasKeluar(this.formKeluar);
        },

        submitLogistik() {
          this.loading = true;
          google.script.run
            .withSuccessHandler(() => {
              this.showToast("Logistik berhasil dicatat!");
              this.showAddLogistikModal = false;
              this.resetForm('formLogistik');
              this.fetchDashboard();
              this.fetchInventaris();
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .addInventaris(this.formLogistik);
        },

        submitProposal() {
          this.loading = true;
          google.script.run
            .withSuccessHandler(() => {
              this.showToast("Pengajuan dana disimpan!");
              this.showAddProposalModal = false;
              this.resetForm('formProposal');
              this.fetchDashboard();
              this.fetchProposals();
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .addProposal(this.formProposal);
        },

        submitUser() {
          this.loading = true;
          google.script.run
            .withSuccessHandler(() => {
              this.showToast("Pengurus baru berhasil didaftarkan!");
              this.showAddUserModal = false;
              this.resetForm('formUser');
              this.fetchUsers();
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .addUser(this.formUser);
        },

        // ACTIONS
        updateProposalStatus(id, newStatus) {
          this.loading = true;
          google.script.run
            .withSuccessHandler(() => {
              this.showToast("Status pengajuan diperbarui ke: " + newStatus);
              this.fetchDashboard();
              this.fetchProposals();
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .updateProposalStatus(id, newStatus);
        },

        deleteUser(email) {
          if (!confirm("Apakah Anda yakin ingin menghapus pengurus ini?")) return;
          this.loading = true;
          google.script.run
            .withSuccessHandler(() => {
              this.showToast("Pengurus berhasil dihapus.");
              this.fetchUsers();
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .deleteUser(email);
        },

        deleteRecord(sheetName, id) {
          if (!confirm("APAKAH ANDA YAKIN? Tindakan ini akan menghapus data transaksi dari database selamanya!")) return;
          this.loading = true;
          google.script.run
            .withSuccessHandler(() => {
              this.showToast("Data transaksi berhasil dihapus.");
              this.fetchDashboard();
              if (sheetName === 'Kas_Masuk') this.fetchKasMasuk();
              if (sheetName === 'Kas_Keluar') this.fetchKasKeluar();
              if (sheetName === 'Inventaris_Logistik') this.fetchInventaris();
            })
            .withFailureHandler((err) => {
              this.showToast(err.message, 'error');
              this.loading = false;
            })
            .deleteRecord(sheetName, id);
        },

        // ROLE VALIDATORS FOR UI BUTTONS
        canEditKasMasuk() {
          return this.user.role === 'Super Admin' || this.user.role === 'Bendahara 1';
        },
        canEditKasKeluar() {
          return this.user.role === 'Super Admin' || this.user.role === 'Bendahara 2';
        },
        canEditLogistik() {
          return this.user.role === 'Super Admin' || this.user.role === 'Sekretaris';
        },
        canApproveAnggaran() {
          return this.user.role === 'Super Admin' || this.user.role === 'Ketua DKM';
        },

        // HELPERS
        formatRupiah(val) {
          if (!val) return 'Rp 0';
          return 'Rp ' + parseFloat(val).toLocaleString('id-ID');
        },
        formatDate(dateStr) {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
        },
        resetForm(formName) {
          const defaultDates = ['formMasuk', 'formKeluar', 'formLogistik', 'formProposal'];
          this[formName] = {};
          if (defaultDates.includes(formName)) {
            this[formName].tanggal = new Date().toISOString().split('T')[0];
          }
          if (formName === 'formLogistik') this[formName].jenisLogistik = 'Masuk';
          if (formName === 'formUser') this[formName].role = 'Bendahara 1';
          if (formName === 'formProposal') this[formName].status = 'Draft';
          this.fetchCategories();
        },
        openPublicUrl() {
          let url;
          if (this.user && this.user.scriptUrl) {
            url = this.user.scriptUrl + '?page=public';
          } else {
            const currentUrl = window.location.href;
            const urlObj = new URL(currentUrl);
            urlObj.searchParams.set('page', 'public');
            url = urlObj.toString();
          }
          window.open(url, '_blank');
        },
        getLogoutUrl() {
          const scriptUrl = (this.user && this.user.scriptUrl) || '';
          if (scriptUrl) {
            return 'https://accounts.google.com/Logout?continue=' + encodeURIComponent('https://appengine.google.com/_ah/logout?continue=' + encodeURIComponent(scriptUrl));
          }
          return 'https://accounts.google.com/Logout';
        }
      }
    }
  </script>
</body>
</html>
`;

export const gasPublicHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Transparansi Jemaah — KasMasjid</title>
  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Alpine.js -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800" x-data="publicKasApp()">

  <!-- PUBLIC HEADER -->
  <header class="bg-emerald-900 text-white py-12 px-4 shadow-md relative overflow-hidden">
    <!-- Background overlay pattern -->
    <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
    <div class="max-w-4xl mx-auto text-center space-y-3 relative z-10">
      <div class="inline-block bg-emerald-700 text-emerald-100 text-3xl p-3.5 rounded-2xl shadow-lg">🕌</div>
      <h1 class="text-3xl font-extrabold tracking-tight">Laporan Keuangan & Kas Masjid</h1>
      <p class="text-emerald-200 text-sm max-w-xl mx-auto leading-relaxed">
        Sistem Informasi Transparansi Keuangan Dewan Kemakmuran Masjid (DKM). Diaudit secara berkala untuk kemaslahatan umat.
      </p>
    </div>
  </header>

  <!-- PUBLIC CORE CONTENT -->
  <main class="max-w-4xl mx-auto px-4 py-8 -mt-6 relative z-20">
    
    <!-- STATS CARD & CONTROLLER -->
    <div class="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 space-y-6">
      
      <!-- CONTROLLER (FILTER HARI) -->
      <div class="flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 pb-5 gap-4">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Periode Tampilan</span>
          <div class="flex space-x-2 mt-1">
            <button @click="changeRange(7)" :class="daysRange === 7 ? 'bg-emerald-800 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'" class="px-4 py-2 rounded-xl text-xs transition">
              7 Hari Terakhir
            </button>
            <button @click="changeRange(30)" :class="daysRange === 30 ? 'bg-emerald-800 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'" class="px-4 py-2 rounded-xl text-xs transition">
              30 Hari Terakhir
            </button>
          </div>
        </div>
        
        <div class="text-right">
          <span class="text-xs font-bold text-slate-400 block uppercase tracking-wider">Status Database</span>
          <span class="inline-flex items-center space-x-1.5 mt-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <span class="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Terhubung ke Google Sheets (Real-time)</span>
          </span>
        </div>
      </div>

      <!-- STATS GRID -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <span class="text-xs font-semibold text-slate-400 block">SALDO AWAL PERIODE</span>
          <span class="text-xl font-bold font-mono text-slate-700 mt-0.5 block" x-text="formatRupiah(report.saldoAwal)">Rp 0</span>
        </div>
        <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <span class="text-xs font-semibold text-slate-400 block">MUTASI KAS MASUK (+)</span>
          <span class="text-xl font-bold font-mono text-emerald-700 mt-0.5 block" x-text="formatRupiah(report.totalMasuk)">+ Rp 0</span>
        </div>
        <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <span class="text-xs font-semibold text-slate-400 block">MUTASI KAS KELUAR (-)</span>
          <span class="text-xl font-bold font-mono text-red-600 mt-0.5 block" x-text="formatRupiah(report.totalKeluar)">- Rp 0</span>
        </div>
      </div>

      <!-- BIG BALANCE BOX -->
      <div class="bg-emerald-800 text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center shadow-lg border border-emerald-700">
        <div class="space-y-1 text-center sm:text-left mb-4 sm:mb-0">
          <span class="text-xs font-semibold uppercase tracking-wider text-emerald-200 block">Saldo Kas Terkini (Milik Umat)</span>
          <h3 class="text-3xl font-black font-mono tracking-tight" x-text="formatRupiah(report.saldoAkhir)">Rp 0</h3>
        </div>
        <div class="text-xs text-emerald-100 text-center sm:text-right max-w-xs leading-relaxed opacity-90">
          Amanah jemaah dikelola secara akuntabel demi kemakmuran masjid dan kesejahteraan sosial masyarakat sekitar.
        </div>
      </div>

    </div>

    <!-- TABLE AREA -->
    <div class="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      
      <div class="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h4 class="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Buku Kas Masjid (Gabungan)</h4>
        <span class="text-xs text-slate-500 font-medium" x-text="report.laporan.length + ' Baris Transaksi'">0</span>
      </div>

      <!-- SPINNER -->
      <div x-show="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800"></div>
        <span class="ml-3 text-sm text-slate-500">Menganalisis & menyamarkan data sensitif...</span>
      </div>

      <!-- TRANSACTIONS TABLE -->
      <div x-show="!loading" class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <th class="p-4">Tanggal</th>
              <th class="p-4">Kategori</th>
              <th class="p-4">Keterangan / Deskripsi</th>
              <th class="p-4 text-right">Pemasukan (+)</th>
              <th class="p-4 text-right">Pengeluaran (-)</th>
              <th class="p-4 text-right">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody>
            <!-- SALDO AWAL ROW -->
            <tr class="bg-emerald-50/30 border-b border-slate-100 text-xs">
              <td class="p-4 text-slate-400 font-medium">Mulai</td>
              <td class="p-4 font-bold text-emerald-800 uppercase tracking-wider">Saldo Awal</td>
              <td class="p-4 text-slate-500 italic">Akumulasi saldo sebelum <span x-text="daysRange"></span> hari yang lalu</td>
              <td class="p-4 text-right font-mono text-slate-400">-</td>
              <td class="p-4 text-right font-mono text-slate-400">-</td>
              <td class="p-4 text-right font-mono font-bold text-slate-700" x-text="formatRupiah(report.saldoAwal)"></td>
            </tr>
            
            <template x-for="item in report.laporan" :key="item.id">
              <tr class="border-b border-slate-100 hover:bg-slate-50/40">
                <td class="p-4 whitespace-nowrap text-slate-500" x-text="formatDate(item.tanggal)"></td>
                <td class="p-4">
                  <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                        :class="item.masuk > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'"
                        x-text="item.kategori"></span>
                </td>
                <td class="p-4">
                  <span class="text-slate-900 block font-medium" x-text="item.keterangan"></span>
                  <span class="text-[10px] font-mono text-slate-400 uppercase" x-text="item.id"></span>
                </td>
                <td class="p-4 text-right font-mono font-bold text-blue-600" x-text="item.masuk > 0 ? formatRupiah(item.masuk) : '-'"></td>
                <td class="p-4 text-right font-mono font-bold text-red-500" x-text="item.keluar > 0 ? formatRupiah(item.keluar) : '-'"></td>
                <td class="p-4 text-right font-mono font-bold text-slate-700" x-text="formatRupiah(item.saldoBerjalan)"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      
    </div>

    <!-- MASKING INFO & DONATION SECTION -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      
      <!-- DATA MASKING INFO (PRD REQ) -->
      <div class="bg-slate-100 rounded-2xl p-5 border border-slate-200 text-slate-600 flex space-x-3 items-start shadow-inner">
        <span class="text-xl">🛡️</span>
        <div class="space-y-1.5">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700">Kebijakan Privasi Jemaah</h5>
          <p class="text-xs leading-relaxed">
            Untuk menjaga kehormatan & privasi mustahik (penerima zakat, santunan, dhuafa, dsb), sistem menyamarkan identitas dan keterangan rincinya secara otomatis di sisi server sebelum dikirimkan ke halaman publik ini.
          </p>
        </div>
      </div>

      <!-- STATIC QRIS DONATION PLACEHOLDER -->
      <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl flex flex-col items-center text-center space-y-4">
        <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Infak & Sedekah Digital</span>
        
        <!-- Kami akan menyematkan gambar QRIS dinamis di sini -->
        <div class="p-2 border-2 border-slate-100 rounded-xl bg-slate-50 shadow-inner">
          <div class="w-32 h-32 bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-500 rounded-lg">
            [ QRIS SCANNER ]
          </div>
        </div>
        
        <div class="space-y-1">
          <h5 class="text-sm font-extrabold text-slate-900">QRIS Masjid Al-Amanah</h5>
          <p class="text-[11px] text-slate-400 leading-relaxed max-w-xs">
            Scan QRIS di atas dengan m-Banking atau e-Wallet Anda (Gopay, OVO, Dana, LinkAja) untuk donasi instan.
          </p>
        </div>
      </div>

    </div>

  </main>

  <!-- JAVASCRIPT LOGIC -->
  <script>
    function publicKasApp() {
      return {
        loading: true,
        daysRange: 30,
        report: { saldoAwal: 0, laporan: [], totalMasuk: 0, totalKeluar: 0, saldoAkhir: 0 },

        init() {
          this.fetchLaporan();
        },

        fetchLaporan() {
          this.loading = true;
          google.script.run
            .withSuccessHandler((res) => {
              this.report = res;
              this.loading = false;
            })
            .withFailureHandler((err) => {
              alert("Gagal memuat laporan publik: " + err.message);
              this.loading = false;
            })
            .getPublicLaporan(this.daysRange);
        },

        changeRange(days) {
          this.daysRange = days;
          this.fetchLaporan();
        },

        formatRupiah(val) {
          if (!val) return 'Rp 0';
          return 'Rp ' + parseFloat(val).toLocaleString('id-ID');
        },
        
        formatDate(dateStr) {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }
    }
  </script>
</body>
</html>
`;
