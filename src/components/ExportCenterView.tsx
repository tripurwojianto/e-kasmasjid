/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { gasCodeGS, gasIndexHTML, gasPublicHTML } from '../gasTemplates';
import { KasMasuk, KasKeluar, InventarisLogistik, RapatPengajuan } from '../types';

interface ExportCenterViewProps {
  kasMasuk: KasMasuk[];
  kasKeluar: KasKeluar[];
  inventaris: InventarisLogistik[];
  proposals: RapatPengajuan[];
}

export default function ExportCenterView({
  kasMasuk,
  kasKeluar,
  inventaris,
  proposals,
}: ExportCenterViewProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<'Code.gs' | 'Index.html' | 'PublicIndex.html'>('Code.gs');
  const [copied, setCopied] = useState(false);

  // PDF report states
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30' | '90' | 'current_month'>('all');
  const [ketuaDKM, setKetuaDKM] = useState('H. Syarifuddin');
  const [bendahara, setBendahara] = useState('Fahmi Salim');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState('');

  const activeCode =
    activeCodeTab === 'Code.gs'
      ? gasCodeGS
      : activeCodeTab === 'Index.html'
      ? gasIndexHTML
      : gasPublicHTML;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupJSON = () => {
    const dataStr = JSON.stringify({ kasMasuk, kasKeluar, inventaris, proposals }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'backup_kasmasjid_data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleDownloadCSV = () => {
    const filteredMasuk = filterDataByPeriod(kasMasuk);
    const filteredKeluar = filterDataByPeriod(kasKeluar);

    const unified = [
      ...filteredMasuk.map(item => ({
        id: item.id,
        tanggal: item.tanggal,
        kategori: item.kategori,
        keterangan: item.keterangan,
        tipe: 'MASUK',
        nominal: item.nominal,
      })),
      ...filteredKeluar.map(item => ({
        id: item.id,
        tanggal: item.tanggal,
        kategori: item.kategori,
        keterangan: item.keterangan,
        tipe: 'KELUAR',
        nominal: item.nominal,
      }))
    ].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    // CSV Headers
    const headers = ['ID Transaksi', 'Tanggal', 'Kategori', 'Keterangan', 'Tipe', 'Nominal (Rp)'];
    
    // Convert to row strings, handle double quotes
    const csvRows = [
      headers.join(','),
      ...unified.map(tr => {
        const id = `"${(tr.id || '').replace(/"/g, '""')}"`;
        const tanggal = `"${(tr.tanggal || '').replace(/"/g, '""')}"`;
        const kategori = `"${(tr.kategori || '').replace(/"/g, '""')}"`;
        const keterangan = `"${(tr.keterangan || '').replace(/"/g, '""')}"`;
        const tipe = `"${tr.tipe}"`;
        const nominal = tr.nominal;
        return [id, tanggal, kategori, keterangan, tipe, nominal].join(',');
      })
    ];

    // Unicode BOM for Excel compatibility (supports Indonesian formatting nicely)
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const filename = `Riwayat_Transaksi_Kas_Masjid_${filterPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', filename);
    linkElement.click();
    URL.revokeObjectURL(url);

    setPdfSuccessMessage('Data riwayat transaksi berhasil diunduh dalam format CSV!');
    setTimeout(() => setPdfSuccessMessage(''), 4000);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filterDataByPeriod = <T extends { tanggal: string }>(data: T[]): T[] => {
    const now = new Date();
    return data.filter((item) => {
      const itemDate = new Date(item.tanggal);
      if (isNaN(itemDate.getTime())) return true; // fallback
      if (filterPeriod === '30') {
        const diffTime = Math.abs(now.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
      if (filterPeriod === '90') {
        const diffTime = Math.abs(now.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 90;
      }
      if (filterPeriod === 'current_month') {
        return (
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      }
      return true; // 'all'
    });
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    setPdfSuccessMessage('');
    
    // Slight timeout to let spinner render smoothly
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageHeight = 297;
        const pageWidth = 210;
        let pageNum = 1;

        const filteredMasuk = filterDataByPeriod(kasMasuk);
        const filteredKeluar = filterDataByPeriod(kasKeluar);

        const totalMasukFiltered = filteredMasuk.reduce((sum, item) => sum + item.nominal, 0);
        const totalKeluarFiltered = filteredKeluar.reduce((sum, item) => sum + item.nominal, 0);
        const saldoAkhirFiltered = totalMasukFiltered - totalKeluarFiltered;

        // Helper to draw kop surat and meta header
        const drawHeader = (docInstance: typeof doc, pNum: number) => {
          // Decorative Emerald top bar
          docInstance.setFillColor(5, 150, 105);
          docInstance.rect(0, 0, pageWidth, 8, 'F');

          // Kop Surat Resmi
          docInstance.setFont('helvetica', 'bold');
          docInstance.setFontSize(16);
          docInstance.setTextColor(15, 23, 42); // slate-900
          docInstance.text("MASJID AL-AMANAH JAKARTA", 105, 20, { align: 'center' });

          docInstance.setFont('helvetica', 'normal');
          docInstance.setFontSize(9);
          docInstance.setTextColor(100, 116, 139); // slate-500
          docInstance.text("Jl. Al-Amanah No. 12, Kebayoran Baru, Jakarta Selatan", 105, 25, { align: 'center' });
          docInstance.text("Sistem Pengelolaan Keuangan & Transparansi Kas Terintegrasi", 105, 29, { align: 'center' });

          // Decorative divider
          docInstance.setDrawColor(203, 213, 225); // slate-300
          docInstance.setLineWidth(0.5);
          docInstance.line(15, 33, 195, 33);

          // Report Title
          docInstance.setFont('helvetica', 'bold');
          docInstance.setFontSize(12);
          docInstance.setTextColor(30, 41, 59); // slate-800
          let periodText = "Semua Riwayat";
          if (filterPeriod === '30') periodText = "30 Hari Terakhir";
          else if (filterPeriod === '90') periodText = "90 Hari Terakhir";
          else if (filterPeriod === 'current_month') {
            const now = new Date();
            periodText = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          }
          docInstance.text(`LAPORAN KEUANGAN RESMI - ${periodText.toUpperCase()}`, 105, 41, { align: 'center' });

          // Print Date and Page Numbering
          docInstance.setFont('helvetica', 'normal');
          docInstance.setFontSize(8);
          docInstance.setTextColor(148, 163, 184); // slate-400
          const genDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          docInstance.text(`Dicetak pada: ${genDateStr}`, 15, 47);
          docInstance.text(`Halaman: ${pNum}`, 195, 47, { align: 'right' });

          // Bottom line
          docInstance.setDrawColor(241, 245, 249); // slate-100
          docInstance.setLineWidth(0.2);
          docInstance.line(15, 49, 195, 49);
        };

        // Draw page 1 header
        drawHeader(doc, pageNum);

        // Draw Summary KPI Blocks
        const boxY = 53;
        const boxHeight = 18;
        const boxWidth = 55;
        const spacing = 7.5;

        // Block 1: Kas Masuk
        doc.setFillColor(240, 253, 250); // teal-50
        doc.roundedRect(15, boxY, boxWidth, boxHeight, 2, 2, 'F');
        doc.setDrawColor(204, 251, 241); // teal-100
        doc.roundedRect(15, boxY, boxWidth, boxHeight, 2, 2, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(13, 148, 136); // teal-600
        doc.text("TOTAL PENERIMAAN (+)", 19, boxY + 6);
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(formatRupiah(totalMasukFiltered), 19, boxY + 13);

        // Block 2: Kas Keluar
        doc.setFillColor(254, 242, 242); // rose-50
        doc.roundedRect(15 + boxWidth + spacing, boxY, boxWidth, boxHeight, 2, 2, 'F');
        doc.setDrawColor(254, 226, 226); // rose-100
        doc.roundedRect(15 + boxWidth + spacing, boxY, boxWidth, boxHeight, 2, 2, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(225, 29, 72); // rose-600
        doc.text("TOTAL PENGELUARAN (-)", 15 + boxWidth + spacing + 4, boxY + 6);
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(formatRupiah(totalKeluarFiltered), 15 + boxWidth + spacing + 4, boxY + 13);

        // Block 3: Saldo Kas Akhir
        doc.setFillColor(239, 246, 255); // blue-50
        doc.roundedRect(15 + (boxWidth + spacing) * 2, boxY, boxWidth, boxHeight, 2, 2, 'F');
        doc.setDrawColor(219, 234, 254); // blue-100
        doc.roundedRect(15 + (boxWidth + spacing) * 2, boxY, boxWidth, boxHeight, 2, 2, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text("SALDO KAS BERJALAN", 15 + (boxWidth + spacing) * 2 + 4, boxY + 6);
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(formatRupiah(saldoAkhirFiltered), 15 + (boxWidth + spacing) * 2 + 4, boxY + 13);

        // Collect all transactions
        interface UnifiedTransaction {
          tanggal: string;
          kategori: string;
          keterangan: string;
          tipe: 'MASUK' | 'KELUAR';
          nominal: number;
        }

        const unified: UnifiedTransaction[] = [
          ...filteredMasuk.map(item => ({
            tanggal: item.tanggal,
            kategori: item.kategori,
            keterangan: item.keterangan,
            tipe: 'MASUK' as const,
            nominal: item.nominal
          })),
          ...filteredKeluar.map(item => ({
            tanggal: item.tanggal,
            kategori: item.kategori,
            keterangan: item.keterangan,
            tipe: 'KELUAR' as const,
            nominal: item.nominal
          }))
        ].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

        // Draw Table headers
        let yRow = 82;
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(15, yRow - 4, 180, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); // slate-600

        doc.text("Tanggal", 17, yRow + 1);
        doc.text("Kategori", 42, yRow + 1);
        doc.text("Keterangan", 77, yRow + 1);
        doc.text("Tipe", 147, yRow + 1);
        doc.text("Nominal", 193, yRow + 1, { align: 'right' });

        yRow += 9;

        if (unified.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          doc.setTextColor(148, 163, 184);
          doc.text("Tidak ada transaksi pada periode ini.", 105, yRow + 10, { align: 'center' });
          yRow += 20;
        } else {
          unified.forEach((tr, index) => {
            // Check for pagination triggers
            if (yRow > 260) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(148, 163, 184);
              doc.text(`Dokumen Laporan Kas Resmi Masjid Al-Amanah - Halaman ${pageNum}`, 105, 287, { align: 'center' });

              doc.addPage();
              pageNum++;
              drawHeader(doc, pageNum);

              yRow = 60;
              doc.setFillColor(241, 245, 249);
              doc.rect(15, yRow - 4, 180, 8, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(71, 85, 105);

              doc.text("Tanggal", 17, yRow + 1);
              doc.text("Kategori", 42, yRow + 1);
              doc.text("Keterangan", 77, yRow + 1);
              doc.text("Tipe", 147, yRow + 1);
              doc.text("Nominal", 193, yRow + 1, { align: 'right' });

              yRow += 9;
            }

            // Draw alternating light row backgrounds
            if (index % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(15, yRow - 4, 180, 7, 'F');
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(51, 65, 85);

            // Print transaction date
            const trDate = new Date(tr.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
            doc.text(trDate, 17, yRow + 1);

            // Print transaction category (truncate if too long)
            const catText = tr.kategori.length > 18 ? tr.kategori.substring(0, 16) + ".." : tr.kategori;
            doc.text(catText, 42, yRow + 1);

            // Print transaction description (truncate if too long)
            const ketText = tr.keterangan.length > 36 ? tr.keterangan.substring(0, 34) + ".." : tr.keterangan;
            doc.text(ketText, 77, yRow + 1);

            // Print transaction type with unique color cues
            if (tr.tipe === 'MASUK') {
              doc.setTextColor(5, 150, 105);
              doc.setFont('helvetica', 'bold');
              doc.text("MASUK", 147, yRow + 1);
            } else {
              doc.setTextColor(220, 38, 38);
              doc.setFont('helvetica', 'bold');
              doc.text("KELUAR", 147, yRow + 1);
            }

            // Print transaction nominal
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            const prefix = tr.tipe === 'MASUK' ? '+' : '-';
            doc.text(`${prefix} ${formatRupiah(tr.nominal)}`, 193, yRow + 1, { align: 'right' });

            // Bottom border separator line
            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.1);
            doc.line(15, yRow + 3, 195, yRow + 3);

            yRow += 7;
          });
        }

        // Space check for signature block
        if (yRow > 230) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Dokumen Laporan Kas Resmi Masjid Al-Amanah - Halaman ${pageNum}`, 105, 287, { align: 'center' });

          doc.addPage();
          pageNum++;
          drawHeader(doc, pageNum);
          yRow = 60;
        }

        // Draw physical validation stamp and signature blocks
        const sigY = yRow + 15;
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');

        const sigDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Jakarta, ${sigDateStr}`, 145, sigY);

        doc.text("Dibuat oleh,", 30, sigY + 5);
        doc.setFont('helvetica', 'bold');
        doc.text("Bendahara Masjid,", 30, sigY + 10);

        doc.setFont('helvetica', 'normal');
        doc.text("Mengetahui,", 145, sigY + 5);
        doc.setFont('helvetica', 'bold');
        doc.text("Ketua Takmir (DKM),", 145, sigY + 10);

        // Signatory Names
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(bendahara, 30, sigY + 32);
        doc.text(ketuaDKM, 145, sigY + 32);

        // Signatory Titles
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Pengurus Keuangan", 30, sigY + 36);
        doc.text("Ketua Pengurus DKM", 145, sigY + 36);

        // Verification digital seal
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.roundedRect(82, sigY + 8, 46, 24, 1, 1, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(13, 148, 136); // emerald-600
        doc.text("DIVERIFIKASI DIGITAL", 105, sigY + 15, { align: 'center' });
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Sistem KasMasjid Online", 105, sigY + 20, { align: 'center' });
        doc.text("Kesyariahan 100% Valid", 105, sigY + 24, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Dokumen Laporan Kas Resmi Masjid Al-Amanah - Halaman ${pageNum}`, 105, 287, { align: 'center' });

        const filename = `Laporan_Resmi_Kas_Masjid_${filterPeriod}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        
        setPdfSuccessMessage('Laporan PDF resmi berhasil diunduh!');
        setTimeout(() => setPdfSuccessMessage(''), 4000);
      } catch (error) {
        console.error("PDF generation failed:", error);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 500);
  };

  return (
    <div id="export-center-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Instructions on Left */}
      <div className="space-y-6 lg:col-span-1">
        
        {/* PDF Generator Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center space-x-2 text-emerald-800">
            <span className="text-xl">📄</span>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Cetak Laporan Keuangan Resmi</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Unduh berkas laporan resmi berformat PDF lengkap dengan kop surat resmi masjid, rincian summary kas, dan kolom tanda tangan pengesahan pengurus.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Periode Laporan:</label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800"
              >
                <option value="all">Semua Riwayat Kas</option>
                <option value="current_month">Bulan Ini (Berjalan)</option>
                <option value="30">30 Hari Terakhir</option>
                <option value="90">90 Hari Terakhir</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Ketua Takmir (DKM):</label>
              <input
                type="text"
                value={ketuaDKM}
                onChange={(e) => setKetuaDKM(e.target.value)}
                placeholder="Contoh: H. Syarifuddin"
                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Bendahara Masjid:</label>
              <input
                type="text"
                value={bendahara}
                onChange={(e) => setBendahara(e.target.value)}
                placeholder="Contoh: Fahmi Salim"
                className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800"
              />
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className={`w-full flex items-center justify-center space-x-2 text-xs font-bold py-2.5 px-4 rounded-xl transition shadow ${
                isGeneratingPdf
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Menyiapkan Dokumen...</span>
                </>
              ) : (
                <>
                  <span>⬇️ Unduh PDF Laporan Resmi</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCSV}
              disabled={isGeneratingPdf}
              className="w-full flex items-center justify-center space-x-2 text-xs font-bold py-2.5 px-4 rounded-xl transition shadow bg-slate-700 hover:bg-slate-800 text-white cursor-pointer"
            >
              📊 Unduh Transaksi (Format CSV)
            </button>

            {pdfSuccessMessage && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-center border border-emerald-100 font-semibold text-[11px]">
                ✓ {pdfSuccessMessage}
              </div>
            )}
          </div>
        </div>

        <div className="bg-emerald-900 text-emerald-100 rounded-2xl p-6 shadow-md space-y-4">
          <div className="bg-emerald-800 p-3 rounded-xl self-start inline-block text-2xl shadow-inner">
            🚀
          </div>
          <h3 className="text-lg font-extrabold tracking-tight">Deploy 100% Gratis ke Google Apps Script</h3>
          <p className="text-xs text-emerald-200 leading-relaxed">
            AI Studio mempermudah Anda membangun program backend dan frontend yang langsung terintegrasi dengan Google Sheets secara gratis! Ikuti panduan 5 langkah di bawah ini untuk mengaktifkan KasMasjid Anda:
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Langkah-Langkah Integrasi:</h4>
          
          <div className="space-y-4 text-xs">
            <div className="flex items-start space-x-3">
              <span className="bg-emerald-50 text-emerald-800 font-bold h-6 w-6 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">1</span>
              <div>
                <p className="font-bold text-slate-800">Buat Google Spreadsheet</p>
                <p className="text-slate-500 mt-0.5">Buka Google Drive Anda, buat spreadsheet baru dengan nama <span className="font-mono bg-slate-50 px-1 py-0.5 rounded border">DB_KasMasjid</span>.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="bg-emerald-50 text-emerald-800 font-bold h-6 w-6 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">2</span>
              <div>
                <p className="font-bold text-slate-800">Buka Google Apps Script</p>
                <p className="text-slate-500 mt-0.5">Pada menu Google Sheets Anda, klik <span className="font-semibold">Ekstensi &gt; Apps Script</span>.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="bg-emerald-50 text-emerald-800 font-bold h-6 w-6 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">3</span>
              <div>
                <p className="font-bold text-slate-800">Salin File Code.gs</p>
                <p className="text-slate-500 mt-0.5">Salin tab <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border text-emerald-700">Code.gs</span> di kanan, lalu paste-kan di dalam editor Apps Script Anda. Jangan lupa ganti <span className="font-semibold text-slate-700">ID Spreadsheet</span> Anda di baris ke-21.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="bg-emerald-50 text-emerald-800 font-bold h-6 w-6 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">4</span>
              <div>
                <p className="font-bold text-slate-800">Buat File HTML</p>
                <p className="text-slate-500 mt-0.5">Di dalam Apps Script, klik tombol <span className="font-semibold">+</span> (Tambah File) &gt; Pilih <span className="font-semibold">HTML</span>. Buat 2 file:</p>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                  <li>Buat file <span className="font-mono font-bold">Index</span> (copy-paste isi tab <span className="font-mono text-emerald-600 font-bold">Index.html</span>)</li>
                  <li>Buat file <span className="font-mono font-bold">PublicIndex</span> (copy-paste isi tab <span className="font-mono text-emerald-600 font-bold">PublicIndex.html</span>)</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="bg-emerald-50 text-emerald-800 font-bold h-6 w-6 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">5</span>
              <div>
                <p className="font-bold text-slate-800">Deploy &amp; Publikasikan!</p>
                <p className="text-slate-500 mt-0.5">Klik <span className="font-semibold">Terapkan &gt; Penerapan Baru</span>. Atur jenis penerapan ke <span className="font-semibold">Aplikasi Web</span>. Jalankan sebagai: "Saya" (pemilik Google Sheets), dan Siapa saja yang memiliki akses: "Siapa saja" (Anyone).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Download simulated backup */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Arsip &amp; Backup Data</h5>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Anda dapat mendownload seluruh data simulasi yang telah Anda masukkan/uji coba di portal ini sebagai cadangan JSON untuk arsip offline.
          </p>
          <button
            onClick={downloadBackupJSON}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl transition shadow cursor-pointer"
          >
            💾 Download Backup JSON
          </button>
        </div>
      </div>

      {/* Code Blocks Area on Right */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[650px]">
          {/* Header tabs */}
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center flex-wrap gap-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveCodeTab('Code.gs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCodeTab === 'Code.gs'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                Code.gs (Backend Script)
              </button>
              <button
                onClick={() => setActiveCodeTab('Index.html')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCodeTab === 'Index.html'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                Index.html (Portal Admin)
              </button>
              <button
                onClick={() => setActiveCodeTab('PublicIndex.html')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCodeTab === 'PublicIndex.html'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                PublicIndex.html (Laporan Publik)
              </button>
            </div>

            <button
              id="btn-copy-code"
              onClick={handleCopy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
            >
              {copied ? 'Tersalin! ✓' : '📋 Salin Kode'}
            </button>
          </div>

          {/* Syntax display block */}
          <div className="p-4 overflow-auto font-mono text-xs bg-slate-950 text-slate-200 flex-grow h-0">
            <pre className="whitespace-pre">{activeCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
