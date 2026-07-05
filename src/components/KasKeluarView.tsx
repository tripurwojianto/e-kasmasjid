/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KasKeluar, User, Kategori } from '../types';

interface KasKeluarViewProps {
  currentUser: User;
  kasKeluar: KasKeluar[];
  onAdd: (data: Omit<KasKeluar, 'id' | 'inputOleh' | 'timestamp'>) => void;
  onDelete: (id: string) => void;
  categories: Kategori[];
}

export default function KasKeluarView({
  currentUser,
  kasKeluar,
  onAdd,
  onDelete,
  categories,
}: KasKeluarViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<KasKeluar | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState('');
  const [buktiUrl, setBuktiUrl] = useState('');
  const [sendWa, setSendWa] = useState(false);
  const [waTarget, setWaTarget] = useState('ketua');
  const [customPhone, setCustomPhone] = useState('');
  const [isSuggested, setIsSuggested] = useState(false);

  const PENGURUS_WA = [
    { key: 'ketua', nama: 'Ustadz Drs. H. Ahmad Fauzi (Ketua DKM)', phone: '6281234567890' },
    { key: 'sekretaris', nama: 'H. Syarifudin (Secerataris)', phone: '6281398765432' },
    { key: 'bendahara', nama: 'Ir. H. Bambang Susilo (Bendahara Umum)', phone: '6281122334455' },
  ];

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  const canWrite = currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || currentUser.role === 'Bendahara 2';
  const canDelete = currentUser.role === 'Super Admin';

  const keluarCategories = categories.filter((c) => c.jenis === 'Keluar');

  const handleKeteranganChange = (val: string) => {
    setKeterangan(val);
    const text = val.toLowerCase();

    // Map keywords to expected category names
    const rules = [
      { keywords: ['imam', 'muadzin', 'bilal', 'bisyarah'], category: 'Honor Imam' },
      { keywords: ['penceramah', 'ustadz', 'ustad', 'kyai', 'khotib', 'khutbah', 'kajian', 'pengajian', 'pembicara'], category: 'Honor Penceramah' },
      { keywords: ['marbot', 'bersih-bersih', 'petugas kebersihan'], category: 'Honor Marbot' },
      { keywords: ['konsumsi', 'makanan', 'minuman', 'snack', 'takjil', 'berbuka', 'kopi', 'teh', 'nasi', 'buah'], category: 'Konsumsi' },
      { keywords: ['listrik', 'pln', 'token', 'tagihan listrik', 'pulsa listrik'], category: 'Listrik' },
      { keywords: ['perawatan', 'renovasi', 'perbaikan', 'cat', 'semen', 'pipa', 'kran', 'ac', 'sound', 'speaker', 'lampu', 'bohlam', 'kabel', 'sapu', 'pel', 'sabun', 'pompa'], category: 'Perawatan' },
    ];

    let matched = false;
    for (const rule of rules) {
      if (rule.keywords.some(kw => text.includes(kw))) {
        const exists = keluarCategories.some(c => c.namaKategori === rule.category);
        if (exists) {
          setKategori(rule.category);
          setIsSuggested(true);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      setIsSuggested(false);
    }
  };

  // Set default category if not set
  React.useEffect(() => {
    if (keluarCategories.length > 0 && !kategori) {
      setKategori(keluarCategories[0].namaKategori);
    }
  }, [keluarCategories, kategori]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    onAdd({
      tanggal,
      kategori: kategori || (keluarCategories[0]?.namaKategori || 'Perawatan'),
      keterangan,
      nominal: parseFloat(nominal),
      buktiUrl,
    });

    // Handle WhatsApp Sending via Third-Party Link API
    if (sendWa) {
      let targetPhone = '';
      if (waTarget === 'custom') {
        targetPhone = customPhone;
      } else {
        const selected = PENGURUS_WA.find(p => p.key === waTarget);
        targetPhone = selected ? selected.phone : '';
      }

      if (targetPhone) {
        const formattedNominal = parseFloat(nominal).toLocaleString('id-ID');
        const message = `*🕌 NOTIFIKASI TRANSAKSI KAS MASJID 🕌*
_Masjid Agung KasMasjid_

*Tipe Transaksi:* KAS KELUAR (Penyaluran) ⚠️
*Tanggal:* ${tanggal}
*Kategori:* ${kategori || (keluarCategories[0]?.namaKategori || 'Perawatan')}
*Nominal:* Rp ${formattedNominal}
*Keterangan:* ${keterangan}
*Petugas:* ${currentUser.nama} (${currentUser.role})
*Status:* Berhasil Dicatat di Sistem

----------------------------------------
_Laporan transparansi dikirim otomatis melalui sistem manajemen keuangan KasMasjid (e-Kas)._`;

        const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
      }
    }

    // Reset Form
    setKeterangan('');
    setNominal('');
    setBuktiUrl('');
    setSendWa(false);
    setCustomPhone('');
    setIsSuggested(false);
    setShowForm(false);
  };

  const filteredData = kasKeluar.filter((item) => {
    const matchesSearch = item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterKategori === '' || item.kategori === filterKategori;
    return matchesSearch && matchesCategory;
  });

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div id="kas-keluar-view-root" className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Penyaluran Kas (Kas Keluar)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Hanya dapat dicatat oleh <span className="font-bold text-slate-700">Bendahara 2</span> & <span className="font-bold text-slate-700">Super Admin</span>.
          </p>
        </div>

        {canWrite ? (
          <button
            id="btn-tambah-kas-keluar"
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            {showForm ? 'Tutup Formulir ✕' : '📝 Catat Kas Keluar'}
          </button>
        ) : (
          <div className="bg-red-50 text-red-800 text-[11px] font-semibold px-3 py-2 rounded-xl border border-red-100">
            🔒 Fitur catat terkunci untuk peran Anda ({currentUser.role})
          </div>
        )}
      </div>

      {/* Write form if open and authorized */}
      {showForm && canWrite && (
        <form id="form-add-kas-keluar" onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm border-b pb-2">Formulir Catat Kas Keluar (Pengeluaran)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-keluar-tanggal" className="block text-xs font-bold text-slate-400 uppercase">Tanggal Pengeluaran</label>
              <input
                id="input-keluar-tanggal"
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-keluar-kategori" className="block text-xs font-bold text-slate-400 uppercase">Kategori Pengeluaran</label>
              <select
                id="input-keluar-kategori"
                value={kategori}
                onChange={(e) => {
                  setKategori(e.target.value);
                  setIsSuggested(false);
                }}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {keluarCategories.map((cat) => (
                  <option key={cat.namaKategori} value={cat.namaKategori}>
                    {cat.namaKategori}
                  </option>
                ))}
              </select>
              {isSuggested && (
                <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1.5 animate-pulse">
                  ✨ Kategori disarankan otomatis
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-keluar-nominal" className="block text-xs font-bold text-slate-400 uppercase">Nominal (Rupiah)</label>
              <input
                id="input-keluar-nominal"
                type="number"
                required
                min="100"
                placeholder="Contoh: 350000"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-keluar-bukti" className="block text-xs font-bold text-slate-400 uppercase">Bukti Upload / Kuitansi URL (Opsional)</label>
              <input
                id="input-keluar-bukti"
                type="text"
                placeholder="https://..."
                value={buktiUrl}
                onChange={(e) => setBuktiUrl(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-keluar-keterangan" className="block text-xs font-bold text-slate-400 uppercase">Keterangan / Deskripsi Penyaluran</label>
            <input
              id="input-keluar-keterangan"
              type="text"
              required
              placeholder="Contoh: Pembelian sabun pel, pembersih marbot..."
              value={keterangan}
              onChange={(e) => handleKeteranganChange(e.target.value)}
              className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* WhatsApp Notification Integration */}
          <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-4 space-y-3.5 mt-2">
            <div className="flex items-center space-x-2.5">
              <input
                id="chk-send-wa"
                type="checkbox"
                checked={sendWa}
                onChange={(e) => setSendWa(e.target.checked)}
                className="h-4 w-4 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="chk-send-wa" className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider cursor-pointer flex items-center gap-1.5 select-none">
                <span>💬 Kirim Ringkasan ke WhatsApp Pengurus</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded-full uppercase tracking-normal">Integrasi API</span>
              </label>
            </div>

            {sendWa && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 animate-fade-in">
                <div>
                  <label htmlFor="wa-target-select" className="block text-[10px] font-bold text-slate-400 uppercase">Pilih Pengurus Penerima</label>
                  <select
                    id="wa-target-select"
                    value={waTarget}
                    onChange={(e) => setWaTarget(e.target.value)}
                    className="mt-1.5 w-full text-xs font-semibold p-3 border border-slate-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                  >
                    {PENGURUS_WA.map((p) => (
                      <option key={p.key} value={p.key}>{p.nama}</option>
                    ))}
                    <option value="custom">✍️ Input No. WhatsApp Manual</option>
                  </select>
                </div>

                {waTarget === 'custom' && (
                  <div>
                    <label htmlFor="wa-custom-phone" className="block text-[10px] font-bold text-slate-400 uppercase">No. WhatsApp Penerima (Contoh: 628123xxx)</label>
                    <input
                      id="wa-custom-phone"
                      type="text"
                      required={waTarget === 'custom'}
                      placeholder="Masukkan No. WA, contoh: 628123456789"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      className="mt-1.5 w-full text-xs font-semibold p-3 border border-slate-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}
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
              Simpan Transaksi Kas Keluar
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
              id="search-keluar"
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 focus:outline-none w-full font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span htmlFor="filter-keluar-kategori" className="text-xs text-slate-400 font-semibold uppercase">Filter Kategori:</span>
            <select
              id="filter-keluar-kategori"
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Kategori</option>
              {keluarCategories.map((cat) => (
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
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
                          📎 Kuitansi
                        </a>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-red-600">
                      {formatRupiah(item.nominal)}
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[10px]">{item.inputOleh}</td>
                    <td className="p-4 text-center">
                      {canDelete ? (
                        <button
                          onClick={() => setDeleteItem(item)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer"
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
                    Tidak ada catatan transaksi kas keluar yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-fade-in text-left">
            <div className="flex items-center space-x-3 text-red-600">
              <span className="text-2xl">⚠️</span>
              <h4 className="font-extrabold text-base text-slate-900">Konfirmasi Hapus Transaksi</h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan transaksi pengeluaran kas ini? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 border border-slate-100 text-xs text-slate-700">
              <div className="flex justify-between"><span className="text-slate-400 font-semibold">ID Transaksi:</span> <span className="font-mono font-bold">{deleteItem.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-semibold">Tanggal:</span> <span className="font-semibold">{new Date(deleteItem.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-semibold">Kategori:</span> <span className="font-bold text-amber-700">{deleteItem.kategori}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-semibold">Keterangan:</span> <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">{deleteItem.keterangan}</span></div>
              <div className="flex justify-between border-t border-slate-200/60 pt-1.5 mt-1.5 font-bold"><span className="text-slate-900">Nominal:</span> <span className="font-mono text-red-600 font-black">{formatRupiah(deleteItem.nominal)}</span></div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deleteItem.id);
                  setDeleteItem(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
