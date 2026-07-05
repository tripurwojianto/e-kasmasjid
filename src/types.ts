/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Super Admin' | 'Admin' | 'Bendahara 1' | 'Bendahara 2' | 'Sekretaris' | 'Ketua DKM' | 'Jemaah';

export interface User {
  email: string;
  nama: string;
  role: UserRole;
  status: 'Aktif' | 'Nonaktif';
  tanggalDaftar: string;
}

export interface KasMasuk {
  id: string;
  tanggal: string;
  kategori: string;
  keterangan: string;
  nominal: number;
  buktiUrl?: string;
  donatur?: string;
  inputOleh: string;
  timestamp: string;
}

export interface KasKeluar {
  id: string;
  tanggal: string;
  kategori: string;
  keterangan: string;
  nominal: number;
  buktiUrl?: string;
  inputOleh: string;
  timestamp: string;
}

export interface InventarisLogistik {
  id: string;
  tanggal: string;
  namaBarang: string;
  jenisLogistik: 'Masuk' | 'Keluar';
  kategori: string;
  volume: number;
  satuan: string;
  sumberPeruntukan: string;
  keterangan: string;
  inputOleh: string;
  timestamp: string;
}

export interface RapatPengajuan {
  id: string;
  tanggal: string;
  judul: string;
  deskripsi: string;
  estimasiBiaya: number;
  status: 'Draft' | 'Diajukan' | 'Disetujui' | 'Ditolak';
  diajukanOleh: string;
  disetujuiOleh?: string;
  timestamp: string;
}

export interface Kategori {
  namaKategori: string;
  jenis: 'Masuk' | 'Keluar';
}

export interface Komentar {
  id: string;
  nama: string;
  email: string;
  konten: string;
  tanggal: string;
  role: string;
  timestamp: string;
}

export interface Postingan {
  id: string;
  tanggal: string;
  judul: string;
  konten: string;
  tipe: 'Pengumuman' | 'Ajakan Donasi' | 'Kegiatan' | 'Informasi';
  tautanDonasi?: boolean;
  targetDonasi?: number;
  terkumpulDonasi?: number;
  gambarUrl?: string;
  dibuatOleh: string;
  namaPembuat: string;
  timestamp: string;
  komentar?: Komentar[];
}

export interface ActivityItem {
  id: string;
  hari: string;
  waktu: string;
  kegiatan: string;
  pemateri: string;
}

export interface WelcomeBannerConfig {
  judul: string;
  subjudul: string;
  pesanSambutan: string;
  aktif: boolean;
  jadwalMingguan: ActivityItem[];
}

export interface ArsipItem {
  id: string;
  nama: string;
  tipe: string;
  kategori: 'kajian' | 'administrasi' | 'dokumentasi' | 'lainnya';
  uploaderName: string;
  uploaderRole: string;
  tanggal: string;
  fileId: string;
  webViewLink?: string;
  webContentLink?: string;
  ukuran: string;
  deskripsi?: string;
}


