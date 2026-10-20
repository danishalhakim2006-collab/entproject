const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());
// Membenarkan Render baca terus fail HTML/CSS dari main directory projek kau
app.use(express.static(__dirname));

const filePath = path.join(__dirname, 'orders.json');

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

function saveOrders(orders) {
  fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
}

// Route bila orang hantar order baru
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  const orders = getOrders();
  
  orders.push(newOrder);
  saveOrders(orders);
  
  res.status(200).json({ success: true, message: 'Order berjaya disimpan!' });
});

// Route bila kau buka admin dashboard
app.get('/api/orders', (req, res) => {
  const orders = getOrders();
  res.json(orders);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
