import { pgTable, serial, varchar, integer, decimal, date, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * User table schema
 * Stores user information
 */
export const userTable = pgTable("user", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * LangChain chat histories table
 * Stores chat message history for conversation context
 * Note: message column must be JSONB for PostgresChatMessageHistory
 */
export const chatHistoriesTable = pgTable("langchain_chat_histories", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  message: jsonb("message").notNull(), // JSONB type required by LangChain
  createdAt: timestamp("created_at").defaultNow(),
  userId: varchar("user_id", { length: 50 }), // User ID for filtering sessions
});