import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import MySQLStore from 'express-mysql-session';
import { pool } from './db';
import { storage } from './storage';
import type { Express, RequestHandler } from 'express';

// Extend session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
    };
  }
}

const MySQLSessionStore = MySQLStore(session);

// Create session store using MySQL
export function createSessionStore() {
  return new MySQLSessionStore({
    host: process.env.XNEELO_DB_HOST,
    port: parseInt(process.env.XNEELO_DB_PORT || '3306'),
    user: process.env.XNEELO_DB_USER,
    password: process.env.XNEELO_DB_PASSWORD,
    database: process.env.XNEELO_DB_NAME,
    createDatabaseTable: true,
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000, // 24 hours
  });
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const sessionStore = createSessionStore();
  
  return session({
    secret: process.env.SESSION_SECRET || 'opian-core-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify user still exists in database
    const user = await storage.getUser(req.session.user.id);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user to request for easy access
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Error verifying user session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Setup authentication routes
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUsers = await storage.searchUsers(email);
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const userId = nanoid();
      
      const user = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        role: 'consultant', // default role
      });

      // Create session
      req.session.user = { id: user.id, email: user.email };
      
      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const users = await storage.searchUsers(email);
      const user = users.find(u => u.email === email);
      
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      req.session.user = { id: user.id, email: user.email };
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}