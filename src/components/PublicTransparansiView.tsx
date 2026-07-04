/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { KasMasuk, KasKeluar } from '../types';

interface PublicTransparansiViewProps {
  kasMasuk: KasMasuk[];
  kasKeluar: KasKeluar[];
}

export default function PublicTransparansiView({
  kasMasuk,
  kasKeluar,
}: PublicTransparansiViewProps) {
  const [daysRange, setDaysRange] = useState<7 | 30>(30);
  const [loading, setLoading] = useState(false);

  // Simulate server-side filter and masking before sending data to client
  const reportData = useMemo(() => {
    // 1. Filter by days range
    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - daysRange);

    const combined: Array<{
      id: string;
      tanggal: string;
      kategori: string;
      keterangan: string;
      masuk: number;
      keluar: number;
      timestamp: string;
    }> = [];

    // Add Inflows
    kasMasuk.forEach((item) => {
      const itemDate = new Date(item.tanggal);
      if (itemDate >= filterDate) {
        combined.push({
          id: item.id,
          tanggal: item.tanggal,
          kategori: item.kategori,
          keterangan: item.keterangan,
          masuk: item.nominal,
          keluar: 0,
          timestamp: item.timestamp,
        });
      }
    });

    // Add Outflows
    kasKeluar.forEach((item) => {
      const itemDate = new Date(item.tanggal);
      if (itemDate >= filterDate) {
        combined.push({
          id: item.id,
          tanggal: item.tanggal,
          kategori: item.kategori,
          keterangan: item.keterangan,
          masuk: 0,
          keluar: item.nominal,
          timestamp: item.timestamp,
        });
      }
    });

    // 2. Sort by date and then by timestamp
    combined.sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime();
      const dateB = new Date(b.tanggal).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    // 3. SERVER-SIDE MASKING SIMULATION
    const sensitiveKeywords = [
      'bantuan', 'fakir', 'miskin', 'zakat fitrah', 
      'mustahik', 'dhuafa', 'santunan', 'anak yatim', 'yatim'
    ];

    const masked = combined.map((item) => {
      const lowerDesc = item.keterangan.toLowerCase();
      const containsSensitive = sensitiveKeywords.some((keyword) => lowerDesc.includes(keyword));
      
      let cleanKeterangan = item.keterangan;
      let cleanKategori = item.kategori;

      if (containsSensitive) {
        if (item.masuk > 0) {
          cleanKeterangan = 'Penerimaan Zakat / Dana Sosial Keumatan (Identitas Disamarkan)';
          cleanKategori = 'Zakat & Sosial';
        } else {
          cleanKeterangan = 'Penyaluran Bantuan Sosial Keumatan (Identitas Disamarkan)';
          cleanKategori = 'Sosial & Santunan';
        }
      }

      return {
        ...item,
        keterangan: cleanKeterangan,
        kategori: cleanKategori,
      };
    });

    // 4. Calculate running balance and initial previous balance
    let prevMasuk = 0;
    let prevKeluar = 0;

    kasMasuk.forEach((item) => {
      if (new Date(item.tanggal) < filterDate) prevMasuk += item.nominal;
    });

    kasKeluar.forEach((item) => {
      if (new Date(item.tanggal) < filterDate) prevKeluar += item.nominal;
    });

    let runningBalance = prevMasuk - prevKeluar;
    const saldoAwal = runningBalance;

    const reportWithRunningBalance = masked.map((item) => {
      runningBalance += (item.masuk - item.keluar);
      return {
        ...item,
        saldoBerjalan: runningBalance,
      };
    });

    const totalMasuk = reportWithRunningBalance.reduce((sum, item) => sum + item.masuk, 0);
    const totalKeluar = reportWithRunningBalance.reduce((sum, item) => sum + item.keluar, 0);

    return {
      saldoAwal,
      laporan: reportWithRunningBalance,
      totalMasuk,
      totalKeluar,
      saldoAkhir: runningBalance,
    };
  }, [kasMasuk, kasKeluar, daysRange]);

  const handleRangeChange = (range: 7 | 30) => {
    setLoading(true);
    setDaysRange(range);
    setTimeout(() => {
      setLoading(false);
    }, 400); // Small delay to show simulator processing
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div id="public-transparansi-view" className="space-y-6">
      {/* Simulation Info Header */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start space-x-3 text-emerald-950 shadow-inner">
        <span className="text-xl">📢</span>
        <div className="space-y-1">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900">Uji Coba Laporan Publik (Jemaah)</h4>
          <p className="text-xs leading-relaxed text-emerald-800">
            Berikut adalah representasi halaman <span className="font-mono font-bold">public.html</span> yang diakses oleh jemaah secara luas tanpa login. Perhatikan bagaimana deskripsi sensitif disamarkan secara otomatis di sisi server (backend simulator) demi melindungi marwah penerima sedekah.
          </p>
        </div>
      </div>

      {/* Stats Card and Controller */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 pb-5 gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Periode Buku Kas</span>
            <div className="flex space-x-2 mt-1">
              <button
                onClick={() => handleRangeChange(7)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  daysRange === 7
                    ? 'bg-emerald-800 text-white shadow'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => handleRangeChange(30)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  daysRange === 30
                    ? 'bg-emerald-800 text-white shadow'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                30 Hari Terakhir
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Koneksi Backend</span>
            <span className="inline-flex items-center space-x-1.5 mt-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Google Sheets Simulator (Real-time)</span>
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">SALDO AWAL PERIODE</span>
            <span className="text-lg font-black font-mono text-slate-700 mt-0.5 block">
              {formatRupiah(reportData.saldoAwal)}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">MUTASI KAS MASUK (+)</span>
            <span className="text-lg font-black font-mono text-emerald-700 mt-0.5 block">
              + {formatRupiah(reportData.totalMasuk)}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">MUTASI KAS KELUAR (-)</span>
            <span className="text-lg font-black font-mono text-red-600 mt-0.5 block">
              - {formatRupiah(reportData.totalKeluar)}
            </span>
          </div>
        </div>

        {/* Big Balance Box */}
        <div className="bg-emerald-800 text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center shadow-md">
          <div className="space-y-1 mb-4 sm:mb-0 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200 block">Saldo Kas Terkini (Milik Umat)</span>
            <h3 className="text-3xl font-black font-mono tracking-tight">{formatRupiah(reportData.saldoAkhir)}</h3>
          </div>
          <div className="text-xs text-emerald-100 text-center sm:text-right max-w-xs leading-relaxed opacity-90">
            Amanah jemaah dikelola secara akuntabel demi kemakmuran masjid dan kemaslahatan umat beragama.
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Buku Kas Masjid (Gabungan)</h4>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {reportData.laporan.length} Baris Transaksi
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-800"></div>
            <span className="ml-3 text-xs text-slate-500 font-semibold">Memproses masking server-side...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Keterangan / Deskripsi</th>
                  <th className="p-4 text-right">Pemasukan (+)</th>
                  <th className="p-4 text-right">Pengeluaran (-)</th>
                  <th className="p-4 text-right">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody>
                {/* Saldo Awal row */}
                <tr className="bg-slate-50/30 border-b border-slate-100 font-semibold">
                  <td className="p-4 text-slate-400">Mulai</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      SALDO AWAL
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 italic">Akumulasi saldo kas sebelum {daysRange} hari terakhir</td>
                  <td className="p-4 text-right text-slate-400 font-mono">-</td>
                  <td className="p-4 text-right text-slate-400 font-mono">-</td>
                  <td className="p-4 text-right font-mono font-black text-slate-700">
                    {formatRupiah(reportData.saldoAwal)}
                  </td>
                </tr>

                {reportData.laporan.length > 0 ? (
                  reportData.laporan.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                      <td className="p-4 whitespace-nowrap text-slate-500">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            item.masuk > 0
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}
                        >
                          {item.kategori}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800 block">{item.keterangan}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">{item.id}</span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-blue-600">
                        {item.masuk > 0 ? formatRupiah(item.masuk) : '-'}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-red-500">
                        {item.keluar > 0 ? formatRupiah(item.keluar) : '-'}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-slate-700">
                        {formatRupiah(item.saldoBerjalan)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic font-semibold">
                      Tidak ada transaksi kas dalam {daysRange} hari terakhir.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Donation Display and Policy Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policy info */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-slate-600 flex space-x-3 items-start shadow-inner">
          <span className="text-xl">🛡️</span>
          <div className="space-y-1">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kebijakan Privasi Mustahik</h5>
            <p className="text-xs leading-relaxed text-slate-500">
              Demi menjaga kehormatan & privasi para penerima zakat fitrah, santunan anak yatim, dhuafa, dan keluarga fakir miskin, sistem KasMasjid otomatis mendeteksi kata kunci sensitif dan menyamarkan keterangan rincinya secara penuh secara server-side sebelum dikirimkan ke web jemaah.
            </p>
          </div>
        </div>

        {/* QRIS card with the generated image */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Donasi & Sedekah Digital (QRIS)
          </span>

          <div className="p-2 border border-slate-100 rounded-2xl bg-slate-50/50 shadow-inner">
            <img
              src="/src/assets/images/qris_donation_qr_1783161083905.jpg"
              alt="QRIS Donasi Masjid"
              referrerPolicy="no-referrer"
              className="w-36 h-36 object-contain rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <h5 className="text-sm font-bold text-slate-900">QRIS Masjid Jami' Al-Amanah</h5>
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs">
              Scan QRIS di atas menggunakan m-Banking atau dompet digital (Gopay, OVO, Dana, LinkAja) Anda untuk sedekah langsung ke rekening DKM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
