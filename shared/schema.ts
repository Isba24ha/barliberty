import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  decimal,
  varchar,
  jsonb,
  index,
  pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["cashier", "server", "manager"]);

// Shift types enum
export const shiftTypeEnum = pgEnum("shift_type", ["morning", "evening"]);

// Table status enum
export const tableStatusEnum = pgEnum("table_status", ["free", "occupied", "reserved"]);

// Order status enum
export const orderStatusEnum = pgEnum("order_status", ["pending", "preparing", "ready", "completed", "cancelled"]);

// Payment method enum
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "credit", "partial"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("server"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table for bar shifts
export const barSessions = pgTable("bar_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  shiftType: shiftTypeEnum("shift_type").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  totalSales: decimal("total_sales", { precision: 10, scale: 2 }).notNull().default("0.00"),
  transactionCount: integer("transaction_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tables in the bar
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  status: tableStatusEnum("status").notNull().default("free"),
  currentOrderId: integer("current_order_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products/Items
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  minStockLevel: integer("min_stock_level").notNull().default(5),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer credits
export const creditClients = pgTable("credit_clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email"),
  phone: varchar("phone", { length: 20 }),
  totalCredit: decimal("total_credit", { precision: 10, scale: 2 }).notNull().default("0.00"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).notNull().default("500.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").references(() => tables.id),
  serverId: varchar("server_id").references(() => users.id),
  sessionId: integer("session_id").references(() => barSessions.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  creditClientId: integer("credit_client_id").references(() => creditClients.id),
  cashierId: varchar("cashier_id").notNull().references(() => users.id),
  sessionId: integer("session_id").references(() => barSessions.id),
  method: paymentMethodEnum("method").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  receivedAmount: decimal("received_amount", { precision: 10, scale: 2 }),
  changeAmount: decimal("change_amount", { precision: 10, scale: 2 }),
  isPartial: boolean("is_partial").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employee absences
export const absences = pgTable("absences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  isApproved: boolean("is_approved").notNull().default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(barSessions),
  orders: many(orders),
  payments: many(payments),
  absences: many(absences),
}));

export const barSessionsRelations = relations(barSessions, ({ one, many }) => ({
  user: one(users, { fields: [barSessions.userId], references: [users.id] }),
  orders: many(orders),
  payments: many(payments),
}));

export const tablesRelations = relations(tables, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  orderItems: many(orderItems),
}));

export const creditClientsRelations = relations(creditClients, ({ many }) => ({
  payments: many(payments),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  server: one(users, { fields: [orders.serverId], references: [users.id] }),
  session: one(barSessions, { fields: [orders.sessionId], references: [barSessions.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  creditClient: one(creditClients, { fields: [payments.creditClientId], references: [creditClients.id] }),
  cashier: one(users, { fields: [payments.cashierId], references: [users.id] }),
  session: one(barSessions, { fields: [payments.sessionId], references: [barSessions.id] }),
}));

export const absencesRelations = relations(absences, ({ one }) => ({
  user: one(users, { fields: [absences.userId], references: [users.id] }),
  approver: one(users, { fields: [absences.approvedBy], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertBarSessionSchema = createInsertSchema(barSessions);
export const insertTableSchema = createInsertSchema(tables);
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertCreditClientSchema = createInsertSchema(creditClients);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertAbsenceSchema = createInsertSchema(absences);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type BarSession = typeof barSessions.$inferSelect;
export type InsertBarSession = typeof barSessions.$inferInsert;
export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type CreditClient = typeof creditClients.$inferSelect;
export type InsertCreditClient = typeof creditClients.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = typeof absences.$inferInsert;

// Extended types for API responses
export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
  table?: Table;
  server?: User;
};

export type SessionStats = {
  totalSales: string;
  transactionCount: number;
  activeCredits: string;
  occupiedTables: number;
  totalTables: number;
};
