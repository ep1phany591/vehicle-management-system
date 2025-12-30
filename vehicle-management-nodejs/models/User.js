const pool = require('../config/database');

class User {
  // 根据手机号查找用户
  static async findByPhone(phone) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE phone = ?', 
      [phone]
    );
    return rows[0];
  }

  // 根据用户ID查找用户
  static async findById(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE user_id = ?', 
      [userId]
    );
    return rows[0];
  }

  // 创建用户
  static async create(userData) {
    const { userId, avatar, realName, password, role, phone, fleetId } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (user_id, avatar, real_name, password, role, phone, fleet_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, avatar, realName, password, role, phone, fleetId]
    );
    return result;
  }

  // 获取车队司机列表
  static async getDriversByFleet(fleetId) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE role = "driver" AND fleet_id = ?',
      [fleetId]
    );
    return rows;
  }
}

module.exports = User;