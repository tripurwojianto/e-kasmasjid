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
    return saved ? JSON.parse(saved) : initialKasMasuk;
  });

  const [kasKeluar, setKasKeluar] = useState<KasKeluar[]>(() => {
    const saved = localStorage.getItem('kasmasjid_keluar');
    return saved ? JSON.parse(saved) : initialKasKeluar;
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
    return saved ? JSON.parse(saved) : initialKategori;
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

  // Active Tab for Admin Portal
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'masuk' | 'keluar' | 'logistik' | 'rapat' | 'users' | 'export'>('ringkasan');

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

  return (
    <div id="app-container" className="min-h-screen bg-slate-50 text-slate-800">
      
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
          <PublicTransparansiView
            kasMasuk={kasMasuk}
            kasKeluar={kasKeluar}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            
            {/* PORTAL NAVIGATION TAB SELECTOR */}
            <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto pb-1.5">
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

              {currentUser.email.toLowerCase() === 'bukukassekolah@gmail.com' && (
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

              {activeTab === 'export' && currentUser.email.toLowerCase() === 'bukukassekolah@gmail.com' && (
                <ExportCenterView
                  kasMasuk={kasMasuk}
                  kasKeluar={kasKeluar}
                  inventaris={inventaris}
                  proposals={proposals}
                />
              )}
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-16 bg-slate-900 text-slate-500 py-8 border-t border-slate-800 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-extrabold text-slate-400">🕌 KasMasjid v1.0 — Bagian dari Ekosistem e-Kas / KulinaSystem</p>
          <p>Didesain secara khusus untuk Dewan Kemakmuran Masjid (DKM). Transparansi Keuangan Berbasis Syariah.</p>
          <p className="text-[10px] text-slate-600">© 2026 KasMasjid. Seluruh hak cipta dilindungi undang-undang.</p>
        </div>
      </footer>

    </div>
  );
}
