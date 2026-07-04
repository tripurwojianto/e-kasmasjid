/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KasMasuk, User, Kategori } from '../types';

interface KasMasukViewProps {
  currentUser: User;
  kasMasuk: KasMasuk[];
  onAdd: (data: Omit<KasMasuk, 'id' | 'inputOleh' | 'timestamp'>) => void;
  onDelete: (id: string) => void;
  categories: Kategori[];
}

export default function KasMasukView({
  currentUser,
  kasMasuk,
  onAdd,
  onDelete,
  categories,
}: KasMasukViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState('');
  const [buktiUrl, setBuktiUrl] = useState('');

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  const canWrite = currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Bendahara 1';
  const canDelete = currentUser.role === 'Super Admin';

  const masukCategories = categories.filter((c) => c.jenis === 'Masuk');

  // Set default category if not set
  React.useEffect(() => {
    if (masukCategories.length > 0 && !kategori) {
      setKategori(masukCategories[0].namaKategori);
    }
  }, [masukCategories, kategori]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    
    onAdd({
      tanggal,
      kategori: kategori || (masukCategories[0]?.namaKategori || 'Infak Umum'),
      keterangan,
      nominal: parseFloat(nominal),
      buktiUrl,
    });

    // Reset Form
    setKeterangan('');
    setNominal('');
    setBuktiUrl('');
    setShowForm(false);
  };

  const filteredData = kasMasuk.filter((item) => {
    const matchesSearch = item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterKategori === '' || item.kategori === filterKategori;
    return matchesSearch && matchesCategory;
  });

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div id="kas-masuk-view-root" className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Penerimaan Kas (Kas Masuk)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Hanya dapat dicatat oleh <span className="font-bold text-slate-700">Bendahara 1</span> & <span className="font-bold text-slate-700">Super Admin</span>.
          </p>
        </div>

        {canWrite ? (
          <button
            id="btn-tambah-kas-masuk"
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            {showForm ? 'Tutup Formulir ✕' : '📝 Catat Kas Masuk'}
          </button>
        ) : (
          <div className="bg-red-50 text-red-800 text-[11px] font-semibold px-3 py-2 rounded-xl border border-red-100">
            🔒 Fitur catat terkunci untuk peran Anda ({currentUser.role})
          </div>
        )}
      </div>

      {/* Write form if open and authorized */}
      {showForm && canWrite && (
        <form id="form-add-kas-masuk" onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm border-b pb-2">Formulir Catat Kas Masuk</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-masuk-tanggal" className="block text-xs font-bold text-slate-400 uppercase">Tanggal Penerimaan</label>
              <input
                id="input-masuk-tanggal"
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-masuk-kategori" className="block text-xs font-bold text-slate-400 uppercase">Kategori</label>
              <select
                id="input-masuk-kategori"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {masukCategories.map((cat) => (
                  <option key={cat.namaKategori} value={cat.namaKategori}>
                    {cat.namaKategori}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-masuk-nominal" className="block text-xs font-bold text-slate-400 uppercase">Nominal (Rupiah)</label>
              <input
                id="input-masuk-nominal"
                type="number"
                required
                min="100"
                placeholder="Contoh: 1500000"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-masuk-bukti" className="block text-xs font-bold text-slate-400 uppercase">Bukti Upload / Foto URL (Opsional)</label>
              <input
                id="input-masuk-bukti"
                type="text"
                placeholder="https://..."
                value={buktiUrl}
                onChange={(e) => setBuktiUrl(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-masuk-keterangan" className="block text-xs font-bold text-slate-400 uppercase">Keterangan / Deskripsi</label>
            <input
              id="input-masuk-keterangan"
              type="text"
              required
              placeholder="Contoh: Kotak amal Salat Jumat perdana Juni..."
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
              Simpan Transaksi Kas Masuk
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
              id="search-masuk"
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 focus:outline-none w-full font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span htmlFor="filter-masuk-kategori" className="text-xs text-slate-400 font-semibold uppercase">Filter Kategori:</span>
            <select
              id="filter-masuk-kategori"
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Kategori</option>
              {masukCategories.map((cat) => (
                <option key={cat.namaKategori} value={cat.namaKategori}>
                  {cat.namaKategori}
                </option>
              ))}
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
                <th className="p-4">Kategori</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4">Petugas</th>
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {item.keterangan}
                      {item.buktiUrl && (
                        <a
                          href={item.buktiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center text-[10px] text-emerald-600 hover:underline font-bold"
                        >
                          📎 Bukti
                        </a>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-emerald-700">
                      {formatRupiah(item.nominal)}
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[10px]">{item.inputOleh}</td>
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
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic font-semibold">
                    Tidak ada catatan transaksi kas masuk yang cocok.
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
