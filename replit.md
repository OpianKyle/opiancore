# Opian Core - Client Management Platform

## Overview

Opian Core is a professional client management platform built for consultants and consulting firms. The application enables users to manage client relationships, create and track quotes, schedule meetings, organize documents, and maintain business operations through an intuitive dashboard interface. Built with modern web technologies, it provides a comprehensive solution for client-focused businesses to streamline their workflow and enhance productivity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route organization
- **File Uploads**: Multer middleware for handling document uploads
- **Session Management**: Express sessions with PostgreSQL storage
- **Error Handling**: Centralized error handling middleware with structured responses

### Authentication System
- **Provider**: Replit OpenID Connect (OIDC) integration
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Authorization**: Role-based access control (admin/consultant roles)
- **User Management**: Automatic user provisioning and profile management

### Database Design
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema updates
- **Connection Pooling**: Neon serverless connection pooling
- **Core Entities**:
  - Users with role-based permissions
  - Clients with status tracking and contact information
  - Quotes with itemized billing and status workflow
  - Meetings with scheduling and status management
  - Documents with client-based organization

### File Management
- **Storage**: Local filesystem with organized directory structure
- **Upload Handling**: Multer with configurable file size limits (10MB)
- **File Organization**: Client-based folder structure for document management
- **Security**: File type validation and access control

### Development Tools
- **Type Safety**: Shared TypeScript types between frontend and backend
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Development Server**: Vite dev server with HMR and Express API proxy
- **Build Process**: Separate builds for client (Vite) and server (esbuild)

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit OIDC service for user authentication
- **Session Storage**: PostgreSQL-backed session management

### Development Platform
- **Hosting**: Replit development environment
- **Build Tools**: Replit-specific Vite plugins for development experience
- **Error Handling**: Replit runtime error modal for development debugging

### UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts (Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter)
- **CSS Framework**: Tailwind CSS with PostCSS processing

### Validation and Forms
- **Schema Validation**: Zod for runtime type validation
- **Form Management**: React Hook Form with Hookform Resolvers
- **Date Handling**: date-fns for date manipulation and formatting

### Build and Development
- **Bundle Analysis**: Source map support with trace-mapping
- **Development Enhancement**: Cartographer and dev banner plugins for Replit
- **Module Bundling**: ESBuild for server-side bundling
- **Type Checking**: TypeScript compiler for static analysis