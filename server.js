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

// Serve static files
app.use(express.static(path.join(__dirname)));

// Temporary in-memory order storage
let orders = [];

// ================= API ROUTES =================

app.get('/api/orders', (req, res) => {
    res.json(orders);
});

app.post('/api/orders', (req, res) => {
    const { name, phone, address, cakeQty, cookieQty, totalPrice, paymentMethod } = req.body;
    
    const newOrder = {
        id: Date.now(),
        date: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur' }),
        name,
        phone,
        address,
        cakeQty: parseInt(cakeQty) || 0,
        cookieQty: parseInt(cookieQty) || 0,
        totalPrice: parseFloat(totalPrice) || 0,
        paymentMethod: paymentMethod || 'COD'
    };

    orders.push(newOrder);
    res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
});

app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    orders = orders.filter(order => order.id !== parseInt(id));
    res.json({ message: 'Order deleted successfully' });
});

app.get('/api/orders/export', async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
        { header: 'Order ID', key: 'id', width: 18 },
        { header: 'Date & Time', key: 'date', width: 22 },
        { header: 'Customer Name', key: 'name', width: 25 },
        { header: 'Phone Number', key: 'phone', width: 16 },
        { header: 'Delivery Address', key: 'address', width: 32 },
        { header: 'Cake Choc Moist (Qty)', key: 'cakeQty', width: 22 },
        { header: 'Soft Cookies (Qty)', key: 'cookieQty', width: 20 },
        { header: 'Total Price (RM)', key: 'totalPrice', width: 16 },
        { header: 'Payment Method', key: 'paymentMethod', width: 18 }
    ];

    orders.forEach(order => worksheet.addRow(order));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Entproject_Orders.xlsx');

    await workbook.xlsx.write(res);
    res.end();
});

// ================= PAGE ROUTES (PASTIKAN BAGIAN INI SAMA) =================

// Paksa halaman utama (/) langsung membuka borang pelanggan
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

// Paksa link /index.html membuka borang pelanggan
app.get('/index.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

// Link khusus admin dashboard
app.get('/admin.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'admin.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`ENTPROJECT server running on port ${PORT}`);
});
