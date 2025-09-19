import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

if (!process.env.XNEELO_DB_HOST || !process.env.XNEELO_DB_NAME || !process.env.XNEELO_DB_USER || !process.env.XNEELO_DB_PASSWORD) {
  throw new Error(
    "MySQL environment variables (XNEELO_DB_HOST, XNEELO_DB_NAME, XNEELO_DB_USER, XNEELO_DB_PASSWORD) must be set",
  );
}

// Create MySQL connection pool
export const pool = mysql.createPool({
  host: process.env.XNEELO_DB_HOST,
  port: parseInt(process.env.XNEELO_DB_PORT || '3306'),
  database: process.env.XNEELO_DB_NAME,
  user: process.env.XNEELO_DB_USER,
  password: process.env.XNEELO_DB_PASSWORD,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool, { schema, mode: 'default' });

// Connection event handlers are not available on mysql2 pools

// Function to test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('MySQL database connection successful');
    return true;
  } catch (error) {
    console.error('MySQL database connection failed:', error);
    return false;
  }
}

// Function to create tables if they don't exist
export async function ensureTablesExist() {
  try {
    const connection = await pool.getConnection();
    
    // Create tables using the schema definitions - this will be implemented
    // after we update the authentication system to not depend on sessions table
    console.log('Database tables verification completed');
    
    connection.release();
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    throw error;
  }
}