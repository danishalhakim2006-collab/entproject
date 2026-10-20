const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Data stok sementara dalam RAM (Live Stock Management)
let stockData = {
  cake: 38,
  combo: 15,
  triple: 10
};

let orders = [];

// --- FUNGSI PEMBANTU: FORMAT DATA ORDER (ELAK UNDEFINED) ---
function formatOrder(data) {
  // Masa & Tarikh automatik jika frontend tak hantar
  const now = new Date();
  const formattedDate = data.date || data.createdAt || data.dateTime || now.toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' });

  // Order ID automatik
  const orderId = data.id || data.orderId || 'ORD-' + Math.floor(1000 + Math.random() * 9000);

  // Parse & format senarai barangan (Items Ordered)
  let itemsFormatted = 'N/A';
  const rawItems = data.itemsOrdered || data.items || data.cart || data.products || data.orderItems;

  if (Array.isArray(rawItems)) {
    itemsFormatted = rawItems.map(item => {
      if (typeof item === 'string') return item;
      const name = item.name || item.productName || item.title || 'Item';
      const qty = item.quantity || item.qty || item.count || 1;
      return `${name} (x${qty})`;
    }).join(', ');
  } else if (typeof rawItems === 'string' && rawItems.trim() !== '') {
    itemsFormatted = rawItems;
  } else if (rawItems && typeof rawItems === 'object') {
    itemsFormatted = JSON.stringify(rawItems);
  }

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
    items: itemsFormatted,
    total: data.total || data.totalAmount || data.price || '0.00',
    payment: data.payment || data.paymentMethod || 'COD (Cash)',
    receipt: data.receipt || data.receiptUrl || 'N/A'
  };
}

// --- 1. ENDPOINT STOK (BACA & KEMAS KINI STOK ADMIN) ---

app.get('/api/stock', (req, res) => res.json({ success: true, ...stockData }));
app.get('/api/stocks', (req, res) => res.json({ success: true, ...stockData }));
app.get('/api/products', (req, res) => res.json({ success: true, ...stockData }));

// Untuk butang 'Save Stock' di admin.html
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

// --- 2. ENDPOINT ORDERS (ADMIN & FRONTEND) ---

app.get('/api/orders', (req, res) => {
  // Pulangkan semua order yang dah diformat
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = formatOrder(req.body);
  orders.push(newOrder);
  res.status(200).json({ success: true, message: 'Order berjaya disimpan!', order: newOrder });
});

// Route untuk padam order bila tekan butang 'Delete'
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  orders = orders.filter(o => o.id !== id && o.orderId !== id);
  res.json({ success: true, message: 'Order deleted successfully' });
});

// --- 3. RUN SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Velvet Delishé berjalan di port ${PORT}`);
});
