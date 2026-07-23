import { pgTable, uuid, text, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const pdfs = pgTable('pdfs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'),
  title: varchar('title', { length: 255 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Pdf = typeof pdfs.$inferSelect;
export type NewPdf = typeof pdfs.$inferInsert;
