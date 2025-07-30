import { 
  cards, 
  purchases, 
  monthlyInvoices,
  categories,
  type Card, 
  type InsertCard,
  type Purchase,
  type InsertPurchase,
  type MonthlyInvoice,
  type Category,
  type InsertCategory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Card operations
  getCards(): Promise<Card[]>;
  getCard(id: string): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: string, card: Partial<InsertCard>): Promise<Card>;
  deleteCard(id: string): Promise<void>;

  // Purchase operations
  getPurchases(): Promise<(Purchase & { card: Card })[]>;
  getPurchasesByMonth(month: string): Promise<(Purchase & { card: Card })[]>;
  getPurchasesByCard(cardId: string): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  updatePurchase(id: string, purchase: Partial<Purchase>): Promise<Purchase>;
  deletePurchase(id: string): Promise<void>;

  // Monthly invoice operations
  getMonthlyInvoices(month: string): Promise<(MonthlyInvoice & { card: Card })[]>;
  updateMonthlyInvoice(month: string, cardId: string, totalValue: number): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCards(): Promise<Card[]> {
    return await db.select().from(cards).orderBy(cards.bankName);
  }

  async getCard(id: string): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const [card] = await db.insert(cards).values(insertCard).returning();
    return card;
  }

  async updateCard(id: string, updateCard: Partial<InsertCard>): Promise<Card> {
    const [card] = await db
      .update(cards)
      .set(updateCard)
      .where(eq(cards.id, id))
      .returning();
    return card;
  }

  async deleteCard(id: string): Promise<void> {
    await db.delete(cards).where(eq(cards.id, id));
  }

  async getPurchases(): Promise<(Purchase & { card: Card })[]> {
    return await db
      .select()
      .from(purchases)
      .leftJoin(cards, eq(purchases.cardId, cards.id))
      .orderBy(desc(purchases.purchaseDate))
      .then(rows => 
        rows.map(row => ({ ...row.purchases, card: row.cards! }))
      );
  }

  async getPurchasesByMonth(month: string): Promise<(Purchase & { card: Card })[]> {
    return await db
      .select()
      .from(purchases)
      .leftJoin(cards, eq(purchases.cardId, cards.id))
      .where(eq(purchases.invoiceMonth, month))
      .orderBy(desc(purchases.purchaseDate))
      .then(rows => 
        rows.map(row => ({ ...row.purchases, card: row.cards! }))
      );
  }

  async getPurchasesByCard(cardId: string): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.cardId, cardId))
      .orderBy(desc(purchases.purchaseDate));
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    // Calculate installment value
    const installmentValue = insertPurchase.totalValue / insertPurchase.totalInstallments;
    
    // Get card information
    const card = await this.getCard(insertPurchase.cardId);
    if (!card) throw new Error("Card not found");
    
    const purchaseDate = new Date(insertPurchase.purchaseDate);
    const purchaseDay = purchaseDate.getDate();
    
    // Calculate the first invoice month based on card closing day
    let firstInvoiceDate = new Date(purchaseDate);
    
    // If purchase is on or after closing day, it goes to next month's invoice
    if (purchaseDay >= card.closingDay) {
      firstInvoiceDate.setMonth(firstInvoiceDate.getMonth() + 1);
    }
    
    // Create purchase entries for each installment
    const purchaseList: Purchase[] = [];
    
    for (let i = 0; i < insertPurchase.totalInstallments; i++) {
      const installmentDate = new Date(firstInvoiceDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      const invoiceMonth = `${installmentDate.getFullYear()}-${String(installmentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const purchaseData = {
        cardId: insertPurchase.cardId,
        purchaseDate: insertPurchase.purchaseDate,
        name: insertPurchase.name,
        category: insertPurchase.category,
        totalValue: insertPurchase.totalValue.toString(),
        totalInstallments: insertPurchase.totalInstallments,
        currentInstallment: i + 1,
        installmentValue: installmentValue.toString(),
        invoiceMonth,
      };

      const [purchase] = await db.insert(purchases).values(purchaseData).returning();
      purchaseList.push(purchase);
      
      // Update monthly invoice for each installment
      await this.updateMonthlyInvoiceForCard(invoiceMonth, insertPurchase.cardId);
    }
    
    // Return the first installment purchase
    return purchaseList[0];
  }

  async updatePurchase(id: string, updatePurchase: Partial<Purchase>): Promise<Purchase> {
    const [purchase] = await db
      .update(purchases)
      .set(updatePurchase)
      .where(eq(purchases.id, id))
      .returning();
    return purchase;
  }

  async deletePurchase(id: string): Promise<void> {
    const purchaseToDelete = await db.select().from(purchases).where(eq(purchases.id, id));
    if (purchaseToDelete.length > 0) {
      const purchase = purchaseToDelete[0];
      
      // Find all related installments (same purchase date, card, name, and total value)
      const relatedPurchases = await db.select().from(purchases).where(
        and(
          eq(purchases.cardId, purchase.cardId),
          eq(purchases.purchaseDate, purchase.purchaseDate),
          eq(purchases.name, purchase.name),
          eq(purchases.totalValue, purchase.totalValue),
          eq(purchases.totalInstallments, purchase.totalInstallments)
        )
      );
      
      // Get all unique invoice months from related purchases
      const invoiceMonths = Array.from(new Set(relatedPurchases.map(p => p.invoiceMonth)));
      
      // Delete all related purchases
      await db.delete(purchases).where(
        and(
          eq(purchases.cardId, purchase.cardId),
          eq(purchases.purchaseDate, purchase.purchaseDate),
          eq(purchases.name, purchase.name),
          eq(purchases.totalValue, purchase.totalValue),
          eq(purchases.totalInstallments, purchase.totalInstallments)
        )
      );
      
      // Update monthly invoices for all affected months
      for (const invoiceMonth of invoiceMonths) {
        await this.updateMonthlyInvoiceForCard(invoiceMonth, purchase.cardId);
      }
    }
  }

  async getMonthlyInvoices(month: string): Promise<(MonthlyInvoice & { card: Card })[]> {
    return await db
      .select()
      .from(monthlyInvoices)
      .leftJoin(cards, eq(monthlyInvoices.cardId, cards.id))
      .where(eq(monthlyInvoices.month, month))
      .then(rows => 
        rows.map(row => ({ ...row.monthly_invoices, card: row.cards! }))
      );
  }

  async updateMonthlyInvoice(month: string, cardId: string, totalValue: number): Promise<void> {
    const existing = await db
      .select()
      .from(monthlyInvoices)
      .where(and(eq(monthlyInvoices.month, month), eq(monthlyInvoices.cardId, cardId)));

    if (existing.length > 0) {
      await db
        .update(monthlyInvoices)
        .set({ totalValue: totalValue.toString() })
        .where(and(eq(monthlyInvoices.month, month), eq(monthlyInvoices.cardId, cardId)));
    } else {
      await db.insert(monthlyInvoices).values({
        month,
        cardId,
        totalValue: totalValue.toString(),
      });
    }
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  private async updateMonthlyInvoiceForCard(month: string, cardId: string): Promise<void> {
    const result = await db
      .select({ sum: sql<string>`COALESCE(SUM(${purchases.installmentValue}), 0)` })
      .from(purchases)
      .where(and(eq(purchases.invoiceMonth, month), eq(purchases.cardId, cardId)));
    
    const totalValue = parseFloat(result[0]?.sum || '0');
    await this.updateMonthlyInvoice(month, cardId, totalValue);
  }
}

export const storage = new DatabaseStorage();
