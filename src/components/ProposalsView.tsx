/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RapatPengajuan, User } from '../types';

interface ProposalsViewProps {
  currentUser: User;
  proposals: RapatPengajuan[];
  onAdd: (data: Omit<RapatPengajuan, 'id' | 'diajukanOleh' | 'timestamp'>) => void;
  onUpdateStatus: (id: string, newStatus: RapatPengajuan['status']) => void;
}

export default function ProposalsView({
  currentUser,
  proposals,
  onAdd,
  onUpdateStatus,
}: ProposalsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [estimasiBiaya, setEstimasiBiaya] = useState('');
  const [status, setStatus] = useState<RapatPengajuan['status']>('Draft');

  const canWrite = currentUser.role === 'Super Admin' || currentUser.role === 'Sekretaris';
  const canApprove = currentUser.role === 'Super Admin' || currentUser.role === 'Ketua DKM';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    onAdd({
      tanggal,
      judul,
      deskripsi,
      estimasiBiaya: parseFloat(estimasiBiaya),
      status,
    });

    // Reset Form
    setJudul('');
    setDeskripsi('');
    setEstimasiBiaya('');
    setStatus('Draft');
    setShowForm(false);
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div id="proposals-view-root" className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Hasil Rapat & Pengajuan Anggaran</h3>
          <p className="text-xs text-slate-500 mt-1">
            Sekretaris membuat draft, <span className="font-bold text-emerald-700">Ketua DKM</span> memiliki hak eksklusif untuk menyetujui anggaran.
          </p>
        </div>

        {canWrite ? (
          <button
            id="btn-tambah-proposal"
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            {showForm ? 'Tutup Formulir ✕' : '📝 Ajukan Proyek / Anggaran'}
          </button>
        ) : (
          <div className="bg-red-50 text-red-800 text-[11px] font-semibold px-3 py-2 rounded-xl border border-red-100">
            🔒 Pembuatan draf terkunci untuk peran Anda ({currentUser.role})
          </div>
        )}
      </div>

      {/* Proposal write form */}
      {showForm && canWrite && (
        <form id="form-add-proposal" onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm border-b pb-2">Formulir Rapat & Pengajuan Anggaran Baru</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-prop-tanggal" className="block text-xs font-bold text-slate-400 uppercase">Tanggal Usulan / Rapat</label>
              <input
                id="input-prop-tanggal"
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-prop-judul" className="block text-xs font-bold text-slate-400 uppercase">Nama Proyek / Pengadaan</label>
              <input
                id="input-prop-judul"
                type="text"
                required
                placeholder="Contoh: Pengadaan Mesin Pembersih Vakum (Vacuum)"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-prop-estimasi" className="block text-xs font-bold text-slate-400 uppercase">Estimasi Biaya Anggaran (Rupiah)</label>
              <input
                id="input-prop-estimasi"
                type="number"
                required
                min="1000"
                placeholder="Contoh: 2800000"
                value={estimasiBiaya}
                onChange={(e) => setEstimasiBiaya(e.target.value)}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-prop-status" className="block text-xs font-bold text-slate-400 uppercase">Alur Awal Pengajuan</label>
              <select
                id="input-prop-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RapatPengajuan['status'])}
                className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Draft">Simpan Sebagai Draft (Belum diajukan)</option>
                <option value="Diajukan">Diajukan langsung (Butuh Approval Ketua DKM)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="input-prop-deskripsi" className="block text-xs font-bold text-slate-400 uppercase">Deskripsi Detail Kebutuhan</label>
            <textarea
              id="input-prop-deskripsi"
              required
              rows={3}
              placeholder="Jelaskan spesifikasi, merek, kuantitas, dan urgensi pengadaan barang/proyek ini..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="mt-1 w-full text-xs font-semibold p-3 border border-slate-100 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            ></textarea>
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
              Simpan Usulan Anggaran
            </button>
          </div>
        </form>
      )}

      {/* Proposals list cards */}
      <div className="space-y-4">
        {proposals.length > 0 ? (
          proposals.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all hover:shadow"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 uppercase">
                    {item.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'Disetujui'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : item.status === 'Ditolak'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : item.status === 'Diajukan'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900">{item.judul}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.deskripsi}</p>
                
                <div className="text-[10px] text-slate-400 font-medium">
                  Diajukan oleh: <span className="text-slate-600">{item.diajukanOleh}</span> | Tanggal: {new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  {item.disetujuiOleh && (
                    <span className="block mt-1">
                      Disetujui oleh: <span className="text-emerald-700 font-bold">{item.disetujuiOleh}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex flex-col items-end justify-between min-w-[200px] border-t md:border-t-0 pt-4 md:pt-0">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Estimasi Anggaran</span>
                  <span className="text-xl font-mono font-black text-slate-800">{formatRupiah(item.estimasiBiaya)}</span>
                </div>

                {/* Transition Actions */}
                <div className="mt-3 flex gap-2">
                  {/* Draft -> Submit to Review (Sekretaris or Super Admin) */}
                  {item.status === 'Draft' && canWrite && (
                    <button
                      onClick={() => onUpdateStatus(item.id, 'Diajukan')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Ajukan ke Ketua DKM 🚀
                    </button>
                  )}

                  {/* Diajukan -> Approve/Reject (Ketua DKM or Super Admin) */}
                  {item.status === 'Diajukan' && canApprove && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(item.id, 'Disetujui')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Setujui ✓
                      </button>
                      <button
                        onClick={() => onUpdateStatus(item.id, 'Ditolak')}
                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Tolak ✗
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-400 italic font-semibold">
            Belum ada usulan anggaran proyek yang diajukan.
          </div>
        )}
      </div>
    </div>
  );
}
