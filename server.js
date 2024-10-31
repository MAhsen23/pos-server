require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./src/routes/user-routes');
const productRoutes = require('./src/routes/product-routes');
const customerRoutes = require('./src/routes/customer-routes');
const supplierRoutes = require('./src/routes/supplier-routes');
const invoiceRoutes = require('./src/routes/invoice-routes');
const expenseRoutes = require('./src/routes/expense-routes');
const purchaseRoutes = require('./src/routes/purchase-routes');
const reportRoutes = require('./src/routes/report-routes');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {}).then(() => console.log('Connected to MongoDB')).catch((err) => console.error('Could not connect to MongoDB', err));

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});