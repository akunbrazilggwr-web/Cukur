# Cukur Rambut Mas Rusdi

Website responsif dengan halaman publik dan panel admin. Dibuat menggunakan HTML, CSS, JavaScript, dan Express.

## Menjalankan secara lokal
1. Pasang Node.js versi 18 atau lebih baru.
2. Salin `.env.example` menjadi `.env`.
3. Isi `ADMIN_PASSWORD` dengan password kuat dan `SESSION_SECRET` dengan string acak panjang.
4. Jalankan `npm install`, lalu `npm start`.
5. Buka `http://localhost:3000`.
6. Login admin melalui `http://localhost:3000/admin/`. Dashboard berada di `/admin/dashboard`.

Di Linux, bisa memakai:
```bash
cp .env.example .env
nano .env
npm install
npm start
```
Jangan commit file `.env`.

## Fitur
- Halaman publik: Tentang, Harga, Lokasi, profil Rusdi, formulir permintaan jadwal, tombol suka.
- Admin: statistik pengunjung/order/suka, edit teks halaman, unggah gambar, edit harga, tambah produk, logout.
- `robots.txt` memiliki petunjuk `/admin/dashboard`. Perlu diketahui, `robots.txt` bersifat publik dan bukan mekanisme keamanan.
- Panel admin dilindungi login. Unggahan dibatasi ke file gambar dan tidak menerima file script yang dapat dieksekusi.

## Deploy ke Vercel
Proyek sudah dilengkapi `vercel.json` dan entry point serverless `api/index.js`.

1. Upload folder proyek ke repository GitHub.
2. Buka Vercel, pilih **Add New → Project**, lalu import repository tersebut.
3. Framework Preset pilih **Other**. Biarkan Build Command dan Output Directory kosong jika Vercel mengizinkan.
4. Di **Settings → Environment Variables**, tambahkan:
   - `ADMIN_USERNAME` = username admin yang kamu inginkan
   - `ADMIN_PASSWORD` = password admin yang kuat
   - `SESSION_SECRET` = string acak panjang (minimal 32 karakter)
5. Klik **Deploy**.

### Catatan penting untuk deployment
- Website dan API sudah disesuaikan agar dapat dibangun sebagai Vercel Function; server tidak memanggil `app.listen()` pada Vercel.
- Vercel menggunakan filesystem sementara. Karena itu perubahan data/harga/statistik tidak dijamin tersimpan setelah instance serverless berganti atau cold start. Untuk data yang permanen, hubungkan database seperti Supabase/Postgres.
- Gambar yang diunggah pada Vercel dikembalikan sebagai data URL sehingga tidak memerlukan penulisan ke folder server. Untuk penggunaan banyak gambar, gunakan object storage seperti Vercel Blob.
- Login admin memerlukan Environment Variables di atas. Jangan mengaktifkan `ALLOW_LOCAL_ADMIN_BYPASS` pada deployment publik.
- `robots.txt` adalah petunjuk publik, bukan mekanisme keamanan.

## Catatan sebelum produksi
- Atur `SESSION_SECRET` dan `ADMIN_PASSWORD` yang kuat lewat environment variables.
- Gunakan HTTPS.
- Ganti session MemoryStore bawaan Express dengan session store persisten untuk produksi.
- Statistik pengunjung menghitung permintaan halaman yang meminta `/api/site`, bukan analitik unik berbasis cookie.
- Data awal lokasi hanya wilayah yang disebutkan; tambahkan alamat lengkap atau tautan peta setelah dikonfirmasi.


## Mode pengembangan lokal (opsional)
Jika ingin membuka `/admin/dashboard` tanpa login hanya di komputer sendiri, ubah `ALLOW_LOCAL_ADMIN_BYPASS=true` pada `.env` dan pastikan `NODE_ENV` bukan `production`. Mode ini hanya berlaku untuk koneksi loopback (`localhost`/`127.0.0.1`/`::1`). Jangan aktifkan di deployment publik. Pada Vercel/production, autentikasi admin tetap diwajibkan.
