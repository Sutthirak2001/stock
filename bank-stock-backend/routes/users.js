// bank-stock-backend/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../middleware/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ดึงข้อมูลผู้ใช้ทั้งหมด (เฉพาะ admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users ORDER BY id'
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
});

// ดึงข้อมูลผู้ใช้ตาม ID (เฉพาะ admin)
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
});

// เพิ่มผู้ใช้ใหม่ (เฉพาะ admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // ตรวจสอบว่าข้อมูลครบหรือไม่
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    
    // ตรวจสอบว่า username หรือ email ซ้ำหรือไม่
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
    }
    
    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // บันทึกลงฐานข้อมูล
    await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'user']
    );
    
    res.status(201).json({ message: 'เพิ่มผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้' });
  }
});

// แก้ไขข้อมูลผู้ใช้ (เฉพาะ admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const userId = req.params.id;
    
    // ตรวจสอบว่ามีผู้ใช้ที่ต้องการแก้ไขหรือไม่
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    // ตรวจสอบว่า username หรือ email ซ้ำกับผู้ใช้อื่นหรือไม่
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
    }
    
    // หากมีการเปลี่ยนรหัสผ่าน
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await db.execute(
        'UPDATE users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?',
        [username, email, hashedPassword, role, userId]
      );
    } else {
      // หากไม่มีการเปลี่ยนรหัสผ่าน
      await db.execute(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
        [username, email, role, userId]
      );
    }
    
    res.json({ message: 'แก้ไขข้อมูลผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้' });
  }
});

// ลบผู้ใช้ (เฉพาะ admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // ตรวจสอบว่ามีผู้ใช้ที่ต้องการลบหรือไม่
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    // ป้องกันการลบผู้ใช้ที่กำลังใช้งานอยู่
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' });
    }
    
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
  }
});

module.exports = router;