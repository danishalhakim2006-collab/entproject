const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Atau folder frontend kau

// Path ke fail orders.json
const filePath = path.join(__dirname, 'orders.json');

// Fungsi pembantu: Baca order dari fail
function getOrders() {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Fungsi pembantu: Simpan order ke fail
function saveOrders(orders) {
  fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
}

// 1. API bila customer hantar form order
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  const orders = getOrders(); // Baca order lama dari orders.json
  
  orders.push(newOrder);      // Tambah order baru
  saveOrders(orders);         // Tulis & simpan terus ke fail orders.json
  
  res.status(200).json({ success: true, message: 'Order berjaya disimpan!' });
});

// 2. API bila kau buka Admin Dashboard nak tengok senarai order
app.get('/api/orders', (req, res) => {
  const orders = getOrders(); // Baca dari orders.json
  res.json(orders);
});

// Port server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
