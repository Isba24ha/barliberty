import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertBarSessionSchema,
  insertTableSchema,
  insertProductSchema,
  insertCreditClientSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertPaymentSchema,
  insertAbsenceSchema,
} from "@shared/schema";

// Simple auth middleware for development
const requireAuth = (req: any, res: any, next: any) => {
  if (!(req.session as any)?.user) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  req.user = (req.session as any).user;
  next();
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Acesso negado" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password, role } = req.body;
    
    // Define user credentials
    const userCredentials = {
      // Servers
      'rafa': { password: 'Liberty@25%', role: 'server' },
      'filinto': { password: 'Liberty@25%', role: 'server' },
      'junior': { password: 'Liberty@25%', role: 'server' },
      // Cashiers
      'jose.barros': { password: 'Liberty@25%', role: 'cashier' },
      'milisiana': { password: 'Liberty@25%', role: 'cashier' },
      // Managers
      'lucelle': { password: 'Bissau@25%', role: 'manager' },
      'carlmalack': { password: 'Bissau@25%', role: 'manager' },
    };
    
    // Validate credentials
    const userCreds = userCredentials[username as keyof typeof userCredentials];
    if (!userCreds || userCreds.password !== password || userCreds.role !== role) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }
    
    // Get user from database
    const user = await storage.getUser(username);
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    
    // Store user in session
    (req.session as any).user = user;
    
    res.json(user);
  });

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });

  // Session routes
  app.get("/api/sessions/active", requireAuth, async (req: any, res) => {
    try {
      const session = await storage.getActiveSession(req.user.id);
      res.json(session);
    } catch (error) {
      console.error("Error fetching active session:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la session" });
    }
  });

  app.post("/api/sessions", requireAuth, requireRole(["cashier"]), async (req: any, res) => {
    try {
      const sessionData = insertBarSessionSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Erreur lors de la création de la session" });
    }
  });

  app.post("/api/sessions/:id/end", requireAuth, requireRole(["cashier"]), async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.endSession(sessionId);
      res.json({ message: "Session fermée avec succès" });
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ message: "Erreur lors de la fermeture de la session" });
    }
  });

  app.get("/api/sessions/:id/stats", requireAuth, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const stats = await storage.getSessionStats(sessionId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching session stats:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Table routes
  app.get("/api/tables", requireAuth, async (req, res) => {
    try {
      const tables = await storage.getAllTables();
      res.json(tables);
    } catch (error) {
      console.error("Error fetching tables:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des tables" });
    }
  });

  app.post("/api/tables", requireAuth, requireRole(["manager"]), async (req, res) => {
    try {
      const tableData = insertTableSchema.parse(req.body);
      const table = await storage.createTable(tableData);
      res.json(table);
    } catch (error) {
      console.error("Error creating table:", error);
      res.status(500).json({ message: "Erreur lors de la création de la table" });
    }
  });

  app.put("/api/tables/:id/status", requireAuth, async (req: any, res) => {
    try {
      const tableId = parseInt(req.params.id);
      const { status, orderId } = req.body;
      await storage.updateTableStatus(tableId, status, orderId);
      res.json({ message: "Statut de la table mis à jour" });
    } catch (error) {
      console.error("Error updating table status:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut de la table" });
    }
  });

  // Product routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des produits" });
    }
  });

  app.post("/api/products", requireAuth, requireRole(["manager"]), async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Erreur lors de la création du produit" });
    }
  });

  // Credit client routes
  app.get("/api/credit-clients", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getAllCreditClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching credit clients:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des clients à crédit" });
    }
  });

  app.post("/api/credit-clients", requireAuth, requireRole(["cashier", "server"]), async (req, res) => {
    try {
      const clientData = insertCreditClientSchema.parse(req.body);
      const client = await storage.createCreditClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating credit client:", error);
      res.status(500).json({ message: "Erreur lors de la création du client à crédit" });
    }
  });

  // Order routes
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
    }
  });

  app.get("/api/orders/pending", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getPendingOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des commandes en attente" });
    }
  });

  app.post("/api/orders", requireAuth, requireRole(["server", "cashier"]), async (req: any, res) => {
    try {
      const { items, ...orderData } = req.body;
      
      // Get active session
      const activeSession = await storage.getActiveSession(req.user.id);
      if (!activeSession) {
        return res.status(400).json({ message: "Nenhuma sessão ativa encontrada" });
      }

      const order = await storage.createOrder({
        ...orderData,
        serverId: req.user.id,
        sessionId: activeSession.id,
      });

      // Add items to the order
      for (const item of items) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: (parseFloat(item.price) * item.quantity).toFixed(2),
        });
      }

      // Update table status
      await storage.updateTableStatus(orderData.tableId, "occupied", order.id);

      // Return the complete order with items
      const completeOrder = await storage.getOrder(order.id);
      res.json(completeOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });

  app.post("/api/orders/:id/items", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const itemData = insertOrderItemSchema.parse({
        ...req.body,
        orderId,
      });
      const item = await storage.addOrderItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error adding order item:", error);
      res.status(500).json({ message: "Erreur lors de l'ajout de l'article à la commande" });
    }
  });

  // Payment routes
  app.post("/api/payments", requireAuth, requireRole(["cashier"]), async (req: any, res) => {
    try {
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        cashierId: req.user.id,
      });
      const payment = await storage.createPayment(paymentData);
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Erreur lors de la création du paiement" });
    }
  });

  // Categories routes
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
