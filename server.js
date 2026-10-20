const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());
// Baca terus fail HTML/CSS/JS dari direktori utama projek
app.use(express.static(__dirname));

const ordersPath = path.join(__dirname, 'orders.json');

// --- FUNGSI SIMPAN & BACA ORDERS (KALI HILANG DARI RAM) ---
function getOrders() {
  if (!fs.existsSync(ordersPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(ordersPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveOrders(orders) {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
}

// --- 1. API ENDPOINT ORDERS ---
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  const orders = getOrders();
  
  orders.push(newOrder);
  saveOrders(orders);
  
  res.status(200).json({ success: true, message: 'Order berjaya disimpan!' });
});

app.get('/api/orders', (req, res) => {
  const orders = getOrders();
  res.json(orders);
});

// --- 2. API ENDPOINT STOK / PRODUK (SELESAIKAN MASALAH LOADING) ---
// Data stok default
const stockData = {
  success: true,
  stock: 50,
  available: 50,
  quantity: 50,
  status: 'available',
  products: [
    { id: 1, name: 'Velvet Cake', stock: 50, price: 8.00 }
  ]
};

// Menyediakan semua variasi route stok yang mungkin dipanggil oleh frontend kau
app.get('/api/stock', (req, res) => res.json(stockData));
app.get('/api/stocks', (req, res) => res.json(stockData));
app.get('/api/products', (req, res) => res.json(stockData));
app.get('/api/inventory', (req, res) => res.json(stockData));
app.get('/api/items', (req, res) => res.json(stockData));

// --- 3. RUN SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Velvet Delishé berjalan di port ${PORT}`);
});
