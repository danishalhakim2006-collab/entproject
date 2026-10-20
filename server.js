const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Data stok semasa
let stockData = {
  cake: 38,
  combo: 15,
  triple: 10
};

let orders = [];

// --- FUNGSI FORMAT DATA & TOLAK STOK AUTOMATIK ---
function formatOrder(data) {
  const now = new Date();
  const formattedDate = data.date || data.createdAt || data.dateTime || now.toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' });
  
  // Ambil ID jika ada, atau generate baru
  const orderId = String(data.id || data.orderId || 'ORD-' + Math.floor(1000 + Math.random() * 9000)).trim();

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

  // Auto tolak stok berdasarkan input
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

  // Tolak stok secara automatik di RAM
  if (cakeQty > 0) stockData.cake = Math.max(0, stockData.cake - cakeQty);
  if (comboQty > 0) stockData.combo = Math.max(0, stockData.combo - comboQty);
  if (tripleQty > 0) stockData.triple = Math.max(0, stockData.triple - tripleQty);

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

// --- 1. ENDPOINT STOK ---
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

// --- 3. ENDPOINT DELETE YANG MENYOKONG SEMUA FORMAT ID FRONTEND ---
app.delete('/api/orders/:id', (req, res) => {
  const targetId = String(req.params.id).trim();
  
  orders = orders.filter((o, index) => {
    const oId = String(o.id || '').trim();
    const oOrderId = String(o.orderId || '').trim();
    const oIndex = String(index);
    
    // Padankan dengan ID, OrderID, atau index baris
    return oId !== targetId && oOrderId !== targetId && oIndex !== targetId;
  });

  res.json({ success: true, message: 'Deleted successfully' });
});

app.delete('/api/orders', (req, res) => {
  const targetId = String(req.query.id || req.body.id || req.body.orderId || '').trim();
  if (targetId) {
    orders = orders.filter((o, idx) => String(o.id) !== targetId && String(o.orderId) !== targetId && String(idx) !== targetId);
  } else {
    orders = []; // Kalau kosong, reset habis senarai order
  }
  res.json({ success: true, message: 'Deleted successfully' });
});

// --- 4. RUN SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Velvet Delishé berjalan di port ${PORT}`);
});
