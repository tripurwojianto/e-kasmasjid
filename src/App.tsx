/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, KasMasuk, KasKeluar, InventarisLogistik, RapatPengajuan, Kategori } from './types';
import {
  initialUsers,
  initialKasMasuk,
  initialKasKeluar,
  initialInventaris,
  initialRapatPengajuan,
  initialKategori,
} from './mockData';
import RoleSimulator from './components/RoleSimulator';
import DashboardView from './components/DashboardView';
import KasMasukView from './components/KasMasukView';
import KasKeluarView from './components/KasKeluarView';
import InventarisView from './components/InventarisView';
import ProposalsView from './components/ProposalsView';
import PublicTransparansiView from './components/PublicTransparansiView';
import UserManagementView from './components/UserManagementView';
import ExportCenterView from './components/ExportCenterView';
import QrisSimulationView from './components/QrisSimulationView';
import LaporanBulananView from './components/LaporanBulananView';
import { Home as HomeIcon, BarChart3, QrCode, Menu as MenuIcon, Lock, LogIn, LogOut, Check } from 'lucide-react';

export default function App() {
  // Load data from localStorage or fallback to mockData
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kasmasjid_users');
    const parsed: User[] = saved ? JSON.parse(saved) : initialUsers;
    const hasOwner = parsed.some(u => u.email.toLowerCase() === 'bukukassekolah@gmail.com');
    if (!hasOwner) {
      const ownerUser: User = {
        email: 'bukukassekolah@gmail.com',
        nama: 'Owner (bukukassekolah@gmail.com)',
        role: 'Super Admin',
        status: 'Aktif',
        tanggalDaftar: '2026-07-04',
      };
      const updated = [ownerUser, ...parsed];
      localStorage.setItem('kasmasjid_users', JSON.stringify(updated));
      return updated;
    }
    return parsed;
  });

  const [kasMasuk, setKasMasuk] = useState<KasMasuk[]>(() => {
    const saved = localStorage.getItem('kasmasjid_masuk');
    const parsed = saved ? JSON.parse(saved) : initialKasMasuk;
    return parsed.map((item: any) => {
      if (item.kategori === 'Infak Jumat') return { ...item, kategori: 'Infaq Jumat' };
      if (item.kategori === 'Donasi Khusus') return { ...item, kategori: 'Infaq Terikat' };
      if (item.kategori === 'Sponsor / CSR') return { ...item, kategori: 'Infaq Terikat' };
      if (item.kategori === 'Kotak Amal Harian') return { ...item, kategori: 'Kotak Amal' };
      return item;
    });
  });

  const [kasKeluar, setKasKeluar] = useState<KasKeluar[]>(() => {
    const saved = localStorage.getItem('kasmasjid_keluar');
    const parsed = saved ? JSON.parse(saved) : initialKasKeluar;
    return parsed.map((item: any) => {
      if (item.kategori === 'Kebersihan & Sarpras') return { ...item, kategori: 'Perawatan' };
      if (item.kategori === 'Penyaluran Zakat & Bansos') return { ...item, kategori: 'Konsumsi' };
      if (item.kategori === 'Insentif Marbot & Imam') return { ...item, kategori: 'Honor Imam' };
      if (item.kategori === 'Sosial & Santunan') return { ...item, kategori: 'Konsumsi' };
      if (item.kategori === 'Listrik & Air') return { ...item, kategori: 'Listrik' };
      return item;
    });
  });

  const [inventaris, setInventaris] = useState<InventarisLogistik[]>(() => {
    const saved = localStorage.getItem('kasmasjid_inventaris');
    return saved ? JSON.parse(saved) : initialInventaris;
  });

  const [proposals, setProposals] = useState<RapatPengajuan[]>(() => {
    const saved = localStorage.getItem('kasmasjid_proposals');
    return saved ? JSON.parse(saved) : initialRapatPengajuan;
  });

  const [categories, setCategories] = useState<Kategori[]>(() => {
    const saved = localStorage.getItem('kasmasjid_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.some((c: any) => c.namaKategori === 'Infak Jumat' || c.namaKategori === 'Donasi Khusus')) {
        localStorage.setItem('kasmasjid_categories', JSON.stringify(initialKategori));
        return initialKategori;
      }
      return parsed;
    }
    return initialKategori;
  });

  // Simulator Sesi User Sesi (Default ke Owner jika ada, fallback ke Super Admin)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUsers = localStorage.getItem('kasmasjid_users');
    const parsedUsers: User[] = savedUsers ? JSON.parse(savedUsers) : initialUsers;
    const owner = parsedUsers.find(u => u.email.toLowerCase() === 'bukukassekolah@gmail.com');
    if (owner) return owner;
    return parsedUsers.find(u => u.role === 'Super Admin') || parsedUsers[0];
  });

  // Public view vs Admin View Toggle
  const [isPublicMode, setIsPublicMode] = useState(false);

  // Bottom Navigation tabs for public/guest mode
  const [publicActiveTab, setPublicActiveTab] = useState<'home' | 'info' | 'donation'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminLoginEmail, setAdminLoginEmail] = useState('bukukassekolah@gmail.com');

  // Active Tab for Admin Portal
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'masuk' | 'keluar' | 'logistik' | 'rapat' | 'users' | 'export' | 'qris' | 'laporan'>('ringkasan');

  // Toaster notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('kasmasjid_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kasmasjid_masuk', JSON.stringify(kasMasuk));
  }, [kasMasuk]);

  useEffect(() => {
    localStorage.setItem('kasmasjid_keluar', JSON.stringify(kasKeluar));
  }, [kasKeluar]);

  useEffect(() => {
    localStorage.setItem('kasmasjid_inventaris', JSON.stringify(inventaris));
  }, [inventaris]);

  useEffect(() => {
    localStorage.setItem('kasmasjid_proposals', JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    localStorage.setItem('kasmasjid_categories', JSON.stringify(categories));
  }, [categories]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Actions
  const handleAddKasMasuk = (newInflow: Omit<KasMasuk, 'id' | 'inputOleh' | 'timestamp'>) => {
    const id = 'M-' + Math.floor(1000 + Math.random() * 9000);
    const item: KasMasuk = {
      ...newInflow,
      id,
      inputOleh: currentUser.email,
      timestamp: new Date().toISOString(),
    };
    setKasMasuk(prev => [item, ...prev]);
    showToast(`Berhasil mencatat kas masuk baru (${id})`);
  };

  const handleDeleteKasMasuk = (id: string) => {
    if (currentUser.role !== 'Super Admin') {
      showToast('Akses Ditolak: Hanya Super Admin yang berwenang menghapus data transaksi.', 'error');
      return;
    }
    setKasMasuk(prev => prev.filter(item => item.id !== id));
    showToast(`Berhasil menghapus kas masuk dengan ID ${id}`);
  };

  const handleAddKasKeluar = (newOutflow: Omit<KasKeluar, 'id' | 'inputOleh' | 'timestamp'>) => {
    const id = 'K-' + Math.floor(1000 + Math.random() * 9000);
    const item: KasKeluar = {
      ...newOutflow,
      id,
      inputOleh: currentUser.email,
      timestamp: new Date().toISOString(),
    };
    setKasKeluar(prev => [item, ...prev]);
    showToast(`Berhasil mencatat kas keluar baru (${id})`);
  };

  const handleDeleteKasKeluar = (id: string) => {
    if (currentUser.role !== 'Super Admin') {
      showToast('Akses Ditolak: Hanya Super Admin yang berwenang menghapus data transaksi.', 'error');
      return;
    }
    setKasKeluar(prev => prev.filter(item => item.id !== id));
    showToast(`Berhasil menghapus kas keluar dengan ID ${id}`);
  };

  const handleAddInventaris = (newItem: Omit<InventarisLogistik, 'id' | 'inputOleh' | 'timestamp'>) => {
    const id = 'INV-' + Math.floor(1000 + Math.random() * 9000);
    const item: InventarisLogistik = {
      ...newItem,
      id,
      inputOleh: currentUser.email,
      timestamp: new Date().toISOString(),
    };
    setInventaris(prev => [item, ...prev]);
    showToast(`Berhasil mencatat barang inventaris baru (${id})`);
  };

  const handleDeleteInventaris = (id: string) => {
    if (currentUser.role !== 'Super Admin') {
      showToast('Akses Ditolak: Hanya Super Admin yang berwenang menghapus data.', 'error');
      return;
    }
    setInventaris(prev => prev.filter(item => item.id !== id));
    showToast(`Berhasil menghapus barang inventaris dengan ID ${id}`);
  };

  const handleAddProposal = (newProposal: Omit<RapatPengajuan, 'id' | 'diajukanOleh' | 'timestamp'>) => {
    const id = 'RAP-' + Math.floor(1000 + Math.random() * 9000);
    const item: RapatPengajuan = {
      ...newProposal,
      id,
      diajukanOleh: currentUser.email,
      timestamp: new Date().toISOString(),
    };
    setProposals(prev => [item, ...prev]);
    showToast(`Berhasil membuat pengajuan proyek baru (${id})`);
  };

  const handleUpdateProposalStatus = (id: string, newStatus: RapatPengajuan['status']) => {
    setProposals(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: newStatus,
            disetujuiOleh: newStatus === 'Disetujui' || newStatus === 'Ditolak' ? currentUser.email : undefined,
          };
        }
        return item;
      })
    );
    showToast(`Anggaran (${id}) diubah statusnya menjadi ${newStatus}`);
  };

  const handleAddUser = (newUser: User) => {
    const exists = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (exists) {
      showToast('Email pengurus ini sudah terdaftar!', 'error');
      return;
    }
    setUsers(prev => [...prev, newUser]);
    showToast(`Berhasil mendaftarkan pengurus baru: ${newUser.nama}`);
  };

  const handleDeleteUser = (email: string) => {
    if (email.toLowerCase() === currentUser.email.toLowerCase()) {
      showToast('Anda tidak dapat menghapus akun Anda sendiri!', 'error');
      return;
    }
    setUsers(prev => prev.filter(item => item.email !== email));
    showToast(`Berhasil menghapus pengurus: ${email}`);
  };

  // Switch public view when toggle changes
  const handleTogglePublic = (isPublic: boolean) => {
    setIsPublicMode(isPublic);
    if (isPublic) {
      showToast('Beralih ke tampilan transparansi publik (tanpa login)');
    } else {
      showToast('Kembali ke portal administrasi internal');
    }
  };

  const handleNavHome = () => {
    if (isPublicMode) {
      setPublicActiveTab('home');
    } else if (currentUser.role === 'Jemaah') {
      setIsPublicMode(true);
      setPublicActiveTab('home');
      showToast('Masuk sebagai Tamu (Akses Read-Only)');
    } else {
      setActiveTab('ringkasan');
    }
  };

  const handleNavInfo = () => {
    if (isPublicMode) {
      setPublicActiveTab('info');
    } else if (currentUser.role === 'Jemaah') {
      setIsPublicMode(true);
      setPublicActiveTab('info');
      showToast('Masuk sebagai Tamu (Akses Read-Only)');
    } else {
      setActiveTab('laporan');
    }
  };

  const handleNavDonasi = () => {
    if (isPublicMode) {
      setPublicActiveTab('donation');
    } else if (currentUser.role === 'Jemaah') {
      setIsPublicMode(true);
      setPublicActiveTab('donation');
      showToast('Masuk sebagai Tamu (Akses Read-Only)');
    } else {
      setActiveTab('qris');
    }
  };

  const handleTriggerAdminCheck = () => {
    setShowAdminLoginModal(true);
  };

  const handleVerifyAdminEmail = () => {
    const foundUser = users.find(u => u.email.trim().toLowerCase() === adminLoginEmail.trim().toLowerCase());
    if (foundUser) {
      if (foundUser.status === 'Aktif') {
        setCurrentUser(foundUser);
        setIsPublicMode(false);
        setShowAdminLoginModal(false);
        showToast(`Otentikasi Berhasil! Selamat datang, ${foundUser.nama} (${foundUser.role})`);
      } else {
        showToast('Akun Anda ditemukan, namun statusnya Nonaktif. Hubungi Super Admin.', 'error');
      }
    } else {
      showToast('Akses Ditolak: Email tidak ditemukan dalam basis data pengurus DKM!', 'error');
    }
  };

  return (
    <div id="app-container" className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      
      {/* BRAND HEADER */}
      <header className="bg-emerald-800 text-white shadow-md border-b border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="bg-emerald-600 p-2.5 rounded-2xl text-emerald-100 font-bold text-xl shadow-inner">
              🕌
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block">KasMasjid (e-Kas)</span>
              <span className="text-xs text-emerald-200 block -mt-1 font-medium">Sistem Transparansi Keuangan &amp; Logistik DKM</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs text-emerald-300 font-bold uppercase tracking-wider">Pemeriksa Akun</span>
              <span className="block text-sm font-extrabold text-white">{isPublicMode ? 'Jemaah Publik (No Login)' : currentUser.nama}</span>
              <span className="block text-[10px] text-emerald-200 font-bold tracking-tight">
                {isPublicMode ? 'Hak Akses: Read Only' : `Peran: ${currentUser.role}`}
              </span>
            </div>
            <div className="bg-emerald-900/50 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-emerald-100 border border-emerald-700">
              {isPublicMode ? 'publik@masjid.org' : currentUser.email}
            </div>
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        
        {/* ACCESS CONTROL ROLE SIMULATOR HEADER */}
        <RoleSimulator
          currentUser={currentUser}
          allUsers={users}
          onUserChange={(user) => {
            setCurrentUser(user);
            showToast(`Sesi login dialihkan ke: ${user.nama} (${user.role})`);
            if (activeTab === 'export' && user.email.toLowerCase() !== 'bukukassekolah@gmail.com') {
              setActiveTab('ringkasan');
            }
          }}
          isPublicMode={isPublicMode}
          onTogglePublicMode={handleTogglePublic}
        />

        {/* NOTIFICATION TOAST */}
        {toast.show && (
          <div
            id="toast-notification"
            className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl text-white shadow-lg flex items-center space-x-3 transition-all transform animate-bounce ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
            <span>{toast.type === 'error' ? '❌' : '✅'}</span>
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        )}

        {/* DYNAMIC VIEWS DEPENDING ON PUBLIC VS PORTAL */}
        {isPublicMode ? (
          <div className="space-y-6">
            {/* Top Info Banner for Guest Mode */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start space-x-3 text-emerald-950 shadow-inner">
              <span className="text-xl">📢</span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900">Mode Jemaah / Tamu (Read-Only)</h4>
                <p className="text-xs leading-relaxed text-emerald-800">
                  Anda sedang mengakses aplikasi sebagai <span className="font-bold">Tamu</span> dengan hak akses baca. Gunakan menu navigasi di bawah untuk beralih halaman.
                </p>
              </div>
            </div>

            {publicActiveTab === 'home' && (
              <PublicTransparansiView
                kasMasuk={kasMasuk}
                kasKeluar={kasKeluar}
                onAddDonation={(amount, donorName, notes) => {
                  const id = 'M-' + Math.floor(1000 + Math.random() * 9000);
                  const item: KasMasuk = {
                    id,
                    tanggal: new Date().toISOString().slice(0, 10),
                    kategori: 'Infaq & Sedekah',
                    nominal: amount,
                    keterangan: `Donasi QRIS Mandiri - ${donorName || 'Hamba Allah'} (${notes || 'Sedekah Subuh'})`,
                    inputOleh: 'sistem.qris@masjid.org',
                    timestamp: new Date().toISOString(),
                  };
                  setKasMasuk(prev => [item, ...prev]);
                  showToast(`Alhamdulillah, donasi QRIS ${donorName ? `dari ${donorName}` : ''} senilai Rp ${amount.toLocaleString('id-ID')} berhasil masuk kas!`);
                }}
              />
            )}

            {publicActiveTab === 'info' && (
              <div className="space-y-4 animate-fade-in">
                <LaporanBulananView
                  kasMasuk={kasMasuk}
                  kasKeluar={kasKeluar}
                />
              </div>
            )}

            {publicActiveTab === 'donation' && (
              <div className="space-y-4 animate-fade-in">
                <QrisSimulationView
                  onAddDonation={(amount, donorName, notes) => {
                    const id = 'M-' + Math.floor(1000 + Math.random() * 9000);
                    const item: KasMasuk = {
                      id,
                      tanggal: new Date().toISOString().slice(0, 10),
                      kategori: 'Infaq & Sedekah',
                      nominal: amount,
                      keterangan: `Donasi QRIS Mandiri - ${donorName || 'Hamba Allah'} (${notes || 'Sedekah Mandiri QRIS'})`,
                      inputOleh: 'sistem.qris@masjid.org',
                      timestamp: new Date().toISOString(),
                    };
                    setKasMasuk(prev => [item, ...prev]);
                    showToast(`Alhamdulillah, donasi QRIS ${donorName ? `dari ${donorName}` : ''} senilai Rp ${amount.toLocaleString('id-ID')} berhasil masuk kas!`);
                    setPublicActiveTab('home');
                  }}
                />
              </div>
            )}
          </div>
        ) : currentUser.role === 'Jemaah' ? (
          /* ACCESSIBILITY LOCK SCREEN ("Akses Terkunci") */
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center border border-slate-200/80 my-12 animate-fade-in">
            <div className="text-6xl mb-4 animate-bounce">🔒</div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Akses Terkunci</h3>
            <p className="text-slate-500 mt-3 text-xs leading-relaxed">
              Akun Google Anda <span className="font-mono text-emerald-700 font-extrabold">{currentUser.email}</span> belum terdaftar di sistem pengurus KasMasjid.
            </p>
            <div className="mt-5 p-4 bg-amber-50 rounded-2xl text-left text-xs text-amber-900 border border-amber-200 leading-relaxed">
              <strong className="text-amber-950 font-bold block mb-1">💡 Petunjuk Kemudahan Akses:</strong>
              Silakan hubungi <b className="font-extrabold">Super Admin</b> untuk mendaftarkan email Google Anda, ATAU gunakan tombol di bawah untuk masuk sebagai <b className="font-extrabold text-emerald-800">Tamu (Read-Only)</b> untuk melihat laporan kas.
            </div>
            
            <div className="mt-6 flex flex-col space-y-2.5">
              <button
                id="btn-lock-tamu"
                onClick={() => {
                  setIsPublicMode(true);
                  setPublicActiveTab('home');
                  showToast('Selamat Datang! Anda masuk sebagai Tamu (Akses Read-Only)');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>🔓 Masuk sebagai Tamu (Read-Only)</span>
              </button>

              <button
                id="btn-lock-admin"
                onClick={handleTriggerAdminCheck}
                className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>🔄 Cek Otomatis &amp; Login Admin</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            
            {/* PORTAL NAVIGATION TAB SELECTOR */}
            <div className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-md pt-3 pb-2 border-b border-slate-200 flex space-x-1 overflow-x-auto shadow-sm -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <button
                id="tab-ringkasan"
                onClick={() => setActiveTab('ringkasan')}
                className={`py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
                  activeTab === 'ringkasan'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📊 Ringkasan DKM
              </button>

              <button
                id="tab-kas-masuk"
                onClick={() => setActiveTab('masuk')}
                className={`py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
                  activeTab === 'masuk'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📈 Kas Masuk
              </button>

              <button
                id="tab-kas-keluar"
                onClick={() => setActiveTab('keluar')}
                className={`py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
                  activeTab === 'keluar'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📉 Kas Keluar
              </button>

              <button
                id="tab-laporan"
                onClick={() => setActiveTab('laporan')}
                className={`py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
                  activeTab === 'laporan'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📋 Laporan Bulanan
              </button>

              <button
                id="tab-logistik"
                onClick={() => setActiveTab('logistik')}
                className={`py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
                  activeTab === 'logistik'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📦 Logistik &amp; Inventaris
              </button>

              <button
                id="tab-rapat"
                onClick={() => setActiveTab('rapat')}
                className={`py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
                  activeTab === 'rapat'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📝 Rapat &amp; Pengajuan
              </button>

              <button
                id="tab-qris"
                onClick={() => setActiveTab('qris')}
                className={`py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition text-amber-800 bg-amber-50 rounded-t-xl ${
                  activeTab === 'qris'
                    ? 'border-amber-600 text-amber-900 bg-amber-100 font-black'
                    : 'border-transparent hover:bg-amber-100/30'
                }`}
              >
                💸 Simulasi QRIS Donasi
              </button>

              {currentUser.role === 'Super Admin' && (
                <button
                  id="tab-users"
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
                    activeTab === 'users'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  👥 Kelola Pengurus
                </button>
              )}

              {currentUser.email.trim().toLowerCase() === 'bukukassekolah@gmail.com' && (
                <button
                  id="tab-export"
                  onClick={() => setActiveTab('export')}
                  className={`py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider transition text-emerald-700 bg-emerald-50 rounded-t-xl ${
                    activeTab === 'export'
                      ? 'border-emerald-600 text-emerald-800 bg-emerald-100 font-black'
                      : 'border-transparent hover:bg-emerald-100/50'
                  }`}
                >
                  🚀 Deploy ke GAS (Free)
                </button>
              )}
            </div>

            {/* TAB CONTENTS */}
            <div className="mt-4 transition-all duration-300">
              {activeTab === 'ringkasan' && (
                <DashboardView
                  kasMasuk={kasMasuk}
                  kasKeluar={kasKeluar}
                  inventaris={inventaris}
                  proposals={proposals}
                />
              )}

              {activeTab === 'masuk' && (
                <KasMasukView
                  currentUser={currentUser}
                  kasMasuk={kasMasuk}
                  onAdd={handleAddKasMasuk}
                  onDelete={handleDeleteKasMasuk}
                  categories={categories}
                />
              )}

              {activeTab === 'keluar' && (
                <KasKeluarView
                  currentUser={currentUser}
                  kasKeluar={kasKeluar}
                  onAdd={handleAddKasKeluar}
                  onDelete={handleDeleteKasKeluar}
                  categories={categories}
                />
              )}

              {activeTab === 'laporan' && (
                <LaporanBulananView
                  kasMasuk={kasMasuk}
                  kasKeluar={kasKeluar}
                />
              )}

              {activeTab === 'logistik' && (
                <InventarisView
                  currentUser={currentUser}
                  inventaris={inventaris}
                  onAdd={handleAddInventaris}
                  onDelete={handleDeleteInventaris}
                />
              )}

              {activeTab === 'rapat' && (
                <ProposalsView
                  currentUser={currentUser}
                  proposals={proposals}
                  onAdd={handleAddProposal}
                  onUpdateStatus={handleUpdateProposalStatus}
                />
              )}

              {activeTab === 'users' && currentUser.role === 'Super Admin' && (
                <UserManagementView
                  currentUser={currentUser}
                  users={users}
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {activeTab === 'qris' && (
                <QrisSimulationView
                  onAddDonation={(amount, donorName, notes) => {
                    const id = 'M-' + Math.floor(1000 + Math.random() * 9000);
                    const item: KasMasuk = {
                      id,
                      tanggal: new Date().toISOString().slice(0, 10),
                      kategori: 'Infaq & Sedekah',
                      nominal: amount,
                      keterangan: `Donasi QRIS Mandiri - ${donorName || 'Hamba Allah'} (${notes || 'Sedekah Mandiri QRIS'})`,
                      inputOleh: 'sistem.qris@masjid.org',
                      timestamp: new Date().toISOString(),
                    };
                    setKasMasuk(prev => [item, ...prev]);
                    showToast(`Alhamdulillah, donasi QRIS ${donorName ? `dari ${donorName}` : ''} senilai Rp ${amount.toLocaleString('id-ID')} berhasil masuk kas!`);
                  }}
                />
              )}

              {activeTab === 'export' && currentUser.email.trim().toLowerCase() === 'bukukassekolah@gmail.com' && (
                <ExportCenterView
                  kasMasuk={kasMasuk}
                  kasKeluar={kasKeluar}
                  inventaris={inventaris}
                  proposals={proposals}
                  currentUser={currentUser}
                />
              )}
            </div>

          </div>
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div id="mobile-bottom-nav" className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-4 py-2.5 flex justify-around items-center">
        <button
          id="btn-nav-home"
          onClick={handleNavHome}
          className={`flex flex-col items-center space-y-1 transition duration-200 cursor-pointer ${
            (isPublicMode && publicActiveTab === 'home') || (!isPublicMode && currentUser.role !== 'Jemaah' && activeTab === 'ringkasan')
              ? 'text-emerald-700 font-extrabold scale-110'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <HomeIcon className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        <button
          id="btn-nav-info"
          onClick={handleNavInfo}
          className={`flex flex-col items-center space-y-1 transition duration-200 cursor-pointer ${
            (isPublicMode && publicActiveTab === 'info') || (!isPublicMode && currentUser.role !== 'Jemaah' && activeTab === 'laporan')
              ? 'text-emerald-700 font-extrabold scale-110'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Info</span>
        </button>

        <button
          id="btn-nav-donasi"
          onClick={handleNavDonasi}
          className={`flex flex-col items-center space-y-1 transition duration-200 cursor-pointer ${
            (isPublicMode && publicActiveTab === 'donation') || (!isPublicMode && currentUser.role !== 'Jemaah' && activeTab === 'qris')
              ? 'text-emerald-700 font-extrabold scale-110'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <QrCode className="h-5 w-5" />
          <span className="text-[10px] tracking-tight font-medium">Donasi</span>
        </button>

        <button
          id="btn-nav-menu"
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center space-y-1 transition duration-200 cursor-pointer ${
            isMenuOpen ? 'text-emerald-700 font-extrabold scale-110' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MenuIcon className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>

      {/* HAMBURGER BOTTOM SHEET OVERLAY */}
      {isMenuOpen && (
        <div id="nav-hamburger-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] overflow-y-auto transform transition-all translate-y-0">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🕌</span>
                <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Akses Utama KasMasjid</h4>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-lg p-1 cursor-pointer">×</button>
            </div>

            {/* Sesi Status */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Sesi Aktif Saat Ini</span>
              {isPublicMode ? (
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl text-lg font-bold">👤</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">Tamu / Jemaah Umum</h5>
                    <p className="text-[10px] text-emerald-700 font-semibold leading-none mt-1">Akses: Read-Only (Terbuka)</p>
                  </div>
                </div>
              ) : currentUser.role === 'Jemaah' ? (
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 text-amber-800 p-2 rounded-xl text-lg font-bold">🔒</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">Akun Belum Terdaftar</h5>
                    <p className="text-[10px] text-amber-700 font-semibold leading-none mt-1">Akses: Terkunci (Gembok)</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-800 text-white p-2 rounded-xl text-lg font-bold">👑</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{currentUser.nama}</h5>
                    <p className="text-[10px] text-emerald-700 font-semibold leading-none mt-1">Peran: {currentUser.role} (Internal)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="space-y-2 pt-2">
              <button
                id="btn-menu-tamu"
                onClick={() => {
                  setIsPublicMode(true);
                  setPublicActiveTab('home');
                  setIsMenuOpen(false);
                  showToast('Anda masuk sebagai Tamu (Akses Read-Only)');
                }}
                className="w-full text-left py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-between border hover:bg-emerald-50/50 hover:border-emerald-200 bg-white border-slate-200 text-slate-700 cursor-pointer"
              >
                <span className="flex items-center space-x-2.5">
                  <span className="text-sm">🔓</span>
                  <span>Masuk sebagai Tamu (Read-Only)</span>
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">Bebas Akses</span>
              </button>

              <button
                id="btn-menu-admin-check"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleTriggerAdminCheck();
                }}
                className="w-full text-left py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-between border hover:bg-emerald-50/50 hover:border-emerald-200 bg-white border-slate-200 text-slate-700 cursor-pointer"
              >
                <span className="flex items-center space-x-2.5">
                  <span className="text-sm">🔄</span>
                  <span>Login / Cek Akun Admin</span>
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Otomatis</span>
              </button>

              <a
                id="btn-menu-konsultasi"
                href="https://cdn.botpress.cloud/webchat/v3.6/shareable.html?configUrl=https://files.bpcontent.cloud/2025/09/25/07/20250925075110-TUJ9QG0T.json"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="w-full text-left py-3 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-between border hover:bg-emerald-50 border-emerald-100 bg-emerald-50/50 text-emerald-800 hover:border-emerald-200 cursor-pointer"
              >
                <span className="flex items-center space-x-2.5">
                  <span className="text-sm">💬</span>
                  <span>Konsultasi e-Kas AI</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full animate-pulse">Bot AI</span>
              </a>

              {!isPublicMode && currentUser.role !== 'Jemaah' && (
                <button
                  id="btn-menu-logout"
                  onClick={() => {
                    const jemaahUser: User = {
                      email: 'akun.lain@gmail.com',
                      nama: 'Akun Google Lain',
                      role: 'Jemaah',
                      status: 'Aktif',
                      tanggalDaftar: new Date().toISOString().slice(0, 10),
                    };
                    setCurrentUser(jemaahUser);
                    setIsPublicMode(false);
                    setIsMenuOpen(false);
                    showToast('Sesi Admin keluar. Simulasi terkunci aktif.', 'error');
                  }}
                  className="w-full text-left py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-between border hover:bg-rose-50 hover:border-rose-200 bg-white border-rose-100 text-rose-700 cursor-pointer"
                >
                  <span className="flex items-center space-x-2.5">
                    <span className="text-sm">🚪</span>
                    <span>Keluar Portal &amp; Kunci Sesi</span>
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">Simulasi Lock</span>
                </button>
              )}
            </div>

            <div className="pt-2 text-[10px] text-slate-400 text-center leading-relaxed">
              Tekan <b className="text-slate-600">Simulasi Lock</b> untuk menguji tampilan ketika akun terkunci gembok di smartphone jemaah.
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CHECK MODAL */}
      {showAdminLoginModal && (
        <div id="admin-check-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Verifikasi Keanggotaan DKM</h4>
              <button onClick={() => setShowAdminLoginModal(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-lg p-1 cursor-pointer">×</button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Fitur ini memicu pemeriksaan otomatis apakah email Google Anda telah terdaftar di database pengurus KasMasjid di Google Spreadsheet.
              </p>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Email Google Sesi Aktif</label>
                <input
                  type="email"
                  value={adminLoginEmail}
                  onChange={(e) => setAdminLoginEmail(e.target.value)}
                  placeholder="bukukassekolah@gmail.com"
                  className="w-full text-xs font-mono font-bold p-3 border border-slate-200 bg-slate-50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Gunakan <span className="font-bold text-emerald-700">bukukassekolah@gmail.com</span> atau email pengurus lainnya untuk simulasi login instan.
                </span>
              </div>

              <button
                id="btn-verify-database"
                onClick={handleVerifyAdminEmail}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>🔍 Cari di Basis Data &amp; Autologin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-16 bg-slate-900 text-slate-500 py-8 border-t border-slate-800 text-center text-xs animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-extrabold text-slate-400">🕌 <a href="https://landing.kasmasjid.web.id/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">KasMasjid</a> v1.0 — Bagian dari Ekosistem <a href="https://landing.e-kas.web.id" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">e-Kas</a></p>
          <p>Didesain secara khusus untuk Dewan Kemakmuran Masjid (DKM). Transparansi Keuangan Berbasis Syariah.</p>
          <p className="text-[10px] text-slate-600">© 2026 KasMasjid. Seluruh hak cipta dilindungi undang-undang.</p>
        </div>
      </footer>

    </div>
  );
}
