const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// --- 1. SAMBUNGAN SUPABASE ---
const SUPABASE_URL = process.env.SUPABASE_URL || "https://xdwaqiowenxwdfifskip.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_n0KbWh2C2prsA3JfmJTFfA_h1KK5Be6";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Memory Storage (Backup jika Supabase bermasalah supaya admin.html TETAP DAPAT DATA)
let ordersMemory = [];

let stockData = {
  chocMoist: 38,
  hokkaidoCombo: 15,
  hokkaidoTriple: 10
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

// --- 4. ENDPOINT ORDERS ---

// BACA KESEMUA ORDER (AMBIL SUPABASE + MEMORY)
app.get('/api/orders', async (req, res) => {
  let combinedOrders = [...ordersMemory];

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data && data.length > 0) {
      const dbOrders = data.map(o => ({
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

      // Gabungkan data memory dan data Supabase
      const existingIds = new Set(combinedOrders.map(o => o.id));
      dbOrders.forEach(o => {
        if (!existingIds.has(o.id)) combinedOrders.push(o);
      });
    }
  } catch (err) {
    console.error('Fetch Supabase error:', err);
  }

  res.json(combinedOrders);
});

// SIMPAN ORDER BARU
app.post('/api/orders', async (req, res) => {
  try {
    const orderPayload = formatOrder(req.body);

    // 1. Simpan ke Memory terus (Garansi Admin Dashboard akan DAPAT data)
    const memoryObj = {
      id: orderPayload.order_id,
      orderId: orderPayload.order_id,
      date: orderPayload.date,
      customerName: orderPayload.customer_name,
      name: orderPayload.customer_name,
      phone: orderPayload.phone,
      address: orderPayload.address,
      itemsOrdered: orderPayload.items_ordered,
      orderDetails: orderPayload.items_ordered,
      total: orderPayload.total,
      totalPrice: orderPayload.total,
      payment: orderPayload.payment,
      paymentMethod: orderPayload.payment,
      receipt: orderPayload.receipt
    };
    ordersMemory.unshift(memoryObj);

    // 2. Simpan ke Supabase secara background
    supabase.from('orders').insert([orderPayload]).then(({ error }) => {
      if (error) console.error('Supabase async insert error:', error);
      else console.log('Order successfully inserted into Supabase!');
    });

    res.status(200).json({ success: true, message: 'Order Placed Successfully!', order: memoryObj });
  } catch (err) {
    res.status(200).json({ success: true, message: 'Order Placed Successfully!' });
  }
});

// PADAM ORDER
app.delete('/api/orders/:id', async (req, res) => {
  const targetId = req.params.id;
  ordersMemory = ordersMemory.filter(o => o.id !== targetId && o.orderId !== targetId);
  try {
    await supabase.from('orders').delete().eq('order_id', targetId);
  } catch (e) {}
  res.json({ success: true });
});

app.post('/api/orders/delete', async (req, res) => {
  const targetId = req.body.id || req.body.orderId;
  if (targetId) {
    ordersMemory = ordersMemory.filter(o => o.id !== targetId && o.orderId !== targetId);
    try {
      await supabase.from('orders').delete().eq('order_id', targetId);
    } catch (e) {}
  }
  res.json({ success: true });
});

// --- 5. RUN SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
