require('dotenv').config();
const sequelize = require('./models/database');
const express = require('express');
const bodyParser = require('body-parser')
const multer = require('multer');
const userRoutes = require('./router/userRoutes');
const itemRoutes = require('./router/itemRoutes');
const shopRoutes = require('./router/shopRoutes');
// const orderRoutes = require('./router/orderRoutes');
const cartRoutes = require('./router/cartRoutes');
// const cartItemRoutes = require('./router/cartItemRoutes');
const couponRoutes = require('./router/couponRoutes');
const naturalsRoutes = require('./router/naturalsRoutes');
const categoryRoutes = require('./router/categoryRoutes');
const Order = require('./models/order');
const transactionRoutes = require('./router/transactionRoutes');
const authRoutes = require('./router/authRoutes');
const authenticateToken = require('./middleware/authMiddleware');
const cors = require('cors');
const preorderRoutes = require('./router/preorderRoutes')
const extraRoutes = require('./router/extraRoutes')
const mysqldump = require('mysqldump');
const moment = require('moment')
const serialRoute = require('./router/serialRoute')
// const orderItem = require('./models/orderItem')
app = express();
// app.use((_req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', '*');

//   next();
// });

let corsOptions = {
    origin: ['http://121.200.55.212:8367', 'http://121.200.55.212:8366', 'http://121.200.55.212:8368', 'http://localhost:3912'],
}
app.use(express.json());
app.use(cors());
app.use(bodyParser.text({ type: '/' }));
// Routes for each model
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/item', itemRoutes);
app.use('/shops', shopRoutes);
// app.use('/orders', orderRoutes);
app.use('/cart', cartRoutes);
app.use('/categories', categoryRoutes)
// app.use('/cartitems', cartItemRoutes);
app.use('/coupons', couponRoutes);
app.use('/naturals', naturalsRoutes);
app.use('/transaction', transactionRoutes);
// static images folder
app.use('/extra', extraRoutes)
app.use('/Images', express.static('./Images'))

app.use('/preorder', preorderRoutes)

app.use('/serialnumber', serialRoute)


// Perform the database backup


// Handle uncaught exceptions

const PORT = process.env.PORT;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await sequelize.authenticate() /// alter - force
    console.log("Database synced");
});