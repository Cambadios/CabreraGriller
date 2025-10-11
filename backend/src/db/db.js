// src/config/db.js
import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  // opcionalmente ajusta tamaños/timeouts:
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Helper: consulta con logging básico
export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('DB QUERY', { text, duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};

// Ping de salud
export const pingDB = async () => {
  const { rows } = await query('SELECT 1 as ok;');
  return rows[0]?.ok === 1;
};

export default pool;
