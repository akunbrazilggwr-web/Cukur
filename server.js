const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!IS_VERCEL) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!process.env.SESSION_SECRET || !process.env.ADMIN_PASSWORD) {
  console.warn('PERINGATAN: atur SESSION_SECRET dan ADMIN_PASSWORD melalui environment sebelum dipakai.');
}
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(session({
  name: 'rusdi.sid',
  secret: process.env.SESSION_SECRET || 'dev-only-change-this-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 2 * 60 * 60 * 1000 }
}));

const defaultData = {
  barber: { name: 'Rusdi', age: 29, shopName: 'Cukur Rambut Mas Rusdi', description: 'Potongan rapi, nyaman, dan bersahabat. Mampir untuk tampil lebih percaya diri.' },
  prices: [{ id: 1, name: 'Cukur rambut dewasa', price: 15000 }, { id: 2, name: 'Cukur rambut anak', price: 12000 }, { id: 3, name: 'Cukur + styling', price: 20000 }],
  products: [{ id: 1, name: 'Pomade rambut', description: 'Untuk membantu menata rambut sehari-hari.', price: 25000 }],
  stats: { visitors: 0, orders: 0, likes: 0 },
  appearance: { headline: 'Rapi itu bikin percaya diri.', subheadline: 'Cukur nyaman, hasil maksimal bersama Mas Rusdi.' }
};
function loadData() {
  if (!IS_VERCEL) {
    try { return { ...defaultData, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }; }
    catch { /* gunakan data awal jika file belum tersedia */ }
  }
  return JSON.parse(JSON.stringify(defaultData));
}
let data = loadData();
function saveData() {
  // Vercel Functions memiliki filesystem sementara; penyimpanan file hanya untuk lokal.
  if (!IS_VERCEL) fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function isLocalDevelopmentBypass(req) {
  const ip = (req.ip || '').replace('::ffff:', '');
  return process.env.NODE_ENV !== 'production'
    && process.env.ALLOW_LOCAL_ADMIN_BYPASS === 'true'
    && (ip === '127.0.0.1' || ip === '::1');
}
function adminOnly(req, res, next) {
  if (req.session.admin || isLocalDevelopmentBypass(req)) return next();
  return res.status(401).json({ error: 'Silakan login sebagai admin.' });
}
const upload = multer({
  storage: IS_VERCEL ? multer.memoryStorage() : multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`)
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('Hanya file gambar JPG, PNG, WEBP, atau GIF yang diperbolehkan.'), ok);
  }
});

app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));
app.get('/robots.txt', (_req, res) => res.type('text/plain').sendFile(path.join(__dirname, 'robots.txt')));
app.get('/admin/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.admin && !isLocalDevelopmentBypass(req)) return res.redirect('/admin/');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/api/site', (_req, res) => {
  data.stats.visitors += 1; saveData();
  res.json({ barber: data.barber, prices: data.prices, products: data.products, appearance: data.appearance, stats: data.stats });
});
app.post('/api/order', (req, res) => {
  const { name, service, phone } = req.body || {};
  if (![name, service, phone].every(v => typeof v === 'string' && v.trim()) || name.length > 80 || phone.length > 30 || service.length > 100) {
    return res.status(400).json({ error: 'Mohon isi nama, layanan, dan nomor kontak dengan benar.' });
  }
  data.stats.orders += 1; saveData();
  res.json({ ok: true, message: 'Permintaan tercatat. Silakan hubungi Mas Rusdi untuk konfirmasi jadwal.' });
});
app.post('/api/like', (_req, res) => {
  data.stats.likes += 1; saveData(); res.json({ likes: data.stats.likes });
});
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedPass || username !== expectedUser || typeof password !== 'string' || password !== expectedPass) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Gagal membuat sesi login.' });
    req.session.admin = true;
    res.json({ ok: true, redirect: '/admin/dashboard' });
  });
});
app.post('/api/admin/logout', adminOnly, (req, res) => req.session.destroy(() => res.json({ ok: true, redirect: '/admin/' })));
app.get('/api/admin/data', adminOnly, (_req, res) => res.json(data));
app.post('/api/admin/appearance', adminOnly, (req, res) => {
  const { headline, subheadline, description, shopName } = req.body || {};
  if (![headline, subheadline, description, shopName].every(v => typeof v === 'string') || headline.length > 120 || subheadline.length > 200 || description.length > 500 || shopName.length > 100) {
    return res.status(400).json({ error: 'Periksa isian dan batas panjang teks.' });
  }
  data.appearance = { headline: headline.trim(), subheadline: subheadline.trim() };
  data.barber.description = description.trim(); data.barber.shopName = shopName.trim();
  saveData(); res.json({ ok: true });
});
app.post('/api/admin/prices', adminOnly, (req, res) => {
  const prices = req.body?.prices;
  if (!Array.isArray(prices) || prices.length > 30 || prices.some(p => typeof p.name !== 'string' || p.name.trim().length > 80 || !Number.isInteger(Number(p.price)) || Number(p.price) < 0 || Number(p.price) > 10000000)) {
    return res.status(400).json({ error: 'Data harga tidak valid.' });
  }
  data.prices = prices.map((p, i) => ({ id: Number(p.id) || Date.now() + i, name: p.name.trim(), price: Number(p.price) }));
  saveData(); res.json({ ok: true });
});
app.post('/api/admin/products', adminOnly, (req, res) => {
  const { name, description, price } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || name.length > 80 || typeof description !== 'string' || description.length > 250 || !Number.isInteger(Number(price)) || Number(price) < 0 || Number(price) > 10000000) return res.status(400).json({ error: 'Data produk tidak valid.' });
  data.products.push({ id: Date.now(), name: name.trim(), description: description.trim(), price: Number(price) });
  saveData(); res.json({ ok: true, products: data.products });
});
app.post('/api/admin/upload', adminOnly, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Pilih file gambar terlebih dahulu.' });
  const url = IS_VERCEL
    ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    : `/uploads/${req.file.filename}`;
  res.json({ ok: true, url, message: 'Gambar berhasil diunggah. Salin URL untuk digunakan di halaman.' });
});
app.use((err, _req, res, _next) => res.status(400).json({ error: err.message || 'Permintaan tidak valid.' }));
if (require.main === module && !IS_VERCEL) {
  app.listen(PORT, () => console.log(`Website Mas Rusdi berjalan di http://localhost:${PORT}`));
}
module.exports = app;
