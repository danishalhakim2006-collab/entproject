const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Data stok dalam RAM
let stockData = {
  cake: 50,
  combo: 50,
  triple: 50
};

let orders = [];

// --- 1. ENDPOINT STOK (GET & POST/PUT) ---

// Untuk paparan stok di kedai & admin dashboard
app.get('/api/stock', (req, res) => res.json({ success: true, ...stockData }));
app.get('/api/stocks', (req, res) => res.json({ success: true, ...stockData }));
app.get('/api/products', (req, res) => res.json({ success: true, ...stockData }));

// Untuk butang 'Save Stock' kat admin.html
app.post('/api/stock', (req, res) => {
  if (req.body) {
    stockData = { ...stockData, ...req.body };
  }
  res.json({ success: true, message: 'Stock updated successfully!' });
});

app.post('/api/stock/update', (req, res) => {
  if (req.body) {
    stockData = { ...stockData, ...req.body };
  }
  res.json({ success: true, message: 'Stock updated successfully!' });
});

app.put('/api/stock', (req, res) => {
  if (req.body) {
    stockData = { ...stockData, ...req.body };
  }
  res.json({ success: true, message: 'Stock updated successfully!' });
});

// --- 2. ENDPOINT ORDERS ---

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  orders.push(req.body);
  res.status(200).json({ success: true, message: 'Order berjaya disimpan!' });
});

// --- 3. LISTEN PORT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
