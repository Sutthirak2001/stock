// bank-stock-backend/routes/banks.js
const express = require('express');
const router = express.Router();
const db = require('../middleware/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ดึงข้อมูลธนาคารทั้งหมด
router.get('/', async (req, res) => {
  try {
    const [banks] = await db.execute('SELECT * FROM banks');
    res.json(banks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ดึงข้อมูลหุ้นล่าสุดของแต่ละธนาคาร
router.get('/latest', async (req, res) => {
  try {
    const [latestData] = await db.execute(`
      SELECT b.bank_code, b.bank_name, bs.*
      FROM banks b
      JOIN (
        SELECT bank_id, MAX(date) as latest_date
        FROM bank_stocks
        GROUP BY bank_id
      ) latest ON b.id = latest.bank_id
      JOIN bank_stocks bs ON latest.bank_id = bs.bank_id AND latest.latest_date = bs.date
    `);
    
    res.json(latestData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ดึงข้อมูลหุ้นของธนาคารตาม bank_code
router.get('/:bankCode/stocks', async (req, res) => {
  try {
    const { bankCode } = req.params;
    const { limit = 30 } = req.query; // จำนวนข้อมูลย้อนหลัง (default 30 วัน)
    
    const [stocks] = await db.execute(`
      SELECT bs.*
      FROM bank_stocks bs
      JOIN banks b ON bs.bank_id = b.id
      WHERE b.bank_code = ?
      ORDER BY bs.date DESC
      LIMIT ?
    `, [bankCode, parseInt(limit)]);
    
    res.json(stocks.reverse()); // reverse เพื่อให้เรียงจากเก่าไปใหม่ สำหรับแสดงกราฟ
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// เพิ่มข้อมูลหุ้นธนาคาร (เฉพาะ admin)
router.post('/:bankCode/stocks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { bankCode } = req.params;
    const {
      date, close_price, open_price, high, low, volume, percentage_change,
      gdp, interest_rate, total_assets, total_equity, total_liabilities,
      net_profit, eps, pe, pbv, market_cap, book_value_per_share, roe, roa
    } = req.body;
    
    // หา bank_id จาก bank_code
    const [banks] = await db.execute('SELECT id FROM banks WHERE bank_code = ?', [bankCode]);
    
    if (banks.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลธนาคาร' });
    }
    
    const bankId = banks[0].id;
    
    // ตรวจสอบว่ามีข้อมูลของวันที่นี้แล้วหรือไม่
    const [existingData] = await db.execute(
      'SELECT id FROM bank_stocks WHERE bank_id = ? AND date = ?',
      [bankId, date]
    );
    
    if (existingData.length > 0) {
      // อัพเดทข้อมูลที่มีอยู่แล้ว
      await db.execute(`
        UPDATE bank_stocks SET
          close_price = ?, open_price = ?, high = ?, low = ?, volume = ?,
          percentage_change = ?, gdp = ?, interest_rate = ?, total_assets = ?,
          total_equity = ?, total_liabilities = ?, net_profit = ?, eps = ?,
          pe = ?, pbv = ?, market_cap = ?, book_value_per_share = ?, roe = ?, roa = ?
        WHERE id = ?
      `, [
        close_price, open_price, high, low, volume, percentage_change,
        gdp, interest_rate, total_assets, total_equity, total_liabilities,
        net_profit, eps, pe, pbv, market_cap, book_value_per_share, roe, roa,
        existingData[0].id
      ]);
      
      res.json({ message: 'อัพเดทข้อมูลหุ้นสำเร็จ' });
    } else {
      // เพิ่มข้อมูลใหม่
      await db.execute(`
        INSERT INTO bank_stocks (
          bank_id, date, close_price, open_price, high, low, volume,
          percentage_change, gdp, interest_rate, total_assets, total_equity,
          total_liabilities, net_profit, eps, pe, pbv, market_cap,
          book_value_per_share, roe, roa
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bankId, date, close_price, open_price, high, low, volume,
        percentage_change, gdp, interest_rate, total_assets, total_equity,
        total_liabilities, net_profit, eps, pe, pbv, market_cap,
        book_value_per_share, roe, roa
      ]);
      
      res.status(201).json({ message: 'เพิ่มข้อมูลหุ้นสำเร็จ' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ลบข้อมูลหุ้นธนาคาร (เฉพาะ admin)
router.delete('/:bankCode/stocks/:date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { bankCode, date } = req.params;
    
    // หา bank_id จาก bank_code
    const [banks] = await db.execute('SELECT id FROM banks WHERE bank_code = ?', [bankCode]);
    
    if (banks.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลธนาคาร' });
    }
    
    const bankId = banks[0].id;
    
    await db.execute(
      'DELETE FROM bank_stocks WHERE bank_id = ? AND date = ?',
      [bankId, date]
    );
    
    res.json({ message: 'ลบข้อมูลหุ้นสำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;