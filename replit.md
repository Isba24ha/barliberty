# Bar Management System

## Overview

This is a full-stack bar management application designed to streamline operations for bars, supporting multiple user roles (cashier, server, manager) with role-based permissions. It comprehensively manages inventory, sales, tables, and customer credit, aiming to enhance efficiency and provide real-time insights into bar operations. The project ambition is to deliver a robust, user-friendly system for optimized bar management.

## User Preferences

Preferred communication style: Simple, everyday language.
Interface language: French labels and messages preferred for UI elements.
Session management: Sessions should remain open until manually closed (no automatic time limits).
Printer support: EPSON thermal printer integration for receipt printing required.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite
- **UI/Styling**: Shadcn/UI (Radix UI primitives), Tailwind CSS
- **State Management**: Zustand, TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js (TypeScript, ESM)
- **Database**: PostgreSQL (Neon serverless driver)
- **ORM**: Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Custom role-based authentication

### Database Design
- **Primary Database**: PostgreSQL (Neon serverless)
- **Schema Management**: Drizzle Kit
- **Key Tables**: `users`, `bar_sessions`, `tables`, `products`, `orders`, `payments`, `credit_clients`
- **Relationships**: Normalized with foreign key constraints
- **Enums**: Role-based permissions, order statuses, payment methods

### Key Features
- **Authentication & Authorization**: Three distinct user roles (Cashier, Server, Manager) with role-based access control and persistent sessions.
- **Session Management**: Handling of morning/evening shifts and manual session closure.
- **Order Management**: Full order lifecycle, including item addition, quantity handling, and payment processing.
- **Credit System**: Customer credit accounts with payment tracking.
- **Table Management**: Real-time table status updates (free, pending order, occupied) with location-based grouping.
- **Inventory Control**: Product and stock management with CRUD operations, image upload support, stock level monitoring (min/max), and category management.
- **Real-time Features**: Polling-based updates for orders, tables, and sessions; live dashboard with real-time statistics.
- **Manager Dashboard**: Comprehensive analytics (sales by shift, top products, session history), user management, inventory management, and export functionality.
- **Thermal Printer Integration**: Support for EPSON thermal printers via Web Serial API for receipt printing.

### System Design Choices
- **Monorepo Structure**: Shared TypeScript types and schemas for end-to-end type safety.
- **Performance Optimization**: User caching system for rapid authentication, optimized database connection pooling.
- **Security**: Robust session management with IP tracking, activity monitoring, and environment-based CORS configuration.
- **UI/UX**: Consistent iconography (Lucide React), accessibility (Radix UI), and responsive design.

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Date Handling**: `date-fns`
- **Styling Utilities**: `clsx`, `tailwind-merge`
- **Validation**: Zod

### Backend Dependencies
- **Database Driver**: `@neondatabase/serverless`
- **ORM**: `drizzle-orm`
- **Session Storage**: `connect-pg-simple`

### Development Tools
- **Replit Integration**: Replit-specific plugins
- **Error Handling**: Runtime error overlay
- **Code Execution**: `tsx` (TypeScript execution), `esbuild` (production builds)