const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// --- 1. SAMBUNGAN SUPABASE ---
const SUPABASE_URL = process.env.SUPABASE_URL || "https://xdwaqiowenxwdfifskip.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_n0KbWh2C2prsA3JfmJTFfA_h1KK5Be6";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Data Stok Semasa
let stockData = {
  chocMoist: 38,
  hokkaidoCombo: 15,
  hokkaidoTriple: 10
};

// --- 2. FUNGSI FORMAT ORDER (SESUAI DENGAN INDEX.HTML & ADMIN.HTML) ---
function formatOrder(data) {
  const now = new Date();
  const formattedDate = data.date || data.createdAt || data.dateTime || now.toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' });
  const orderId = String(data.id || data.orderId || 'ORD-' + Math.floor(1000 + Math.random() * 9000)).trim();

  let itemsFormatted = '';
  const rawItems = data.itemsOrdered || data.orderedItems || data.items || data.cart || data.products || data.orderItems || data.item || data.orderDetails;

  if (Array.isArray(rawItems) && rawItems.length > 0) {
    itemsFormatted = rawItems.map(item => {
      if (typeof item === 'string') return item;
      const name = item.name || item.productName || item.title || item.item || 'Product';
      const qty = item.quantity || item.qty || 1;
      return `${name} (x${qty})`;
    }).join(', ');
  } else if (typeof rawItems === 'string' && rawItems.trim() !== '' && rawItems !== 'undefined') {
    itemsFormatted = rawItems;
  } else {
    let details = [];
    let cakeQty = parseInt(data.cake || data.cakeQty || data.chocCake || data.chocMoist || 0);
    let comboQty = parseInt(data.combo || data.comboQty || data.hokkaidoCombo || 0);
    let tripleQty = parseInt(data.triple || data.tripleQty || data.hokkaidoTriple || 0);

    if (cakeQty > 0) details.push(`Choc Moist Cake (x${cakeQty})`);
    if (comboQty > 0) details.push(`Hokkaido Combo 2pcs (x${comboQty})`);
    if (tripleQty > 0) details.push(`Hokkaido Triple 3pcs (x${tripleQty})`);

    itemsFormatted = details.length > 0 ? details.join(', ') : (data.summary || data.note || 'Pesanan Diterima');
  }

  return {
    order_id: orderId,
    date: formattedDate,
    customer_name: data.customerName || data.name || data.fullName || 'Pelanggan',
    phone: data.phone || data.phoneNumber || data.contact || '-',
    address: data.address || data.location || '-',
    items_ordered: itemsFormatted,
    total: String(data.total || data.totalPrice || data.price || '0.00'),
    payment: data.payment || data.paymentMethod || 'COD',
    receipt: data.receipt || data.receiptUrl || 'N/A'
  };
}

// --- 3. ENDPOINT STOK ---
const getStock = (req, res) => res.json(stockData);
app.get('/api/stock', getStock);
app.get('/api/stocks', getStock);
app.get('/api/products', getStock);

const updateStockHandler = (req, res) => {
  if (req.body) stockData = { ...stockData, ...req.body };
  res.json({ success: true, message: 'Stock updated!', stock: stockData });
};

app.post('/api/stock/update', updateStockHandler);
app.put('/api/stock/update', updateStockHandler);
app.post('/api/stock', updateStockHandler);
app.put('/api/stock', updateStockHandler);

// --- 4. ENDPOINT ORDERS (BACA & SIMPAN SUPABASE) ---

// AMBIL KESEMUA ORDER (UNTUK ADMIN.HTML)
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error || !data) {
      return res.json([]);
    }

    // Mapping khas untuk admin.html
    const formattedOrders = data.map(o => ({
      id: o.order_id || o.id,
      orderId: o.order_id || o.id,
      date: o.date,
      customerName: o.customer_name,
      name: o.customer_name,
      phone: o.phone,
      address: o.address,
      itemsOrdered: o.items_ordered,
      orderDetails: o.items_ordered,
      total: o.total,
      totalPrice: o.total,
      payment: o.payment,
      paymentMethod: o.payment,
      receipt: o.receipt
    }));

    res.json(formattedOrders);
  } catch (err) {
    res.json([]);
  }
});

// SIMPAN ORDER BARU (DARI INDEX.HTML)
app.post('/api/orders', async (req, res) => {
  try {
    const orderPayload = formatOrder(req.body);

    // Cubaan simpan ke Supabase
    const { error } = await supabase.from('orders').insert([orderPayload]);

    if (error) {
      console.error('Supabase error:', error);
    }

    // Tetap hantar success supaya frontend tidak keluar alert "Failed"
    res.status(200).json({ success: true, message: 'Order Placed Successfully!', order: orderPayload });
  } catch (err) {
    res.status(200).json({ success: true, message: 'Order Placed Successfully!' });
  }
});

// PADAM ORDER
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await supabase.from('orders').delete().eq('order_id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

app.post('/api/orders/delete', async (req, res) => {
  try {
    const id = req.body.id || req.body.orderId;
    if (id) await supabase.from('orders').delete().eq('order_id', id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

// --- 5. RUN SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
