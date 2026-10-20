const express = require('express');
const app = express();

// Middleware untuk parse JSON dari frontend
app.use(express.json());

// Serving static files dari root directory
app.use(express.static(__dirname));

// Array sementara dalam RAM untuk tempahan (asal)
let orders = [];

// 1. ENDPOINT STOK & PRODUK (Selesaikan masalah Loading)
const defaultStock = {
  success: true,
  stock: 50,
  available: 50,
  products: [
    { id: 1, name: 'Velvet Delishé', stock: 50, price: 8.00 }
  ]
};

app.get('/api/stock', (req, res) => res.json(defaultStock));
app.get('/api/stocks', (req, res) => res.json(defaultStock));
app.get('/api/products', (req, res) => res.json(defaultStock));
app.get('/api/inventory', (req, res) => res.json(defaultStock));

// 2. ENDPOINT ORDERS (Asal)
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  orders.push(newOrder);
  res.status(200).json({ success: true, message: 'Order berjaya diterima!' });
});

// 3. LISTEN PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Velvet Delishé berjalan di port ${PORT}`);
});
