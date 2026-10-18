const money = n => new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
async function getSite() {
  try {
    const r = await fetch('/api/site'); const d = await r.json();
    document.getElementById('headline').innerHTML = (d.appearance.headline || 'Rapi itu bikin percaya diri.').replace(' percaya diri.', '<br><em>percaya diri.</em>');
    document.getElementById('subheadline').textContent = d.appearance.subheadline;
    document.getElementById('description').textContent = d.barber.description;
    document.getElementById('barber-name').textContent = d.barber.name;
    document.getElementById('price-list').innerHTML = d.prices.map(p => `<div class="price-row"><strong>${escapeHtml(p.name)}</strong><span>${money(p.price)}</span></div>`).join('');
    document.getElementById('product-list').innerHTML = d.products.map(p => `<article class="product-card"><div class="product-icon">✂</div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description)}</p><strong>${money(p.price)}</strong></article>`).join('');
    document.getElementById('like-count').textContent = d.stats.likes;
  } catch(e) { console.error('Gagal memuat data website', e); }
}
function escapeHtml(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
document.getElementById('booking-form').addEventListener('submit', async e => {
  e.preventDefault(); const form = new FormData(e.currentTarget);
  const r = await fetch('/api/order', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(form))});
  const d = await r.json(); document.getElementById('booking-notice').textContent = d.message || d.error;
  if(r.ok) e.currentTarget.reset();
});
document.getElementById('like-button').addEventListener('click', async () => {
  const r = await fetch('/api/like', {method:'POST'}); const d = await r.json();
  document.getElementById('like-count').textContent = d.likes;
});
getSite();
