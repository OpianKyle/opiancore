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
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        profile_image_url VARCHAR(512),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'consultant',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create clients table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name TEXT NOT NULL,
        company TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        notes TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create quotes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        client_id VARCHAR(36) NOT NULL,
        quote_number VARCHAR(100) NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        items JSON NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL,
        tax DECIMAL(12,2) NOT NULL DEFAULT 0,
        total DECIMAL(12,2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        valid_until TIMESTAMP,
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create meetings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        client_id VARCHAR(36) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        scheduled_at TIMESTAMP NOT NULL,
        duration INT NOT NULL DEFAULT 60,
        location TEXT,
        agenda TEXT,
        notes TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create documents table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        client_id VARCHAR(36) NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INT NOT NULL,
        path TEXT NOT NULL,
        uploaded_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    console.log('Database tables created/verified successfully');
    connection.release();
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    throw error;
  }
}