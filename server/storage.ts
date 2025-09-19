import {
  users,
  clients,
  quotes,
  meetings,
  documents,
  type User,
  type UpsertUser,
  type Client,
  type InsertClient,
  type Quote,
  type InsertQuote,
  type Meeting,
  type InsertMeeting,
  type Document,
  type InsertDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Client operations
  getClients(userId: string, isAdmin: boolean): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  searchClients(query: string, userId: string, isAdmin: boolean): Promise<Client[]>;
  
  // Quote operations
  getQuotes(userId: string, isAdmin: boolean): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: string): Promise<void>;
  getNextQuoteNumber(): Promise<string>;
  
  // Meeting operations
  getMeetings(userId: string, isAdmin: boolean): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting>;
  deleteMeeting(id: string): Promise<void>;
  
  // Document operations
  getDocuments(clientId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(userId: string, isAdmin: boolean): Promise<{
    totalClients: number;
    activeQuotes: number;
    upcomingMeetings: number;
    monthlyRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Client operations
  async getClients(userId: string, isAdmin: boolean): Promise<Client[]> {
    let query = db.select().from(clients);
    if (!isAdmin) {
      query = query.where(eq(clients.createdBy, userId));
    }
    return await query.orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async searchClients(query: string, userId: string, isAdmin: boolean): Promise<Client[]> {
    const conditions = [
      or(
        like(clients.name, `%${query}%`),
        like(clients.company, `%${query}%`),
        like(clients.email, `%${query}%`)
      )
    ];
    
    if (!isAdmin) {
      conditions.push(eq(clients.createdBy, userId));
    }

    return await db.select().from(clients).where(and(...conditions));
  }

  // Quote operations
  async getQuotes(userId: string, isAdmin: boolean): Promise<Quote[]> {
    let query = db.select().from(quotes);
    if (!isAdmin) {
      query = query.where(eq(quotes.createdBy, userId));
    }
    return await query.orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const quoteNumber = await this.getNextQuoteNumber();
    const [newQuote] = await db.insert(quotes).values({
      ...quote,
      quoteNumber
    }).returning();
    return newQuote;
  }

  async updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote> {
    const [updatedQuote] = await db
      .update(quotes)
      .set({ ...quote, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote;
  }

  async deleteQuote(id: string): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  async getNextQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `QT${year}`;
    
    const lastQuote = await db
      .select()
      .from(quotes)
      .where(like(quotes.quoteNumber, `${prefix}%`))
      .orderBy(desc(quotes.quoteNumber))
      .limit(1);

    if (lastQuote.length === 0) {
      return `${prefix}001`;
    }

    const lastNumber = parseInt(lastQuote[0].quoteNumber.slice(-3));
    return `${prefix}${String(lastNumber + 1).padStart(3, '0')}`;
  }

  // Meeting operations
  async getMeetings(userId: string, isAdmin: boolean): Promise<Meeting[]> {
    let query = db.select().from(meetings);
    if (!isAdmin) {
      query = query.where(eq(meetings.createdBy, userId));
    }
    return await query.orderBy(desc(meetings.scheduledAt));
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({ ...meeting, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting;
  }

  async deleteMeeting(id: string): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  // Document operations
  async getDocuments(clientId: string): Promise<Document[]> {
    return await db.select().from(documents)
      .where(eq(documents.clientId, clientId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Dashboard stats
  async getDashboardStats(userId: string, isAdmin: boolean): Promise<{
    totalClients: number;
    activeQuotes: number;
    upcomingMeetings: number;
    monthlyRevenue: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get total clients
    let clientQuery = db.select().from(clients);
    if (!isAdmin) {
      clientQuery = clientQuery.where(eq(clients.createdBy, userId));
    }
    const totalClients = (await clientQuery).length;

    // Get active quotes
    let activeQuoteConditions = [eq(quotes.status, 'sent')];
    if (!isAdmin) {
      activeQuoteConditions.push(eq(quotes.createdBy, userId));
    }
    const activeQuotes = (await db.select().from(quotes).where(and(...activeQuoteConditions))).length;

    // Get upcoming meetings
    let upcomingMeetingConditions = [eq(meetings.status, 'scheduled')];
    if (!isAdmin) {
      upcomingMeetingConditions.push(eq(meetings.createdBy, userId));
    }
    const upcomingMeetings = (await db.select().from(meetings).where(and(...upcomingMeetingConditions))).length;

    // Calculate monthly revenue (accepted quotes this month)
    let revenueConditions = [eq(quotes.status, 'accepted')];
    if (!isAdmin) {
      revenueConditions.push(eq(quotes.createdBy, userId));
    }
    const acceptedQuotes = await db.select().from(quotes).where(and(...revenueConditions));
    const monthlyRevenue = acceptedQuotes.reduce((sum, quote) => 
      sum + parseFloat(quote.total), 0
    );

    return {
      totalClients,
      activeQuotes,
      upcomingMeetings,
      monthlyRevenue
    };
  }
}

export const storage = new DatabaseStorage();
