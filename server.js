const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Data stok semasa (dikemaskini secara live)
let stockData = {
  cake: 38,
  combo: 15,
  triple: 10
};

let orders = [];

// --- FUNGSI FORMAT ORDER & AUTO-TOLAK STOK ---
function formatOrder(data) {
  const now = new Date();
  const formattedDate = data.date || data.createdAt || data.dateTime || now.toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' });
  const orderId = String(data.id || data.orderId || 'ORD-' + Math.floor(1000 + Math.random() * 9000)).trim();

  // 1. Tangkap items dari pelbagai format frontend
  let itemsFormatted = '';
  const rawItems = data.itemsOrdered || data.orderedItems || data.items || data.cart || data.products || data.orderItems || data.item || data.orderDetails;

  if (Array.isArray(rawItems) && rawItems.length > 0) {
    itemsFormatted = rawItems.map(item => {
      if (typeof item === 'string') return item;
      const name = item.name || item.productName || item.title || item.item || item.type || 'Product';
      const qty = item.quantity || item.qty || item.count || 1;
      return `${name} (x${qty})`;
    }).join(', ');
  } else if (typeof rawItems === 'string' && rawItems.trim() !== '' && rawItems !== 'undefined') {
    itemsFormatted = rawItems;
  } else if (rawItems && typeof rawItems === 'object' && Object.keys(rawItems).length > 0) {
    itemsFormatted = Object.entries(rawItems)
      .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
      .join(', ');
  }

  // 2. Jika item dihantar sebagai kuantiti spesifik
  let cakeQty = parseInt(data.cake || data.cakeQty || data.chocCake || 0);
  let comboQty = parseInt(data.combo || data.comboQty || 0);
  let tripleQty = parseInt(data.triple || data.tripleQty || 0);

  if (!itemsFormatted || itemsFormatted === 'undefined' || itemsFormatted === 'N/A') {
    let details = [];
    if (cakeQty > 0) details.push(`Choc Moist Cake (x${cakeQty})`);
    if (comboQty > 0) details.push(`Hokkaido Combo 2pcs (x${comboQty})`);
    if (tripleQty > 0) details.push(`Hokkaido Triple 3pcs (x${tripleQty})`);
    
    if (details.length > 0) {
      itemsFormatted = details.join(', ');
    } else {
      itemsFormatted = data.summary || data.note || data.description || 'Order Received';
    }
  }

  // 3. Auto tolak stok
  if (cakeQty > 0) stockData.cake = Math.max(0, stockData.cake - cakeQty);
  if (comboQty > 0) stockData.combo = Math.max(0, stockData.combo - comboQty);
  if (tripleQty > 0) stockData.triple = Math.max(0, stockData.triple - tripleQty);

  // 4. Return objek penuh dengan SEMUA kunci alternatif
  return {
    ...data,
    id: orderId,
    orderId: orderId,
    date: formattedDate,
    dateTime: formattedDate,
    createdAt: formattedDate,
    customerName: data.customerName || data.name || data.fullName || 'N/A',
    phone: data.phone || data.phoneNumber || data.contact || 'N/A',
    address: data.address || data.location || 'N/A',
    
    itemsOrdered: itemsFormatted,
    orderedItems: itemsFormatted,
    items: itemsFormatted,
    orderItems: itemsFormatted,
    cart: itemsFormatted,
    products: itemsFormatted,
    item: itemsFormatted,
    orderDetails: itemsFormatted,

    total: data.total || data.totalAmount || data.price || '0.00',
    payment: data.payment || data.paymentMethod || 'COD (Cash)',
    receipt: data.receipt || data.receiptUrl || 'N/A'
  };
}

// --- 1. ENDPOINT STOK (GET, POST, PUT) ---
app.get('/api/stock', (req, res) => res.json({ success: true, ...stockData }));
app.get('/api/stocks', (req, res) => res.json({ success: true, ...stockData }));
app.get('/api/products', (req, res) => res.json({ success: true, ...stockData }));

app.post('/api/stock', (req, res) => {
  if (req.body) stockData = { ...stockData, ...req.body };
  res.json({ success: true, message: 'Stock updated successfully!' });
});
app.post('/api/stock/update', (req, res) => {
  if (req.body) stockData = { ...stockData, ...req.body };
  res.json({ success: true, message: 'Stock updated successfully!' });
});
app.put('/api/stock', (req, res) => {
  if (req.body) stockData = { ...stockData, ...req.body };
  res.json({ success: true, message: 'Stock updated successfully!' });
});

// --- 2. ENDPOINT ORDERS ---
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = formatOrder(req.body);
  orders.push(newOrder);
  res.status(200).json({ success: true, message: 'Order berjaya disimpan!', order: newOrder });
});

// --- 3. ENDPOINT DELETE LENGKAP (SEMUA VARIASI LALUAN) ---
app.delete('/api/orders/:id', (req, res) => {
  const target = String(req.params.id).trim();
  orders = orders.filter((o, idx) => {
    return String(o.id || '').trim() !== target && 
           String(o.orderId || '').trim() !== target && 
           String(idx) !== target;
  });
  res.json({ success: true, message: 'Deleted successfully' });
});

app.delete('/api/orders', (req, res) => {
  const target = String(req.query.id || req.body.id || req.body.orderId || req.body.index || '').trim();
  if (target) {
    orders = orders.filter((o, idx) => {
      return String(o.id || '').trim() !== target && 
             String(o.orderId || '').trim() !== target && 
             String(idx) !== target;
    });
  } else {
    // Kalau tiada param, bersihkan rekod terbakar/undefined
    orders = orders.filter(o => o.customerName && o.customerName !== 'N/A');
  }
  res.json({ success: true, message: 'Deleted successfully' });
});

app.post('/api/orders/delete', (req, res) => {
  const target = String(req.body.id || req.body.orderId || req.body.index || '').trim();
  orders = orders.filter((o, idx) => {
    return String(o.id || '').trim() !== target && 
           String(o.orderId || '').trim() !== target && 
           String(idx) !== target;
  });
  res.json({ success: true, message: 'Deleted successfully' });
});

// --- 4. LISTEN PORT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Velvet Delishé berjalan di port ${PORT}`);
});
