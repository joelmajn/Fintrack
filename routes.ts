import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCardSchema, insertPurchaseSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Card routes
  app.get("/api/cards", async (req, res) => {
    try {
      const cards = await storage.getCards();
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar cartões" });
    }
  });

  app.post("/api/cards", async (req, res) => {
    try {
      const cardData = insertCardSchema.parse(req.body);
      const card = await storage.createCard(cardData);
      res.json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar cartão" });
      }
    }
  });

  app.delete("/api/cards/:id", async (req, res) => {
    try {
      await storage.deleteCard(req.params.id);
      res.json({ message: "Cartão removido com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover cartão" });
    }
  });

  // Purchase routes
  app.get("/api/purchases", async (req, res) => {
    try {
      const { month } = req.query;
      let purchases;
      
      if (month && typeof month === 'string') {
        purchases = await storage.getPurchasesByMonth(month);
      } else {
        purchases = await storage.getPurchases();
      }
      
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar compras" });
    }
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      console.log("Request body:", req.body);
      const purchaseData = insertPurchaseSchema.parse(req.body);
      console.log("Parsed data:", purchaseData);
      const purchase = await storage.createPurchase(purchaseData);
      res.json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        console.log("Database error:", error);
        res.status(500).json({ message: "Erro ao criar compra" });
      }
    }
  });

  app.delete("/api/purchases/:id", async (req, res) => {
    try {
      await storage.deletePurchase(req.params.id);
      res.json({ message: "Compra removida com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover compra" });
    }
  });

  // Monthly invoice routes
  app.get("/api/invoices/:month", async (req, res) => {
    try {
      const invoices = await storage.getMonthlyInvoices(req.params.month);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar faturas" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar categoria" });
      }
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ message: "Categoria removida com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover categoria" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
