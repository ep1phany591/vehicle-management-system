// reset-password.js
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetPassword() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'vehicle_management'
  });
  
  try {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('新密码哈希:', hashedPassword);
    
    // 更新所有用户的密码
    await pool.query(
      "UPDATE users SET password = ? WHERE phone = '13800138000'",
      [hashedPassword]
    );
    
    console.log('密码重置成功');
    
    // 验证
    const [users] = await pool.query(
      "SELECT * FROM users WHERE phone = '13800138000'"
    );
    
    if (users.length > 0) {
      const user = users[0];
      const isValid = await bcrypt.compare(password, user.password);
      console.log('验证结果:', isValid);
      console.log('用户新哈希:', user.password);
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

resetPassword();