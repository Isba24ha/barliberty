import {
  users,
  barSessions,
  tables,
  categories,
  products,
  creditClients,
  orders,
  orderItems,
  payments,
  absences,
  type User,
  type UpsertUser,
  type BarSession,
  type InsertBarSession,
  type Table,
  type InsertTable,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type CreditClient,
  type InsertCreditClient,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Payment,
  type InsertPayment,
  type Absence,
  type InsertAbsence,
  type OrderWithItems,
  type SessionStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sum, count, sql, gte, lt, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Session operations
  getActiveSession(userId: string): Promise<BarSession | undefined>;
  getAnyActiveSession(): Promise<BarSession | undefined>;
  createSession(session: InsertBarSession): Promise<BarSession>;
  endSession(sessionId: number): Promise<void>;
  getSessionStats(sessionId: number): Promise<SessionStats>;
  
  // Table operations
  getAllTables(): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  updateTableStatus(id: number, status: string, orderId?: number): Promise<void>;
  createTable(table: InsertTable): Promise<Table>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<void>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<void>;
  
  // Credit client operations
  getAllCreditClients(): Promise<CreditClient[]>;
  getCreditClient(id: number): Promise<CreditClient | undefined>;
  createCreditClient(client: InsertCreditClient): Promise<CreditClient>;
  updateCreditClient(id: number, client: Partial<InsertCreditClient>): Promise<void>;
  
  // Order operations
  getAllOrders(): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  getPendingOrders(): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<void>;
  addOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsBySession(sessionId: number): Promise<Payment[]>;
  
  // Absence operations
  createAbsence(absence: InsertAbsence): Promise<Absence>;
  getAbsencesByUser(userId: string): Promise<Absence[]>;
  approveAbsence(id: number, approvedBy: string): Promise<void>;
  
  // Manager operations
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, isActive: boolean): Promise<void>;
  updateUserDetails(id: string, userData: Partial<UpsertUser>): Promise<User>;
  getTopProductsByDate(date: string): Promise<Array<{ name: string; sales: number; revenue: string }>>;
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

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  // Session operations
  async getActiveSession(userId: string): Promise<BarSession | undefined> {
    const [session] = await db
      .select()
      .from(barSessions)
      .where(and(eq(barSessions.userId, userId), eq(barSessions.isActive, true)))
      .orderBy(desc(barSessions.startTime));
    return session;
  }

  async getAnyActiveSession(): Promise<BarSession | undefined> {
    const [session] = await db
      .select()
      .from(barSessions)
      .where(eq(barSessions.isActive, true))
      .orderBy(desc(barSessions.startTime));
    return session;
  }

  async createSession(sessionData: InsertBarSession): Promise<BarSession> {
    const [session] = await db.insert(barSessions).values(sessionData).returning();
    return session;
  }

  async endSession(sessionId: number): Promise<void> {
    // Calculate final stats before closing
    const stats = await this.getSessionStats(sessionId);
    
    await db
      .update(barSessions)
      .set({ 
        isActive: false, 
        endTime: new Date(),
        totalSales: stats.totalSales,
        transactionCount: stats.transactionCount 
      })
      .where(eq(barSessions.id, sessionId));
  }

  async getSessionStats(sessionId: number): Promise<SessionStats> {
    const [session] = await db
      .select()
      .from(barSessions)
      .where(eq(barSessions.id, sessionId));

    if (!session) {
      return {
        totalSales: "0.00",
        transactionCount: 0,
        activeCredits: "0.00",
        occupiedTables: 0,
        totalTables: 0,
      };
    }

    // Calculate total sales from payments during this session
    const totalSalesResult = await db
      .select({ total: sum(sql<number>`CAST(${payments.amount} AS NUMERIC)`) })
      .from(payments)
      .where(eq(payments.sessionId, sessionId));

    // Count transactions (payments) during this session
    const transactionCountResult = await db
      .select({ count: count() })
      .from(payments)
      .where(eq(payments.sessionId, sessionId));

    const totalTablesResult = await db.select({ count: count() }).from(tables);
    const occupiedTablesResult = await db
      .select({ count: count() })
      .from(tables)
      .where(eq(tables.status, "occupied"));

    const creditClientsResult = await db
      .select({ total: sum(creditClients.totalCredit) })
      .from(creditClients)
      .where(eq(creditClients.isActive, true));

    return {
      totalSales: totalSalesResult[0]?.total || "0.00",
      transactionCount: transactionCountResult[0]?.count || 0,
      activeCredits: creditClientsResult[0]?.total || "0.00",
      occupiedTables: occupiedTablesResult[0]?.count || 0,
      totalTables: totalTablesResult[0]?.count || 0,
    };
  }

  // Table operations
  async getAllTables(): Promise<Table[]> {
    return await db.select().from(tables).orderBy(asc(tables.number));
  }

  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async updateTableStatus(id: number, status: string, orderId?: number): Promise<void> {
    await db
      .update(tables)
      .set({
        status: status as any,
        currentOrderId: orderId,
        updatedAt: new Date(),
      })
      .where(eq(tables.id, id));
  }

  async createTable(tableData: InsertTable): Promise<Table> {
    const [table] = await db.insert(tables).values(tableData).returning();
    return table;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        categoryId: products.categoryId,
        stock: products.stockQuantity,
        minStock: products.minStockLevel,
        maxStock: sql<number>`${products.stockQuantity} * 2`,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<void> {
    await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id));
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<void> {
    await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id));
  }

  // Credit client operations
  async getAllCreditClients(): Promise<CreditClient[]> {
    return await db
      .select()
      .from(creditClients)
      .where(eq(creditClients.isActive, true))
      .orderBy(desc(creditClients.updatedAt));
  }

  async getCreditClient(id: number): Promise<CreditClient | undefined> {
    const [client] = await db.select().from(creditClients).where(eq(creditClients.id, id));
    return client;
  }

  async createCreditClient(clientData: InsertCreditClient): Promise<CreditClient> {
    const [client] = await db.insert(creditClients).values(clientData).returning();
    return client;
  }

  async updateCreditClient(id: number, clientData: Partial<InsertCreditClient>): Promise<void> {
    await db
      .update(creditClients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(creditClients.id, id));
  }

  // Order operations
  async getAllOrders(): Promise<OrderWithItems[]> {
    const ordersResult = await db
      .select()
      .from(orders)
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .leftJoin(users, eq(orders.serverId, users.id))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      ordersResult.map(async (orderResult) => {
        const order = orderResult.orders;
        const items = await db
          .select()
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items: items.map((item) => ({
            ...item.order_items,
            product: item.products!,
          })),
          table: orderResult.tables || undefined,
          server: orderResult.users || undefined,
        };
      })
    );

    return ordersWithItems;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [orderResult] = await db
      .select()
      .from(orders)
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .leftJoin(users, eq(orders.serverId, users.id))
      .where(eq(orders.id, id));

    if (!orderResult) return undefined;

    const items = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return {
      ...orderResult.orders,
      items: items.map((item) => ({
        ...item.order_items,
        product: item.products!,
      })),
      table: orderResult.tables || undefined,
      server: orderResult.users || undefined,
    };
  }

  async getPendingOrders(): Promise<OrderWithItems[]> {
    const ordersResult = await db
      .select()
      .from(orders)
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .leftJoin(users, eq(orders.serverId, users.id))
      .where(eq(orders.status, "pending"))
      .orderBy(asc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      ordersResult.map(async (orderResult) => {
        const order = orderResult.orders;
        const items = await db
          .select()
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items: items.map((item) => ({
            ...item.order_items,
            product: item.products!,
          })),
          table: orderResult.tables || undefined,
          server: orderResult.users || undefined,
        };
      })
    );

    return ordersWithItems;
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<void> {
    await db
      .update(orders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  async addOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(itemData).returning();
    return item;
  }

  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }

  async getPaymentsBySession(sessionId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.sessionId, sessionId))
      .orderBy(desc(payments.createdAt));
  }

  // Absence operations
  async createAbsence(absenceData: InsertAbsence): Promise<Absence> {
    const [absence] = await db.insert(absences).values(absenceData).returning();
    return absence;
  }

  async getAbsencesByUser(userId: string): Promise<Absence[]> {
    return await db
      .select()
      .from(absences)
      .where(eq(absences.userId, userId))
      .orderBy(desc(absences.createdAt));
  }

  async approveAbsence(id: number, approvedBy: string): Promise<void> {
    await db
      .update(absences)
      .set({ isApproved: true, approvedBy })
      .where(eq(absences.id, id));
  }

  // Manager operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName);
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, id));
  }

  async updateUserDetails(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getTopProductsByDate(date: string): Promise<Array<{ name: string; sales: number; revenue: string }>> {
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const topProducts = await db
        .select({
          name: products.name,
          sales: sql<number>`SUM(${orderItems.quantity})::int`,
          revenue: sql<string>`SUM(${orderItems.totalPrice})::text`,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            gte(orders.createdAt, startDate),
            lt(orders.createdAt, endDate),
            eq(orders.status, "completed")
          )
        )
        .groupBy(products.id, products.name)
        .orderBy(sql`SUM(${orderItems.totalPrice}) DESC`)
        .limit(5);

      return topProducts.map(p => ({
        name: p.name || "Produit inconnu",
        sales: p.sales || 0,
        revenue: (p.revenue || "0"),
      }));
    } catch (error) {
      console.error("Error in getTopProductsByDate:", error);
      return [];
    }
  }

  async getSessionsByPeriod(period: string, date: string): Promise<any[]> {
    const targetDate = new Date(date);
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "daily":
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
        break;
      case "weekly":
        const weekStart = new Date(targetDate);
        weekStart.setDate(targetDate.getDate() - targetDate.getDay());
        startDate = weekStart;
        endDate = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
        break;
      default:
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    }

    return await db
      .select({
        id: barSessions.id,
        userId: barSessions.userId,
        shiftType: barSessions.shiftType,
        totalSales: barSessions.totalSales,
        transactionCount: barSessions.transactionCount,
        createdAt: barSessions.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(barSessions)
      .leftJoin(users, eq(barSessions.userId, users.id))
      .where(
        and(
          gte(barSessions.createdAt, startDate),
          lt(barSessions.createdAt, endDate)
        )
      )
      .orderBy(desc(barSessions.createdAt));
  }
}

export const storage = new DatabaseStorage();
