import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  json,
  mysqlTable,
  text,
  varchar,
  timestamp,
  decimal,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 128 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  profileImageUrl: varchar("profile_image_url", { length: 512 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("consultant"), // 'admin' or 'consultant'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'prospect', 'inactive'
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotes table
export const quotes = mysqlTable("quotes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id),
  quoteNumber: varchar("quote_number", { length: 100 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  items: json("items").notNull(), // Array of quote line items
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // 'draft', 'sent', 'accepted', 'rejected'
  validUntil: timestamp("valid_until"),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meetings table
export const meetings = mysqlTable("meetings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: int("duration").notNull().default(60), // duration in minutes
  location: text("location"),
  agenda: text("agenda"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"), // 'scheduled', 'confirmed', 'completed', 'cancelled'
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = mysqlTable("documents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: int("size").notNull(),
  path: text("path").notNull(),
  uploadedBy: varchar("uploaded_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  quotes: many(quotes),
  meetings: many(meetings),
  documents: many(documents),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
  quotes: many(quotes),
  meetings: many(meetings),
  documents: many(documents),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [quotes.createdBy],
    references: [users.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  client: one(clients, {
    fields: [meetings.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [meetings.createdBy],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertClientSchema = createInsertSchema(clients).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertQuoteSchema = createInsertSchema(quotes).omit({ 
  id: true, 
  quoteNumber: true,
  createdAt: true, 
  updatedAt: true 
});
export const insertMeetingSchema = createInsertSchema(meetings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  createdAt: true 
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
