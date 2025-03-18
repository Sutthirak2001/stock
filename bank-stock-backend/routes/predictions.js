// bank-stock-backend/routes/predictions.js
const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { authMiddleware } = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');

// ฟังก์ชันเรียกใช้โมเดลพยากรณ์ (ใช้ Python)
const predictStockPrice = (bankCode, inputData) => {
  return new Promise((resolve, reject) => {
    // สมมติว่ามีโมเดล Python อยู่ใน /models/predict.py
    const pythonProcess = spawn('python', [
      path.join(__dirname, '..', 'models', 'predict.py'),
      bankCode,
      JSON.stringify(inputData)
    ]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`โมเดลพยากรณ์ผิดพลาด: ${error}`));
        return;
      }
      
      try {
        const prediction = JSON.parse(result);
        resolve(prediction);
      } catch (err) {
        reject(new Error(`ไม่สามารถแปลงผลลัพธ์: ${err.message}`));
      }
    });
  });
};

// API สำหรับพยากรณ์ราคาหุ้น
router.post('/:bankCode/predict', authMiddleware, async (req, res) => {
  try {
    const { bankCode } = req.params;
    const inputData = req.body;
    
    // หา bank_id จาก bank_code
    const [banks] = await db.execute('SELECT id, bank_name FROM banks WHERE bank_code = ?', [bankCode]);
    
    if (banks.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลธนาคาร' });
    }
    
    const bank = banks[0];
    
    // เรียกใช้โมเดลพยากรณ์
    const prediction = await predictStockPrice(bankCode, inputData);
    
    // บันทึกผลการพยากรณ์
    await db.execute(
      'INSERT INTO predictions (bank_id, prediction_date, predicted_price, created_at) VALUES (?, CURDATE(), ?, NOW())',
      [bank.id, prediction.predicted_price]
    );
    
    res.json({
      bank_code: bankCode,
      bank_name: bank.bank_name,
      prediction_date: new Date().toISOString().split('T')[0],
      predicted_price: prediction.predicted_price,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ดึงข้อมูลผลการพยากรณ์ล่าสุดของแต่ละธนาคาร
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const [predictions] = await db.execute(`
      SELECT b.bank_code, b.bank_name, p.prediction_date, p.predicted_price, p.actual_price, p.error_percentage
      FROM banks b
      JOIN (
        SELECT bank_id, MAX(created_at) as latest_prediction
        FROM predictions
        GROUP BY bank_id
      ) latest ON b.id = latest.bank_id
      JOIN predictions p ON latest.bank_id = p.bank_id AND latest.latest_prediction = p.created_at
    `);
    
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;