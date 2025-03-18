// bank-stock-backend/middleware/auth.js
const jwt = require('jsonwebtoken');

// ค่าลับสำหรับ JWT
const JWT_SECRET = 'your_jwt_secret_key'; // ควรเก็บใน environment variable

// ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้วหรือไม่
const authMiddleware = (req, res, next) => {
  // ดึง token จาก header
  const token = req.header('x-auth-token');
  
  // ตรวจสอบว่ามี token หรือไม่
  if (!token) {
    return res.status(401).json({ message: 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบ' });
  }
  
  try {
    // ตรวจสอบความถูกต้องของ token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token ไม่ถูกต้อง' });
  }
};

// ตรวจสอบว่าเป็น admin หรือไม่
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' });
  }
  next();
};

module.exports = { 
  authMiddleware, 
  adminMiddleware,
  JWT_SECRET  // ส่งออกเพื่อใช้ในไฟล์อื่น
};