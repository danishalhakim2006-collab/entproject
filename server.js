const express = require('express');
const cors = require('cors');
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Support upload resit gambar besar)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// In-Memory Database (Orders & Stock)
let orders = [];
let stock = {
    chocMoist: 20,          // Stok awal Choc Moist Cake
    hokkaidoCombo: 15,      // Stok awal Hokkaido Combo (2pcs)
    hokkaidoTriple: 10      // Stok awal Hokkaido Triple (3pcs)
};

// ================= API ROUTES =================

// Fetch Orders
app.get('/api/orders', (req, res) => {
    res.json(orders);
});

// Fetch Current Stock
app.get('/api/stock', (req, res) => {
    res.json(stock);
});

// Update Stock (For Seller Admin)
app.post('/api/stock/update', (req, res) => {
    const { chocMoist, hokkaidoCombo, hokkaidoTriple } = req.body;
    if (chocMoist !== undefined) stock.chocMoist = parseInt(chocMoist);
    if (hokkaidoCombo !== undefined) stock.hokkaidoCombo = parseInt(hokkaidoCombo);
    if (hokkaidoTriple !== undefined) stock.hokkaidoTriple = parseInt(hokkaidoTriple);
    
    res.json({ message: 'Stock updated successfully!', stock });
});

// Submit New Order
app.post('/api/orders', (req, res) => {
    const { name, phone, address, items, totalPrice, paymentMethod, receipt } = req.body;
    
    // Potong Stok Automatik
    if (items) {
        items.forEach(item => {
            if (item.id === 'chocMoist') stock.chocMoist = Math.max(0, stock.chocMoist - item.qty);
            if (item.id === 'hokkaidoCombo') stock.hokkaidoCombo = Math.max(0, stock.hokkaidoCombo - item.qty);
            if (item.id === 'hokkaidoTriple') stock.hokkaidoTriple = Math.max(0, stock.hokkaidoTriple - item.qty);
        });
    }

    const newOrder = {
        id: Date.now(),
        date: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' }),
        name,
        phone,
        address,
        orderDetails: items.map(i => `${i.name} (x${i.qty})`).join(', '),
        totalPrice: parseFloat(totalPrice) || 0,
        paymentMethod: paymentMethod || 'COD',
        receipt: receipt || null
    };

    orders.push(newOrder);
    res.status(201).json({ message: 'Order placed successfully!', order: newOrder, currentStock: stock });
});

app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    orders = orders.filter(order => order.id !== parseInt(id));
    res.json({ message: 'Order deleted successfully' });
});

// Export Excel
app.get('/api/orders/export', async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
        { header: 'Order ID', key: 'id', width: 18 },
        { header: 'Date & Time', key: 'date', width: 22 },
        { header: 'Customer Name', key: 'name', width: 22 },
        { header: 'Phone Number', key: 'phone', width: 16 },
        { header: 'Address/Location', key: 'address', width: 30 },
        { header: 'Order Items', key: 'orderDetails', width: 35 },
        { header: 'Total Price (RM)', key: 'totalPrice', width: 16 },
        { header: 'Payment Method', key: 'paymentMethod', width: 22 }
    ];

    orders.forEach(order => worksheet.addRow(order));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=VelvetDelishe_Orders.xlsx');

    await workbook.xlsx.write(res);
    res.end();
});

// Page Routes
app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.resolve(__dirname, 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.resolve(__dirname, 'admin.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
