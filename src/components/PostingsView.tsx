/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Postingan, Komentar } from '../types';
import { Megaphone, Heart, Info, Calendar, Trash2, PlusCircle, Target, TrendingUp, User as UserIcon, HelpCircle, Filter, MessageSquare, Send, ShieldCheck } from 'lucide-react';

interface PostingsViewProps {
  currentUser: User;
  postings: Postingan[];
  onAdd: (newPost: Omit<Postingan, 'id' | 'dibuatOleh' | 'namaPembuat' | 'timestamp'>) => void;
  onDelete: (id: string) => void;
  onDonateClick?: (campaignTitle: string, targetAmount?: number) => void;
  onAddComment: (postId: string, comment: Omit<Komentar, 'id' | 'timestamp' | 'tanggal'>) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
}

export default function PostingsView({
  currentUser,
  postings,
  onAdd,
  onDelete,
  onDonateClick,
  onAddComment,
  onDeleteComment,
}: PostingsViewProps) {
  // Form state
  const [judul, setJudul] = useState('');
  const [konten, setKonten] = useState('');
  const [tipe, setTipe] = useState<Postingan['tipe']>('Pengumuman');
  const [tautanDonasi, setTautanDonasi] = useState(false);
  const [targetDonasiStr, setTargetDonasiStr] = useState('');
  const [gambarUrl, setGambarUrl] = useState('');

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'Semua' | Postingan['tipe']>('Semua');

  // Comment inputs state map { [postId]: string }
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const isSecretary = currentUser.role === 'Sekretaris';
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const canDelete = isSecretary || isSuperAdmin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSecretary) return;

    if (!judul.trim() || !konten.trim()) {
      alert('Judul dan konten postingan tidak boleh kosong!');
      return;
    }

    const targetVal = tautanDonasi && targetDonasiStr ? parseInt(targetDonasiStr, 10) : undefined;

    onAdd({
      tanggal: new Date().toISOString().slice(0, 10),
      judul: judul.trim(),
      konten: konten.trim(),
      tipe,
      tautanDonasi,
      targetDonasi: targetVal,
      terkumpulDonasi: tautanDonasi ? 0 : undefined,
      gambarUrl: gambarUrl.trim() || undefined,
    });

    // Reset Form
    setJudul('');
    setKonten('');
    setTipe('Pengumuman');
    setTautanDonasi(false);
    setTargetDonasiStr('');
    setGambarUrl('');
  };

  const filteredPostings = postings.filter((p) => {
    if (activeFilter === 'Semua') return true;
    return p.tipe === activeFilter;
  });

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div id="postings-view-root" className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-wider flex items-center gap-2">
            📢 Kabar & Info Masjid
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Media publikasi pengumuman kegiatan, berita dakwah, dan ajakan donasi sosial oleh Sekretariat DKM Al-Amanah
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="category-filter" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-700 animate-pulse" /> Saring Kategori:
          </label>
          <select
            id="category-filter"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm cursor-pointer transition-all duration-200 pr-8 relative appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/></svg>")`,
              backgroundPosition: 'right 10px center',
              backgroundSize: '12px',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <option value="Semua">✨ Semua Kategori</option>
            <option value="Pengumuman">📢 Pengumuman</option>
            <option value="Ajakan Donasi">💝 Ajakan Donasi</option>
            <option value="Kegiatan">📅 Kegiatan</option>
            <option value="Informasi">ℹ️ Informasi Umum</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Posting Creation Form (Only Secretary can add) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-700" /> Tulis Kabar Baru
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Sekretaris Only</span>
          </div>

          {isSecretary ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Judul Postingan / Kabar</label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Undangan Kegiatan Tabligh Akbar..."
                  className="w-full text-xs font-semibold p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Kategori Kabar</label>
                <select
                  value={tipe}
                  onChange={(e) => {
                    const selected = e.target.value as Postingan['tipe'];
                    setTipe(selected);
                    if (selected === 'Ajakan Donasi') {
                      setTautanDonasi(true);
                    } else {
                      setTautanDonasi(false);
                    }
                  }}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Pengumuman">📢 Pengumuman</option>
                  <option value="Ajakan Donasi">💝 Ajakan Donasi</option>
                  <option value="Kegiatan">📅 Kegiatan</option>
                  <option value="Informasi">ℹ️ Informasi Umum</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <input
                  type="checkbox"
                  id="tautanDonasi"
                  checked={tautanDonasi}
                  onChange={(e) => setTautanDonasi(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                />
                <label htmlFor="tautanDonasi" className="text-[10px] font-bold text-slate-600 uppercase cursor-pointer">
                  Sediakan Tautan Infaq / Donasi QRIS
                </label>
              </div>

              {tautanDonasi && (
                <div className="animate-fade-in space-y-2">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Target Anggaran Penggalangan (Rp)</label>
                  <input
                    type="number"
                    value={targetDonasiStr}
                    onChange={(e) => setTargetDonasiStr(e.target.value)}
                    placeholder="Contoh: 15000000 (Kosongkan jika tidak ada target)"
                    className="w-full text-xs font-mono font-bold p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">URL Gambar / Poster Kegiatan</label>
                <input
                  type="url"
                  value={gambarUrl}
                  onChange={(e) => setGambarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau tautan gambar lainnya"
                  className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
                {gambarUrl.trim() && (
                  <div className="mt-2 p-1.5 border border-slate-200 bg-slate-50 rounded-xl">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">👀 Pratinjau Gambar</span>
                    <img
                      src={gambarUrl.trim()}
                      alt="Pratinjau poster"
                      className="w-full h-28 object-cover rounded-lg border border-slate-100"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Format+Tautan+Gambar+Salah';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Isi Konten / Kabar Lengkap</label>
                <textarea
                  rows={8}
                  value={konten}
                  onChange={(e) => setKonten(e.target.value)}
                  placeholder="Tuliskan berita, detail acara, waktu pelaksanaan, serta pesan ajakan kontribusi jamaah disini secara ramah dan santun..."
                  className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:ring-1 focus:ring-emerald-600 focus:outline-none resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer text-center"
              >
                Terbitkan Postingan 🚀
              </button>
            </form>
          ) : (
            /* Locked State with explicit Segregation of Duties explanation */
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-4">
              <div className="text-4xl">🔒</div>
              <div className="space-y-1">
                <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider">Akses Menulis Dibatasi</h5>
                <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
                  Peran login Anda saat ini adalah <span className="font-extrabold text-emerald-800">{currentUser.role}</span>.
                </p>
                <p className="text-[10px] leading-relaxed text-amber-800 mt-2">
                  Sesuai kebijakan tata kelola masjid (SOP), <strong>hanya Sekretaris Masjid</strong> yang berwenang menulis kabar dan mengelola papan publikasi humas.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200/50 text-[10px] text-slate-500 text-left leading-normal space-y-1">
                <p className="font-bold text-slate-700">💡 Cara Menguji Fitur Ini:</p>
                <p>Gunakan <strong>Simulator Peran</strong> di bagian atas layar untuk mengubah peran menjadi <b className="text-amber-900 font-extrabold">Budi Raharjo (Sekretaris)</b>.</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Posting Cards Feed */}
        <div className="lg:col-span-8 space-y-4">
          
          {filteredPostings.length > 0 ? (
            filteredPostings.map((post) => {
              const isCampaign = post.tipe === 'Ajakan Donasi' && post.tautanDonasi;
              const hasProgress = isCampaign && post.targetDonasi && post.targetDonasi > 0;
              const percent = hasProgress && post.terkumpulDonasi
                ? Math.min(100, Math.round((post.terkumpulDonasi / post.targetDonasi!) * 100))
                : 0;
              const isGoalReached = hasProgress && (post.terkumpulDonasi || 0) >= post.targetDonasi!;

              return (
                <div
                  key={post.id}
                  className={`bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 transition hover:shadow-md relative overflow-hidden ${
                    post.tipe === 'Ajakan Donasi' ? 'border-l-4 border-l-emerald-600' : ''
                  }`}
                >
                  {/* Badge & Metadata Row */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center flex-wrap gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          post.tipe === 'Ajakan Donasi'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : post.tipe === 'Pengumuman'
                            ? 'bg-rose-50 text-rose-800 border-rose-100'
                            : post.tipe === 'Kegiatan'
                            ? 'bg-blue-50 text-blue-800 border-blue-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {post.tipe === 'Ajakan Donasi' ? '💝' : post.tipe === 'Pengumuman' ? '📢' : post.tipe === 'Kegiatan' ? '📅' : 'ℹ️'}{' '}
                        {post.tipe}
                      </span>
                      {isCampaign && isGoalReached && (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white border border-emerald-600 flex items-center gap-1 shadow-xs animate-pulse">
                          ✅ Selesai
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">{post.id}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 font-bold">{post.tanggal}</span>
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus postingan "${post.judul}"?`)) {
                              onDelete(post.id);
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-red-500 rounded transition cursor-pointer"
                          title="Hapus Postingan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{post.judul}</h4>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-semibold">
                      <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                      <span>Diposting oleh: <strong className="text-slate-500">{post.namaPembuat}</strong> ({post.dibuatOleh})</span>
                    </div>
                  </div>

                  {/* Thumbnail Image if exists */}
                  {post.gambarUrl && (
                    <div className="w-full h-48 sm:h-60 overflow-hidden rounded-xl border border-slate-150">
                      <img
                        src={post.gambarUrl}
                        alt={post.judul}
                        className="w-full h-full object-cover hover:scale-102 transition duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Body Text */}
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {post.konten}
                  </p>

                  {/* Donation Tracking Box (if active campaign) */}
                  {isCampaign && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                      {isGoalReached && (
                        <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-950 rounded-xl p-3 flex items-start space-x-2 text-[11px] font-bold">
                          <span className="text-sm">🎉</span>
                          <div>
                            <span className="block font-black text-emerald-900">Alhamdulillah! Target Donasi Terpenuhi</span>
                            <span className="text-slate-500 font-semibold mt-0.5 block">Kampanye ini telah selesai dikumpulkan. Terima kasih atas kedermawanan Anda.</span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Akumulasi Infaq Jamaah</span>
                          <span className="text-sm font-black text-emerald-900 font-mono mt-0.5 block">
                            {formatRupiah(post.terkumpulDonasi || 0)}
                          </span>
                        </div>
                        {post.targetDonasi && post.targetDonasi > 0 && (
                          <div className="sm:text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Kebutuhan Dana</span>
                            <span className="text-xs font-bold text-slate-600 font-mono mt-0.5 block">
                              {formatRupiah(post.targetDonasi)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      {hasProgress && (
                        <div className="space-y-1">
                          <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full transition-all duration-300 ${isGoalReached ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Tercapai: {percent}%</span>
                            <span>Kekurangan: {formatRupiah(Math.max(0, post.targetDonasi! - (post.terkumpulDonasi || 0)))}</span>
                          </div>
                        </div>
                      )}

                      {/* Quick Donate Action Button */}
                      {onDonateClick && (
                        <button
                          type="button"
                          onClick={() => onDonateClick(post.judul, post.targetDonasi)}
                          className={`w-full py-2 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer text-center ${
                            isGoalReached ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {isGoalReached ? '💝 Salurkan Infaq Tambahan via QRIS ➔' : '💝 Berikan Infaq Dukungan Sekarang via QRIS ➔'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Share button */}
                  <div className="pt-2.5 border-t border-slate-100 mt-2 flex flex-col gap-3">
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

                    {/* Feedback & Comments Moderation Section */}
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-3 mt-1 text-left">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                          Feedback &amp; Pertanyaan Jemaah ({post.komentar?.length || 0})
                        </span>
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          🛡️ Moderasi Aktif
                        </span>
                      </div>

                      {/* Comment list */}
                      {post.komentar && post.komentar.length > 0 ? (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {post.komentar.map((comment) => {
                            const isPengurus = comment.role !== 'Jemaah';
                            return (
                              <div key={comment.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs text-xs space-y-1">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-slate-800 text-[10px]">
                                      {comment.nama}
                                    </span>
                                    {isPengurus ? (
                                      <span className="bg-emerald-800 text-white font-black text-[7px] uppercase tracking-widest px-1 py-0.2 rounded flex items-center gap-0.5">
                                        <ShieldCheck className="w-2 h-2" /> DKM
                                      </span>
                                    ) : (
                                      <span className="bg-slate-100 text-slate-500 font-bold text-[7px] uppercase tracking-widest px-1 py-0.2 rounded border border-slate-200">
                                        Jemaah
                                      </span>
                                    )}
                                    <span className="text-[9px] text-slate-400 font-medium font-mono">
                                      • {comment.tanggal}
                                    </span>
                                  </div>
                                  
                                  {/* Moderation delete button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Hapus komentar dari "${comment.nama}"?`)) {
                                        onDeleteComment(post.id, comment.id);
                                      }
                                    }}
                                    className="p-0.5 text-slate-300 hover:text-rose-600 transition cursor-pointer"
                                    title="Hapus / Moderasi Komentar"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed break-words whitespace-pre-wrap">
                                  {comment.konten}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-semibold text-center py-2 italic">
                          Belum ada pertanyaan atau tanggapan dari jemaah.
                        </p>
                      )}

                      {/* Add Reply/Comment Input Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const txt = commentInputs[post.id] || '';
                          if (!txt.trim()) return;
                          onAddComment(post.id, {
                            nama: currentUser.nama.split(' ')[0] || currentUser.nama,
                            email: currentUser.email,
                            konten: txt.trim(),
                            role: currentUser.role,
                          });
                          setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
                        }}
                        className="flex items-center gap-1.5 border-t border-slate-200/50 pt-2"
                      >
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Ketik tanggapan / instruksi DKM resmi..."
                          className="flex-1 text-[10px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                        />
                        <button
                          type="submit"
                          disabled={!(commentInputs[post.id] || '').trim()}
                          className="p-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-700 text-white rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl py-16 border border-slate-200 text-center text-slate-400 italic font-semibold">
              <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Tidak ada postingan kabar masjid dalam kategori "{activeFilter}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
