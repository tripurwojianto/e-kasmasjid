import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArsipItem, User } from '../types';
import { 
  FileText, 
  FileDown, 
  Image as ImageIcon, 
  Search, 
  Filter, 
  Upload, 
  Cloud, 
  CloudLightning, 
  CheckCircle, 
  Trash2, 
  ExternalLink, 
  Download, 
  AlertCircle, 
  BookOpen, 
  Folder, 
  ArrowUpRight, 
  Plus, 
  Info,
  LogOut,
  Sparkles
} from 'lucide-react';
import { 
  googleSignIn, 
  googleLogout, 
  initAuth, 
  uploadFileToDrive, 
  makeFilePublic 
} from '../lib/googleDrive';
import { User as FirebaseUser } from 'firebase/auth';

export const initialArsipItems: ArsipItem[] = [
  {
    id: 'ARS-001',
    nama: 'Rangkuman_Tafsir_AlKahfi_Ayat_1_10.pdf',
    tipe: 'application/pdf',
    kategori: 'kajian',
    uploaderName: 'Ust. Dr. KH. Syarifuddin',
    uploaderRole: 'Ustadz / Pemateri',
    tanggal: '2026-06-15',
    fileId: 'mock-1',
    webViewLink: 'https://drive.google.com',
    webContentLink: 'https://drive.google.com',
    ukuran: '1.2 MB',
    deskripsi: 'Bahan rujukan kajian tafsir mingguan hari Senin ba\'da Maghrib. Pembahasan mendalam fadhilah dan tafsir surah Al-Kahfi ayat 1 sampai 10.'
  },
  {
    id: 'ARS-002',
    nama: 'Laporan_Keuangan_Kas_Masjid_Juni_2026.pdf',
    tipe: 'application/pdf',
    kategori: 'administrasi',
    uploaderName: 'Budi Raharjo',
    uploaderRole: 'Sekretaris',
    tanggal: '2026-06-30',
    fileId: 'mock-2',
    webViewLink: 'https://drive.google.com',
    webContentLink: 'https://drive.google.com',
    ukuran: '842 KB',
    deskripsi: 'Laporan neraca keuangan bulanan resmi DKM Al-Amanah periode Juni 2026, mencakup rekapitulasi infaq jumat, zakat, dan pengeluaran operasional.'
  },
  {
    id: 'ARS-003',
    nama: 'Foto_Kajian_Akbar_Ustadz_Adi_Hidayat.jpg',
    tipe: 'image/jpeg',
    kategori: 'dokumentasi',
    uploaderName: 'Muhammad Al-Fatih',
    uploaderRole: 'Admin',
    tanggal: '2026-06-25',
    fileId: 'mock-3',
    webViewLink: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop',
    webContentLink: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop',
    ukuran: '2.4 MB',
    deskripsi: 'Dokumentasi foto bersama jemaah kajian Riyadhus Shalihin ba\'da Subuh bersama bintang tamu Ustadz Adi Hidayat, Lc.'
  }
];

interface ArchiveViewProps {
  arsip: ArsipItem[];
  onAddArsip: (item: ArsipItem) => void;
  onDeleteArsip: (id: string) => void;
  currentUser: User;
  isPublicMode: boolean;
}

export default function ArchiveView({ 
  arsip, 
  onAddArsip, 
  onDeleteArsip, 
  currentUser, 
  isPublicMode 
}: ArchiveViewProps) {
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('semua');
  const [selectedTipe, setSelectedTipe] = useState<string>('semua');

  // Google OAuth Drive connection states
  const [gUser, setGUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDriveSupported, setIsDriveSupported] = useState(true);

  // File upload form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [kategoriUpload, setKategoriUpload] = useState<ArsipItem['kategori']>('kajian');
  const [deskripsi, setDeskripsi] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Auth state
  useEffect(() => {
    try {
      const unsubscribe = initAuth(
        (user, token) => {
          setGUser(user);
          setAccessToken(token);
        },
        () => {
          setGUser(null);
          setAccessToken(null);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase config probably not yet ready or offline:', e);
      setIsDriveSupported(false);
    }
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Failed to authenticate Google Drive:', err);
      alert('Gagal menghubungkan Google Drive. Pastikan Anda menyetujui izin aplikasi.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (window.confirm('Apakah Anda yakin ingin memutuskan sambungan Google Drive Sekretaris?')) {
      await googleLogout();
      setGUser(null);
      setAccessToken(null);
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload file logic
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!accessToken) {
      alert('Silakan hubungkan Google Drive Akun Sekretaris terlebih dahulu sebelum melakukan upload.');
      return;
    }

    setIsUploading(true);
    try {
      // Real Drive Upload
      const result = await uploadFileToDrive(accessToken, selectedFile, deskripsi);

      // Add to global state list
      const newItem: ArsipItem = {
        id: 'ARS-' + Math.floor(1000 + Math.random() * 9000),
        nama: result.name,
        tipe: result.mimeType,
        kategori: kategoriUpload,
        uploaderName: currentUser.nama.split(' ')[0] || currentUser.nama || 'Pengurus',
        uploaderRole: currentUser.role,
        tanggal: new Date().toISOString().slice(0, 10),
        fileId: result.id,
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink || result.webViewLink,
        ukuran: result.size || 'Unknown',
        deskripsi: deskripsi.trim() || undefined
      };

      onAddArsip(newItem);
      
      // Reset form
      setSelectedFile(null);
      setDeskripsi('');
      alert(`Alhamdulillah! Berhasil mengunggah "${result.name}" ke Google Drive dan didaftarkan di Arsip Masjid.`);
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(`Gagal mengunggah berkas: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = (item: ArsipItem) => {
    const isOwner = currentUser.nama.split(' ')[0] === item.uploaderName || currentUser.role === 'Super Admin' || currentUser.role === 'Sekretaris';
    if (!isOwner) {
      alert('Akses Ditolak: Hanya Super Admin, Sekretaris, atau uploader asli berkas yang dapat menghapusnya.');
      return;
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus arsip "${item.nama}" dari portal?\n(Tindakan ini tidak menghapus file asli di Google Drive Anda demi keamanan data)`
    );
    if (confirmed) {
      onDeleteArsip(item.id);
    }
  };

  // File type icons mapping
  const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) {
      return <div className="p-3 bg-red-100 rounded-2xl text-red-700 shrink-0"><FileText className="h-6 w-6" /></div>;
    }
    if (mime.includes('image')) {
      return <div className="p-3 bg-blue-100 rounded-2xl text-blue-700 shrink-0"><ImageIcon className="h-6 w-6" /></div>;
    }
    if (mime.includes('text') || mime.includes('document') || mime.includes('msword')) {
      return <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-700 shrink-0"><FileText className="h-6 w-6" /></div>;
    }
    return <div className="p-3 bg-slate-100 rounded-2xl text-slate-700 shrink-0"><Folder className="h-6 w-6" /></div>;
  };

  // Categories labeling mapping
  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case 'kajian':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">📚 Kajian / Materi</span>;
      case 'administrasi':
        return <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">📋 Administrasi</span>;
      case 'dokumentasi':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">📸 Dokumentasi</span>;
      default:
        return <span className="bg-slate-50 text-slate-800 border border-slate-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">📂 Lainnya</span>;
    }
  };

  // Determine upload authority
  const isAuthorizedToUpload = !isPublicMode && (
    currentUser.role === 'Super Admin' || 
    currentUser.role === 'Admin' || 
    currentUser.role === 'Sekretaris' || 
    currentUser.role === 'Ketua DKM' || 
    currentUser.role.toLowerCase().includes('bendahara')
  );

  // Filtering list
  const filteredArsip = arsip.filter(item => {
    const matchesSearch = 
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.deskripsi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesKategori = selectedKategori === 'semua' || item.kategori === selectedKategori;
    
    const matchesTipe = selectedTipe === 'semua' || 
      (selectedTipe === 'pdf' && item.tipe.includes('pdf')) ||
      (selectedTipe === 'gambar' && item.tipe.includes('image')) ||
      (selectedTipe === 'lainnya' && !item.tipe.includes('pdf') && !item.tipe.includes('image'));

    return matchesSearch && matchesKategori && matchesTipe;
  });

  return (
    <div id="archive-view-root" className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-emerald-850 text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
        <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
          <Folder className="h-32 w-32" />
        </div>
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 bg-emerald-900/50 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border border-emerald-700 text-emerald-200">
            <Sparkles className="h-3 w-3 animate-pulse text-amber-400" />
            <span>Pustaka &amp; Arsip Digital Masjid</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">📁 Pustaka Dokumen &amp; Arsip Al-Amanah</h2>
          <p className="text-xs leading-relaxed text-emerald-100/90 font-sans font-light">
            Selamat datang di menu arsip digital DKM Al-Amanah. Di sini pengurus dan ustadz dapat mengunggah rangkuman materi pengajian, laporan administrasi bulanan masjid, serta foto kegiatan yang secara otomatis terintegrasi aman di Google Drive. Seluruh jemaah dapat membaca dan mengunduh berkas-berkas ini secara terbuka untuk transparansi dan kemudahan belajar.
          </p>
        </div>
      </div>

      {/* Google Drive Connection Section - ONLY FOR PENGURUS */}
      {isAuthorizedToUpload && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-emerald-700" />
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Koneksi Google Drive Sekretaris</h4>
                <p className="text-[10px] text-slate-400">Hubungkan Drive Akun Sekretaris DKM untuk menyimpan berkas resmi secara cloud</p>
              </div>
            </div>
            
            {accessToken ? (
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-emerald-800 text-[10px] font-extrabold">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-xs">Terhubung: {gUser?.email || 'Akun DKM'}</span>
                <button 
                  onClick={handleDisconnectGoogle} 
                  className="ml-2 hover:text-red-600 cursor-pointer text-slate-400"
                  title="Putuskan Sambungan"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CloudLightning className="h-3.5 w-3.5" />
                {isConnecting ? 'Menghubungkan...' : 'Hubungkan Drive Sekretaris'}
              </button>
            )}
          </div>

          {/* Guidelines on permissions */}
          <div className="flex items-start gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-[11px] text-slate-600 leading-relaxed">
            <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700">Petunjuk Keamanan Berkas:</span> Berkas yang diunggah akan otomatis disimpan ke Drive Sekretaris dalam folder khusus yang dibuat oleh aplikasi. Sistem akan menyetel hak akses berkas tersebut menjadi <span className="font-bold text-emerald-700">"Siapa saja dengan link dapat melihat/mengunduh"</span> agar para jemaah dapat langsung mengunduh dari portal ini secara instan tanpa perlu meminta izin akses manual.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Upload Form (if authorized), Right Search & Archives List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: UPLOAD BOX (Visible only to internal pengurus) */}
        {isAuthorizedToUpload && (
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Plus className="h-4 w-4 text-emerald-700" /> Unggah Berkas Baru
              </h3>

              {!accessToken ? (
                <div className="text-center py-6 px-4 bg-amber-50/50 border border-dashed border-amber-200 rounded-2xl space-y-3">
                  <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-xs text-amber-900 uppercase tracking-wide">Drive Belum Terhubung</h5>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      Silakan klik tombol <span className="font-bold">"Hubungkan Drive Sekretaris"</span> di atas terlebih dahulu untuk mengaktifkan formulir unggah berkas.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {/* File Drag and Drop */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                      dragActive 
                        ? 'border-emerald-600 bg-emerald-50/40' 
                        : 'border-slate-250 hover:border-emerald-600 hover:bg-slate-50/50'
                    }`}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                      className="hidden"
                    />
                    <Upload className="h-8 w-8 text-slate-400" />
                    
                    {selectedFile ? (
                      <div className="space-y-0.5 max-w-full">
                        <p className="text-[11px] font-bold text-emerald-800 truncate px-2">{selectedFile.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700">Tarik berkas ke sini atau Klik</p>
                        <p className="text-[9px] text-slate-400">PDF, JPG, PNG, atau TXT (Maks 10MB)</p>
                      </div>
                    )}
                  </div>

                  {/* Kategori */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Kategori Arsip</label>
                    <select
                      value={kategoriUpload}
                      onChange={(e) => setKategoriUpload(e.target.value as ArsipItem['kategori'])}
                      className="w-full text-xs font-bold p-2.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="kajian">📚 Kajian (Rangkuman Bahan Pengajian)</option>
                      <option value="administrasi">📋 Administrasi (Laporan, Surat, dll)</option>
                      <option value="dokumentasi">📸 Foto Kegiatan Masjid</option>
                      <option value="lainnya">📂 Lainnya (Buku Tamu, Inventaris, dll)</option>
                    </select>
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Deskripsi / Catatan Singkat</label>
                    <textarea
                      rows={3}
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      placeholder="e.g. Rangkuman Kajian subuh membahas hadits ke-12 tentang adab shalat..."
                      className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? 'Sedang Mengunggah...' : 'Unggah ke Google Drive'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* RIGHT: SEARCH, FILTERS & CARDS */}
        <div className={`${isAuthorizedToUpload ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
          
          {/* Filters and Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul arsip, nama pengunggah, atau isi deskripsi berkas..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Categories Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'semua', label: '🗂️ Semua' },
                  { key: 'kajian', label: '📚 Kajian' },
                  { key: 'administrasi', label: '📋 Laporan & Admin' },
                  { key: 'dokumentasi', label: '📸 Foto Kegiatan' },
                  { key: 'lainnya', label: '📂 Lainnya' }
                ].map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedKategori(cat.key)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider border cursor-pointer transition ${
                      selectedKategori === cat.key
                        ? 'bg-emerald-800 text-white border-emerald-850 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedTipe}
                  onChange={(e) => setSelectedTipe(e.target.value)}
                  className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                >
                  <option value="semua">Semua Tipe File</option>
                  <option value="pdf">dokumen PDF</option>
                  <option value="gambar">berkas Gambar (JPG/PNG)</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          {filteredArsip.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArsip.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: File Type Icon and Category badge */}
                    <div className="flex justify-between items-start">
                      {getFileIcon(item.tipe)}
                      <div className="flex flex-col items-end space-y-1">
                        {getKategoriBadge(item.kategori)}
                        <span className="text-[9px] font-mono font-extrabold text-slate-400 bg-slate-50 border px-1.5 py-0.5 rounded-md">
                          💾 {item.ukuran}
                        </span>
                      </div>
                    </div>

                    {/* Body: Title and Description */}
                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-xs text-slate-800 leading-snug break-words" title={item.nama}>
                        {item.nama}
                      </h4>
                      {item.deskripsi && (
                        <p className="text-[10px] text-slate-500 leading-relaxed font-sans font-normal line-clamp-3">
                          {item.deskripsi}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer metadata and download action buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                      <span>👤 {item.uploaderName} ({item.uploaderRole})</span>
                      <span>📅 {item.tanggal}</span>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      {/* View Link */}
                      <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[9px] uppercase tracking-wider rounded-lg text-center flex items-center justify-center gap-1 transition"
                      >
                        <ExternalLink className="h-3 w-3" /> Pratinjau
                      </a>

                      {/* Download Link */}
                      <a
                        href={item.webContentLink || item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg text-center flex items-center justify-center gap-1 transition shadow-xs"
                      >
                        <Download className="h-3 w-3" /> Unduh
                      </a>

                      {/* Delete button only for authorized */}
                      {!isPublicMode && (currentUser.role === 'Super Admin' || currentUser.role === 'Sekretaris' || currentUser.nama.split(' ')[0] === item.uploaderName) && (
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Hapus Arsip"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
              <span className="text-4xl block mb-2">📁</span>
              <p className="text-xs text-slate-400 italic font-semibold">Tidak ada arsip dokumen yang cocok dengan pencarian.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
