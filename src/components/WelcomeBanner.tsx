import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ActivityItem, WelcomeBannerConfig } from '../types';
import { Calendar, Clock, BookOpen, Plus, Trash2, Edit2, Check, X, Eye, EyeOff, LayoutGrid, Sparkles } from 'lucide-react';

export const defaultWelcomeBannerConfig: WelcomeBannerConfig = {
  judul: '🕌 Jadwal Kegiatan & Kajian Mingguan DKM Al-Amanah',
  subjudul: 'Mari Makmurkan Masjid & Raih Ridho-Nya Bersama Kami',
  pesanSambutan: 'Assalamu\'alaikum Wr. Wb. Selamat datang di portal transparansi KasMasjid. Selaku pengurus DKM, kami mengundang bapak, ibu, dan seluruh jemaah sekalian untuk menghadiri dan memakmurkan kegiatan rutin ibadah, kajian, serta sosial kemasyarakatan di masjid kami.',
  aktif: true,
  jadwalMingguan: [
    {
      id: 'ACT-1',
      hari: 'Senin',
      waktu: 'Ba\'da Maghrib',
      kegiatan: 'Kajian Tafsir Al-Qur\'an (Surah Al-Kahfi)',
      pemateri: 'Ust. Dr. KH. Syarifuddin, M.A.',
    },
    {
      id: 'ACT-2',
      hari: 'Rabu',
      waktu: 'Ba\'da Isya',
      kegiatan: 'Tahsin & Tartil Al-Qur\'an Remaja & Dewasa',
      pemateri: 'Ust. Muhammad Al-Fatih',
    },
    {
      id: 'ACT-3',
      hari: 'Kamis',
      waktu: '18:15 - Selesai',
      kegiatan: 'Yasinan, Dzikir Bersama & Doa Kebangsaan',
      pemateri: 'Jemaah & Pengurus DKM Al-Amanah',
    },
    {
      id: 'ACT-4',
      hari: 'Jumat',
      waktu: '11:45 - 13:00',
      kegiatan: 'Salat Jumat Berjamaah & Khutbah Mingguan',
      pemateri: 'Drs. KH. Ahmad Fauzi (Ketua DKM)',
    },
    {
      id: 'ACT-5',
      hari: 'Sabtu',
      waktu: 'Ba\'da Subuh',
      kegiatan: 'Kajian Riyadhus Shalihin & Sarapan Bersama',
      pemateri: 'Ust. Adi Hidayat, Lc. (Bintang Tamu)',
    },
    {
      id: 'ACT-6',
      hari: 'Ahad',
      waktu: '07:30 - 09:00',
      kegiatan: 'Kajian Dhuha Rutin & Pemeriksaan Kesehatan Gratis',
      pemateri: 'Dr. KH. Ahmad Fauzi & Tim Medis DKM',
    }
  ],
};

interface WelcomeBannerProps {
  config: WelcomeBannerConfig;
}

export function WelcomeBanner({ config }: WelcomeBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!config.aktif) return null;

  const getDayColor = (day: string) => {
    switch (day.toLowerCase()) {
      case 'jumat': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'sabtu':
      case 'ahad': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sortedActivities = [...config.jadwalMingguan].sort((a, b) => {
    const daysOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'ahad'];
    return daysOrder.indexOf(a.hari.toLowerCase()) - daysOrder.indexOf(b.hari.toLowerCase());
  });

  return (
    <motion.div
      id="welcome-banner-card"
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-850 via-emerald-800 to-emerald-750 p-6 text-white relative">
        <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
          <Calendar className="h-32 w-32" />
        </div>
        
        <div className="max-w-4xl space-y-2">
          <div className="inline-flex items-center space-x-2 bg-emerald-900/50 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border border-emerald-700 text-emerald-200">
            <Sparkles className="h-3 w-3 animate-pulse text-amber-400" />
            <span>Sambutan &amp; Informasi Kegiatan</span>
          </div>
          
          <h2 className="text-lg sm:text-xl font-black tracking-tight">{config.judul}</h2>
          <p className="text-xs text-emerald-100 font-medium">{config.subjudul}</p>
          <p className="text-xs leading-relaxed text-emerald-50/90 pt-1 font-sans font-light">
            {config.pesanSambutan}
          </p>
        </div>

        <div className="mt-4 flex justify-between items-center pt-3 border-t border-emerald-700/50">
          <span className="text-[10px] text-emerald-200/90 font-bold flex items-center gap-1">
            📅 Diupdate secara berkala oleh DKM Masjid
          </span>
          <button
            id="btn-toggle-schedule"
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-700/60 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
          >
            {isExpanded ? '⚡ Sembunyikan Jadwal' : '⚡ Tampilkan Jadwal'}
          </button>
        </div>
      </div>

      {/* Grid of Weekly Activities */}
      {isExpanded && (
        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 mb-4">
            <Calendar className="h-4.5 w-4.5 text-emerald-700" />
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest block">
              Jadwal Kegiatan Rutin Mingguan (Berdasarkan Hari)
            </span>
          </div>

          {sortedActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedActivities.map((act, index) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getDayColor(act.hari)}`}>
                        {act.hari}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-slate-400" /> {act.waktu}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-slate-800 leading-snug">
                        {act.kegiatan}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{act.pemateri || 'Seluruh Jemaah'}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white border border-dashed border-slate-200 rounded-2xl">
              <span className="text-3xl block mb-2">🕌</span>
              <p className="text-xs text-slate-400 italic font-semibold">Tidak ada jadwal kegiatan khusus pekan ini.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

interface WelcomeBannerEditorProps {
  config: WelcomeBannerConfig;
  onUpdateConfig: (newConfig: WelcomeBannerConfig) => void;
}

export function WelcomeBannerEditor({ config, onUpdateConfig }: WelcomeBannerEditorProps) {
  const [judul, setJudul] = useState(config.judul);
  const [subjudul, setSubjudul] = useState(config.subjudul);
  const [pesanSambutan, setPesanSambutan] = useState(config.pesanSambutan);
  const [aktif, setAktif] = useState(config.aktif);

  // New item form states
  const [newHari, setNewHari] = useState('Senin');
  const [newWaktu, setNewWaktu] = useState('');
  const [newKegiatan, setNewKegiatan] = useState('');
  const [newPemateri, setNewPemateri] = useState('');

  // Editing single item states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHari, setEditHari] = useState('');
  const [editWaktu, setEditWaktu] = useState('');
  const [editKegiatan, setEditKegiatan] = useState('');
  const [editPemateri, setEditPemateri] = useState('');

  const handleSaveMeta = () => {
    onUpdateConfig({
      ...config,
      judul,
      subjudul,
      pesanSambutan,
      aktif,
    });
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaktu || !newKegiatan) return;

    const newItem: ActivityItem = {
      id: 'ACT-' + Math.floor(1000 + Math.random() * 9000),
      hari: newHari,
      waktu: newWaktu,
      kegiatan: newKegiatan,
      pemateri: newPemateri || 'Seluruh Jemaah',
    };

    onUpdateConfig({
      ...config,
      jadwalMingguan: [...config.jadwalMingguan, newItem],
    });

    // Reset fields
    setNewWaktu('');
    setNewKegiatan('');
    setNewPemateri('');
  };

  const handleDeleteActivity = (id: string) => {
    onUpdateConfig({
      ...config,
      jadwalMingguan: config.jadwalMingguan.filter(act => act.id !== id),
    });
  };

  const startEditActivity = (act: ActivityItem) => {
    setEditingId(act.id);
    setEditHari(act.hari);
    setEditWaktu(act.waktu);
    setEditKegiatan(act.kegiatan);
    setEditPemateri(act.pemateri);
  };

  const handleSaveEditActivity = (id: string) => {
    const updated = config.jadwalMingguan.map(act => {
      if (act.id === id) {
        return {
          id,
          hari: editHari,
          waktu: editWaktu,
          kegiatan: editKegiatan,
          pemateri: editPemateri,
        };
      }
      return act;
    });

    onUpdateConfig({
      ...config,
      jadwalMingguan: updated,
    });

    setEditingId(null);
  };

  const loadPresetTemplate = (type: string) => {
    let preset: Omit<ActivityItem, 'id'> | null = null;
    if (type === 'subuh') {
      preset = {
        hari: 'Ahad',
        waktu: '04:30 - 06:00',
        kegiatan: 'Kajian Subuh Berjamaah & Pembahasan Kitab Bulughul Maram',
        pemateri: 'Ustadz Wijayanto',
      };
    } else if (type === 'jumat') {
      preset = {
        hari: 'Jumat',
        waktu: '11:45 - 13:00',
        kegiatan: 'Pelaksanaan Ibadah Salat Jumat & Khutbah Jumat',
        pemateri: 'Imam & Khatib Masjid Al-Amanah',
      };
    } else if (type === 'tahsin') {
      preset = {
        hari: 'Selasa',
        waktu: 'Ba\'da Isya',
        kegiatan: 'Kelas Belajar Tajwid & Perbaikan Bacaan Al-Qur\'an',
        pemateri: 'Ustadz Muammar ZA',
      };
    }

    if (preset) {
      setNewHari(preset.hari);
      setNewWaktu(preset.waktu);
      setNewKegiatan(preset.kegiatan);
      setNewPemateri(preset.pemateri);
    }
  };

  return (
    <div id="welcome-banner-editor" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="space-y-0.5">
          <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
            🕌 Atur Banner Sambutan &amp; Jadwal Kegiatan
          </h4>
          <p className="text-xs text-slate-400">Atur sambutan halaman utama dan infomasikan jadwal mingguan kepada Jemaah</p>
        </div>
        <button
          id="btn-toggle-active-banner"
          onClick={() => {
            const nextVal = !aktif;
            setAktif(nextVal);
            onUpdateConfig({ ...config, aktif: nextVal });
          }}
          className={`px-3 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider border cursor-pointer flex items-center gap-1.5 transition ${
            aktif
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-100'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
          }`}
        >
          {aktif ? <Eye className="h-3.5 w-3.5 text-emerald-700" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
          {aktif ? 'Banner Ditampilkan' : 'Banner Disembunyikan'}
        </button>
      </div>

      {/* Meta Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
        <div className="space-y-3 md:col-span-2">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
            ✍️ Pengaturan Teks Banner
          </span>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Judul Utama Banner</label>
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full text-xs font-semibold p-2 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            placeholder="e.g. 🕌 Jadwal Kegiatan & Kajian Mingguan DKM Al-Amanah"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Sub-judul Banner</label>
          <input
            type="text"
            value={subjudul}
            onChange={(e) => setSubjudul(e.target.value)}
            className="w-full text-xs font-semibold p-2 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            placeholder="e.g. Mari Makmurkan Masjid & Raih Ridho-Nya Bersama Kami"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Paragraf Pesan Sambutan</label>
          <textarea
            rows={3}
            value={pesanSambutan}
            onChange={(e) => setPesanSambutan(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none resize-none leading-relaxed"
            placeholder="Assalamu'alaikum Wr. Wb. Selamat datang..."
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveMeta}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" /> Simpan Teks Banner
          </button>
        </div>
      </div>

      {/* Interactive Activity Manager */}
      <div className="space-y-4">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
          📋 Kelola Baris Kegiatan Mingguan
        </span>

        {/* Existing List of Activities Table */}
        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Hari</th>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Nama Kegiatan</th>
                  <th className="p-3">Pemateri / PJ</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {config.jadwalMingguan.map((act) => {
                  const isEditing = editingId === act.id;
                  return (
                    <tr key={act.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">
                        {isEditing ? (
                          <select
                            value={editHari}
                            onChange={(e) => setEditHari(e.target.value)}
                            className="p-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                          >
                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'].map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        ) : (
                          act.hari
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editWaktu}
                            onChange={(e) => setEditWaktu(e.target.value)}
                            className="p-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white w-24 font-mono font-bold"
                          />
                        ) : (
                          <span className="font-mono font-bold text-slate-600">{act.waktu}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editKegiatan}
                            onChange={(e) => setEditKegiatan(e.target.value)}
                            className="p-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white w-full font-bold"
                          />
                        ) : (
                          <span className="font-extrabold text-slate-800">{act.kegiatan}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editPemateri}
                            onChange={(e) => setEditPemateri(e.target.value)}
                            className="p-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white w-full"
                          />
                        ) : (
                          <span className="text-slate-500 font-semibold">{act.pemateri}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveEditActivity(act.id)}
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition cursor-pointer"
                                title="Simpan Perubahan"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition cursor-pointer"
                                title="Batal"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditActivity(act)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                                title="Edit Baris"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteActivity(act.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition cursor-pointer"
                                title="Hapus Baris"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {config.jadwalMingguan.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic font-semibold bg-slate-50/50">
                      Belum ada jadwal kegiatan mingguan. Isi form di bawah untuk menambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Activity Form */}
        <form onSubmit={handleAddActivity} className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2 border-b pb-2">
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest block">
              ➕ Tambah Kegiatan Baru
            </span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => loadPresetTemplate('subuh')}
                className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[9px] px-2 py-1 rounded-md transition cursor-pointer"
              >
                Preset: Kajian Subuh
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('jumat')}
                className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[9px] px-2 py-1 rounded-md transition cursor-pointer"
              >
                Preset: Salat Jumat
              </button>
              <button
                type="button"
                onClick={() => loadPresetTemplate('tahsin')}
                className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[9px] px-2 py-1 rounded-md transition cursor-pointer"
              >
                Preset: Tahsin
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Hari</label>
              <select
                value={newHari}
                onChange={(e) => setNewHari(e.target.value)}
                className="w-full text-xs font-bold p-2.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'].map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Waktu / Jam</label>
              <input
                type="text"
                value={newWaktu}
                onChange={(e) => setNewWaktu(e.target.value)}
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. Ba'da Maghrib"
                required
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Nama Kegiatan</label>
              <input
                type="text"
                value={newKegiatan}
                onChange={(e) => setNewKegiatan(e.target.value)}
                className="w-full text-xs font-bold p-2.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. Kajian Tafsir Al-Qur'an"
                required
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Pemateri / Pembina / PJ</label>
              <input
                type="text"
                value={newPemateri}
                onChange={(e) => setNewPemateri(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                placeholder="e.g. Ust. Dr. KH. Syarifuddin, M.A. (Bila kosong: Jemaah & Pengurus)"
              />
            </div>

            <div className="flex items-end justify-end">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Tambahkan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
