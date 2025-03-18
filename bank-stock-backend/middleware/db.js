// bank-stock-backend/middleware/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',         // เปลี่ยนตามการตั้งค่าของคุณ
  password: '12345678',         // เปลี่ยนตามการตั้งค่าของคุณ
  database: 'stock_prediction',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;