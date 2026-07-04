/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, UserRole } from '../types';

interface RoleSimulatorProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  allUsers: User[];
  isPublicMode: boolean;
  onTogglePublicMode: (isPublic: boolean) => void;
}

export default function RoleSimulator({
  currentUser,
  onUserChange,
  allUsers,
  isPublicMode,
  onTogglePublicMode,
}: RoleSimulatorProps) {
  return (
    <div id="role-simulator-container" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-amber-950 p-2 rounded-xl text-lg">💡</div>
          <div>
            <h4 className="font-extrabold text-sm text-amber-950 uppercase tracking-wider">Simulator Peran (Role-Based Access Control)</h4>
            <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
              Uji batasan keamanan (segregation of duties) sesuai PRD dengan mengganti identitas login di bawah ini:
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Selector: Admin Panel vs Public (Tanpa Login) */}
          <div className="flex bg-amber-100 p-1 rounded-xl border border-amber-200">
            <button
              id="btn-mode-admin"
              onClick={() => onTogglePublicMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isPublicMode
                  ? 'bg-emerald-700 text-white shadow'
                  : 'text-amber-800 hover:bg-amber-200'
              }`}
            >
              🔐 Portal Pengurus (Internal)
            </button>
            <button
              id="btn-mode-public"
              onClick={() => onTogglePublicMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isPublicMode
                  ? 'bg-emerald-700 text-white shadow'
                  : 'text-amber-800 hover:bg-amber-200'
              }`}
            >
              📢 Halaman Jemaah (Publik)
            </button>
          </div>

          {!isPublicMode && (
            <div className="flex items-center space-x-2">
              <label htmlFor="user-select" className="text-xs font-semibold text-amber-800">Simulasikan Sesi:</label>
              <select
                id="user-select"
                value={currentUser.email}
                onChange={(e) => {
                  const selected = allUsers.find((u) => u.email === e.target.value);
                  if (selected) onUserChange(selected);
                }}
                className="bg-white border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {allUsers.map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.nama} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic Instruction banner depending on role */}
      {!isPublicMode && (
        <div className="mt-3 pt-3 border-t border-amber-200/50 text-[11px] text-amber-900 leading-normal space-y-1">
<<<<<<< HEAD
          <p className="font-extrabold text-amber-950 uppercase tracking-wider text-[10px]">Panduan Peran Pengurus &amp; Akses Sistem:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-1.5">
            <li className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
              <span className="font-bold text-emerald-800 block">1. Super Admin</span>
              <span className="text-slate-600 block mt-0.5">Bypass semua modul &amp; CRUD Penuh (Tanpa Kode GAS)</span>
            </li>
            <li className="bg-teal-50 border border-teal-100 p-2 rounded-xl">
              <span className="font-bold text-teal-800 block">👑 Owner</span>
              <span className="text-slate-600 block mt-0.5">Email bukukassekolah@gmail.com (Akses Kode GAS &amp; Deploy)</span>
            </li>
            <li className="bg-blue-50 border border-blue-100 p-2 rounded-xl">
              <span className="font-bold text-blue-800 block">3. Admin</span>
              <span className="text-slate-600 block mt-0.5">Bisa edit data bulanan jika bendahara berhalangan (Tanpa Kode)</span>
            </li>
            <li className="bg-purple-50 border border-purple-100 p-2 rounded-xl">
              <span className="font-bold text-purple-800 block">4. Sekretaris</span>
              <span className="text-slate-600 block mt-0.5">Mencatat rapat, usulan anggaran &amp; inventaris logistik</span>
            </li>
            <li className="bg-rose-50 border border-rose-100 p-2 rounded-xl">
              <span className="font-bold text-rose-800 block">5. Bendahara</span>
              <span className="text-slate-600 block mt-0.5">Mencatat transaksi keuangan kas masuk &amp; keluar harian</span>
            </li>
            <li className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
              <span className="font-bold text-amber-800 block">6. Ketua DKM</span>
              <span className="text-slate-600 block mt-0.5">Memantau seluruh laporan &amp; approval pengajuan anggaran</span>
=======
          <p className="font-extrabold text-amber-950 uppercase tracking-wider text-[10px]">Panduan Peran Pengurus:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-1.5">
            <li className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
              <span className="font-bold text-emerald-800 block">1. Super Admin</span>
              <span className="text-slate-600 block mt-0.5">Bisa akses source code</span>
            </li>
            <li className="bg-blue-50 border border-blue-100 p-2 rounded-xl">
              <span className="font-bold text-blue-800 block">2. Admin</span>
              <span className="text-slate-600 block mt-0.5">Bisa edit data masuk/keluar bulanan jika bendahara/sekretaris berhalangan. Tidak bisa akses kode GAS</span>
            </li>
            <li className="bg-purple-50 border border-purple-100 p-2 rounded-xl">
              <span className="font-bold text-purple-800 block">3. Sekretaris</span>
              <span className="text-slate-600 block mt-0.5">Mencatat administrasi &amp; logistik</span>
            </li>
            <li className="bg-rose-50 border border-rose-100 p-2 rounded-xl">
              <span className="font-bold text-rose-800 block">4. Bendahara</span>
              <span className="text-slate-600 block mt-0.5">Mencatat keuangan masuk &amp; keluar</span>
            </li>
            <li className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
              <span className="font-bold text-amber-800 block">5. Ketua DKM</span>
              <span className="text-slate-600 block mt-0.5">Memantau laporan &amp; approval</span>
>>>>>>> 5c0a7516461135a0c0f8f8c3448d54a199890e9a
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
