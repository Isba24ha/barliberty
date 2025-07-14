import { create } from 'zustand';
import { User, BarSession, Table, Order, CreditClient, SessionStats } from '@shared/schema';

interface BarStore {
  // Current user and session
  currentUser: User | null;
  activeSession: BarSession | null;
  sessionStats: SessionStats | null;
  
  // Data
  tables: Table[];
  pendingOrders: Order[];
  creditClients: CreditClient[];
  
  // UI State
  selectedTable: Table | null;
  showPaymentModal: boolean;
  showSessionModal: boolean;
  selectedOrder: Order | null;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setActiveSession: (session: BarSession | null) => void;
  setSessionStats: (stats: SessionStats | null) => void;
  setTables: (tables: Table[]) => void;
  setPendingOrders: (orders: Order[]) => void;
  setCreditClients: (clients: CreditClient[]) => void;
  setSelectedTable: (table: Table | null) => void;
  setShowPaymentModal: (show: boolean) => void;
  setShowSessionModal: (show: boolean) => void;
  setSelectedOrder: (order: Order | null) => void;
}

export const useBarStore = create<BarStore>((set) => ({
  // Initial state
  currentUser: null,
  activeSession: null,
  sessionStats: null,
  tables: [],
  pendingOrders: [],
  creditClients: [],
  selectedTable: null,
  showPaymentModal: false,
  showSessionModal: false,
  selectedOrder: null,
  
  // Actions
  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveSession: (session) => set({ activeSession: session }),
  setSessionStats: (stats) => set({ sessionStats: stats }),
  setTables: (tables) => set({ tables }),
  setPendingOrders: (orders) => set({ pendingOrders: orders }),
  setCreditClients: (clients) => set({ creditClients: clients }),
  setSelectedTable: (table) => set({ selectedTable: table }),
  setShowPaymentModal: (show) => set({ showPaymentModal: show }),
  setShowSessionModal: (show) => set({ showSessionModal: show }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
}));
