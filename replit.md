# Bar Management System

## Overview

This is a full-stack bar management application built with React, Express, and PostgreSQL. The system is designed to handle multiple user roles (cashier, server, manager) with role-based permissions for managing bar operations including inventory, sales, tables, and customer credit management.

## User Preferences

Preferred communication style: Simple, everyday language.
Interface language: French labels and messages preferred for UI elements.
Session management: Sessions should remain open until manually closed (no automatic time limits).
Printer support: EPSON thermal printer integration for receipt printing required.

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

## Recent Changes (July 2025)

### Session Management Improvements
- Updated session modal to remove specific time constraints (morning/evening shifts without hourly limits)
- Sessions now remain open until manually closed by cashier
- Automatic session detection based on current time for default shift type

### Order Management Enhancements
- Fixed order item addition for existing orders (resolving "falha ao adicionar itens ao pedido")
- Implemented proper logic to add items to pending orders at same table
- Updated database schema: renamed `customer_name` to `client_name` in orders table
- Added `payment_method` field to orders table for tracking payment types

### Thermal Printer Integration
- Created comprehensive thermal printer utility (`thermalPrinter.ts`)
- Supports EPSON thermal printers with Web Serial API
- Fallback to print dialog and text download for unsupported browsers
- Automatic receipt printing after payment processing
- Manual print functionality in sales history
- Proper receipt formatting with Portuguese text

### User Interface Improvements
- Enhanced product cards with stock level indicators (green/orange/red)
- Added new client creation modal in order process
- Improved stock visibility for cashiers on product selection
- Updated navigation with dedicated sales history page
- Added comprehensive error handling and user feedback

### Tables Management Enhancement (July 2025)
- Redesigned Tables page with location-based grouping
- Added real-time order information display on table cards
- Implemented visual indicators: green (free), orange (pending order), red (occupied)
- Direct order management from table cards with "Voir" and "Ajouter" buttons
- Enhanced table status system with pending order detection
- Added modal dialogs for viewing order details directly from tables
- Streamlined workflow allowing order creation and item addition from tables page

### Order Management Bug Fixes (July 2025)
- Fixed quantity handling when adding items to existing orders
- Improved logic to handle both new products and quantity increases for existing products
- Enhanced existing order detection and item addition workflow
- Added proper quantity difference calculation for existing products
- Fixed dashboard sales calculation display issues

### Database Schema Updates
- Added `address` and `notes` fields to credit_clients table
- Updated order table column names for consistency
- Added sample data for testing (products, tables, credit clients, users)
- Stock tracking implementation with min/max levels
- Added `imageUrl` field to products table for image upload support

### Manager Dashboard Implementation (July 2025)
- Created dedicated ManagerDashboard component with comprehensive business analytics
- Implemented role-based navigation with different sidebars for managers vs cashiers/servers
- Added sales analytics by shift (morning/evening) with detailed statistics
- Developed manager-specific routes for user management and business metrics
- Created tabbed interface for overview, sales, users, inventory, and reports
- Added export functionality for daily, weekly, and monthly sales reports
- Implemented user management with activation/deactivation capabilities
- Added top products analysis and session history tracking

### Inventory Management System (July 2025)
- Created comprehensive inventory management page for managers
- Implemented product CRUD operations with optional image upload
- Added stock level monitoring with visual indicators (low/medium/high stock)
- Developed category-based filtering and search functionality
- Created product creation modal with image upload support
- Added stock statistics cards showing total products, low stock alerts, and inventory value
- Implemented grid view for products with edit/delete actions
- Added stock status indicators with color coding for easy monitoring

### Role-Based Access Control Enhancement (July 2025)
- Strict role separation: managers restricted from order/payment operations
- Cashiers and servers cannot access inventory management or user administration
- Manager role redirects to specialized dashboard instead of operational dashboard
- Different navigation menus based on user roles
- Role-based API endpoint protection with 403 forbidden responses
- Updated authentication middleware to enforce manager-only routes

### Manager Dashboard Statistics Fix (July 2025)
- Fixed SQL syntax error in `getTopProductsByDate` method causing statistics to show 0 F CFA
- Added proper SQL imports and corrected column references (totalPrice instead of price)
- Implemented comprehensive user management functionality with create/modify/block capabilities
- Added modal interface for user creation and modification with form validation
- Created sample data for testing statistics display (sessions, orders, credit clients)
- Fixed manager authentication and data retrieval for real-time dashboard statistics
- Sales statistics now properly display by shift (morning/evening) with accurate totals
- Export functionality for daily/weekly/monthly reports with CSV download capability

### Inventory Management CRUD Operations Complete (July 2025)
- Fixed missing PUT and DELETE API routes for products causing inventory management failures
- Implemented soft delete functionality (isActive = false) for product removal instead of hard delete
- Added cache-busting headers and React Query configuration for real-time inventory updates
- Corrected field mappings between database schema and frontend (stockQuantity vs stock, minStockLevel vs minStock)
- Fixed data type validation: price field now correctly sent as string to match decimal schema
- Removed problematic image upload functionality that was causing validation errors
- Product creation, modification, and deletion now fully functional with proper error handling
- Inventory display filters only active products (isActive = true) with real-time refresh