/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { KasMasuk, KasKeluar } from '../types';

interface PublicTransparansiViewProps {
  kasMasuk: KasMasuk[];
  kasKeluar: KasKeluar[];
  onAddDonation?: (amount: number, donorName: string, notes: string) => void;
}

export default function PublicTransparansiView({
  kasMasuk,
  kasKeluar,
  onAddDonation,
}: PublicTransparansiViewProps) {
  const [daysRange, setDaysRange] = useState<7 | 30>(30);
  const [loading, setLoading] = useState(false);

  // Donation Wizard States
  const [donationStep, setDonationStep] = useState<'form' | 'qris' | 'verifying' | 'success'>('form');
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState<number>(50000);
  const [customAmountStr, setCustomAmountStr] = useState('');
  const [donorNotes, setDonorNotes] = useState('');
  const [uniqueCode, setUniqueCode] = useState(0);
  const [countdown, setCountdown] = useState(300); // 5 mins in seconds
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('');

  // Countdown Timer for QRIS Validity
  useEffect(() => {
    if (donationStep !== 'qris') return;
    
    setCountdown(300); // reset to 5 mins
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [donationStep]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Verification Progress simulation
  useEffect(() => {
    if (donationStep !== 'verifying') return;

    setVerificationProgress(0);
    setVerificationStatus('Menghubungi Bank Issuer QRIS...');

    const interval = setInterval(() => {
      setVerificationProgress((prev) => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          // Trigger success!
          setTimeout(() => {
            const finalAmount = donationAmount + uniqueCode;
            if (onAddDonation) {
              onAddDonation(finalAmount, donorName.trim() || 'Hamba Allah', donorNotes.trim() || 'Sedekah Mandiri QRIS');
            }
            setDonationStep('success');
          }, 500);
          return 100;
        }

        // Update status messages at milestones
        if (next === 30) {
          setVerificationStatus('Mencocokkan tanda terima nominal unik...');
        } else if (next === 60) {
          setVerificationStatus('Memproses mutasi buku kas elektronik...');
        } else if (next === 85) {
          setVerificationStatus('Mengirimkan notifikasi ke DKM...');
        }

        return next;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [donationStep, donationAmount, uniqueCode, donorName, donorNotes, onAddDonation]);

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Policy info and Instructions on Left */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-slate-600 flex space-x-3 items-start shadow-sm">
            <span className="text-xl">🛡️</span>
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Kebijakan Privasi Mustahik</h5>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Demi menjaga kehormatan & privasi para penerima zakat fitrah, santunan anak yatim, dhuafa, dan keluarga fakir miskin, sistem KasMasjid otomatis mendeteksi kata kunci sensitif dan menyamarkan keterangan rincinya secara penuh secara server-side sebelum dikirimkan ke web jemaah.
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 text-emerald-950 flex space-x-3 items-start shadow-sm">
            <span className="text-xl">🕌</span>
            <div className="space-y-1">
              <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Umat Mendukung Masjid</h5>
              <p className="text-[11px] leading-relaxed text-emerald-700">
                Setiap rupiah infaq yang Anda salurkan akan segera tercatat secara transparan pada buku kas umum ini demi kenyamanan dan kepercayaan jemaah sekalian.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive QRIS Donation Wizard on Right */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md">
          {donationStep === 'form' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Sedekah Infaq QRIS
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Simulasi Instan</span>
              </div>

              <div className="space-y-3">
                {/* Donor Name Input */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Nama Donatur (Hamba Allah jika kosong)</label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Contoh: H. Ahmad Fauzi / Hamba Allah"
                    className="w-full text-xs font-semibold p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Donation Presets */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Pilih Nominal Sedekah</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10000, 25000, 50000, 100000, 250000, 500000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setDonationAmount(amount);
                          setCustomAmountStr('');
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition border ${
                          donationAmount === amount && !customAmountStr
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {formatRupiah(amount).replace(',00', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Input */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Nominal Kustom (Rp)</label>
                  <input
                    type="number"
                    value={customAmountStr}
                    onChange={(e) => {
                      setCustomAmountStr(e.target.value);
                      const parsed = parseInt(e.target.value, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        setDonationAmount(parsed);
                      }
                    }}
                    placeholder="Masukkan jumlah lain, misal: 15000"
                    className="w-full text-xs font-mono font-bold p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Short notes/Prayers */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Doa / Pesan Kebaikan (Optional)</label>
                  <textarea
                    rows={2}
                    value={donorNotes}
                    onChange={(e) => setDonorNotes(e.target.value)}
                    placeholder="Semoga membawa keberkahan keluarga, kesembuhan, kelancaran rezeki..."
                    className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (donationAmount < 1000) {
                    alert('Minimal donasi adalah Rp 1.000');
                    return;
                  }
                  // Generate unique code suffix to make QRIS simulation realistic (random 1-999)
                  setUniqueCode(Math.floor(1 + Math.random() * 99));
                  setDonationStep('qris');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer"
              >
                Lanjut ke QRIS Sedekah ➔
              </button>
            </div>
          )}

          {donationStep === 'qris' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Scan QRIS Pembayaran
                </span>
                <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded animate-pulse">
                  Sesi Aktif: {formatTime(countdown)}
                </span>
              </div>

              <div className="flex flex-col items-center">
                {/* Beautiful Mock QRIS Sticker Frame */}
                <div className="w-64 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  {/* QRIS Header */}
                  <div className="bg-[#1A3150] text-white p-3 text-center font-black tracking-widest text-lg border-b-2 border-red-500">
                    <span className="text-cyan-400">QR</span><span className="text-red-500">IS</span>
                    <div className="text-[8px] tracking-normal font-light text-slate-300">Quick Response Code Indonesian Standard</div>
                  </div>

                  {/* QR Image Area */}
                  <div className="p-4 bg-white flex flex-col items-center justify-center space-y-2">
                    <div className="text-[9px] font-black tracking-wider text-slate-500 uppercase">A.N. MASJID JAMI' AL-AMANAH</div>
                    <div className="p-2 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <img
                        src="/src/assets/images/qris_donation_qr_1783161083905.jpg"
                        alt="QRIS Donasi Masjid"
                        referrerPolicy="no-referrer"
                        className="w-40 h-40 object-contain rounded-lg"
                      />
                    </div>
                    <div className="text-[7px] font-semibold text-slate-400">NMID: ID102030405060</div>
                  </div>

                  {/* QRIS Footer with Payment Logo Simulator */}
                  <div className="bg-[#EAEAEA] py-2 px-3 border-t border-slate-200 flex justify-around items-center opacity-75">
                    <span className="text-[8px] font-extrabold text-slate-500">GPN</span>
                    <span className="text-[8px] font-extrabold text-sky-600">GoPay</span>
                    <span className="text-[8px] font-extrabold text-purple-600">OVO</span>
                    <span className="text-[8px] font-extrabold text-blue-600">DANA</span>
                    <span className="text-[8px] font-extrabold text-red-600">LinkAja</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Invoice / Billing Info */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Nama Donatur:</span>
                  <span className="font-extrabold text-slate-800">{donorName.trim() || 'Hamba Allah'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Nominal Dasar:</span>
                  <span className="font-bold text-slate-600">{formatRupiah(donationAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span className="font-semibold">Kode Unik Verifikasi:</span>
                  <span className="font-extrabold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">+{uniqueCode}</span>
                </div>
                <hr className="border-slate-200 my-1" />
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-800 font-black">TOTAL TRANSFER:</span>
                  <span className="text-sm font-black font-mono text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    {formatRupiah(donationAmount + uniqueCode)}
                  </span>
                </div>
                {donorNotes && (
                  <p className="text-[10px] text-slate-400 italic leading-relaxed border-t border-slate-200/50 pt-1">
                    "{donorNotes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDonationStep('form')}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition text-center cursor-pointer"
                >
                  ◀ Ubah
                </button>
                <button
                  type="button"
                  onClick={() => setDonationStep('verifying')}
                  className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow text-center cursor-pointer"
                >
                  Saya Sudah Bayar ➔
                </button>
              </div>
            </div>
          )}

          {donationStep === 'verifying' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              {/* Spinner */}
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800"></div>
                <span className="absolute text-lg">💰</span>
              </div>

              <div className="text-center space-y-1">
                <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider">Verifikasi Real-time</h5>
                <p className="text-xs text-slate-500 font-medium">{verificationStatus}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${verificationProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {donationStep === 'success' && (
            <div className="space-y-4 text-center">
              {/* Success Badge */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl shadow-inner text-emerald-800 animate-bounce">
                  ✓
                </div>
                <h5 className="font-black text-emerald-800 text-xs uppercase tracking-wider mt-2">Sedekah Diterima</h5>
                <p className="text-[10px] text-slate-400">Terima kasih atas infaq &amp; sedekah Anda</p>
              </div>

              {/* Mock Receipt */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 text-left text-xs font-mono space-y-2 relative overflow-hidden">
                {/* Decorative cutouts at top/bottom of receipt */}
                <div className="absolute top-0 left-0 right-0 h-1 flex justify-between">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-white rounded-full -mt-1"></div>
                  ))}
                </div>

                <div className="text-center font-extrabold text-slate-700 pt-2 pb-1 border-b border-dashed border-slate-200">
                  TANDA TERIMA RESMI (E-RECEIPT)
                  <div className="text-[8px] font-normal text-slate-400">KASMASJID DIGITAL DONATION</div>
                </div>

                <div className="space-y-1 text-slate-600 text-[11px] pt-1.5">
                  <div className="flex justify-between">
                    <span>No. Ref:</span>
                    <span className="font-bold text-slate-800">TX-QRIS-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span className="font-bold text-slate-800">{new Date().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Donatur:</span>
                    <span className="font-bold text-slate-800">{donorName.trim() || 'Hamba Allah'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-bold text-slate-800">QRIS E-Wallet</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kategori:</span>
                    <span className="font-bold text-slate-800">Infaq &amp; Sedekah</span>
                  </div>
                  {donorNotes && (
                    <div className="text-[10px] italic border-t border-slate-200/50 pt-1 text-slate-400">
                      Pesan: "{donorNotes}"
                    </div>
                  )}
                  <div className="border-t border-dashed border-slate-200 my-2 pt-2 flex justify-between items-center text-sm">
                    <span className="font-extrabold text-slate-800">TOTAL SEDEKAH:</span>
                    <span className="font-black text-emerald-800">{formatRupiah(donationAmount + uniqueCode)}</span>
                  </div>
                </div>

                <div className="text-center text-[9px] text-slate-400 border-t border-dashed border-slate-200 pt-2 pb-1">
                  ✓ Dana telah otomatis tercatat secara real-time pada buku kas umum jemaah di atas. Jazakumullah Khairan Katsiran.
                </div>
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={() => {
                  setDonationStep('form');
                  setDonorName('');
                  setDonorNotes('');
                  setCustomAmountStr('');
                  setDonationAmount(50000);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Infaq Lagi / Selesai
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
