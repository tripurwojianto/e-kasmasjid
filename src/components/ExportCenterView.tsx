/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { gasCodeGS, gasIndexHTML, gasPublicHTML } from '../gasTemplates';
import { KasMasuk, KasKeluar, InventarisLogistik, RapatPengajuan, User } from '../types';

interface ExportCenterViewProps {
  kasMasuk: KasMasuk[];
  kasKeluar: KasKeluar[];
  inventaris: InventarisLogistik[];
  proposals: RapatPengajuan[];
  currentUser: User;
}

function applyTheme(
  code: string,
  theme: 'emerald' | 'sapphire' | 'maroon',
  tabName: 'Code.gs' | 'Index.html' | 'PublicIndex.html',
  mosqueName: string,
  mosqueSub: string
): string {
  let res = code;

  // 1. Ganti nama masjid & sub-judul di file Code.gs
  if (tabName === 'Code.gs') {
    res = res.replace("Code.gs - Backend KasMasjid (e-Kas)", `Code.gs - Backend ${mosqueName}`);
    res = res.replace(/htmlOutput\.setTitle\("KasMasjid — Amanah & Transparan"\)/g, `htmlOutput.setTitle("${mosqueName} — Amanah, Rapi, & Transparan")`);
    
    const themeNameStr = theme === 'emerald'
      ? 'Emerald Classic (Hijau Islami)'
      : theme === 'sapphire'
      ? 'Midnight Sapphire (Biru Modern)'
      : 'Maroon Heritage (Merah Klasik)';
    
    res = res.replace(
      "Code.gs - Backend KasMasjid (e-Kas)",
      `Code.gs - Backend KasMasjid (e-Kas)\n * Tema Tampilan: ${themeNameStr}`
    );
    res = res.replace(
      'const SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI";',
      `const SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI";\nconst ACTIVE_THEME = "${theme}"; // Tema aktif\nconst MOSQUE_NAME = "${mosqueName}"; // Nama masjid custom\nconst MOSQUE_SUB = "${mosqueSub}"; // Sub-judul/alamat custom`
    );
    return res;
  }

  // 2. Ganti nama masjid & sub-judul di file HTML (Index & PublicIndex)
  if (tabName === 'Index.html' || tabName === 'PublicIndex.html') {
    // Menyisipkan variabel tema yang dipilih ke dalam head HTML
    res = res.replace(
      '<head>',
      `<head>\n  <script>\n    const ACTIVE_THEME = "${theme}";\n    const MOSQUE_NAME = "${mosqueName}";\n    const MOSQUE_SUB = "${mosqueSub}";\n  </script>`
    );

    // Ganti tag Title di HTML head
    res = res.replace(/<title>KasMasjid — Amanah, Rapi, & Transparan<\/title>/g, `<title>${mosqueName} — Amanah, Rapi, & Transparan</title>`);
    res = res.replace(/<title>Laporan Transparansi Jemaah — KasMasjid<\/title>/g, `<title>Laporan Transparansi Jemaah — ${mosqueName}</title>`);

    // Ganti Title & Subtitle di Navbar Index.html
    res = res.replace(/<span class="font-bold text-lg tracking-tight block">KasMasjid<\/span>/g, `<span class="font-bold text-lg tracking-tight block">${mosqueName}</span>`);
    res = res.replace(/e-Kas & Logistik DKM/g, mosqueSub);
    res = res.replace(/belum terdaftar di sistem pengurus KasMasjid\./g, `belum terdaftar di sistem pengurus ${mosqueName}.`);

    // Ganti Title & Subtitle di Header PublicIndex.html
    res = res.replace(/Laporan Keuangan & Kas Masjid/g, `Laporan Keuangan & Kas ${mosqueName}`);
    res = res.replace(/Sistem Informasi Transparansi Keuangan Dewan Kemakmuran Masjid \(DKM\)\. Diaudit secara berkala untuk kemaslahatan umat\./g, mosqueSub);
  }

  if (theme === 'sapphire') {
    res = res.replace(/KasMasjid — Amanah, Rapi, & Transparan/g, `${mosqueName} — Amanah, Rapi, & Transparan`);
    res = res.replace(/Laporan Transparansi Jemaah — KasMasjid/g, `Laporan Transparansi Jemaah — ${mosqueName}`);
    
    // Emerald green palette mapped to sapphire blue/sky/indigo palette
    res = res.replace(/emerald-950/g, 'slate-950');
    res = res.replace(/emerald-900/g, 'slate-900');
    res = res.replace(/emerald-800/g, 'blue-800');
    res = res.replace(/emerald-700/g, 'blue-700');
    res = res.replace(/emerald-600/g, 'sky-600');
    res = res.replace(/emerald-500/g, 'sky-500');
    res = res.replace(/emerald-400/g, 'sky-400');
    res = res.replace(/emerald-300/g, 'sky-300');
    res = res.replace(/emerald-200/g, 'blue-200');
    res = res.replace(/emerald-100/g, 'blue-100');
    res = res.replace(/emerald-50/g, 'blue-50');
    
    // Accent colors also change to blue-themed colors
    res = res.replace(/teal-600/g, 'cyan-600');
    res = res.replace(/teal-50/g, 'cyan-50');
    res = res.replace(/teal-100/g, 'cyan-100');
    res = res.replace(/teal-200/g, 'cyan-200');
    res = res.replace(/teal-700/g, 'cyan-700');
    
    // Replace visual cues like Mosque Emoji with something matching
    res = res.replace(/🕌/g, '🔵'); // Blue badge/orb
  } else if (theme === 'maroon') {
    res = res.replace(/KasMasjid — Amanah, Rapi, & Transparan/g, `${mosqueName} — Amanah, Rapi, & Transparan`);
    res = res.replace(/Laporan Transparansi Jemaah — KasMasjid/g, `Laporan Transparansi Jemaah — ${mosqueName}`);

    // Emerald green palette mapped to maroon red/rose palette
    res = res.replace(/emerald-950/g, 'stone-950');
    res = res.replace(/emerald-900/g, 'rose-950');
    res = res.replace(/emerald-800/g, 'red-800');
    res = res.replace(/emerald-700/g, 'red-700');
    res = res.replace(/emerald-600/g, 'rose-600');
    res = res.replace(/emerald-50/g, 'rose-50');
    res = res.replace(/emerald-100/g, 'rose-100');
    res = res.replace(/emerald-200/g, 'rose-200');
    res = res.replace(/emerald-300/g, 'rose-300');
    res = res.replace(/emerald-400/g, 'rose-400');
    res = res.replace(/emerald-500/g, 'rose-500');
    
    // Accent colors also change to warm maroon/amber
    res = res.replace(/teal-600/g, 'amber-600');
    res = res.replace(/teal-50/g, 'amber-50');
    res = res.replace(/teal-100/g, 'amber-100');
    res = res.replace(/teal-200/g, 'amber-200');
    res = res.replace(/teal-700/g, 'amber-700');
    
    // Replace visual cues like Mosque Emoji
    res = res.replace(/🕌/g, '🔴'); // Red badge/orb
  }

  return res;
}

export default function ExportCenterView({
  kasMasuk,
  kasKeluar,
  inventaris,
  proposals,
  currentUser,
}: ExportCenterViewProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<'Code.gs' | 'Index.html' | 'PublicIndex.html'>('Code.gs');
  const [copied, setCopied] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'emerald' | 'sapphire' | 'maroon'>('emerald');
  const [customMosqueName, setCustomMosqueName] = useState('KasMasjid (e-Kas)');
  const [customMosqueSub, setCustomMosqueSub] = useState('Sistem Transparansi Keuangan & Logistik DKM');

  // PDF report states
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30' | '90' | 'current_month'>('all');
  const [ketuaDKM, setKetuaDKM] = useState('H. Syarifuddin');
  const [bendahara, setBendahara] = useState('Fahmi Salim');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState('');

  const activeCodeRaw =
    activeCodeTab === 'Code.gs'
      ? gasCodeGS
      : activeCodeTab === 'Index.html'
      ? gasIndexHTML
      : gasPublicHTML;

  const activeCode = applyTheme(activeCodeRaw, selectedTheme, activeCodeTab, customMosqueName, customMosqueSub);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([activeCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', activeCodeTab);
    linkElement.click();
    URL.revokeObjectURL(url);
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

  const isOwner = currentUser.email.trim().toLowerCase() === 'bukukassekolah@gmail.com';

  if (!isOwner) {
    return (
      <div id="export-center-root" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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

        {/* Right card: Access restricted for security */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
            <span className="text-3xl">🔒</span>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-950">Integrasi GAS Terkunci</h4>
            <p className="text-xs text-amber-900 leading-relaxed">
              Modul integrasi Google Apps Script (GAS) dan penyalinan source code dilindungi hak kekayaan intelektual (IP) dan hanya dapat diakses secara eksklusif oleh pemilik sistem (<span className="font-bold">bukukassekolah@gmail.com</span>).
            </p>
            <p className="text-[10px] text-amber-800 leading-relaxed font-semibold">
              Silakan login/alihkan simulator ke akun "Owner (bukukassekolah@gmail.com)" untuk membuka source code & panduan deployment.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Arsip &amp; Backup Data</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Anda tetap dapat mendownload data simulasi sebagai cadangan JSON untuk arsip offline.
            </p>
            <button
              onClick={downloadBackupJSON}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl transition shadow cursor-pointer"
            >
              💾 Download Backup JSON
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Pilihan Tema (Theme Selection) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">🎨 Pilih Tema Aplikasi KasMasjid</h4>
              <p className="text-xs text-slate-500">
                Pilih tema visual di bawah ini sebelum menyalin atau mengunduh kode. Seluruh file Code.gs dan HTML akan menyesuaikan otomatis!
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded">
              3 Pilihan Tema Aktif
            </span>
          </div>

          {/* Custom Identity Inputs */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                🕌 Nama Masjid / Judul Utama
              </label>
              <input
                id="custom-mosque-name"
                type="text"
                value={customMosqueName}
                onChange={(e) => setCustomMosqueName(e.target.value)}
                placeholder="Contoh: Kas Masjid Al Muhajirin"
                className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                📍 Alamat / Sub-judul / Logistik DKM
              </label>
              <input
                id="custom-mosque-sub"
                type="text"
                value={customMosqueSub}
                onChange={(e) => setCustomMosqueSub(e.target.value)}
                placeholder="Contoh: Jalan Melati no. 1 Dawuan Tengah Cikampek"
                className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Emerald Classic */}
            <button
              id="theme-emerald"
              onClick={() => setSelectedTheme('emerald')}
              className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedTheme === 'emerald'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                  : 'border-slate-100 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                🕌
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Emerald Classic</span>
                <span className="text-[10px] text-emerald-700 font-medium">Hijau Islami Traditional</span>
              </div>
            </button>

            {/* Midnight Sapphire */}
            <button
              id="theme-sapphire"
              onClick={() => setSelectedTheme('sapphire')}
              className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedTheme === 'sapphire'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-100 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                🔵
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Midnight Sapphire</span>
                <span className="text-[10px] text-blue-700 font-medium">Biru Modern &amp; Tech</span>
              </div>
            </button>

            {/* Maroon Heritage */}
            <button
              id="theme-maroon"
              onClick={() => setSelectedTheme('maroon')}
              className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedTheme === 'maroon'
                  ? 'border-red-500 bg-rose-50/50 ring-2 ring-red-500/20'
                  : 'border-slate-100 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                🔴
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Maroon Heritage</span>
                <span className="text-[10px] text-red-700 font-medium">Merah Klasik &amp; Hangat</span>
              </div>
            </button>
          </div>

          {/* Visual Theme Preview Component */}
          <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                👁️ Live Pratinjau Tema: <span className="text-emerald-800 font-black">{selectedTheme === 'emerald' ? 'Emerald Classic' : selectedTheme === 'sapphire' ? 'Midnight Sapphire' : 'Maroon Heritage'}</span>
              </span>
              <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                Visual Mockup
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Palette swatches */}
              <div className="bg-slate-50/75 rounded-xl p-3 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 block">Palet Warna Utama (Tailwind CSS)</span>
                <div className="flex items-center space-x-3">
                  <div className="space-y-1 text-center">
                    <div className={`w-10 h-10 rounded-lg shadow-sm ${
                      selectedTheme === 'emerald' ? 'bg-emerald-800' : selectedTheme === 'sapphire' ? 'bg-blue-800' : 'bg-red-800'
                    }`} />
                    <span className="text-[9px] font-mono text-slate-500 block">Utama</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className={`w-10 h-10 rounded-lg shadow-sm ${
                      selectedTheme === 'emerald' ? 'bg-emerald-600' : selectedTheme === 'sapphire' ? 'bg-sky-600' : 'bg-rose-600'
                    }`} />
                    <span className="text-[9px] font-mono text-slate-500 block">Sekunder</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className={`w-10 h-10 rounded-lg shadow-sm ${
                      selectedTheme === 'emerald' ? 'bg-teal-600' : selectedTheme === 'sapphire' ? 'bg-cyan-600' : 'bg-amber-600'
                    }`} />
                    <span className="text-[9px] font-mono text-slate-500 block">Aksen</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className={`w-10 h-10 rounded-lg shadow-sm border border-slate-200 ${
                      selectedTheme === 'emerald' ? 'bg-emerald-50' : selectedTheme === 'sapphire' ? 'bg-blue-50' : 'bg-rose-50'
                    }`} />
                    <span className="text-[9px] font-mono text-slate-500 block">Muda</span>
                  </div>
                </div>
              </div>

              {/* Sample Mini UI Mockup */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
                {/* Mockup Header */}
                <div className={`px-3 py-2 text-white flex items-center justify-between transition-colors duration-300 ${
                  selectedTheme === 'emerald' ? 'bg-emerald-900' : selectedTheme === 'sapphire' ? 'bg-slate-900' : 'bg-rose-950'
                }`}>
                  <div className="flex flex-col text-left min-w-0 flex-1 mr-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm shrink-0">
                        {selectedTheme === 'emerald' ? '🕌' : '🔴'}
                      </span>
                      <span className="text-[10px] font-extrabold tracking-tight truncate max-w-[130px]" title={customMosqueName}>
                        {customMosqueName}
                      </span>
                    </div>
                    <span className="text-[7px] text-white/70 font-bold truncate max-w-[140px] block mt-0.5" title={customMosqueSub}>
                      {customMosqueSub}
                    </span>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    selectedTheme === 'emerald' ? 'bg-emerald-800 text-white' : selectedTheme === 'sapphire' ? 'bg-blue-800 text-white' : 'bg-red-800 text-white'
                  }`}>
                    ONLINE
                  </span>
                </div>

                {/* Mockup Content body */}
                <div className="p-3 space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Saldo Kas Masjid</span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                      selectedTheme === 'emerald' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : selectedTheme === 'sapphire' ? 'bg-blue-50 text-blue-800 border border-blue-100' : 'bg-rose-50 text-red-800 border border-rose-100'
                    }`}>
                      Kas Utama
                    </span>
                  </div>
                  <div className={`text-sm font-black tracking-tight ${
                    selectedTheme === 'emerald' ? 'text-emerald-800' : selectedTheme === 'sapphire' ? 'text-blue-800' : 'text-red-800'
                  }`}>
                    Rp 45.750.000
                  </div>

                  {/* Buttons and actions */}
                  <div className="flex space-x-1.5 pt-1">
                    <div className={`flex-1 text-center py-1 rounded text-[8px] font-bold transition-colors duration-300 text-white cursor-default ${
                      selectedTheme === 'emerald' ? 'bg-emerald-700' : selectedTheme === 'sapphire' ? 'bg-blue-700' : 'bg-red-700'
                    }`}>
                      Masukan Kas
                    </div>
                    <div className={`flex-1 text-center py-1 rounded text-[8px] font-extrabold border transition-colors duration-300 cursor-default ${
                      selectedTheme === 'emerald' ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50' : selectedTheme === 'sapphire' ? 'border-blue-200 text-blue-700 bg-blue-50/50' : 'border-rose-200 text-red-700 bg-rose-50/50'
                    }`}>
                      Saran Jemaah
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

            <div className="flex items-center space-x-2">
              <button
                id="btn-download-code"
                onClick={handleDownloadFile}
                className="bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
              >
                📥 Unduh {activeCodeTab}
              </button>
              <button
                id="btn-copy-code"
                onClick={handleCopy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
              >
                {copied ? 'Tersalin! ✓' : '📋 Salin Kode'}
              </button>
            </div>
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
