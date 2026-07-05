/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { KasMasuk, KasKeluar, Postingan, User, Komentar, WelcomeBannerConfig } from '../types';
import { X, MessageSquare, Send, ShieldCheck, HelpCircle } from 'lucide-react';
import { WelcomeBanner } from './WelcomeBanner';

interface PublicTransparansiViewProps {
  kasMasuk: KasMasuk[];
  kasKeluar: KasKeluar[];
  postings?: Postingan[];
  onAddDonation?: (amount: number, donorName: string, notes: string) => void;
  onDonateCampaign?: (campaignTitle: string, targetAmount?: number) => void;
  currentUser?: User;
  isPublicMode?: boolean;
  onAddComment?: (postId: string, comment: Omit<Komentar, 'id' | 'timestamp' | 'tanggal'>) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  welcomeBannerConfig?: WelcomeBannerConfig;
}

export default function PublicTransparansiView({
  kasMasuk,
  kasKeluar,
  postings = [],
  onAddDonation,
  onDonateCampaign,
  currentUser,
  isPublicMode,
  onAddComment,
  onDeleteComment,
  welcomeBannerConfig,
}: PublicTransparansiViewProps) {
  const [daysRange, setDaysRange] = useState<7 | 30>(30);
  const [loading, setLoading] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState<Postingan | null>(null);

  // Comments System States
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [publicCommenterName, setPublicCommenterName] = useState('');

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

  const handleDonateCampaignLocal = (campaignTitle: string, targetAmount?: number) => {
    setDonorNotes(`Infaq Program: ${campaignTitle}`);
    setDonationStep('form');
    setTimeout(() => {
      const element = document.getElementById('public-donation-wizard');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

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

  // Calculate total donations and target across active campaign postings
  const fundraisingStats = useMemo(() => {
    const campaigns = postings.filter((p) => p.tipe === 'Ajakan Donasi');
    const totalCollected = campaigns.reduce((sum, p) => sum + (p.terkumpulDonasi || 0), 0);
    const totalTarget = campaigns.reduce((sum, p) => sum + (p.targetDonasi || 0), 0);
    const activeCount = campaigns.length;
    const completedCount = campaigns.filter(
      (p) => p.targetDonasi && p.targetDonasi > 0 && (p.terkumpulDonasi || 0) >= p.targetDonasi
    ).length;

    return {
      totalCollected,
      totalTarget,
      activeCount,
      completedCount,
    };
  }, [postings]);

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

      {/* Welcome Banner with Weekly Schedule */}
      {welcomeBannerConfig && (
        <WelcomeBanner config={welcomeBannerConfig} />
      )}

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

      {/* Kabar & Kegiatan Masjid Terbaru */}
      {postings && postings.length > 0 && (
        <div id="pengumuman" className="space-y-4 animate-fade-in scroll-mt-24">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <span className="text-lg">📢</span>
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Kabar &amp; Berita Masjid Terbaru</h4>
          </div>

          {/* Summary Section: Total Donasi Terkumpul */}
          {fundraisingStats.activeCount > 0 && (
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-850 to-emerald-800 text-white rounded-2xl p-5 border border-emerald-950/40 shadow-sm space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-700/40 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest block">
                    ✨ Ringkasan Dampak Kebaikan
                  </span>
                  <h5 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Total Infaq Penyaluran Program Dakwah &amp; Sosial
                  </h5>
                </div>
                <span className="bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-700/60 text-[10px] font-bold text-emerald-200">
                  💝 {fundraisingStats.completedCount} Selesai / {fundraisingStats.activeCount} Kampanye Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-800/50 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block">
                    Total Donasi Terkumpul (Umat)
                  </span>
                  <span className="text-lg font-black font-mono text-amber-300 mt-0.5 block">
                    {formatRupiah(fundraisingStats.totalCollected)}
                  </span>
                </div>

                <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-800/50 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block">
                    Total Kebutuhan Anggaran Target
                  </span>
                  <span className="text-lg font-black font-mono text-slate-100 mt-0.5 block">
                    {formatRupiah(fundraisingStats.totalTarget)}
                  </span>
                </div>

                <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-800/50 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block">
                    Persentase Ketercapaian Kumulatif
                  </span>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <div className="flex-1 bg-emerald-950/50 h-2 rounded-full overflow-hidden border border-emerald-850">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            fundraisingStats.totalTarget > 0
                              ? Math.min(100, Math.round((fundraisingStats.totalCollected / fundraisingStats.totalTarget) * 100))
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-black font-mono text-amber-300">
                      {fundraisingStats.totalTarget > 0
                        ? Math.min(100, Math.round((fundraisingStats.totalCollected / fundraisingStats.totalTarget) * 100))
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-800/30 text-[10px] text-emerald-100 leading-relaxed font-semibold">
                💝 <strong>Amanah &amp; Transparansi:</strong> Alhamdulillah, seluruh kontribusi infaq yang Anda salurkan otomatis terhitung dan ditampilkan secara aktual. Syiar dan dukungan kedermawanan jemaah sekalian sangat membantu mendanai pembangunan, dakwah sosial, dan kenyamanan ibadah di lingkungan Masjid Al-Amanah. Semoga bernilai pahala jariyah tanpa putus.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {postings.map((post) => {
              const isCampaign = post.tipe === 'Ajakan Donasi' && post.tautanDonasi;
              const hasProgress = isCampaign && post.targetDonasi && post.targetDonasi > 0;
              const percent = hasProgress && post.terkumpulDonasi
                ? Math.min(100, Math.round((post.terkumpulDonasi / post.targetDonasi!) * 100))
                : 0;
              const isGoalReached = hasProgress && (post.terkumpulDonasi || 0) >= post.targetDonasi!;

              return (
                <div
                  key={post.id}
                  className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden transition-all hover:shadow-md ${
                    post.tipe === 'Ajakan Donasi' ? 'border-l-4 border-l-emerald-600' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Badge & Meta */}
                    <div className="flex justify-between items-center text-[10px] flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                            post.tipe === 'Ajakan Donasi'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                              : post.tipe === 'Pengumuman'
                              ? 'bg-rose-50 text-rose-800 border-rose-100'
                              : post.tipe === 'Kegiatan'
                              ? 'bg-blue-50 text-blue-800 border-blue-100'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {post.tipe === 'Ajakan Donasi' ? '💝' : post.tipe === 'Pengumuman' ? '📢' : post.tipe === 'Kegiatan' ? '📅' : 'ℹ️'} {post.tipe}
                        </span>
                        {isCampaign && isGoalReached && (
                          <span className="px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-600 text-white border border-emerald-600 animate-pulse text-[9px] flex items-center gap-0.5">
                            ✅ Selesai
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-bold">{post.tanggal}</span>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h5
                        onClick={() => setSelectedPosting(post)}
                        className="font-extrabold text-slate-900 text-xs leading-snug cursor-pointer hover:text-emerald-700 transition-colors"
                      >
                        {post.judul}
                      </h5>
                      
                      {post.gambarUrl && (
                        <div
                          onClick={() => setSelectedPosting(post)}
                          className="w-full h-36 overflow-hidden rounded-xl border border-slate-150 cursor-pointer"
                        >
                          <img
                            src={post.gambarUrl}
                            alt={post.judul}
                            className="w-full h-full object-cover hover:scale-105 transition duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed whitespace-pre-wrap">
                        {post.konten.length > 150 ? (
                          <>
                            {post.konten.substring(0, 150)}...{' '}
                            <button
                              type="button"
                              onClick={() => setSelectedPosting(post)}
                              className="text-emerald-600 hover:text-emerald-700 hover:underline font-black focus:outline-none ml-1 cursor-pointer"
                            >
                              Baca Selengkapnya ➔
                            </button>
                          </>
                        ) : (
                          post.konten
                        )}
                      </p>
                    </div>

                    {/* Progress tracking for campaigns */}
                    {isCampaign && (
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-2 mt-2">
                        {isGoalReached && (
                          <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-950 rounded-lg p-2.5 text-[10px] font-bold mb-1">
                            🎉 <strong className="text-emerald-900">Alhamdulillah!</strong> Target terpenuhi (Selesai).
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400">TERKUMPUL:</span>
                          <span className="text-emerald-800 font-mono">{formatRupiah(post.terkumpulDonasi || 0)}</span>
                        </div>
                        {post.targetDonasi && post.targetDonasi > 0 && (
                          <>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isGoalReached ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                              <span>Target: {formatRupiah(post.targetDonasi)}</span>
                              <span>{percent}%</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Call to action & Share */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 mt-auto">
                    {isCampaign && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onDonateCampaign) {
                            onDonateCampaign(post.judul, post.targetDonasi);
                          } else {
                            handleDonateCampaignLocal(post.judul, post.targetDonasi);
                          }
                        }}
                        className={`w-full py-2 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer text-center ${
                          isGoalReached ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isGoalReached ? '💝 Salurkan Infaq Tambahan ➔' : '💝 Salurkan Infaq Dukungan Sekarang ➔'}
                      </button>
                    )}

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `*${post.tipe}: ${post.judul}*\n\n${
                          post.konten.length > 250 ? post.konten.substring(0, 250) + '...' : post.konten
                        }\n\n${
                          isCampaign
                            ? `*Target:* ${formatRupiah(post.targetDonasi || 0)}\n*Terkumpul:* ${formatRupiah(post.terkumpulDonasi || 0)}\n\n`
                            : ''
                        }Mari dukung dan syiarkan kegiatan Masjid kami. Selengkapnya di portal e-Kas:\n${window.location.href.split('#')[0]}#pengumuman`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer text-center"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-emerald-600 animate-pulse" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.688 2.043 14.218 1.019 12.008 1.019 6.574 1.019 2.15 5.39 2.146 10.82c-.001 1.737.457 3.432 1.328 4.931l-.1 1.714-1.636 5.969 6.136-1.614-.214-.132zM17.91 14.8c-.318-.16-1.884-.93-2.175-1.037-.291-.107-.504-.16-.715.16-.211.32-.818 1.037-1.003 1.25-.185.214-.37.24-.688.08-.319-.16-1.343-.495-2.558-1.582-.946-.844-1.585-1.887-1.771-2.207-.186-.32-.02-.493.14-.652.144-.143.319-.374.479-.56.16-.188.213-.32.319-.534.106-.214.053-.4-.027-.56-.08-.16-.715-1.722-.979-2.36-.258-.62-.519-.536-.715-.546-.185-.01-.397-.01-.61-.01-.212 0-.557.08-.848.4-.291.32-1.114 1.091-1.114 2.662 0 1.57 1.144 3.087 1.302 3.3.159.213 2.25 3.437 5.451 4.821.761.329 1.356.525 1.82.673.765.243 1.461.209 2.012.127.614-.093 1.884-.77 2.15-1.48.265-.71.265-1.32.185-1.44-.08-.12-.292-.2-.611-.36z" />
                      </svg>
                      <span>Bagikan ke WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        <div id="public-donation-wizard" className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md">
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

      {/* Modal Detail Postingan */}
      {selectedPosting && (
        <div
          id="posting-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSelectedPosting(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative max-h-[85vh] transition-all duration-300 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-wider border ${
                    selectedPosting.tipe === 'Ajakan Donasi'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                      : selectedPosting.tipe === 'Pengumuman'
                      ? 'bg-rose-50 text-rose-800 border-rose-100'
                      : selectedPosting.tipe === 'Kegiatan'
                      ? 'bg-blue-50 text-blue-800 border-blue-100'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {selectedPosting.tipe === 'Ajakan Donasi' ? '💝' : selectedPosting.tipe === 'Pengumuman' ? '📢' : selectedPosting.tipe === 'Kegiatan' ? '📅' : 'ℹ️'} {selectedPosting.tipe}
                </span>
                {selectedPosting.tipe === 'Ajakan Donasi' && selectedPosting.targetDonasi && (selectedPosting.terkumpulDonasi || 0) >= selectedPosting.targetDonasi && (
                  <span className="px-2.5 py-1 rounded-full font-black uppercase tracking-wider bg-emerald-600 text-white border border-emerald-600 text-[8px] flex items-center gap-0.5 animate-pulse">
                    ✅ Selesai
                  </span>
                )}
              </div>
              <button
                type="button"
                id="btn-close-modal"
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                onClick={() => setSelectedPosting(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">{selectedPosting.tanggal}</span>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">{selectedPosting.judul}</h4>
              </div>

              {selectedPosting.gambarUrl && (
                <div className="w-full rounded-2xl overflow-hidden border border-slate-150 bg-slate-50">
                  <img
                    src={selectedPosting.gambarUrl}
                    alt={selectedPosting.judul}
                    className="w-full h-auto max-h-64 object-contain mx-auto"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="text-[11px] sm:text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                {selectedPosting.konten}
              </div>

              {selectedPosting.tipe === 'Ajakan Donasi' && selectedPosting.tautanDonasi && (
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                  {selectedPosting.targetDonasi && selectedPosting.targetDonasi > 0 && (
                    <>
                      {/* Campaign details */}
                      { (selectedPosting.terkumpulDonasi || 0) >= selectedPosting.targetDonasi && (
                        <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-950 rounded-xl p-3 text-[10px] font-bold">
                          🎉 <strong className="text-emerald-900">Alhamdulillah!</strong> Target terpenuhi (Selesai).
                        </div>
                      )}
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">TERKUMPUL:</span>
                        <span className="text-emerald-800 font-mono text-xs sm:text-sm">
                          {formatRupiah(selectedPosting.terkumpulDonasi || 0)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            (selectedPosting.terkumpulDonasi || 0) >= selectedPosting.targetDonasi
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-emerald-600'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(((selectedPosting.terkumpulDonasi || 0) / selectedPosting.targetDonasi) * 100)
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Target: {formatRupiah(selectedPosting.targetDonasi)}</span>
                        <span>
                          {Math.min(
                            100,
                            Math.round(((selectedPosting.terkumpulDonasi || 0) / selectedPosting.targetDonasi) * 100)
                          )}
                          %
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Comments Section inside Detail Modal */}
              <div className="border-t border-slate-100 pt-5 mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-700 animate-pulse" />
                    Tanya Jawab &amp; Masukan Umat ({(postings.find(p => p.id === selectedPosting.id)?.komentar || []).length})
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    Interaktif
                  </span>
                </div>

                {/* List of comments */}
                {((postings.find(p => p.id === selectedPosting.id)?.komentar || []).length > 0) ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {(postings.find(p => p.id === selectedPosting.id)?.komentar || []).map((comment) => {
                      const isPengurus = comment.role !== 'Jemaah';
                      return (
                        <div key={comment.id} className="bg-slate-50 border border-slate-150 p-3 rounded-2xl space-y-1.5 text-xs">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-[11px]">{comment.nama}</span>
                              {isPengurus ? (
                                <span className="bg-emerald-800 text-white font-black text-[7px] uppercase tracking-widest px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> DKM
                                </span>
                              ) : (
                                <span className="bg-slate-200/80 text-slate-600 font-bold text-[7px] uppercase tracking-widest px-1 py-0.2 rounded border border-slate-200">
                                  Jemaah
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium font-mono">
                                • {comment.tanggal}
                              </span>
                            </div>

                            {/* Moderation Delete Icon: visible for registered pengurus */}
                            {currentUser && currentUser.role !== 'Jemaah' && !isPublicMode && onDeleteComment && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus masukan dari "${comment.nama}"?`)) {
                                    onDeleteComment(selectedPosting.id, comment.id);
                                  }
                                }}
                                className="p-0.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Hapus / Moderasi Masukan"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed break-words whitespace-pre-wrap">
                            {comment.konten}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-dashed border-slate-200 text-center text-slate-400 text-[10px] font-semibold italic flex items-center justify-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-slate-300 animate-bounce" />
                    <span>Belum ada tanggapan atau saran jemaah. Silakan tulis masukan Anda di bawah ini!</span>
                  </div>
                )}

                {/* Leave Comment Form */}
                {onAddComment && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const txt = commentInputs[selectedPosting.id] || '';
                      if (!txt.trim()) return;

                      // Decide author name and role
                      const isUserPengurus = currentUser && currentUser.role !== 'Jemaah' && !isPublicMode;
                      const authorName = isUserPengurus
                        ? currentUser.nama.split(' ')[0] || currentUser.nama
                        : publicCommenterName.trim() || 'Hamba Allah';
                      const authorRole = isUserPengurus ? currentUser.role : 'Jemaah';
                      const authorEmail = isUserPengurus ? currentUser.email : 'jemaah@masjid.org';

                      onAddComment(selectedPosting.id, {
                        nama: authorName,
                        email: authorEmail,
                        konten: txt.trim(),
                        role: authorRole,
                      });

                      // Reset states
                      setCommentInputs(prev => ({ ...prev, [selectedPosting.id]: '' }));
                      setPublicCommenterName('');
                    }}
                    className="bg-slate-50/50 border border-slate-150 rounded-2xl p-3.5 space-y-3.5 text-left"
                  >
                    <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-widest block">
                      📝 Tulis Masukan / Pertanyaan
                    </span>

                    <div className="space-y-2.5">
                      {/* Name input if guest */}
                      {!(currentUser && currentUser.role !== 'Jemaah' && !isPublicMode) && (
                        <div>
                          <input
                            type="text"
                            value={publicCommenterName}
                            onChange={(e) => setPublicCommenterName(e.target.value)}
                            placeholder="Nama Lengkap Anda (Contoh: Ahmad, Siti - Kosongkan jika Hamba Allah)"
                            className="w-full text-[11px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold text-slate-700 font-medium"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={commentInputs[selectedPosting.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [selectedPosting.id]: e.target.value }))}
                          placeholder={
                            currentUser && currentUser.role !== 'Jemaah' && !isPublicMode
                              ? `Tulis jawaban/tanggapan resmi DKM (${currentUser.nama.split(' ')[0]})...`
                              : "Ketik saran, pertanyaan, atau permohonan doa..."
                          }
                          className="flex-1 text-[11px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-slate-700"
                          required
                        />
                        <button
                          type="submit"
                          disabled={!(commentInputs[selectedPosting.id] || '').trim()}
                          className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 disabled:hover:bg-emerald-700 text-white rounded-xl transition duration-150 shadow-xs flex items-center justify-center cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
              {selectedPosting.tipe === 'Ajakan Donasi' && selectedPosting.tautanDonasi && (
                <button
                  type="button"
                  id="modal-btn-donate"
                  onClick={() => {
                    setSelectedPosting(null);
                    if (onDonateCampaign) {
                      onDonateCampaign(selectedPosting.judul, selectedPosting.targetDonasi);
                    } else {
                      handleDonateCampaignLocal(selectedPosting.judul, selectedPosting.targetDonasi);
                    }
                  }}
                  className={`w-full py-2.5 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer text-center ${
                    selectedPosting.targetDonasi && (selectedPosting.terkumpulDonasi || 0) >= selectedPosting.targetDonasi
                      ? 'bg-slate-600 hover:bg-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {selectedPosting.targetDonasi && (selectedPosting.terkumpulDonasi || 0) >= selectedPosting.targetDonasi
                    ? '💝 Salurkan Infaq Tambahan ➔'
                    : '💝 Salurkan Infaq Dukungan Sekarang ➔'}
                </button>
              )}

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `*${selectedPosting.tipe}: ${selectedPosting.judul}*\n\n${
                    selectedPosting.konten.length > 250
                      ? selectedPosting.konten.substring(0, 250) + '...'
                      : selectedPosting.konten
                  }\n\n${
                    selectedPosting.tipe === 'Ajakan Donasi' && selectedPosting.targetDonasi
                      ? `*Target:* ${formatRupiah(selectedPosting.targetDonasi || 0)}\n*Terkumpul:* ${formatRupiah(
                          selectedPosting.terkumpulDonasi || 0
                        )}\n\n`
                      : ''
                  }Mari dukung dan syiarkan kegiatan Masjid kami. Selengkapnya di portal e-Kas:\n${
                    window.location.href.split('#')[0]
                  }#pengumuman`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer text-center"
              >
                <svg className="w-3.5 h-3.5 fill-current text-emerald-600" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.688 2.043 14.218 1.019 12.008 1.019 6.574 1.019 2.15 5.39 2.146 10.82c-.001 1.737.457 3.432 1.328 4.931l-.1 1.714-1.636 5.969 6.136-1.614-.214-.132zM17.91 14.8c-.318-.16-1.884-.93-2.175-1.037-.291-.107-.504-.16-.715.16-.211.32-.818 1.037-1.003 1.25-.185.214-.37.24-.688.08-.319-.16-1.343-.495-2.558-1.582-.946-.844-1.585-1.887-1.771-2.207-.186-.32-.02-.493.14-.652.144-.143.319-.374.479-.56.16-.188.213-.32.319-.534.106-.214.053-.4-.027-.56-.08-.16-.715-1.722-.979-2.36-.258-.62-.519-.536-.715-.546-.185-.01-.397-.01-.61-.01-.212 0-.557.08-.848.4-.291.32-1.114 1.091-1.114 2.662 0 1.57 1.144 3.087 1.302 3.3.159.213 2.25 3.437 5.451 4.821.761.329 1.356.525 1.82.673.765.243 1.461.209 2.012.127.614-.093 1.884-.77 2.15-1.48.265-.71.265-1.32.185-1.44-.08-.12-.292-.2-.611-.36z" />
                </svg>
                <span>Bagikan ke WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
