/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KasMasuk, KasKeluar, InventarisLogistik, RapatPengajuan, WelcomeBannerConfig } from '../types';
import { Heart, TrendingUp, Users, ArrowUpRight, DollarSign } from 'lucide-react';
import { WelcomeBanner, WelcomeBannerEditor } from './WelcomeBanner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';

interface DashboardViewProps {
  kasMasuk: KasMasuk[];
  kasKeluar: KasKeluar[];
  inventaris: InventarisLogistik[];
  proposals: RapatPengajuan[];
  welcomeBannerConfig?: WelcomeBannerConfig;
  onUpdateWelcomeBanner?: (newConfig: WelcomeBannerConfig) => void;
}

const COLORS = ['#059669', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export default function DashboardView({
  kasMasuk,
  kasKeluar,
  inventaris,
  proposals,
  welcomeBannerConfig,
  onUpdateWelcomeBanner,
}: DashboardViewProps) {
  // Calculations
  const totalMasuk = kasMasuk.reduce((sum, item) => sum + item.nominal, 0);
  const totalKeluar = kasKeluar.reduce((sum, item) => sum + item.nominal, 0);
  const saldoKas = totalMasuk - totalKeluar;
  const pendingProposals = proposals.filter((p) => p.status === 'Diajukan').length;

  // Monthly data preparation
  const monthlyMap: { [key: string]: { masuk: number; keluar: number; masukCount: number } } = {};
  
  kasMasuk.forEach((item) => {
    const month = item.tanggal.substring(0, 7); // YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = { masuk: 0, keluar: 0, masukCount: 0 };
    monthlyMap[month].masuk += item.nominal;
    monthlyMap[month].masukCount += 1;
  });

  kasKeluar.forEach((item) => {
    const month = item.tanggal.substring(0, 7); // YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = { masuk: 0, keluar: 0, masukCount: 0 };
    monthlyMap[month].keluar += item.nominal;
  });

  let cumulativeBalance = 0;
  const monthlyData = Object.keys(monthlyMap)
    .sort()
    .map((month) => {
      // Format month string (e.g. 2026-06 to Juni)
      const parts = month.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      const label = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      const masuk = monthlyMap[month].masuk;
      const keluar = monthlyMap[month].keluar;
      const masukCount = monthlyMap[month].masukCount || 0;
      const net = masuk - keluar;
      cumulativeBalance += net;

      return {
        month: label,
        'Kas Masuk': masuk,
        'Kas Keluar': keluar,
        'Surplus Bersih': net,
        'Saldo Akumulatif': cumulativeBalance,
        'Jumlah Transaksi': masukCount,
        'Rerata Donasi': masukCount > 0 ? Math.round(masuk / masukCount) : 0,
      };
    });

  const savingsRate = totalMasuk > 0 ? ((totalMasuk - totalKeluar) / totalMasuk) * 100 : 0;
  const distributionRatio = totalMasuk > 0 ? (totalKeluar / totalMasuk) * 100 : 0;
  const avgSurplus = monthlyData.length > 0
    ? monthlyData.reduce((sum, item) => sum + item['Surplus Bersih'], 0) / monthlyData.length
    : 0;

  // Category data preparation for Kas Masuk
  const masukCatMap: { [key: string]: number } = {};
  kasMasuk.forEach((item) => {
    masukCatMap[item.kategori] = (masukCatMap[item.kategori] || 0) + item.nominal;
  });
  const masukCatData = Object.keys(masukCatMap).map((cat) => ({
    name: cat,
    value: masukCatMap[cat],
  }));

  // Category data preparation for Kas Keluar
  const keluarCatMap: { [key: string]: number } = {};
  kasKeluar.forEach((item) => {
    keluarCatMap[item.kategori] = (keluarCatMap[item.kategori] || 0) + item.nominal;
  });
  const keluarCatData = Object.keys(keluarCatMap).map((cat) => ({
    name: cat,
    value: keluarCatMap[cat],
  }));

  const totalDonaturCount = kasMasuk.length;
  const maxDonation = kasMasuk.length > 0 ? Math.max(...kasMasuk.map(item => item.nominal)) : 0;
  const avgDonation = totalDonaturCount > 0 ? totalMasuk / totalDonaturCount : 0;

  const [showBannerManager, setShowBannerManager] = React.useState(false);

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div id="dashboard-view-root" className="space-y-6">
      {/* Banner & Schedule Management Card */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <span className="text-2xl">🕌</span>
          <div className="space-y-1">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900">Banner Sambutan &amp; Jadwal Kegiatan Mingguan</h4>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-xl">
              Kelola pesan sambutan jamaah di halaman utama dan jadwal ibadah/kajian rutin mingguan masjid untuk mengoptimalkan transparansi informasi.
            </p>
          </div>
        </div>
        <button
          id="btn-toggle-banner-manager"
          onClick={() => setShowBannerManager(!showBannerManager)}
          className="sm:self-center bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer text-center shrink-0"
        >
          {showBannerManager ? '✕ Tutup Pengelola Banner' : '⚙️ Kelola & Pratinjau Banner'}
        </button>
      </div>

      {showBannerManager && welcomeBannerConfig && onUpdateWelcomeBanner && (
        <div className="space-y-6 animate-fade-in border border-slate-100 bg-slate-50/30 p-4 sm:p-6 rounded-2xl">
          <div className="border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white border px-2.5 py-1 rounded-md">Pratinjau Live (Tampilan Jemaah)</span>
          </div>
          <WelcomeBanner config={welcomeBannerConfig} />
          
          <div className="border-b border-slate-200 pb-2 pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white border px-2.5 py-1 rounded-md">Panel Editor Admin</span>
          </div>
          <WelcomeBannerEditor config={welcomeBannerConfig} onUpdateConfig={onUpdateWelcomeBanner} />
        </div>
      )}

      {/* Cards stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div id="card-saldo-kas" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Saldo Kas Masjid</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{formatRupiah(saldoKas)}</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 self-start px-2 py-0.5 rounded-full">
            ● Bersih & Siap Disalurkan
          </div>
        </div>

        <div id="card-total-masuk" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Penerimaan (Masuk)</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">{formatRupiah(totalMasuk)}</span>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Dari {kasMasuk.length} transaksi infak/zakat
          </div>
        </div>

        <div id="card-total-keluar" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Penyaluran (Keluar)</span>
            <span className="text-2xl font-black text-red-500 mt-1 block">{formatRupiah(totalKeluar)}</span>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Termasuk bansos, operasional, & marbot
          </div>
        </div>

        <div id="card-total-logistik" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Logistik & Anggaran</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {inventaris.length} Item <span className="text-xs font-normal text-slate-400">|</span> {pendingProposals} Diajukan
            </span>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Butuh approval Ketua DKM: {pendingProposals}
          </div>
        </div>
      </div>

      {/* Visualisasi Tren Kesehatan Keuangan (Net Surplus & Saldo Akumulatif) */}
      <div id="trend-kesehatan-keuangan" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Tren Kesehatan Keuangan Masjid</h4>
                <p className="text-xs text-slate-400 mt-0.5">Pertumbuhan akumulasi saldo kas berjalan vs surplus bersih bulanan</p>
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-bold">
                <span className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
                  <span className="text-slate-600">Saldo Berjalan</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-slate-600">Surplus Bersih</span>
                </span>
              </div>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSurplus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp ${val / 1000000}M`} />
                  <Tooltip
                    formatter={(value: any) => formatRupiah(Number(value))}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                  />
                  <Area type="monotone" dataKey="Saldo Akumulatif" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSaldo)" />
                  <Area type="monotone" dataKey="Surplus Bersih" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSurplus)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Health Indicators / KPIs Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">Indikator Kesehatan Kas</h4>
            <p className="text-xs text-slate-400 mb-4">Metrik kesehatan pengelolaan dan pendistribusian dana umat</p>
            
            <div className="space-y-3.5 text-xs">
              {/* Savings Rate KPI */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Rasio Surplus Kas (Simpanan)</span>
                  <span className={`font-black text-sm ${savingsRate >= 15 ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {savingsRate.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Presentase penerimaan kas yang berhasil ditahan setelah penyaluran.</p>
              </div>

              {/* Efficiency Ratio */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Rasio Distribusi Dana</span>
                  <span className="font-black text-sm text-blue-700">
                    {distributionRatio.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Presentase dana jemaah yang disalurkan kembali untuk kemaslahatan.</p>
              </div>

              {/* Average Monthly Net */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Rerata Surplus Bulanan</span>
                  <span className={`font-mono font-black ${avgSurplus >= 0 ? 'text-emerald-700' : 'text-red-500'}`}>
                    {formatRupiah(avgSurplus)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Rata-rata sisa bersih operasional bulanan yang siap dialokasikan.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
            💡 <span className="font-semibold text-slate-600">Saran Keuangan:</span> {savingsRate > 50 ? 'Surplus sangat tinggi. Pengurus disarankan mempercepat penyaluran program sosial & dhuafa.' : 'Rasio simpanan ideal. Stabilitas keuangan masjid sangat sehat & terkontrol.'}
          </div>
        </div>
      </div>

      {/* SECTION TREN PENERIMAAN DONASI (DONATION TRENDS) */}
      <div id="donation-trends-section" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                <Heart className="w-5 h-5 fill-emerald-100" />
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Tren Penerimaan Donasi (Donation Trends)</h4>
            </div>
            <p className="text-xs text-slate-400 mt-1">Analisis intensitas donasi masuk, frekuensi transaksi, dan rerata kontribusi jemaah bulanan</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> Terpantau Stabil
            </span>
          </div>
        </div>

        {/* Donation KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-center space-x-3.5">
            <div className="p-2.5 bg-emerald-100/60 rounded-xl text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Donasi</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">{formatRupiah(totalMasuk)}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-center space-x-3.5">
            <div className="p-2.5 bg-blue-100/60 rounded-xl text-blue-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frekuensi Donasi</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">{totalDonaturCount} Transaksi</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-center space-x-3.5">
            <div className="p-2.5 bg-purple-100/60 rounded-xl text-purple-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rerata Per Donasi</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">{formatRupiah(Math.round(avgDonation))}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-center space-x-3.5">
            <div className="p-2.5 bg-amber-100/60 rounded-xl text-amber-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Donasi Terbesar</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">{formatRupiah(maxDonation)}</span>
            </div>
          </div>
        </div>

        {/* Donation Trends Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dual-axis Chart */}
          <div className="lg:col-span-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Grafik Tren Volume vs Frekuensi Bulanan</span>
              <div className="flex items-center space-x-3 text-[10px] font-bold">
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                  <span className="text-slate-500">Nominal Donasi (Rp)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  <span className="text-slate-500">Jumlah Transaksi</span>
                </span>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDonasiInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFreqInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  
                  {/* Left Y-axis for Nominal */}
                  <YAxis yAxisId="left" stroke="#059669" fontSize={10} tickLine={false} tickFormatter={(val) => `Rp ${val / 1000000}M`} />
                  
                  {/* Right Y-axis for Frequency */}
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} tickLine={false} tickFormatter={(val) => `${val}x`} />
                  
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === 'Kas Masuk') return [formatRupiah(Number(value)), 'Total Donasi'];
                      if (name === 'Jumlah Transaksi') return [`${value} Transaksi`, name];
                      return [value, name];
                    }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                  />
                  
                  <Area yAxisId="left" type="monotone" dataKey="Kas Masuk" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDonasiInflow)" />
                  <Area yAxisId="right" type="monotone" dataKey="Jumlah Transaksi" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorFreqInflow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Averages List & Analysis */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-3">Histori Donasi Rata-rata</span>
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {monthlyData.map((item) => (
                  <div key={item.month} className="flex justify-between items-center py-2 border-b border-slate-100/50 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block">{item.month}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{item['Jumlah Transaksi']} kali donasi masuk</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-800 block">{formatRupiah(item['Rerata Donasi'] || 0)}</span>
                      <span className="text-[9px] text-slate-400">Rata-rata/kontribusi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed bg-white p-2.5 rounded-xl border">
              📈 <span className="font-bold text-slate-600">Info Tren:</span> Kontribusi jemaah tertinggi tercatat pada bulan dengan frekuensi donatur aktif terbanyak. Pertahankan strategi transparansi untuk meningkatkan keterikatan donatur.
            </div>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">Kas Masuk vs Kas Keluar Bulanan</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp ${val / 1000000}M`} />
                <Tooltip
                  formatter={(value: any) => formatRupiah(Number(value))}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Kas Masuk" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Kas Keluar" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kas Masuk Category Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">Sumber Kas Masuk</h4>
          <span className="text-xs text-slate-400 mb-4 block">Distribusi penerimaan berdasarkan kategori</span>
          
          <div className="h-44 flex justify-center items-center relative">
            {masukCatData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={masukCatData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {masukCatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Belum ada data</span>
            )}
          </div>

          <div className="mt-4 space-y-2 overflow-y-auto max-h-32 text-xs">
            {masukCatData.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center py-1 border-b border-slate-50">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kas Keluar Category Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col lg:col-span-1">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">Penyaluran Kas Keluar</h4>
          <span className="text-xs text-slate-400 mb-4 block">Distribusi pengeluaran berdasarkan kategori</span>
          
          <div className="h-44 flex justify-center items-center relative">
            {keluarCatData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={keluarCatData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {keluarCatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Belum ada data</span>
            )}
          </div>

          <div className="mt-4 space-y-2 overflow-y-auto max-h-32 text-xs">
            {keluarCatData.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center py-1 border-b border-slate-50">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}></span>
                  <span className="font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">Aktivitas Terakhir</h4>
          <div className="space-y-4">
            {[...kasMasuk, ...kasKeluar]
              .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
              .slice(0, 5)
              .map((item) => {
                const isMasuk = 'id' in item && item.id.startsWith('M');
                return (
                  <div key={item.id} className="flex justify-between items-center py-2.5 border-b border-slate-50 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl text-xs font-bold ${isMasuk ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {isMasuk ? 'IN' : 'OUT'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block">{item.keterangan}</span>
                        <span className="text-xs text-slate-400">{item.kategori} • {item.tanggal}</span>
                      </div>
                    </div>
                    <span className={`font-mono font-bold ${isMasuk ? 'text-emerald-700' : 'text-red-500'}`}>
                      {isMasuk ? '+' : '-'} {formatRupiah(item.nominal)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
