import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cards = pgTable("cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankName: text("bank_name").notNull(),
  logoUrl: text("logo_url"),
  closingDay: integer("closing_day").notNull(),
  dueDay: integer("due_day").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardId: varchar("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  purchaseDate: date("purchase_date").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull(),
  totalInstallments: integer("total_installments").notNull().default(1),
  currentInstallment: integer("current_installment").notNull().default(1),
  installmentValue: decimal("installment_value", { precision: 10, scale: 2 }).notNull(),
  invoiceMonth: text("invoice_month").notNull(), // Format: YYYY-MM
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monthlyInvoices = pgTable("monthly_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: text("month").notNull(), // Format: YYYY-MM
  cardId: varchar("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cardRelations = relations(cards, ({ many }) => ({
  purchases: many(purchases),
  monthlyInvoices: many(monthlyInvoices),
}));

export const purchaseRelations = relations(purchases, ({ one }) => ({
  card: one(cards, {
    fields: [purchases.cardId],
    references: [cards.id],
  }),
}));

export const monthlyInvoiceRelations = relations(monthlyInvoices, ({ one }) => ({
  card: one(cards, {
    fields: [monthlyInvoices.cardId],
    references: [cards.id],
  }),
}));

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
}).extend({
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
  installmentValue: true,
  invoiceMonth: true,
}).extend({
  totalValue: z.string().transform((val) => parseFloat(val)),
  totalInstallments: z.number().min(1).max(99),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type MonthlyInvoice = typeof monthlyInvoices.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
