import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userSystemEnum = pgEnum("user_system_enum", ["system", "user"]);

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  pdfName: text("pdfName").notNull(),
  pdfUrl: text("pdfUrl").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  userId: varchar("userId", { length: 256 }).notNull(),
  fileKey: text("fileKey").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chatId")
    .references(() => chats.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  role: userSystemEnum("role").notNull().default("user"),
});
