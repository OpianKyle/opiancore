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
import { eq, desc, like, and, or, count, sum, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  searchUsers(email: string): Promise<User[]>;
  
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
    // MySQL doesn't support returning clause, so we insert and then select
    try {
      await db
        .insert(users)
        .values(userData)
        .onDuplicateKeyUpdate({
          set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            passwordHash: userData.passwordHash,
            role: userData.role,
            updatedAt: new Date(),
          },
        });
      
      // Return the user after upsert
      const [user] = await db.select().from(users).where(eq(users.id, userData.id || ''));
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async searchUsers(email: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.email, email));
  }

  // Client operations
  async getClients(userId: string, isAdmin: boolean): Promise<Client[]> {
    if (!isAdmin) {
      return await db.select().from(clients).where(eq(clients.createdBy, userId)).orderBy(desc(clients.createdAt));
    }
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    await db.insert(clients).values(client);
    // Get the created client
    const [newClient] = await db.select().from(clients).where(eq(clients.name, client.name)).orderBy(desc(clients.createdAt)).limit(1);
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    await db.update(clients).set({
      ...client,
      updatedAt: new Date()
    }).where(eq(clients.id, id));
    
    const [updatedClient] = await db.select().from(clients).where(eq(clients.id, id));
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async searchClients(query: string, userId: string, isAdmin: boolean): Promise<Client[]> {
    const searchTerm = `%${query}%`;
    const conditions = [
      or(
        like(clients.name, searchTerm),
        like(clients.company, searchTerm),
        like(clients.email, searchTerm)
      )
    ];
    
    if (!isAdmin) {
      conditions.push(eq(clients.createdBy, userId));
    }

    return await db.select().from(clients).where(and(...conditions)).orderBy(desc(clients.createdAt));
  }

  // Quote operations
  async getQuotes(userId: string, isAdmin: boolean): Promise<Quote[]> {
    if (!isAdmin) {
      return await db.select().from(quotes).where(eq(quotes.createdBy, userId)).orderBy(desc(quotes.createdAt));
    }
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    // Generate quote number
    const quoteNumber = await this.getNextQuoteNumber();
    const quoteData = { ...quote, quoteNumber };
    
    await db.insert(quotes).values(quoteData);
    
    // Get the created quote
    const [newQuote] = await db.select().from(quotes).where(eq(quotes.quoteNumber, quoteNumber));
    return newQuote;
  }

  async updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote> {
    await db.update(quotes).set({
      ...quote,
      updatedAt: new Date()
    }).where(eq(quotes.id, id));
    
    const [updatedQuote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return updatedQuote;
  }

  async deleteQuote(id: string): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  async getNextQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `Q${year}-`;
    
    const [lastQuote] = await db
      .select()
      .from(quotes)
      .where(like(quotes.quoteNumber, `${prefix}%`))
      .orderBy(desc(quotes.quoteNumber))
      .limit(1);

    if (!lastQuote) {
      return `${prefix}001`;
    }

    const lastNumber = parseInt(lastQuote.quoteNumber.replace(prefix, ''));
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `${prefix}${nextNumber}`;
  }

  // Meeting operations
  async getMeetings(userId: string, isAdmin: boolean): Promise<Meeting[]> {
    if (!isAdmin) {
      return await db.select().from(meetings).where(eq(meetings.createdBy, userId)).orderBy(desc(meetings.scheduledAt));
    }
    return await db.select().from(meetings).orderBy(desc(meetings.scheduledAt));
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    await db.insert(meetings).values(meeting);
    
    // Get the created meeting
    const [newMeeting] = await db.select().from(meetings).where(eq(meetings.title, meeting.title)).orderBy(desc(meetings.createdAt)).limit(1);
    return newMeeting;
  }

  async updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting> {
    await db.update(meetings).set({
      ...meeting,
      updatedAt: new Date()
    }).where(eq(meetings.id, id));
    
    const [updatedMeeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return updatedMeeting;
  }

  async deleteMeeting(id: string): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  // Document operations
  async getDocuments(clientId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.clientId, clientId)).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    await db.insert(documents).values(document);
    
    // Get the created document
    const [newDocument] = await db.select().from(documents).where(eq(documents.filename, document.filename)).orderBy(desc(documents.createdAt)).limit(1);
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
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Count total clients
      const [clientCount] = isAdmin 
        ? await db.select({ count: count() }).from(clients)
        : await db.select({ count: count() }).from(clients).where(eq(clients.createdBy, userId));

      // Count active quotes
      const [quoteCount] = isAdmin
        ? await db.select({ count: count() }).from(quotes).where(eq(quotes.status, 'sent'))
        : await db.select({ count: count() }).from(quotes).where(and(eq(quotes.status, 'sent'), eq(quotes.createdBy, userId)));

      // Count upcoming meetings
      const [meetingCount] = isAdmin
        ? await db.select({ count: count() }).from(meetings).where(
            and(
              gte(meetings.scheduledAt, now),
              eq(meetings.status, 'scheduled')
            )
          )
        : await db.select({ count: count() }).from(meetings).where(
            and(
              gte(meetings.scheduledAt, now),
              eq(meetings.status, 'scheduled'),
              eq(meetings.createdBy, userId)
            )
          );

      // Calculate monthly revenue from accepted quotes
      const [revenue] = isAdmin
        ? await db.select({ total: sum(quotes.total) }).from(quotes).where(
            and(
              eq(quotes.status, 'accepted'),
              gte(quotes.updatedAt, startOfMonth)
            )
          )
        : await db.select({ total: sum(quotes.total) }).from(quotes).where(
            and(
              eq(quotes.status, 'accepted'),
              gte(quotes.updatedAt, startOfMonth),
              eq(quotes.createdBy, userId)
            )
          );

      return {
        totalClients: clientCount?.count || 0,
        activeQuotes: quoteCount?.count || 0,
        upcomingMeetings: meetingCount?.count || 0,
        monthlyRevenue: parseFloat(revenue?.total || '0')
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalClients: 0,
        activeQuotes: 0,
        upcomingMeetings: 0,
        monthlyRevenue: 0
      };
    }
  }
}

export const storage = new DatabaseStorage();