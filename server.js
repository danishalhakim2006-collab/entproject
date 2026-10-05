const express = require('express');
const cors = require('cors');
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();

// Enable CORS untuk semua HTTP Methods
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bolehkan akses fail static (supaya admin.html & index.html boleh dibuka dari localhost:5000)
app.use(express.static(path.join(__dirname)));

// In-Memory Database for Orders
let ordersDatabase = [];

// 1. API: Get all orders
app.get('/api/orders', (req, res) => {
    res.json(ordersDatabase);
});

// 2. API: Submit New Order
app.post('/api/orders', (req, res) => {
    const { customer_name, phone_number, delivery_address, cake_choc_moist_qty, soft_cookies_qty, total_price, payment_method } = req.body;
    
    if (!customer_name || !phone_number) {
        return res.status(400).json({ message: "Please enter your name and phone number!" });
    }

    const newOrder = {
        order_id: "ENT-" + String(ordersDatabase.length + 1).padStart(3, '0'),
        customer_name,
        phone_number,
        delivery_address: delivery_address || "-",
        cake_choc_moist_qty: parseInt(cake_choc_moist_qty) || 0,
        soft_cookies_qty: parseInt(soft_cookies_qty) || 0,
        total_price: parseFloat(total_price) || 0,
        payment_method: payment_method || "COD",
        status: "Pending",
        created_at: new Date().toLocaleString('en-US')
    };

    ordersDatabase.push(newOrder);
    res.status(201).json({ message: "Order placed successfully!", order: newOrder });
});

// 3. API: Delete Order
app.delete('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;
    const initialLength = ordersDatabase.length;
    
    ordersDatabase = ordersDatabase.filter(order => order.order_id !== orderId);

    if (ordersDatabase.length < initialLength) {
        res.json({ message: `Order ${orderId} deleted successfully!` });
    } else {
        res.status(404).json({ message: "Order not found!" });
    }
});

// 4. API: Export to Excel File
app.get('/api/orders/export', async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Entproject Orders');

    worksheet.columns = [
        { header: 'Order ID', key: 'order_id', width: 12 },
        { header: 'Date & Time', key: 'created_at', width: 22 },
        { header: 'Customer Name', key: 'customer_name', width: 20 },
        { header: 'Phone Number', key: 'phone_number', width: 16 },
        { header: 'Delivery Address', key: 'delivery_address', width: 30 },
        { header: 'Cake Choc Moist (Qty)', key: 'cake_choc_moist_qty', width: 22 },
        { header: 'Soft Cookies (Qty)', key: 'soft_cookies_qty', width: 20 },
        { header: 'Total Price (RM)', key: 'total_price', width: 16 },
        { header: 'Payment Method', key: 'payment_method', width: 18 },
        { header: 'Status', key: 'status', width: 12 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2B3A4A' }
    };

    ordersDatabase.forEach(order => {
        worksheet.addRow(order);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ENTPROJECT_Orders_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
});

// Start Server on Port 5000
const PORT = 5000;
app.listen(PORT, () => {
    console.log("=================================");
    console.log(`ENTPROJECT Server running on: http://localhost:${PORT}`);
    console.log("=================================");
});