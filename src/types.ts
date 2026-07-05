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
