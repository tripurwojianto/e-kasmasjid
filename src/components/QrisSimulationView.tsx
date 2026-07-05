/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, AlertCircle, Sparkles, CheckCircle2, RefreshCw, X, ArrowRight, BookOpen } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrisSimulationViewProps {
  onAddDonation: (amount: number, donorName: string, notes: string) => void;
}

// Helper to parse standard QRIS strings and other format fallbacks
function parseQrisString(qris: string) {
  if (!qris || qris.trim() === '') return null;
  const text = qris.trim();

  // 1. QRIS standard starting with 000201
  if (text.startsWith("000201")) {
    let index = 6;
    let amount: number | null = null;
    let merchantName: string | null = null;
    let reference: string | null = null;
    
    while (index < text.length) {
      if (index + 4 > text.length) break;
      const tag = text.substring(index, index + 2);
      const lengthStr = text.substring(index + 2, index + 4);
      const length = parseInt(lengthStr, 10);
      if (isNaN(length)) break;
      
      index += 4;
      if (index + length > text.length) break;
      const value = text.substring(index, index + length);
      index += length;
      
      if (tag === '54') {
        const parsedAmt = parseFloat(value);
        if (!isNaN(parsedAmt)) {
          amount = parsedAmt;
        }
      } else if (tag === '59') {
        merchantName = value;
      } else if (tag === '62') {
        let subIndex = 0;
        while (subIndex < value.length) {
          if (subIndex + 4 > value.length) break;
          const subTag = value.substring(subIndex, subIndex + 2);
          const subLength = parseInt(value.substring(subIndex + 2, subIndex + 4), 10);
          if (isNaN(subLength)) break;
          subIndex += 4;
          if (subIndex + subLength > value.length) break;
          const subValue = value.substring(subIndex, subIndex + subLength);
          subIndex += subLength;
          
          if (subTag === '01') {
            reference = subValue;
          }
        }
      }
    }
    return {
      type: 'QRIS Standard (EMVCo)',
      amount,
      merchantName,
      reference,
      notes: reference ? `QRIS Ref: ${reference}` : (merchantName ? `QRIS Donasi: ${merchantName}` : 'Infaq QRIS Standar')
    };
  }

  // 2. URL parsing fallback (e.g., https://kasmasjid.web.id/pay?amount=75000&donor=Budi&notes=Infaq_Jumat)
  try {
    const url = new URL(text);
    const amountParam = url.searchParams.get('amount') || url.searchParams.get('total') || url.searchParams.get('value');
    const donorParam = url.searchParams.get('donor') || url.searchParams.get('name') || url.searchParams.get('donorName');
    const notesParam = url.searchParams.get('notes') || url.searchParams.get('desc') || url.searchParams.get('keterangan');
    
    if (amountParam) {
      const parsedAmount = parseFloat(amountParam);
      if (!isNaN(parsedAmount)) {
        return {
          type: 'E-Donation Link (URL)',
          amount: parsedAmount,
          donorName: donorParam ? decodeURIComponent(donorParam) : null,
          notes: notesParam ? decodeURIComponent(notesParam) : `Sedekah Link QR`
        };
      }
    }
  } catch (e) {
    // Not a valid URL
  }

  // 3. JSON parsing fallback
  try {
    const data = JSON.parse(text);
    if (data.amount) {
      const parsedAmount = parseFloat(data.amount);
      if (!isNaN(parsedAmount)) {
        return {
          type: 'JSON E-Data',
          amount: parsedAmount,
          donorName: data.donorName || data.donor || null,
          notes: data.notes || data.keterangan || 'Donasi Data QR'
        };
      }
    }
  } catch (e) {
    // Not JSON
  }

  // 4. Plain Text Number extraction fallback
  const numMatch = text.match(/\b\d{4,9}\b/);
  if (numMatch) {
    const parsedAmount = parseInt(numMatch[0], 10);
    return {
      type: 'Plain Text QR',
      amount: parsedAmount,
      donorName: null,
      notes: `Donasi Terdeteksi dari QR: ${text.substring(0, 30)}`
    };
  }

  return null;
}

const demoQrisPresets = [
  {
    title: '🕌 QRIS Dinamis Al-Amanah (Rp 25.000)',
    description: 'QRIS dinamis resmi Bank Indonesia untuk infaq rutin Masjid Al-Amanah.',
    raw: '00020101021226590016ID102030405060120110123456789020300351105204000053033605405250005802ID5917MASJID AL-AMANAH6005Depok62180110Ref-99120708Al-Amanah6304ABCD'
  },
  {
    title: '🏗️ QRIS Wakaf Pembangunan (Rp 150.000)',
    description: 'QRIS dinamis khusus untuk program wakaf pembangunan gedung dakwah.',
    raw: '00020101021226590016ID1020304050601201101234567890203003511052040000530336054061500005802ID5917YAYASAN AL-FALAH6005Depok62190111Ref-FALAH0708Al-Falah6304BCDE'
  },
  {
    title: '🌐 E-Donation URL (Rp 75.000 + Pesan)',
    description: 'Link QR kustom berisi nominal donasi, nama penyumbang, dan doa khusus.',
    raw: 'https://kasmasjid.web.id/pay?amount=75000&donor=Budi%20Santoso&notes=Sedekah%20Jumat%20Barokah'
  }
];

export default function QrisSimulationView({ onAddDonation }: QrisSimulationViewProps) {
  const [donationStep, setDonationStep] = useState<'form' | 'qris' | 'verifying' | 'success'>('form');
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState<number>(50000);
  const [customAmountStr, setCustomAmountStr] = useState('');
  const [donorNotes, setDonorNotes] = useState('');
  const [uniqueCode, setUniqueCode] = useState(0);
  const [countdown, setCountdown] = useState(300); // 5 mins in seconds
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('');

  // QR Code Scanner States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState<{
    type: string;
    amount: number | null;
    merchantName?: string | null;
    donorName?: string | null;
    reference?: string | null;
    notes?: string | null;
    rawText: string;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeScanTab, setActiveScanTab] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

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

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Camera Management for scanning
  useEffect(() => {
    if (isScannerOpen && activeScanTab === 'camera') {
      Html5Qrcode.getCameras()
        .then((devices) => {
          setCameraDevices(devices);
          if (devices.length > 0) {
            const backCam = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('environment') || 
              d.label.toLowerCase().includes('belakang')
            );
            const defaultId = backCam ? backCam.id : devices[0].id;
            setSelectedCameraId(defaultId);
            startScanning(defaultId);
          } else {
            setScanError('Tidak menemukan perangkat kamera.');
          }
        })
        .catch((err) => {
          setScanError('Gagal mengakses kamera. Silakan periksa izin kamera browser.');
          console.error(err);
        });
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isScannerOpen, activeScanTab]);

  const startScanning = (cameraId: string) => {
    stopScanning().then(() => {
      setScanError(null);
      setIsCameraActive(true);
      
      const html5QrCode = new Html5Qrcode("scanner-viewport");
      html5QrCodeRef.current = html5QrCode;
      
      html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        },
        (qrCodeMessage) => {
          handleSuccessfulScan(qrCodeMessage);
        },
        (errorMessage) => {
          // Verbose scanner feedback, safely ignore
        }
      ).catch((err) => {
        setScanError('Gagal memulai kamera: ' + err);
        setIsCameraActive(false);
      });
    });
  };

  const stopScanning = (): Promise<void> => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      return html5QrCodeRef.current.stop()
        .then(() => {
          html5QrCodeRef.current = null;
          setIsCameraActive(false);
        })
        .catch((err) => {
          console.error("Gagal menghentikan scanner:", err);
          html5QrCodeRef.current = null;
          setIsCameraActive(false);
        });
    }
    return Promise.resolve();
  };

  const handleSuccessfulScan = (rawText: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    stopScanning();
    
    const parsed = parseQrisString(rawText);
    if (parsed) {
      setScannedResult({
        ...parsed,
        rawText
      });
      setScanError(null);
    } else {
      setScannedResult({
        type: 'Teks Arbitrer / Custom QR',
        amount: null,
        rawText,
        notes: rawText
      });
      setScanError('Format QR tidak mengandung data transaksi standar. Silakan masukkan nominal manual.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setScanError(null);
    setScannedResult(null);

    const fileScanner = new Html5Qrcode("scanner-file-hidden");
    fileScanner.scanFile(file, true)
      .then((qrCodeMessage) => {
        setUploadLoading(false);
        handleSuccessfulScan(qrCodeMessage);
      })
      .catch((err) => {
        setUploadLoading(false);
        setScanError('Gagal membaca QR Code dari gambar. Pastikan gambar cukup terang, terpusat, dan jelas.');
        console.error(err);
      });
  };

  const applyScannedResult = () => {
    if (!scannedResult) return;
    
    if (scannedResult.amount) {
      setDonationAmount(scannedResult.amount);
      setCustomAmountStr(scannedResult.amount.toString());
    }
    
    if (scannedResult.donorName) {
      setDonorName(scannedResult.donorName);
    }
    
    let combinedNotes = '';
    if (scannedResult.merchantName) {
      combinedNotes += `Penerima: ${scannedResult.merchantName}. `;
    }
    if (scannedResult.reference) {
      combinedNotes += `Invoice: ${scannedResult.reference}. `;
    }
    if (scannedResult.notes) {
      combinedNotes += scannedResult.notes;
    }
    
    setDonorNotes(combinedNotes.trim() || 'Sedekah Hasil Scan QR');
    setIsScannerOpen(false);
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
            onAddDonation(finalAmount, donorName.trim() || 'Hamba Allah', donorNotes.trim() || 'Sedekah Mandiri QRIS');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto py-2">
      {/* Informational Guidance on Left */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-emerald-950 flex space-x-3 items-start shadow-sm">
          <span className="text-2xl">💰</span>
          <div className="space-y-1">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">Modul Simulasi QRIS</h5>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Halaman ini didesain khusus untuk mensimulasikan transaksi masuk secara instan via pembayaran digital QRIS standar Bank Indonesia.
            </p>
          </div>
        </div>

        {/* Real-world Scanning Feature Highlight Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 border border-emerald-800 rounded-2xl p-5 text-white space-y-3 shadow-md">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
            <h5 className="text-xs font-black uppercase tracking-wider text-amber-300">Baru: Scan QR Code Donasi Riil</h5>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-200">
            Kini portal e-Kas mendukung pengisian data donasi otomatis menggunakan sensor pemindaian QRIS nyata!
          </p>
          <ul className="text-[10px] text-slate-300 space-y-1.5 list-disc list-inside">
            <li>Dapat membaca QRIS standard EMVCo (GPN/E-Wallet).</li>
            <li>Mengurai otomatis data nominal tersembunyi.</li>
            <li>Mengisi nama donatur &amp; tujuan masjid secara instan.</li>
          </ul>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-700 space-y-2 shadow-sm">
          <span className="text-xl">💡</span>
          <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Bagaimana Cara Mengujinya?</h5>
          <ol className="text-[11px] text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Isi nama Anda (atau biarkan kosong sebagai <span className="font-semibold text-slate-700">Hamba Allah</span>).</li>
            <li>Pilih nominal infaq atau masukkan jumlah kustom Anda sendiri.</li>
            <li>Klik <span className="font-semibold text-emerald-800">Lanjut ke QRIS Sedekah</span> untuk melihat visual QRIS dinamis lengkap dengan <span className="text-emerald-700 font-semibold">kode unik verifikasi</span>.</li>
            <li>Klik <span className="font-semibold text-emerald-800">Saya Sudah Bayar</span> untuk mensimulasikan pengecekan otomatis (auto-checking) dana dari Bank.</li>
            <li>Selesai! Dana akan otomatis terinput di database kas masuk dan saldo kas masjid akan langsung bertambah secara real-time.</li>
          </ol>
        </div>
      </div>

      {/* Interactive QRIS Donation Wizard on Right */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md">
        {donationStep === 'form' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Simulasi Kas Masuk via QRIS
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">Active</span>
            </div>

            {/* Scanning Feature Entrance */}
            <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between gap-3 shadow-inner">
              <div className="space-y-1">
                <h6 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-emerald-600" />
                  <span>Scan QR Code Donasi Nyata</span>
                </h6>
                <p className="text-[10px] text-slate-500 leading-normal max-w-[280px]">
                  Pindai brosur masjid, flyer, atau QRIS nyata untuk mengisi form secara otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsScannerOpen(true);
                  setScannedResult(null);
                  setScanError(null);
                  setActiveScanTab('camera');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition shadow-sm shrink-0 cursor-pointer"
              >
                Mulai Pindai
              </button>
            </div>

            <div className="space-y-3">
              {/* Donor Name Input */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                  Nama Donatur / Pembayar (Hamba Allah jika kosong)
                </label>
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
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                  Pilih Nominal Sedekah
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10000, 25000, 50000, 100000, 250000, 500000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setDonationAmount(amount);
                        setCustomAmountStr('');
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        donationAmount === amount && !customAmountStr
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                  Nominal Kustom (Rp)
                </label>
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
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                  Doa / Keterangan Tambahan
                </label>
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
                // Generate unique code suffix (random 1-99)
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
                ✓ Dana telah otomatis tercatat secara real-time pada buku kas umum jemaah. Jazakumullah Khairan Katsiran.
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

      {/* Immersive Modal for QR Scanning and Decoding */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">📷</span>
                <div>
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Pemindai QR Donasi</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">Pindai QR nyata atau pilih simulasi berkas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopScanning();
                  setIsScannerOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveScanTab('camera')}
                className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-lg transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer ${
                  activeScanTab === 'camera'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScanTab('upload')}
                className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-lg transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer ${
                  activeScanTab === 'upload'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Unggah Gambar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScanTab('samples')}
                className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-lg transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer ${
                  activeScanTab === 'samples'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Kode Contoh</span>
              </button>
            </div>

            {/* Error Message banner */}
            {scanError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-800 flex items-start gap-2 text-[10px] leading-relaxed">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Kesalahan: </span>
                  {scanError}
                </div>
              </div>
            )}

            {/* Scanned Result Card - Prominent Preview */}
            {scannedResult && (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center space-x-1.5 text-emerald-900 font-extrabold text-[11px] uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>QR Code Terbaca!</span>
                </div>
                
                <div className="space-y-1.5 text-[10px] text-slate-700 bg-white p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-semibold">Tipe Sumber QR:</span>
                    <span className="font-extrabold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded text-[9px] uppercase">{scannedResult.type}</span>
                  </div>

                  {scannedResult.merchantName && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-semibold">Tujuan / Merchant:</span>
                      <span className="font-bold text-slate-800 text-right">{scannedResult.merchantName}</span>
                    </div>
                  )}

                  {scannedResult.donorName && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-semibold">Nama Donatur:</span>
                      <span className="font-bold text-slate-800">{scannedResult.donorName}</span>
                    </div>
                  )}

                  {scannedResult.reference && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-semibold">Ref Invoice / Bill:</span>
                      <span className="font-mono font-bold text-slate-600">{scannedResult.reference}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-800 font-bold">Nominal Donasi:</span>
                    {scannedResult.amount ? (
                      <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{formatRupiah(scannedResult.amount)}</span>
                    ) : (
                      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-[9px]">User Input Manual</span>
                    )}
                  </div>

                  {scannedResult.notes && (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <span className="text-slate-400 font-semibold block mb-0.5">Catatan Terdeteksi:</span>
                      <p className="p-2 bg-slate-50 rounded-lg text-[9px] text-slate-500 italic border border-slate-100 leading-normal">
                        "{scannedResult.notes}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScannedResult(null);
                      if (activeScanTab === 'camera' && selectedCameraId) {
                        startScanning(selectedCameraId);
                      }
                    }}
                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-xl transition cursor-pointer text-center"
                  >
                    Atur Ulang
                  </button>
                  <button
                    type="button"
                    onClick={applyScannedResult}
                    className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Konfirmasi &amp; Isi Form</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 1: CAMERA SCANNING VIEWPORT */}
            {activeScanTab === 'camera' && !scannedResult && (
              <div className="space-y-4">
                {/* Camera Selection Dropdown */}
                {cameraDevices.length > 1 && (
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pilih Perangkat Kamera</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value);
                        startScanning(e.target.value);
                      }}
                      className="w-full text-xs font-semibold p-2 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      {cameraDevices.map((device) => (
                        <option key={device.id} value={device.id}>
                          {device.label || `Kamera ${device.id.substring(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Live Scanner Screen Frame */}
                <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-900 shadow-inner flex flex-col justify-center items-center">
                  
                  {/* Neon Target Scanner Box Overlay */}
                  <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-emerald-500/80 rounded-xl relative">
                      {/* Bounding corner accents */}
                      <span className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl"></span>
                      <span className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr"></span>
                      <span className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl"></span>
                      <span className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br"></span>
                      
                      {/* Horizontal Scanning pulsing laser line */}
                      <div className="absolute left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" style={{ top: '45%' }}></div>
                    </div>
                  </div>

                  {/* html5-qrcode live video mounts here */}
                  <div id="scanner-viewport" className="w-full h-full object-cover"></div>

                  {/* Loading camera indicator */}
                  {!isCameraActive && (
                    <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center space-y-2 text-white">
                      <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
                      <p className="text-[10px] text-slate-400">Menghubungkan aliran video...</p>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-slate-400 leading-normal max-w-sm mx-auto">
                    Arahkan kamera ke QR Code atau QRIS donasi. Sensor pemindai akan mendeteksi dan mengurai isinya secara otomatis.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: IMAGE FILE UPLOAD */}
            {activeScanTab === 'upload' && !scannedResult && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-300 rounded-2xl p-6 transition flex flex-col items-center justify-center bg-slate-50/50 hover:bg-emerald-50/10 cursor-pointer relative min-h-[160px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  
                  {uploadLoading ? (
                    <div className="flex flex-col items-center space-y-2">
                      <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin" />
                      <p className="text-[11px] font-bold text-emerald-800">Membaca berkas QR Code...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2 text-center">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-600">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Tarik &amp; taruh berkas gambar di sini</p>
                      <p className="text-[10px] text-slate-400">Atau klik untuk menjelajahi berkas (Format: JPG, PNG, WebP)</p>
                    </div>
                  )}
                </div>

                {/* Hidden container required by html5-qrcode file API */}
                <div id="scanner-file-hidden" className="hidden"></div>
              </div>
            )}

            {/* Tab 3: SAMPLES PRESETS FOR SIMULATION */}
            {activeScanTab === 'samples' && !scannedResult && (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  💡 Tidak membawa QR Code nyata? Klik salah satu preset donasi nyata di bawah ini untuk mensimulasikan hasil dekoder QRIS/URL yang sukses dibaca oleh pemindai:
                </p>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {demoQrisPresets.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const parsed = parseQrisString(preset.raw);
                        if (parsed) {
                          setScannedResult({
                            ...parsed,
                            rawText: preset.raw
                          });
                          setScanError(null);
                        }
                      }}
                      className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition duration-150 flex justify-between items-center gap-2 cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <h6 className="text-[11px] font-black text-slate-800">{preset.title}</h6>
                        <p className="text-[9px] text-slate-400 leading-normal">{preset.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
