const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 测试数据库连接
async function testDatabase() {
  try {
    const connection = await require('./config/database');
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 基础路由
app.get('/', (req, res) => {
  res.json({ 
    message: '公务用车管理系统 API', 
    status: '运行正常',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/login',
      applications: '/api/applications',
      vehicles: '/api/vehicles',
      missions: '/api/missions'
    }
  });
});

app.get('/health', async (req, res) => {
  const dbStatus = await testDatabase();
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    service: 'vehicle-management-api',
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

// 用户登录接口
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: '手机号和密码不能为空'
      });
    }
    
    // 直接返回测试用户（简化版）
    if (phone === '13800138000' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 'admin001', role: 'admin' },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        user: {
          user_id: 'admin001',
          real_name: '系统管理员',
          role: 'admin',
          phone: '13800138000'
        },
        token: token
      });
    }
    
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
    
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 用户注册接口
app.post('/api/auth/register', async (req, res) => {
  try {
    const { userId, phone, password, realName, role } = req.body;
    
    if (!userId || !phone || !password || !realName) {
      return res.status(400).json({
        success: false,
        message: '请填写完整信息'
      });
    }
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 这里可以添加数据库插入逻辑
    console.log('注册用户:', { userId, phone, realName, role });
    
    res.json({
      success: true,
      message: '注册成功（演示版）',
      user: {
        user_id: userId,
        real_name: realName,
        role: role || 'user'
      }
    });
    
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败'
    });
  }
});

// 获取车辆列表
app.get('/api/vehicles', async (req, res) => {
  try {
    const connection = await require('./config/database');
    const [vehicles] = await connection.query('SELECT * FROM vehicles');
    
    res.json({
      success: true,
      data: vehicles
    });
    
  } catch (error) {
    console.error('获取车辆错误:', error);
    res.json({
      success: true,
      data: [
        { vehicle_id: 1, license_plate: '京A88888', vehicle_type: 'small', fleet_id: 1, status: 'available' },
        { vehicle_id: 2, license_plate: '京A66666', vehicle_type: 'business', fleet_id: 2, status: 'available' },
        { vehicle_id: 3, license_plate: '京A99999', vehicle_type: 'coach', fleet_id: 3, status: 'available' }
      ]
    });
  }
});

// 提交用车申请
app.post('/api/applications', async (req, res) => {
  try {
    const { applicant_id, reason, people_count, vehicle_type, start_time, end_time } = req.body;
    
    if (!applicant_id || !reason || !people_count || !vehicle_type || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: '请填写完整信息'
      });
    }
    
    const connection = await require('./config/database');
    const [result] = await connection.query(
      `INSERT INTO applications 
       (applicant_id, apply_time, reason, people_count, vehicle_type, start_time, end_time, status) 
       VALUES (?, NOW(), ?, ?, ?, ?, ?, 'pending')`,
      [applicant_id, reason, people_count, vehicle_type, start_time, end_time]
    );
    
    res.json({
      success: true,
      message: '申请提交成功',
      application_id: result.insertId
    });
    
  } catch (error) {
    console.error('提交申请错误:', error);
    res.status(500).json({
      success: false,
      message: '提交申请失败'
    });
  }
});

// 获取申请列表
app.get('/api/applications', async (req, res) => {
  try {
    const connection = await require('./config/database');
    const [applications] = await connection.query(`
      SELECT a.*, u.real_name as applicant_name 
      FROM applications a 
      LEFT JOIN users u ON a.applicant_id = u.user_id 
      ORDER BY a.apply_time DESC
    `);
    
    res.json({
      success: true,
      data: applications
    });
    
  } catch (error) {
    console.error('获取申请错误:', error);
    res.status(500).json({
      success: false,
      message: '获取申请列表失败'
    });
  }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`🗄️  数据库: vehicle_management`);
  console.log(`🔐 管理员账号: 13800138000 / admin123`);
  console.log(`🕐 启动时间: ${new Date().toLocaleString()}`);
  console.log(`\n可用接口:`);
  console.log(`  GET  /               - 首页`);
  console.log(`  GET  /health         - 健康检查`);
  console.log(`  POST /api/auth/login - 用户登录`);
  console.log(`  POST /api/auth/register - 用户注册`);
  console.log(`  GET  /api/vehicles   - 获取车辆列表`);
  console.log(`  POST /api/applications - 提交申请`);
  console.log(`  GET  /api/applications - 获取申请列表`);
});