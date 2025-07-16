import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertBarSessionSchema,
  insertTableSchema,
  insertProductSchema,
  insertCategorySchema,
  insertCreditClientSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertPaymentSchema,
  insertAbsenceSchema,
} from "@shared/schema";

// Enhanced auth middleware for production
const requireAuth = (req: any, res: any, next: any) => {
  try {
    const session = req.session as any;
    
    // Check if session exists and has user data
    if (!session || !session.user) {
      return res.status(401).json({ 
        message: "Não autorizado",
        details: "Sessão inválida ou expirada" 
      });
    }

    // Validate user data integrity
    if (!session.user.id || !session.user.role) {
      return res.status(401).json({ 
        message: "Não autorizado",
        details: "Dados de usuário inválidos" 
      });
    }

    // Update last activity for session tracking
    session.lastActivity = new Date().toISOString();
    
    // Attach user to request object
    req.user = session.user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: "Erro de autenticação",
      details: process.env.NODE_ENV === 'development' ? error.message : "Erro interno" 
    });
  }
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Acesso negado" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Cache user data for faster authentication
  const userCache = new Map();
  
  // Preload user data into cache at startup
  const preloadUserCache = async () => {
    try {
      const userIds = ['rafa', 'filinto', 'junior', 'server-001', 'jose.barros', 'milisiana', 'cashier-001', 'lucelle', 'carlmalack', 'manager', 'manager-001'];
      const users = await Promise.all(userIds.map(id => storage.getUser(id)));
      
      users.forEach(user => {
        if (user) {
          userCache.set(user.id, user);
        }
      });
      
      console.log(`Preloaded ${userCache.size} users into cache`);
    } catch (error) {
      console.error('Error preloading user cache:', error);
    }
  };
  
  // Initialize cache
  preloadUserCache();

  // Enhanced login route with improved security and error handling
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, role } = req.body;
      
      // Input validation
      if (!username || !password || !role) {
        return res.status(400).json({ 
          message: "Dados incompletos", 
          details: "Username, password e role são obrigatórios" 
        });
      }

      // Sanitize inputs
      const sanitizedUsername = username.trim().toLowerCase();
      const sanitizedRole = role.trim().toLowerCase();
      
      // Define user credentials with enhanced security
      const userCredentials = new Map([
        // Servers
        ['rafa', { password: 'Liberty@25%', role: 'server', active: true }],
        ['filinto', { password: 'Liberty@25%', role: 'server', active: true }],
        ['junior', { password: 'Liberty@25%', role: 'server', active: true }],
        ['server-001', { password: 'Liberty@25%', role: 'server', active: true }],
        // Cashiers
        ['jose.barros', { password: 'Liberty@25%', role: 'cashier', active: true }],
        ['milisiana', { password: 'Liberty@25%', role: 'cashier', active: true }],
        ['cashier-001', { password: 'Liberty@25%', role: 'cashier', active: true }],
        // Managers
        ['lucelle', { password: 'Bissau@25%', role: 'manager', active: true }],
        ['carlmalack', { password: 'Bissau@25%', role: 'manager', active: true }],
        ['manager', { password: 'Liberty@25%', role: 'manager', active: true }],
        ['manager-001', { password: 'Liberty@25%', role: 'manager', active: true }],
      ]);
      
      // Enhanced credential validation
      const userCreds = userCredentials.get(sanitizedUsername);
      
      if (!userCreds || userCreds.password !== password || userCreds.role !== sanitizedRole) {
        return res.status(401).json({ 
          message: "Credenciais inválidas", 
          details: "Usuário, senha ou role incorretos" 
        });
      }
      
      if (!userCreds.active) {
        return res.status(403).json({ 
          message: "Conta desativada", 
          details: "Contacte o administrador" 
        });
      }
      
      // Get user from cache first, fallback to database
      let user = userCache.get(sanitizedUsername);
      if (!user) {
        user = await storage.getUser(sanitizedUsername);
        if (user) {
          userCache.set(sanitizedUsername, user);
        }
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: "Usuário não encontrado", 
          details: "Dados do usuário não disponíveis" 
        });
      }
      
      // Check if user is active in database
      if (!user.isActive) {
        return res.status(403).json({ 
          message: "Conta desativada", 
          details: "Usuário inativo no sistema" 
        });
      }
      
      // Store user in session with enhanced security
      if (!req.session) {
        return res.status(500).json({ 
          message: "Erro de sessão", 
          details: "Sessão não disponível" 
        });
      }
      
      (req.session as any).user = user;
      (req.session as any).loginTime = new Date().toISOString();
      (req.session as any).lastActivity = new Date().toISOString();
      (req.session as any).ipAddress = req.ip;
      (req.session as any).userAgent = req.get('User-Agent') || 'unknown';
      
      // Save session explicitly to ensure persistence
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(new Error('Falha ao salvar sessão'));
          } else {
            resolve();
          }
        });
      });
      
      // Log successful login
      console.log(`Login successful: ${user.firstName} ${user.lastName} (${user.role}) at ${new Date().toISOString()}`);
      
      // Return enhanced user data
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          profileImageUrl: user.profileImageUrl
        },
        session: {
          loginTime: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
        },
        message: "Login realizado com sucesso"
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        details: process.env.NODE_ENV === 'development' ? error.message : "Tente novamente mais tarde" 
      });
    }
  });

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      // Return comprehensive user data from session
      const user = req.user;
      
      // Validate user data before returning
      if (!user || !user.id || !user.role) {
        return res.status(401).json({ 
          message: "Não autorizado",
          details: "Dados de usuário inválidos" 
        });
      }

      // Return user data for authenticated users
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ 
        message: "Erro ao buscar usuário",
        details: process.env.NODE_ENV === 'development' ? error.message : "Erro interno" 
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({ message: "Erro ao fazer logout" });
        }
        res.clearCookie('liberty.session');
        res.json({ message: "Logout realizado com sucesso" });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Erro ao fazer logout" });
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie('liberty.session');
      res.redirect('/login');
    });
  });

  // Session test route to verify session persistence
  app.get("/api/auth/session-test", (req, res) => {
    try {
      const session = req.session as any;
      const sessionInfo = {
        hasSession: !!session,
        sessionId: session?.id || null,
        user: session?.user || null,
        loginTime: session?.loginTime || null,
        cookie: {
          secure: session?.cookie?.secure || false,
          httpOnly: session?.cookie?.httpOnly || false,
          maxAge: session?.cookie?.maxAge || null,
          sameSite: session?.cookie?.sameSite || null,
          domain: session?.cookie?.domain || null
        },
        timestamp: new Date().toISOString()
      };
      
      res.json({
        message: "Session test successful",
        sessionInfo,
        authenticated: !!session?.user
      });
    } catch (error) {
      console.error("Session test error:", error);
      res.status(500).json({ 
        message: "Session test failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
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
      // Disable cache for product data to ensure fresh data after mutations
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': Date.now().toString()
      });
      
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

  app.put("/api/products/:id", requireAuth, requireRole(["manager"]), async (req, res) => {
    try {
      const { id } = req.params;
      const productId = parseInt(id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "ID de produit invalide" });
      }

      const productData = insertProductSchema.partial().parse(req.body);
      await storage.updateProduct(productId, productData);
      
      const updatedProduct = await storage.getProduct(productId);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du produit" });
    }
  });

  app.delete("/api/products/:id", requireAuth, requireRole(["manager"]), async (req, res) => {
    try {
      const { id } = req.params;
      const productId = parseInt(id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "ID de produit invalide" });
      }

      // Soft delete: set isActive to false instead of hard delete
      await storage.updateProduct(productId, { isActive: false });
      
      res.json({ message: "Produit supprimé avec succès", id: productId });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Erreur lors de la suppression du produit" });
    }
  });

  // Category routes
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
    }
  });

  app.post("/api/categories", requireAuth, requireRole(["manager"]), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Erreur lors de la création de la catégorie" });
    }
  });

  app.put("/api/categories/:id", requireAuth, requireRole(["manager"]), async (req, res) => {
    try {
      const { id } = req.params;
      const categoryId = parseInt(id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "ID de catégorie invalide" });
      }

      const categoryData = insertCategorySchema.partial().parse(req.body);
      await storage.updateCategory(categoryId, categoryData);
      
      const updatedCategory = await storage.getCategory(categoryId);
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de la catégorie" });
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
      const { status, date } = req.query;
      
      if (status === "completed" && date) {
        // Filter completed orders by date
        const orders = await storage.getAllOrders();
        const filterDate = new Date(date as string);
        const nextDate = new Date(filterDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return order.status === "completed" && 
                 orderDate >= filterDate && 
                 orderDate < nextDate;
        });
        
        res.json(filteredOrders);
      } else {
        const orders = await storage.getAllOrders();
        res.json(orders);
      }
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
      
      // Get active session - check for any active session, not just user's own
      let activeSession = await storage.getActiveSession(req.user.id);
      
      // If no personal session, look for any active session in the system
      if (!activeSession) {
        activeSession = await storage.getAnyActiveSession();
      }
      
      // If still no session and user is cashier, create one automatically
      if (!activeSession && req.user.role === "cashier") {
        activeSession = await storage.createSession({
          userId: req.user.id,
          shiftType: new Date().getHours() < 14 ? "morning" : "evening",
        });
      }
      
      if (!activeSession) {
        return res.status(400).json({ message: "Nenhuma sessão ativa encontrada. Um caixa deve iniciar uma sessão primeiro." });
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

  app.post("/api/orders/:id/items", requireAuth, requireRole(["server", "cashier"]), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { items } = req.body;
      
      // Check if order exists and is still pending
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Não é possível adicionar itens a um pedido já pago" });
      }

      // Add each item to the order
      const addedItems = [];
      for (const item of items) {
        const itemData = {
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: (parseFloat(item.price) * item.quantity).toFixed(2),
        };
        const addedItem = await storage.addOrderItem(itemData);
        addedItems.push(addedItem);
      }

      // Update order total amount
      const updatedOrder = await storage.getOrder(orderId);
      if (updatedOrder) {
        const totalAmount = updatedOrder.items.reduce((sum, item) => 
          sum + parseFloat(item.totalPrice), 0
        ).toFixed(2);
        await storage.updateOrder(orderId, { totalAmount });
      }

      res.json(addedItems);
    } catch (error) {
      console.error("Error adding order items:", error);
      res.status(500).json({ message: "Erro ao adicionar itens ao pedido" });
    }
  });

  // Payment routes
  app.post("/api/payments", requireAuth, requireRole(["cashier"]), async (req: any, res) => {
    try {
      const { orderId, method, amount, receivedAmount, creditClientId, phoneNumber } = req.body;
      
      // Get active session
      const activeSession = await storage.getActiveSession(req.user.id) || await storage.getAnyActiveSession();
      if (!activeSession) {
        return res.status(400).json({ message: "Nenhuma sessão ativa encontrada" });
      }

      // Calculate change amount for cash payments
      let changeAmount = "0.00";
      if (method === "cash" && receivedAmount) {
        changeAmount = (parseFloat(receivedAmount) - parseFloat(amount)).toFixed(2);
      }

      const paymentData = {
        orderId: parseInt(orderId),
        creditClientId: creditClientId ? parseInt(creditClientId) : null,
        cashierId: req.user.id,
        sessionId: activeSession.id,
        method,
        amount: amount.toString(),
        receivedAmount: receivedAmount ? receivedAmount.toString() : null,
        changeAmount,
        isPartial: false,
      };

      const payment = await storage.createPayment(paymentData);
      
      // If payment is credit, update the credit client's balance
      if (method === "credit" && creditClientId) {
        const creditClient = await storage.getCreditClient(parseInt(creditClientId));
        if (creditClient) {
          const newCreditTotal = (parseFloat(creditClient.totalCredit) + parseFloat(amount)).toFixed(2);
          await storage.updateCreditClient(parseInt(creditClientId), { 
            totalCredit: newCreditTotal 
          });
        }
      }
      
      // Update order status to completed
      await storage.updateOrder(parseInt(orderId), { status: "completed" });
      
      // Get the order to find the table
      const order = await storage.getOrder(parseInt(orderId));
      if (order && order.tableId) {
        // Free the table
        await storage.updateTableStatus(order.tableId, "free");
      }

      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      console.error("Error details:", error);
      res.status(500).json({ message: "Erro ao processar pagamento" });
    }
  });

  // Credit payment route
  app.post("/api/credit-payments", requireAuth, async (req, res) => {
    try {
      const { clientId, amount, method, phoneNumber } = req.body;
      
      if (!clientId || !amount || !method) {
        return res.status(400).json({ message: "Données manquantes" });
      }

      // Get current session
      const activeSession = await storage.getAnyActiveSession();
      if (!activeSession) {
        return res.status(400).json({ message: "Aucune session active trouvée" });
      }

      // Get the credit client
      const creditClient = await storage.getCreditClient(parseInt(clientId));
      if (!creditClient) {
        return res.status(404).json({ message: "Client non trouvé" });
      }

      const paymentAmount = parseFloat(amount);
      const currentCredit = parseFloat(creditClient.totalCredit);

      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }

      if (paymentAmount > currentCredit) {
        return res.status(400).json({ message: "Montant supérieur au crédit disponible" });
      }

      // Calculate new credit balance
      const newCreditBalance = (currentCredit - paymentAmount).toFixed(2);

      // Update credit client balance
      await storage.updateCreditClient(parseInt(clientId), {
        totalCredit: newCreditBalance
      });

      // Create a payment record (using existing payment system)
      const paymentData = {
        orderId: null, // No order for direct credit payment
        creditClientId: parseInt(clientId),
        cashierId: req.user.id,
        sessionId: activeSession.id,
        method,
        amount: amount.toString(),
        receivedAmount: method === "cash" ? amount.toString() : null,
        changeAmount: "0.00",
        phoneNumber: phoneNumber || null,
        isPartial: false,
        isDirectCreditPayment: true, // Flag to identify direct credit payments
      };

      const payment = await storage.createPayment(paymentData);
      
      res.json({
        payment,
        newCreditBalance,
        message: "Paiement de crédit traité avec succès"
      });
    } catch (error) {
      console.error("Error processing credit payment:", error);
      res.status(500).json({ message: "Erreur lors du traitement du paiement" });
    }
  });

  // Manager statistics routes
  app.get("/api/manager/stats/daily/:date", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== "manager") {
        return res.status(403).json({ message: "Accès interdit" });
      }

      const { date } = req.params;
      
      // Get all sessions for the selected date (only real sessions with actual data)
      const sessions = await storage.getSessionsByPeriod("daily", date);
      
      // Calculate sales by shift from real sessions data
      const morningSales = sessions
        .filter(s => s.shiftType === "morning" && s.totalSales)
        .reduce((sum, s) => sum + parseFloat(s.totalSales || "0"), 0);
      
      const eveningSales = sessions
        .filter(s => s.shiftType === "evening" && s.totalSales)
        .reduce((sum, s) => sum + parseFloat(s.totalSales || "0"), 0);

      const totalSales = morningSales + eveningSales;

      // Get active credits
      const creditClients = await storage.getAllCreditClients();
      const activeCredits = creditClients
        .filter(c => c.isActive && parseFloat(c.totalCredit) > 0)
        .reduce((sum, c) => sum + parseFloat(c.totalCredit), 0);

      // Get user statistics
      const users = await storage.getAllUsers();
      const activeUsers = users.filter(u => u.isActive).length;

      // Get product statistics
      const products = await storage.getAllProducts();
      const lowStockProducts = products.filter(p => 
        p.stock !== null && p.minStock !== null && p.stock <= p.minStock
      ).length;

      // Get top products from actual sales data
      const topProducts = await storage.getTopProductsByDate(date);

      // Get session history
      const sessionHistory = sessions.slice(0, 10).map(s => ({
        id: s.id,
        date: new Date(s.createdAt!).toLocaleDateString("pt-PT"),
        shift: s.shiftType === "morning" ? "Matin" : "Soir",
        user: s.user?.firstName + " " + s.user?.lastName,
        sales: s.totalSales || "0.00",
        transactions: s.transactionCount || 0,
      }));

      const managerStats = {
        dailySales: {
          morning: morningSales.toFixed(2),
          evening: eveningSales.toFixed(2),
          total: totalSales.toFixed(2),
        },
        weeklySales: totalSales.toFixed(2), // Only show real daily data
        monthlySales: totalSales.toFixed(2), // Only show real daily data
        activeCredits: activeCredits.toFixed(2),
        totalUsers: users.length,
        activeUsers,
        totalProducts: products.length,
        lowStockProducts,
        topProducts,
        sessionHistory,
      };

      res.json(managerStats);
    } catch (error) {
      console.error("Error fetching manager stats:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Manager users route
  app.get("/api/manager/users", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== "manager") {
        return res.status(403).json({ message: "Accès interdit" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  // Create new user (manager only)
  app.post("/api/manager/users", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== "manager") {
        return res.status(403).json({ message: "Accès interdit" });
      }

      const userData = req.body;
      const newUser = await storage.upsertUser(userData);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Erreur lors de la création de l'utilisateur" });
    }
  });

  // Update user status (activate/deactivate)
  app.put("/api/manager/users/:id/status", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== "manager") {
        return res.status(403).json({ message: "Accès interdit" });
      }

      const { id } = req.params;
      const { isActive } = req.body;

      await storage.updateUserStatus(id, isActive);
      res.json({ message: "Statut utilisateur mis à jour" });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Update user details
  app.put("/api/manager/users/:id", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== "manager") {
        return res.status(403).json({ message: "Accès interdit" });
      }

      const { id } = req.params;
      const userData = req.body;

      const updatedUser = await storage.updateUserDetails(id, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
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
