require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./src/routes/user');
const productRoutes = require('./src/routes/product');
const customerRoutes = require('./src/routes/customer');
const supplierRoutes = require('./src/routes/supplier');
const invoiceRoutes = require('./src/routes/invoice');
const taxRoutes = require('./src/routes/tax');
const expenseRoutes = require('./src/routes/expense');
const purchaseRoutes = require('./src/routes/purchase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {}).then(() => console.log('Connected to MongoDB')).catch((err) => console.error('Could not connect to MongoDB', err));

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/purchases', purchaseRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});