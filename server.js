const express = require('express');
const cors = require('cors');
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (index.html, admin.html, etc.)
app.use(express.static(path.join(__dirname)));

// Simpan data order dalam memory (temporary array)
let orders = [];

// ================= API ROUTES =================

// 1. Route untuk dapatkan senarai order (GET)
app.get('/api/orders', (req, res) => {
    res.json(orders);
});

// 2. Route untuk hantar order baru dari Customer (POST)
app.post('/api/orders', (req, res) => {
    const { name, phone, address, cakeQty, cookieQty, totalPrice } = req.body;
    
    const newOrder = {
        id: Date.now(),
        date: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' }),
        name,
        phone,
        address,
        cakeQty: parseInt(cakeQty) || 0,
        cookieQty: parseInt(cookieQty) || 0,
        totalPrice: parseFloat(totalPrice) || 0
    };

    orders.push(newOrder);
    res.status(201).json({ message: 'Order successfully placed!', order: newOrder });
});

// 3. Route untuk padam order dari Admin (DELETE)
app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    orders = orders.filter(order => order.id !== parseInt(id));
    res.json({ message: 'Order deleted successfully' });
});

// 4. Route untuk Export ke Excel (GET)
app.get('/api/orders/export', async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Customer Name', key: 'name', width: 25 },
        { header: 'Phone Number', key: 'phone', width: 15 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Choc Moist (Qty)', key: 'cakeQty', width: 18 },
        { header: 'Soft Cookies (Qty)', key: 'cookieQty', width: 18 },
        { header: 'Total Price (RM)', key: 'totalPrice', width: 15 }
    ];

    orders.forEach(order => worksheet.addRow(order));

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Entproject_Orders.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
});

// ================= PAGE ROUTES (FIXED) =================

// Buka link utama terus ke Customer Order Form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Buka link /index.html ke Customer Order Form
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Buka link /admin.html ke Admin Dashboard
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`ENTPROJECT Server running on port ${PORT}`);
});