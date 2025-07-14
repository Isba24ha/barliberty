# Bar Management System

## Overview

This is a full-stack bar management application built with React, Express, and PostgreSQL. The system is designed to handle multiple user roles (cashier, server, manager) with role-based permissions for managing bar operations including inventory, sales, tables, and customer credit management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: Zustand for global state management
- **Data Fetching**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Custom role-based authentication system

### Database Design
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations
- **Key Tables**: users, bar_sessions, tables, products, orders, payments, credit_clients
- **Relationships**: Properly normalized with foreign key constraints
- **Enums**: Role-based permissions, order statuses, payment methods

## Key Components

### Authentication & Authorization
- **Three User Roles**: 
  - Cashier: Can manage payments and sessions
  - Server: Can take orders and manage customer credits
  - Manager: Can view statistics and manage inventory
- **Session Management**: Role-based access control with session persistence
- **Demo Authentication**: Simplified login for development

### Business Logic Modules
- **Session Management**: Morning/evening shifts with proper session handling
- **Order Management**: Complete order lifecycle from creation to payment
- **Credit System**: Customer credit accounts with payment tracking
- **Table Management**: Real-time table status updates
- **Inventory Control**: Product and stock management

### Real-time Features
- **Auto-refresh**: Polling-based updates for orders, tables, and sessions
- **Live Dashboard**: Real-time statistics and metrics
- **Status Updates**: Automatic UI updates for table and order statuses

## Data Flow

1. **User Authentication**: Login → Role verification → Session creation
2. **Session Management**: Cashier opens session → Operations tracking → Session closure
3. **Order Processing**: Server creates order → Kitchen preparation → Cashier payment
4. **Credit Management**: Customer credit account → Partial payments → Balance tracking
5. **Analytics**: Real-time data aggregation → Dashboard statistics → Reports

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessible components
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation
- **Class Management**: clsx and tailwind-merge for conditional styling
- **Validation**: Zod for schema validation

### Backend Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm for database operations
- **Session Storage**: connect-pg-simple for PostgreSQL session store
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Replit Integration**: Replit-specific plugins for development environment
- **Error Handling**: Runtime error overlay for development
- **Code Organization**: Path aliases for clean imports

## Deployment Strategy

### Development Setup
- **Local Development**: Vite dev server with hot reloading
- **Database**: Requires DATABASE_URL environment variable
- **Session Storage**: PostgreSQL-backed session management
- **Asset Handling**: Vite handles static assets and bundling

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database Migrations**: Drizzle Kit handles schema migrations
- **Environment**: Production mode with optimized builds

### Key Configuration
- **Database**: PostgreSQL with Neon serverless driver
- **Session Security**: Secure session configuration required
- **CORS**: Frontend/backend integration on same domain
- **Static Files**: Express serves built frontend from dist/public

The application follows a monorepo structure with shared TypeScript types and schemas, enabling type safety across the full stack while maintaining clear separation of concerns between frontend and backend code.