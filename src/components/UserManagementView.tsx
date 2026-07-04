/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserManagementViewProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (email: string) => void;
}

export default function UserManagementView({
  currentUser,
  users,
  onAddUser,
  onDeleteUser,
}: UserManagementViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState<UserRole>('Bendahara 1');

  const canManage = currentUser.role === 'Super Admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    onAddUser({
      email,
      nama,
      role,
      status: 'Aktif',
      tanggalDaftar: new Date().toISOString().split('T')[0],
    });

    // Reset Form
    setEmail('');
    setNama('');
    setRole('Bendahara 1');
    setShowForm(false);
  };

  return (
    <div id="user-management-view" className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Kelola Pengurus Masjid (DKM)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Hanya <span className="font-bold text-slate-700">Super Admin</span> yang memiliki wewenang mengelola akun pengurus.
          </p>
        </div>

        {canManage ? (
          <button
            id="btn-tambah-user"
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            {showForm ? 'Tutup Formulir ✕' : '👥 Tambah Pengurus Baru'}
          </button>
        ) : (
          <div className="bg-red-50 text-red-800 text-[11px] font-semibold px-3 py-2 rounded-xl border border-red-100">
            🔒 Fitur kelola pengurus terkunci untuk peran Anda ({currentUser.role})
          </div>
        )}
      </div>

      {/* Add User form if open & authorized */}
      {showForm && canManage && (
        <form id="form-add-user" onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm border-b pb-2">Daftarkan Pengurus Baru</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-user-email" className="block text-xs font-bold text-slate-400 uppercase">Email Google (Sesi Aktif)</label>
              <input
                id="input-user-email"
                type="email"
                required
                placeholder="nama@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-user-nama" className="block text-xs font-bold text-slate-400 uppercase">Nama Lengkap Pengurus</label>
              <input
                id="input-user-nama"
                type="text"
                required
                placeholder="Contoh: Drs. Syahrul Fauzi"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-user-role" className="block text-xs font-bold text-slate-400 uppercase">Peran / Hak Akses (Role)</label>
            <select
              id="input-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="Super Admin">Super Admin (Akses Penuh + Bypass)</option>
              <option value="Admin">Admin (Edit Transaksi Bulanan)</option>
              <option value="Bendahara 1">Bendahara 1 (Khusus Mencatat Kas Masuk)</option>
              <option value="Bendahara 2">Bendahara 2 (Khusus Mencatat Kas Keluar)</option>
              <option value="Sekretaris">Sekretaris (Kelola Logistik & Usul Anggaran)</option>
              <option value="Ketua DKM">Ketua DKM (Melihat Laporan & Approval Anggaran)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              Daftarkan Pengurus DKM
            </button>
          </div>
        </form>
      )}

      {/* User list table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Email Google</th>
                <th className="p-4">Nama Pengurus</th>
                <th className="p-4">Peran (Role)</th>
                <th className="p-4">Status</th>
                <th className="p-4">Tanggal Daftar</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.email} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-4 font-mono font-bold text-emerald-800">{item.email}</td>
                  <td className="p-4 font-bold text-slate-800">{item.nama}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {item.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{item.tanggalDaftar}</td>
                  <td className="p-4 text-center">
                    {canManage && item.email !== currentUser.email ? (
                      <button
                        onClick={() => onDeleteUser(item.email)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-bold transition"
                      >
                        Hapus Akun
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">No Action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
