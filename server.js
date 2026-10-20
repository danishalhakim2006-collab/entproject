const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Data stok
let stockData = {
  cake: 38,
  combo: 15,
  triple: 10
};

let orders = [];

// --- FUNGSI FORMAT ORDER (MENYELESAIKAN UNDEFINED PADA ITEMS ORDERED) ---
function formatOrder(data) {
  const now = new Date();
  const formattedDate = data.date || data.createdAt || data.dateTime || now.toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' });
  const orderId = data.id || data.orderId || 'ORD-' + Math.floor(1000 + Math.random() * 9000);

  // Cari data barang dari frontend
  let itemsFormatted = 'N/A';
  const rawItems = data.itemsOrdered || data.orderedItems || data.items || data.cart || data.products || data.orderItems || data.item;

  if (Array.isArray(rawItems)) {
    itemsFormatted = rawItems.map(item => {
      if (typeof item === 'string') return item;
      const name = item.name || item.productName || item.title || item.item || 'Cake/Combo';
      const qty = item.quantity || item.qty || item.count || 1;
      return `${name} (x${qty})`;
    }).join(', ');
  } else if (typeof rawItems === 'string' && rawItems.trim() !== '') {
    itemsFormatted = rawItems;
  } else if (rawItems && typeof rawItems === 'object') {
    itemsFormatted = JSON.stringify(rawItems);
  } else {
    // Kalau frontend hantar terus kuantiti kek dalam body (cth: cakeQty, comboQty)
    let details = [];
    if (data.cake || data.cakeQty || data.chocCake) details.push(`Choc Moist Cake (x${data.cake || data.cakeQty || data.chocCake})`);
    if (data.combo || data.comboQty) details.push(`Hokkaido Combo (x${data.combo || data.comboQty})`);
    if (data.triple || data.tripleQty) details.push(`Hokkaido Triple (x${data.triple || data.tripleQty})`);
    if (details.length > 0) itemsFormatted = details.join(', ');
  }

  // Masukkan SEMUA kemungkinan nama kunci yang dicari oleh admin.html
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
    
    // Semua variasi nama key untuk Items Ordered:
    itemsOrdered: itemsFormatted,
    orderedItems: itemsFormatted,
    items: itemsFormatted,
    orderItems: itemsFormatted,
    cart: itemsFormatted,
    products: itemsFormatted,
    item: itemsFormatted,

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

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  orders = orders.filter(o => o.id !== id && o.orderId !== id);
  res.json({ success: true, message: 'Order deleted successfully' });
});

// --- 3. LISTEN PORT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Velvet Delishé berjalan di port ${PORT}`);
});
