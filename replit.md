# Personal Finance App

## Overview

This is a full-stack personal finance application built for managing credit card expenses. The application allows users to track credit card purchases, manage multiple cards, and monitor monthly spending patterns. It's designed as a single-user application focused on detailed expense tracking and financial control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

This application follows a modern full-stack architecture with a clear separation between client and server:

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Validation**: Zod schemas shared between client and server

## Key Components

### Database Schema
The application uses three main entities:
1. **Cards**: Stores credit card information including bank name, logo, closing day, and due day
2. **Purchases**: Records individual transactions with installment support and automatic invoice month calculation
3. **Monthly Invoices**: Aggregates purchase totals by card and month for invoice tracking

### API Endpoints
- **Card Management**: CRUD operations for credit cards (`/api/cards`)
- **Purchase Tracking**: CRUD operations for purchases (`/api/purchases`)
- **Invoice Management**: Monthly invoice aggregation (`/api/invoices`)

### Frontend Pages
- **Dashboard**: Overview of current month spending, recent purchases, and card summaries
- **Purchase History**: Filtered view of all purchases with search and categorization
- **Cards Management**: Dedicated page to view and manage all registered credit cards
- **Purchases Management**: Complete view of all purchases with individual delete functionality
- **Invoice History**: Hierarchical view organized by year > month > bank with detailed breakdowns

### Key Features
- **Installment Support**: Automatic calculation of installment values and invoice months
- **Category Management**: Predefined categories for expense classification
- **Monthly Aggregation**: Automatic calculation of monthly invoices per card
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Navigation Menu**: Three-dot menu for accessing all app sections
- **Card Management**: Complete CRUD operations for credit cards with visual cards display
- **Purchase Management**: Individual purchase deletion with filtering capabilities
- **Hierarchical Invoice History**: Year > Month > Bank breakdown with detailed purchase lists

## Data Flow

1. **Purchase Creation**: User creates a purchase → System calculates invoice month based on card closing day → Installment details are computed → Monthly invoice is updated
2. **Dashboard View**: Aggregated data is fetched for current month → Cards and recent purchases are displayed → Real-time totals are calculated
3. **History Filtering**: Purchases are filtered by month, card, or category → Results are displayed with pagination support

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL provider
- **Connection**: Uses connection pooling via `@neondatabase/serverless`

### UI Components
- **Radix UI**: Comprehensive component library for accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel component for mobile-friendly interfaces

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Development environment optimizations

## Deployment Strategy

### Development
- **Local Development**: Uses Vite dev server with HMR
- **Database**: Connects to Neon Database via environment variables
- **Asset Serving**: Vite handles static assets and client-side routing

### Production
- **Build Process**: 
  1. Vite builds the frontend to `dist/public`
  2. ESBuild bundles the server code to `dist/index.js`
- **Server**: Express serves both API endpoints and static files
- **Database**: Uses the same Neon Database connection with production credentials

### Environment Configuration
- **DATABASE_URL**: Required environment variable for database connection
- **Build Scripts**: Separate scripts for development (`dev`) and production (`start`)
- **Type Checking**: TypeScript compilation check via `tsc`

The application is designed to run efficiently on Replit with minimal configuration, using serverless database connections and optimized build processes for both development and production environments.