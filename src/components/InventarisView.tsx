/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventarisLogistik, User } from '../types';

interface InventarisViewProps {
  currentUser: User;
  inventaris: InventarisLogistik[];
  onAdd: (data: Omit<InventarisLogistik, 'id' | 'inputOleh' | 'timestamp'>) => void;
  onDelete: (id: string) => void;
}

export default function InventarisView({
  currentUser,
  inventaris,
  onAdd,
  onDelete,
}: InventarisViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [namaBarang, setNamaBarang] = useState('');
  const [jenisLogistik, setJenisLogistik] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [kategori, setKategori] = useState('');
  const [volume, setVolume] = useState('');
  const [satuan, setSatuan] = useState('');
  const [sumberPeruntukan, setSumberPeruntukan] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState('');

  const canWrite = currentUser.role === 'Super Admin' || currentUser.role === 'Sekretaris';
  const canDelete = currentUser.role === 'Super Admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    onAdd({
      tanggal,
      namaBarang,
      jenisLogistik,
      kategori: kategori || 'Perlengkapan',
      volume: parseFloat(volume),
      satuan: satuan || 'Unit',
      sumberPeruntukan,
      keterangan,
    });

    // Reset Form
    setNamaBarang('');
    setVolume('');
    setSatuan('');
    setSumberPeruntukan('');
    setKeterangan('');
    setShowForm(false);
  };

  const filteredData = inventaris.filter((item) => {
    const matchesSearch = item.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJenis = filterJenis === '' || item.jenisLogistik === filterJenis;
    return matchesSearch && matchesJenis;
  });

  return (
    <div id="inventaris-view-root" className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Inventaris Logistik (Non-Keuangan)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Hanya dapat dicatat oleh <span className="font-bold text-slate-700">Sekretaris</span> & <span className="font-bold text-slate-700">Super Admin</span>.
          </p>
        </div>

        {canWrite ? (
          <button
            id="btn-tambah-inventaris"
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            {showForm ? 'Tutup Formulir ✕' : '📝 Catat Barang Baru'}
          </button>
        ) : (
          <div className="bg-red-50 text-red-800 text-[11px] font-semibold px-3 py-2 rounded-xl border border-red-100">
            🔒 Fitur catat terkunci untuk peran Anda ({currentUser.role})
          </div>
        )}
      </div>

      {/* Write form if open and authorized */}
      {showForm && canWrite && (
        <form id="form-add-inventaris" onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm border-b pb-2">Formulir Catat Logistik / Barang</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-inv-tanggal" className="block text-xs font-bold text-slate-400 uppercase">Tanggal Mutasi</label>
              <input
                id="input-inv-tanggal"
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-inv-nama" className="block text-xs font-bold text-slate-400 uppercase">Nama Barang</label>
              <input
                id="input-inv-nama"
                type="text"
                required
                placeholder="Contoh: Mushaf Al-Qur'an Rasm Usmani"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="input-inv-jenis" className="block text-xs font-bold text-slate-400 uppercase">Jenis Mutasi</label>
              <select
                id="input-inv-jenis"
                value={jenisLogistik}
                onChange={(e) => setJenisLogistik(e.target.value as 'Masuk' | 'Keluar')}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Masuk">Masuk (Penambahan)</option>
                <option value="Keluar">Keluar (Penyaluran/Pengurangan)</option>
              </select>
            </div>

            <div>
              <label htmlFor="input-inv-volume" className="block text-xs font-bold text-slate-400 uppercase">Kuantitas (Volume)</label>
              <input
                id="input-inv-volume"
                type="number"
                required
                min="0.1"
                step="any"
                placeholder="Contoh: 50"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-inv-satuan" className="block text-xs font-bold text-slate-400 uppercase">Satuan</label>
              <input
                id="input-inv-satuan"
                type="text"
                required
                placeholder="Contoh: Buku, Roll, Pcs"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-inv-kategori" className="block text-xs font-bold text-slate-400 uppercase">Kategori Barang</label>
              <input
                id="input-inv-kategori"
                type="text"
                placeholder="Contoh: Kitab Suci, Elektronik, Sarpras"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-inv-sumber" className="block text-xs font-bold text-slate-400 uppercase">Sumber / Peruntukan</label>
              <input
                id="input-inv-sumber"
                type="text"
                required
                placeholder="Contoh: Wakaf H. Ramli / Dibagikan gratis"
                value={sumberPeruntukan}
                onChange={(e) => setSumberPeruntukan(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-inv-keterangan" className="block text-xs font-bold text-slate-400 uppercase">Keterangan Spesifikasi</label>
            <input
              id="input-inv-keterangan"
              type="text"
              placeholder="Contoh: Ditempatkan di lemari tadarus utama..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
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
              Simpan Mutasi Barang
            </button>
          </div>
        </form>
      )}

      {/* Filters and List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex items-center space-x-2 w-full sm:max-w-xs">
            <span className="text-slate-400 text-xs">🔍</span>
            <input
              id="search-inventaris"
              type="text"
              placeholder="Cari nama barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 focus:outline-none w-full font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span htmlFor="filter-inv-jenis" className="text-xs text-slate-400 font-semibold uppercase">Filter Mutasi:</span>
            <select
              id="filter-inv-jenis"
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Mutasi</option>
              <option value="Masuk">Masuk (Penambahan)</option>
              <option value="Keluar">Keluar (Penyaluran)</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">ID</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Nama Barang</th>
                <th className="p-4">Jenis</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-center">Volume / Satuan</th>
                <th className="p-4">Sumber / Peruntukan</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-slate-500">{item.id}</td>
                    <td className="p-4 whitespace-nowrap font-medium text-slate-600">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 block">{item.namaBarang}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">{item.keterangan}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.jenisLogistik === 'Masuk'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {item.jenisLogistik}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{item.kategori}</td>
                    <td className="p-4 text-center font-bold text-slate-700 font-mono">
                      {item.volume} {item.satuan}
                    </td>
                    <td className="p-4 text-slate-600 italic text-[11px]">{item.sumberPeruntukan}</td>
                    <td className="p-4 text-center">
                      {canDelete ? (
                        <button
                          onClick={() => onDelete(item.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold transition"
                        >
                          Hapus
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">No Action</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic font-semibold">
                    Tidak ada catatan inventaris yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
