const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Simpan data order dalam RAM (kod asal kau)
let orders = [];

// Endpoint terima order asal
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  orders.push(newOrder);
  res.status(200).json({ success: true, message: 'Order berjaya disimpan!' });
});

// Endpoint baca order asal
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Endpoint stok asal (mengelakkan masalah loading)
app.get('/api/stock', (req, res) => {
  res.json({ success: true, stock: 50 });
});

app.get('/api/products', (req, res) => {
  res.json({ success: true, stock: 50 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
