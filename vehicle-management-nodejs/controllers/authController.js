const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  // 用户登录
  async login(req, res) {
    try {
      const { phone, password } = req.body;

      // 验证输入
      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          message: '手机号和密码不能为空'
        });
      }

      // 查找用户
      const user = await User.findByPhone(phone);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '密码错误'
        });
      }

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.user_id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // 移除密码
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  },

  // 用户注册
  async register(req, res) {
    try {
      const { userId, phone, password, realName, role } = req.body;

      // 验证输入
      if (!userId || !phone || !password || !realName) {
        return res.status(400).json({
          success: false,
          message: '请填写完整信息'
        });
      }

      // 检查用户是否已存在
      const existingUser = await User.findByPhone(phone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '手机号已注册'
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      await User.create({
        userId,
        phone,
        password: hashedPassword,
        realName,
        role: role || 'user'
      });

      res.json({
        success: true,
        message: '注册成功'
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({
        success: false,
        message: '注册失败'
      });
    }
  }
};

module.exports = authController;