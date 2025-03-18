// bank-stock-backend/app.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'ระบบพยากรณ์ราคาหุ้นธนาคาร API พร้อมให้บริการ' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
// เพิ่มเส้นทาง API อื่นๆ (ถ้ามี)
app.use('/api/banks', require('./routes/banks'));
// app.use('/api/predictions', require('./routes/predictions'));

// ทดสอบ API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// จัดการข้อผิดพลาด
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});