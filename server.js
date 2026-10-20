const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// --- 1. SAMBUNGAN SUPABASE ---
const SUPABASE_URL = process.env.SUPABASE_URL || "https://xdwaqiowenxwdfifskip.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_n0KbWh2C2prsA3JfmJTFfA_h1KK5Be6";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Data Stok Semasa (Sementara dalam RAM)
let stockData = {
  cake: 38,
  combo: 15,
  triple: 10
};

// --- 2. FUNGSI FORMAT ORDER ---
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
    let cakeQty = parseInt(data.cake || data.cakeQty || data.chocCake || 0);
    let comboQty = parseInt(data.combo || data.comboQty || 0);
    let tripleQty = parseInt(data.triple || data.tripleQty || 0);

    if (cakeQty > 0) details.push(`Choc Moist Cake (x${cakeQty})`);
    if (comboQty > 0) details.push(`Hokkaido Combo 2pcs (x${comboQty})`);
    if (tripleQty > 0) details.push(`Hokkaido Triple 3pcs (x${tripleQty})`);

    itemsFormatted = details.length > 0 ? details.join(', ') : (data.summary || data.note || 'Order Received');
  }

  return {
    order_id: orderId,
    date: formattedDate,
    customer_name: data.customerName || data.name || data.fullName || 'N/A',
    phone: data.phone || data.phoneNumber || data.contact || 'N/A',
    address: data.address || data.location || 'N/A',
    items_ordered: itemsFormatted,
    total: data.total || data.totalAmount || data.price || '0.00',
    payment: data.payment || data.paymentMethod || 'COD (Cash)',
    receipt: data.receipt || data.receiptUrl || 'N/A'
  };
}

// --- 3. ENDPOINT STOK (SUPPORT SEMUA VARIASI URL FRONTEND) ---
app.get('/api/stock', (req, res) => res.json({ success: true, ...stockData }));
app.get('/api/stocks', (req, res) => res.json({ success: true, ...stockData }));
app.get('/api/products', (req, res) => res.json({ success: true, ...stockData }));

const updateStockHandler = (req, res) => {
  if (req.body) {
    stockData = { ...stockData, ...req.body };
  }
  res.json({ success: true, message: 'Stock updated successfully!', stock: stockData });
};

app.post('/api/stock', updateStockHandler);
app.put('/api/stock', updateStockHandler);
app.post('/api/stocks', updateStockHandler);
app.put('/api/stocks', updateStockHandler);
app.post('/api/products', updateStockHandler);
app.put('/api/products', updateStockHandler);

// --- 4. ENDPOINT ORDERS (DISEPADUKAN DENGAN SUPABASE) ---

// BACA KESEMUA ORDER DARI SUPABASE
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    const formattedOrders = (data || []).map(o => ({
      id: o.order_id,
      orderId: o.order_id,
      date: o.date,
      customerName: o.customer_name,
      phone: o.phone,
      address: o.address,
      itemsOrdered: o.items_ordered,
      total: o.total,
      payment: o.payment,
      receipt: o.receipt
    }));

    res.json(formattedOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Gagal ambil data orders dari Supabase' });
  }
});

// SIMPAN ORDER BARU KE SUPABASE
app.post('/api/orders', async (req, res) => {
  try {
    const orderPayload = formatOrder(req.body);

    const { data, error } = await supabase
      .from('orders')
      .insert([orderPayload]);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Order berjaya disimpan secara kekal di Supabase!', order: orderPayload });
  } catch (err) {
    console.error('Error saving order:', err);
    res.status(500).json({ error: 'Gagal simpan order ke Supabase' });
  }
});

// PADAM ORDER DARI SUPABASE (PELBAGAI LALUAN DELETE)
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const targetId = String(req.params.id).trim();
    const { error } = await supabase.from('orders').delete().eq('order_id', targetId);
    if (error) throw error;
    res.json({ success: true, message: 'Order berjaya dipadam secara kekal dari Supabase' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal padam order dari Supabase' });
  }
});

app.delete('/api/orders', async (req, res) => {
  try {
    const targetId = String(req.query.id || req.body.id || req.body.orderId || '').trim();
    if (targetId) {
      await supabase.from('orders').delete().eq('order_id', targetId);
    }
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal padam order' });
  }
});

app.post('/api/orders/delete', async (req, res) => {
  try {
    const targetId = String(req.body.id || req.body.orderId || '').trim();
    if (targetId) {
      await supabase.from('orders').delete().eq('order_id', targetId);
    }
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal padam order' });
  }
});

// --- 5. RUN SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Velvet Delishé berjalan di port ${PORT}`);
});
