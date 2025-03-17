// app.js - ไฟล์หลักของ Backend สำหรับจัดการข้อมูลหุ้นธนาคาร
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

// สร้าง Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// เชื่อมต่อกับฐานข้อมูล MySQL (PhpMyAdmin)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',   // อาจต้องเปลี่ยนตามการตั้งค่า PhpMyAdmin ของคุณ
  password: '12345678',   // อาจต้องเปลี่ยนตามการตั้งค่า PhpMyAdmin ของคุณ
  database: 'bank_stocks'
});

// ทดสอบการเชื่อมต่อฐานข้อมูล
db.connect(err => {
  if (err) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ' + err.stack);
    return;
  }
  console.log('เชื่อมต่อฐานข้อมูลสำเร็จ กับ ID ' + db.threadId);
});

// API Endpoints

// GET - ดึงข้อมูลหุ้นธนาคารทั้งหมด
app.get('/api/bank-stocks', (req, res) => {
  const sql = 'SELECT * FROM bank_stocks ORDER BY trade_date DESC, bank_code ASC';
  
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// GET - ดึงข้อมูลหุ้นธนาคารตามรหัสธนาคาร (KTB, BBL, KBANK)
app.get('/api/bank-stocks/code/:bank_code', (req, res) => {
  const bank_code = req.params.bank_code;
  const sql = 'SELECT * FROM bank_stocks WHERE bank_code = ? ORDER BY trade_date DESC';
  
  db.query(sql, [bank_code], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลหุ้นของธนาคารนี้' });
    }
    
    res.json(results);
  });
});

// GET - ดึงข้อมูลหุ้นธนาคารตาม ID
app.get('/api/bank-stocks/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM bank_stocks WHERE id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลหุ้นธนาคาร' });
    }
    
    res.json(results[0]);
  });
});

// GET - ดึงข้อมูลหุ้นธนาคารตามช่วงวันที่
app.get('/api/bank-stocks/date-range/:start_date/:end_date', (req, res) => {
  const start_date = req.params.start_date;
  const end_date = req.params.end_date;
  const sql = 'SELECT * FROM bank_stocks WHERE trade_date BETWEEN ? AND ? ORDER BY trade_date DESC, bank_code ASC';
  
  db.query(sql, [start_date, end_date], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลหุ้นธนาคารในช่วงวันที่ที่ระบุ' });
    }
    
    res.json(results);
  });
});

// POST - เพิ่มข้อมูลหุ้นธนาคารใหม่
app.post('/api/bank-stocks', (req, res) => {
  const { 
    bank_code, bank_name, ROA, ROE, Book_Value_per_Share, Market_Cap,
    PBV, PE, EPS, NetProfit, Total_Liabilities, Total_Equity, Total_Assets,
    InterestRate, GDP, Percentage_Change, Volume, Low, High, OpenPrice, ClosePrice, trade_date
  } = req.body;
  
  if (!bank_code || !bank_name || !trade_date) {
    return res.status(400).json({ message: 'กรุณากรอกรหัสธนาคาร, ชื่อธนาคาร และวันที่ให้ครบถ้วน' });
  }
  
  const sql = `INSERT INTO bank_stocks (
    bank_code, bank_name, ROA, ROE, Book_Value_per_Share, Market_Cap,
    PBV, PE, EPS, NetProfit, Total_Liabilities, Total_Equity, Total_Assets,
    InterestRate, GDP, Percentage_Change, Volume, Low, High, OpenPrice, ClosePrice, trade_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const values = [
    bank_code, bank_name, ROA, ROE, Book_Value_per_Share, Market_Cap,
    PBV, PE, EPS, NetProfit, Total_Liabilities, Total_Equity, Total_Assets,
    InterestRate, GDP, Percentage_Change, Volume, Low, High, OpenPrice, ClosePrice, trade_date
  ];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      message: 'เพิ่มข้อมูลหุ้นธนาคารสำเร็จ',
      id: result.insertId
    });
  });
});

// PUT - อัปเดตข้อมูลหุ้นธนาคาร
app.put('/api/bank-stocks/:id', (req, res) => {
  const id = req.params.id;
  const { 
    bank_code, bank_name, ROA, ROE, Book_Value_per_Share, Market_Cap,
    PBV, PE, EPS, NetProfit, Total_Liabilities, Total_Equity, Total_Assets,
    InterestRate, GDP, Percentage_Change, Volume, Low, High, OpenPrice, ClosePrice, trade_date
  } = req.body;
  
  if (!bank_code || !bank_name || !trade_date) {
    return res.status(400).json({ message: 'กรุณากรอกรหัสธนาคาร, ชื่อธนาคาร และวันที่ให้ครบถ้วน' });
  }
  
  const sql = `UPDATE bank_stocks SET 
    bank_code = ?, 
    bank_name = ?, 
    ROA = ?,
    ROE = ?,
    Book_Value_per_Share = ?,
    Market_Cap = ?,
    PBV = ?,
    PE = ?,
    EPS = ?,
    NetProfit = ?,
    Total_Liabilities = ?,
    Total_Equity = ?,
    Total_Assets = ?,
    InterestRate = ?,
    GDP = ?,
    Percentage_Change = ?,
    Volume = ?,
    Low = ?,
    High = ?,
    OpenPrice = ?,
    ClosePrice = ?,
    trade_date = ?
    WHERE id = ?`;
  
  const values = [
    bank_code, bank_name, ROA, ROE, Book_Value_per_Share, Market_Cap,
    PBV, PE, EPS, NetProfit, Total_Liabilities, Total_Equity, Total_Assets,
    InterestRate, GDP, Percentage_Change, Volume, Low, High, OpenPrice, ClosePrice, trade_date, id
  ];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลหุ้นธนาคารที่ต้องการอัปเดต' });
    }
    
    res.json({ message: 'อัปเดตข้อมูลหุ้นธนาคารสำเร็จ' });
  });
});

// DELETE - ลบข้อมูลหุ้นธนาคาร
app.delete('/api/bank-stocks/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM bank_stocks WHERE id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลหุ้นธนาคารที่ต้องการลบ' });
    }
    
    res.json({ message: 'ลบข้อมูลหุ้นธนาคารสำเร็จ' });
  });
});

// ค้นหาข้อมูลหุ้นธนาคาร
app.get('/api/bank-stocks/search/:keyword', (req, res) => {
  const keyword = `%${req.params.keyword}%`;
  const sql = `
    SELECT * FROM bank_stocks 
    WHERE bank_code LIKE ? OR bank_name LIKE ? 
    ORDER BY trade_date DESC, bank_code ASC
  `;
  
  db.query(sql, [keyword, keyword], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(results);
  });
});

// เริ่มการทำงานของ Server
app.listen(PORT, () => {
  console.log(`Server กำลังทำงานที่ port ${PORT}`);
});