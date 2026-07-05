import React, { useState, useMemo } from 'react';
import { KasMasuk, KasKeluar } from '../types';
import { Calendar, TrendingUp, TrendingDown, Wallet, ArrowRight, FileText, Search, Info, Printer } from 'lucide-react';

interface LaporanBulananViewProps {
  kasMasuk: KasMasuk[];
  kasKeluar: KasKeluar[];
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function LaporanBulananView({ kasMasuk, kasKeluar }: LaporanBulananViewProps) {
  // Generate all unique YYYY-MM months present in data, plus the current month as fallback
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    
    // Add current month by default
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentYearMonth);

    // Collect from kasMasuk
    kasMasuk.forEach(item => {
      if (item.tanggal && item.tanggal.length >= 7) {
        monthsSet.add(item.tanggal.substring(0, 7));
      }
    });

    // Collect from kasKeluar
    kasKeluar.forEach(item => {
      if (item.tanggal && item.tanggal.length >= 7) {
        monthsSet.add(item.tanggal.substring(0, 7));
      }
    });

    // Convert to array and sort descending
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [kasMasuk, kasKeluar]);

  // Selected Month state (defaults to the latest month available)
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || '');

  // Search filter for transactions inside the report
  const [searchTerm, setSearchTerm] = useState('');

  // Format YYYY-MM to human readable Indonesian month ("Juli 2026")
  const formatMonthName = (yearMonth: string) => {
    if (!yearMonth || yearMonth.length < 7) return yearMonth;
    const [year, monthStr] = yearMonth.split('-');
    const monthIndex = parseInt(monthStr, 10) - 1;
    const monthName = INDONESIAN_MONTHS[monthIndex] || monthStr;
    return `${monthName} ${year}`;
  };

  // Filter transactions for the selected month
  const filteredMasuk = useMemo(() => {
    return kasMasuk.filter(item => item.tanggal && item.tanggal.startsWith(selectedMonth));
  }, [kasMasuk, selectedMonth]);

  const filteredKeluar = useMemo(() => {
    return kasKeluar.filter(item => item.tanggal && item.tanggal.startsWith(selectedMonth));
  }, [kasKeluar, selectedMonth]);

  // Statistics
  const totalMasuk = useMemo(() => {
    return filteredMasuk.reduce((sum, item) => sum + item.nominal, 0);
  }, [filteredMasuk]);

  const totalKeluar = useMemo(() => {
    return filteredKeluar.reduce((sum, item) => sum + item.nominal, 0);
  }, [filteredKeluar]);

  const saldoBulanan = totalMasuk - totalKeluar;

  // Category breakdown for selected month
  const kategoriMasukSummary = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMasuk.forEach(item => {
      map[item.kategori] = (map[item.kategori] || 0) + item.nominal;
    });
    return Object.entries(map).map(([kategori, total]) => ({ kategori, total })).sort((a, b) => b.total - a.total);
  }, [filteredMasuk]);

  const kategoriKeluarSummary = useMemo(() => {
    const map: Record<string, number> = {};
    filteredKeluar.forEach(item => {
      map[item.kategori] = (map[item.kategori] || 0) + item.nominal;
    });
    return Object.entries(map).map(([kategori, total]) => ({ kategori, total })).sort((a, b) => b.total - a.total);
  }, [filteredKeluar]);

  // Combined and sorted transactions list for details table
  const combinedTransactions = useMemo(() => {
    const masukList = filteredMasuk.map(item => ({
      ...item,
      tipe: 'Masuk' as const,
    }));
    const keluarList = filteredKeluar.map(item => ({
      ...item,
      tipe: 'Keluar' as const,
      donatur: undefined
    }));
    
    return [...masukList, ...keluarList]
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .filter(item => {
        const term = searchTerm.toLowerCase();
        return (
          item.keterangan.toLowerCase().includes(term) ||
          item.kategori.toLowerCase().includes(term) ||
          (item.donatur && item.donatur.toLowerCase().includes(term)) ||
          item.nominal.toString().includes(term)
        );
      });
  }, [filteredMasuk, filteredKeluar, searchTerm]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up blocker Anda dinonaktifkan.');
      return;
    }

    const monthName = formatMonthName(selectedMonth);
    const currentDate = new Date().toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    // Build categories summary markup
    const kategoriMasukHtml = kategoriMasukSummary.length === 0
      ? '<tr><td colspan="3" class="text-center py-4 text-slate-400">Tidak ada pemasukan</td></tr>'
      : kategoriMasukSummary.map(({ kategori, total }) => {
          const percentage = totalMasuk > 0 ? (total / totalMasuk) * 100 : 0;
          return `
            <tr class="border-b border-slate-100">
              <td class="py-2 px-3 font-semibold text-slate-700">${kategori}</td>
              <td class="py-2 px-3 text-right font-bold text-slate-800">Rp ${total.toLocaleString('id-ID')}</td>
              <td class="py-2 px-3 text-right text-slate-500 font-medium">${percentage.toFixed(1)}%</td>
            </tr>
          `;
        }).join('');

    const kategoriKeluarHtml = kategoriKeluarSummary.length === 0
      ? '<tr><td colspan="3" class="text-center py-4 text-slate-400">Tidak ada pengeluaran</td></tr>'
      : kategoriKeluarSummary.map(({ kategori, total }) => {
          const percentage = totalKeluar > 0 ? (total / totalKeluar) * 100 : 0;
          return `
            <tr class="border-b border-slate-100">
              <td class="py-2 px-3 font-semibold text-slate-700">${kategori}</td>
              <td class="py-2 px-3 text-right font-bold text-slate-800">Rp ${total.toLocaleString('id-ID')}</td>
              <td class="py-2 px-3 text-right text-slate-500 font-medium">${percentage.toFixed(1)}%</td>
            </tr>
          `;
        }).join('');

    // Build detailed transactions markup
    const transactionsHtml = combinedTransactions.length === 0
      ? '<tr><td colspan="6" class="text-center py-6 text-slate-400">Belum ada transaksi</td></tr>'
      : combinedTransactions.map((item, index) => {
          return `
            <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition">
              <td class="py-2.5 px-3 text-slate-500 font-mono text-[11px]">${index + 1}</td>
              <td class="py-2.5 px-3 text-slate-600 font-mono text-[11px]">${item.tanggal}</td>
              <td class="py-2.5 px-3 font-semibold text-slate-700">${item.id} <span class="text-[9px] text-slate-400">(${item.tipe})</span></td>
              <td class="py-2.5 px-3 font-bold text-slate-800">${item.kategori}</td>
              <td class="py-2.5 px-3 text-slate-600 text-xs">
                ${item.keterangan}
                ${item.tipe === 'Masuk' ? `<span class="text-[9px] text-slate-400 block mt-0.5">Donatur: ${item.donatur || 'Hamba Allah'}</span>` : ''}
              </td>
              <td class="py-2.5 px-3 text-right font-extrabold ${item.tipe === 'Masuk' ? 'text-emerald-600' : 'text-rose-600'}">
                ${item.tipe === 'Masuk' ? '+' : '-'} Rp ${item.nominal.toLocaleString('id-ID')}
              </td>
            </tr>
          `;
        }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan Keuangan Bulanan - ${monthName}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
          @media print {
            body {
              background-color: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            .print-border {
              border: 1px solid #e2e8f0 !important;
            }
            tr {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-800 p-8">
        <!-- Control Bar for screen viewing -->
        <div class="no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <span class="text-xl">🖨️</span>
            <div>
              <h4 class="font-bold text-xs text-slate-800">Pratinjau Cetak Laporan</h4>
              <p class="text-[10px] text-slate-400">Gunakan tombol cetak atau simpan ke PDF di sebelah kanan.</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="window.close()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">
              Tutup
            </button>
            <button onclick="window.print()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer">
              Cetak Sekarang / Save PDF
            </button>
          </div>
        </div>

        <!-- Printable Report Layout -->
        <div class="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl border border-slate-200/80 shadow-md print-border print:shadow-none print:border-none print:p-0">
          
          <!-- Mosque Header -->
          <div class="text-center border-b-2 border-emerald-800 pb-5 mb-6 relative">
            <div class="text-2xl font-black text-slate-900 tracking-tight uppercase">DEWAN KEMAKMURAN MASJID (DKM)</div>
            <div class="text-3xl font-extrabold text-emerald-700 tracking-tight mt-1">MASJID AGUNG KASMASJID</div>
            <div class="text-xs text-slate-500 font-medium tracking-wide mt-1">Alamat: Jl. Raya Masjid Agung No. 1, Kota Madani • Telp: (021) 12345678 • Email: dkm@masjidagung.org</div>
          </div>

          <!-- Document Info -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-6">
            <div>
              <h1 class="text-xl font-black text-slate-900 uppercase tracking-tight">LAPORAN REKAPITULASI KEUANGAN</h1>
              <p class="text-sm font-bold text-emerald-700 mt-0.5">Periode Bulan: ${monthName}</p>
            </div>
            <div class="text-right text-xs text-slate-500 font-medium">
              <div>Tanggal Cetak: <span class="font-bold text-slate-700">${currentDate}</span></div>
              <div>Dicetak Oleh: <span class="font-bold text-slate-700">Sistem KasMasjid</span></div>
            </div>
          </div>

          <!-- SUMMARY FIGURES -->
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Total Pemasukan</span>
              <span class="text-lg font-black text-emerald-700 block mt-1">Rp ${totalMasuk.toLocaleString('id-ID')}</span>
              <span class="text-[9px] text-emerald-600 block mt-0.5">${filteredMasuk.length} Transaksi</span>
            </div>
            <div class="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <span class="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Total Pengeluaran</span>
              <span class="text-lg font-black text-rose-700 block mt-1">Rp ${totalKeluar.toLocaleString('id-ID')}</span>
              <span class="text-[9px] text-rose-600 block mt-0.5">${filteredKeluar.length} Pengeluaran</span>
            </div>
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span class="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">Sisa Saldo Kas</span>
              <span class="text-lg font-black text-slate-900 block mt-1">Rp ${saldoBulanan.toLocaleString('id-ID')}</span>
              <span class="text-[9px] text-slate-500 block mt-0.5 font-semibold">${saldoBulanan >= 0 ? 'Surplus Kas' : 'Defisit Kas'}</span>
            </div>
          </div>

          <!-- CATEGORY SUMMARIES -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Pemasukan -->
            <div class="border border-slate-200 rounded-2xl p-4">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 border-b pb-1.5 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Ringkasan Pemasukan per Kategori
              </h3>
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-slate-400 font-bold border-b border-slate-100 text-[10px] text-left uppercase">
                    <th class="pb-1">Kategori</th>
                    <th class="pb-1 text-right">Total</th>
                    <th class="pb-1 text-right">Persen</th>
                  </tr>
                </thead>
                <tbody>
                  ${kategoriMasukHtml}
                </tbody>
              </table>
            </div>

            <!-- Pengeluaran -->
            <div class="border border-slate-200 rounded-2xl p-4">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 border-b pb-1.5 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                Ringkasan Pengeluaran per Kategori
              </h3>
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-slate-400 font-bold border-b border-slate-100 text-[10px] text-left uppercase">
                    <th class="pb-1">Kategori</th>
                    <th class="pb-1 text-right">Total</th>
                    <th class="pb-1 text-right">Persen</th>
                  </tr>
                </thead>
                <tbody>
                  ${kategoriKeluarHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- DETAILED TRANSACTIONS TABLE -->
          <div class="mb-10">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              📋 Detail Transaksi Arus Kas Bulanan
            </h3>
            <div class="border border-slate-200 rounded-2xl overflow-hidden">
              <table class="w-full text-left text-xs">
                <head class="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th class="py-2 px-3 w-10">No</th>
                    <th class="py-2 px-3 w-24">Tanggal</th>
                    <th class="py-2 px-3 w-28">Kode/Tipe</th>
                    <th class="py-2 px-3 w-36">Kategori</th>
                    <th class="py-2 px-3">Keterangan / Detail</th>
                    <th class="py-2 px-3 text-right w-32">Nominal</th>
                  </tr>
                </head>
                <tbody>
                  ${transactionsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- SIGNATURES SECTION -->
          <div class="mt-16 grid grid-cols-2 text-center text-xs">
            <div>
              <p class="text-slate-500">Mengetahui,</p>
              <p class="font-extrabold text-slate-800 mt-1 uppercase">Ketua DKM Masjid KasMasjid</p>
              <div class="h-16"></div>
              <p class="font-extrabold text-slate-800 underline">Ustadz Drs. H. Ahmad Fauzi</p>
              <p class="text-[10px] text-slate-400 mt-0.5">NIP: DKM-KA.01.2025</p>
            </div>
            <div>
              <p class="text-slate-500">Dibuat Oleh,</p>
              <p class="font-extrabold text-slate-800 mt-1 uppercase">Bendahara Utama</p>
              <div class="h-16"></div>
              <p class="font-extrabold text-slate-800 underline">Ir. H. Bambang Susilo, MBA</p>
              <p class="text-[10px] text-slate-400 mt-0.5">NIP: DKM-BD.02.2025</p>
            </div>
          </div>

          <!-- FOOTER INTEGRITY -->
          <div class="mt-16 pt-5 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Laporan ini dibuat dan ditandatangani secara otomatis menggunakan Sistem Administrasi Transparansi KasMasjid.
            <br/>
            Masjid KasMasjid berkomitmen menjaga integritas syariah, transparansi, dan akuntabilitas dana umat.
          </div>

        </div>

        <!-- Auto-trigger print dialog when document loads -->
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 600);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in" id="laporan-bulanan-container">
      {/* Title & Selector Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Laporan Rekapitulasi Keuangan Bulanan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analisis transparansi arus kas masuk, keluar, dan sisa saldo operasional per bulan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <div className="flex items-center space-x-2">
            <label htmlFor="month-selector" className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Pilih Bulan:
            </label>
            <select
              id="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold p-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none text-slate-700 cursor-pointer hover:bg-slate-100 transition"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {formatMonthName(month)}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-cetak-laporan"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total Pemasukan</span>
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp className="w-4 h-4 text-emerald-100" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight">
              Rp {totalMasuk.toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-emerald-100/90 font-medium">
              Terdiri dari {filteredMasuk.length} transaksi di bulan ini
            </p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <TrendingDown className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Total Pengeluaran</span>
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingDown className="w-4 h-4 text-rose-100" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight">
              Rp {totalKeluar.toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-rose-100/90 font-medium">
              Terdiri dari {filteredKeluar.length} pengeluaran operasional
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <div className={`bg-gradient-to-br ${saldoBulanan >= 0 ? 'from-slate-800 to-slate-900' : 'from-amber-600 to-red-700'} rounded-3xl p-6 text-white shadow-md relative overflow-hidden group`}>
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Sisa Saldo Bulanan</span>
            <div className="p-2 bg-white/20 rounded-xl">
              <Wallet className="w-4 h-4 text-slate-200" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight">
              Rp {saldoBulanan.toLocaleString('id-ID')}
            </h3>
            <p className="text-[11px] text-slate-200/90 font-medium">
              {saldoBulanan >= 0 
                ? 'Arus kas surplus (aman & produktif)' 
                : 'Arus kas defisit untuk bulan berjalan'}
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY BREAKDOWNS SIDE BY SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Pemasukan */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Rincian Pemasukan per Kategori
          </h3>
          {kategoriMasukSummary.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              Tidak ada catatan pemasukan pada bulan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {kategoriMasukSummary.map(({ kategori, total }) => {
                const percentage = totalMasuk > 0 ? (total / totalMasuk) * 100 : 0;
                return (
                  <div key={kategori} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">{kategori}</span>
                      <span className="text-slate-800">
                        Rp {total.toLocaleString('id-ID')}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kategori Pengeluaran */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Rincian Pengeluaran per Kategori
          </h3>
          {kategoriKeluarSummary.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              Tidak ada catatan pengeluaran pada bulan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {kategoriKeluarSummary.map(({ kategori, total }) => {
                const percentage = totalKeluar > 0 ? (total / totalKeluar) * 100 : 0;
                return (
                  <div key={kategori} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">{kategori}</span>
                      <span className="text-slate-800">
                        Rp {total.toLocaleString('id-ID')}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-rose-500 to-orange-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DETAILED TRANSACTIONS LIST */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header Section */}
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              Arus Kas Detail Bulan {formatMonthName(selectedMonth)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Menampilkan {combinedTransactions.length} transaksi yang terdaftar pada bulan ini.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs p-2.5 pl-9 border border-slate-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Table representation */}
        {combinedTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            {searchTerm ? 'Tidak ada hasil pencarian yang cocok.' : 'Belum ada data arus kas untuk bulan terpilih.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Kode / Tipe</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Keterangan / Donatur</th>
                  <th className="p-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {combinedTransactions.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 text-slate-500 whitespace-nowrap">{item.tanggal}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.tipe === 'Masuk' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {item.id} • {item.tipe}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-bold">{item.kategori}</td>
                    <td className="p-4 text-slate-600">
                      <div>
                        <span>{item.keterangan}</span>
                        {item.tipe === 'Masuk' && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Donatur: <span className="font-semibold text-slate-600">{item.donatur || 'Hamba Allah'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-black text-sm ${
                        item.tipe === 'Masuk' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {item.tipe === 'Masuk' ? '+' : '-'} Rp {item.nominal.toLocaleString('id-ID')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SHARIA INTEGRITY NOTICE */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 flex items-start space-x-3">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <h4 className="font-extrabold text-emerald-900 uppercase tracking-wide">Prinsip Akuntabilitas Transparansi Syariah</h4>
          <p className="text-emerald-700 mt-1 leading-relaxed font-semibold">
            Laporan bulanan ini diproduksi secara real-time berdasarkan data buku kas masuk dan buku kas keluar DKM. Seluruh donasi yang diamanahkan melalui QRIS maupun tunai disajikan secara utuh sebagai bentuk pertanggungjawaban kepada jemaah dan Allah Subhanahu wa Ta'ala.
          </p>
        </div>
      </div>
    </div>
  );
}
