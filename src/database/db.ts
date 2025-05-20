import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'hopper.proxy.rlwy.net',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'yZLOpNNyxQBPjbNzKJxBxWpsUhCzJmNc',
  database: process.env.MYSQLDATABASE || 'railway',
  port: Number(process.env.MYSQLPORT) || 24600,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;