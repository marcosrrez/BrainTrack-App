# MemoryBoost Cognitive Enhancement Application

## Overview

MemoryBoost is a full-stack cognitive enhancement application designed to improve long-term memory through spaced repetition and multimedia memory capture. The application allows users to record video and audio memories, review them using intelligent scheduling algorithms, and track their cognitive performance through detailed analytics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS for responsive styling with shadcn/ui components
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with in-memory store (MemoryStore)
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Migration Strategy**: Database migrations managed through drizzle-kit
- **Connection**: Neon Database serverless PostgreSQL connection
- **Schema**: Structured schema with users, memories, and analytics tables

## Key Components

### Authentication System
- Session-based authentication with secure HTTP-only cookies
- User registration and login with bcrypt password hashing
- Protected route middleware for API endpoints
- Context-based authentication state management on frontend

### Memory Capture System
- Browser-based media recording using MediaRecorder API
- Support for both video (24s) and audio (8s) recording
- Base64 encoding for media storage
- Real-time recording timers and progress indicators
- Media preview and playback functionality
- Automatic AI analysis of captured content

### TensorFlow AI Engine
- **Text Analysis**: Sentiment analysis, keyword extraction, theme identification
- **Emotion Recognition**: Multi-dimensional emotion analysis with intensity scoring
- **Pattern Detection**: Machine learning analysis of memory patterns and performance
- **Optimized Spaced Repetition**: AI-powered interval prediction based on user performance
- **Similarity Detection**: Embedding-based memory similarity using cosine similarity
- **Personalized Insights**: ML-generated recommendations with confidence scoring
- **Performance Optimization**: Dynamic learning algorithm adjustments

### Spaced Repetition Engine
- AI-enhanced spaced repetition algorithm with TensorFlow optimization
- Four-level scoring system (Again, Hard, Good, Easy)
- Dynamic interval calculation using machine learning predictions
- Review scheduling based on AI analysis of user patterns and performance

### Analytics Dashboard
- User performance tracking with retention rates
- Memory categorization and performance analysis
- Review streak tracking and accuracy calculations
- TensorFlow-powered insights generation with confidence scores
- Machine learning pattern recognition for optimization recommendations
- AI-driven similarity analysis and memory connections

## Data Flow

### Memory Creation Flow
1. User captures video/audio through browser API
2. Media is encoded to base64 and sent to server
3. Server validates and stores memory with metadata
4. Initial review schedule is calculated and set
5. User analytics are updated asynchronously

### Review Flow
1. System queries for memories due for review
2. User reviews memory and provides performance score
3. Spaced repetition algorithm calculates next review date
4. Memory and analytics records are updated
5. Progress tracking is maintained across sessions

### Authentication Flow
1. User submits credentials through secure form
2. Server validates against stored hash
3. Session is created and stored server-side
4. Client receives session cookie for subsequent requests
5. Protected routes verify session on each request

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, ReactDOM, React Hook Form)
- Express.js server framework
- Drizzle ORM for database operations
- Tailwind CSS and Radix UI for styling

### Media Recording Dependencies
- Browser MediaRecorder API for video/audio capture
- FileReader API for base64 encoding
- HTML5 video/audio elements for playback

### Development Dependencies
- Vite for build tooling and development server
- TypeScript for type safety
- ESBuild for server-side bundling

## Deployment Strategy

### Development Environment
- Vite development server for frontend with HMR
- tsx for running TypeScript server in development
- Replit-specific development banners and error handling

### Production Build Process
1. Vite builds frontend assets to `dist/public`
2. ESBuild bundles server code to `dist/index.js`
3. Static assets served from Express in production
4. Environment variables for database connection

### Database Deployment
- PostgreSQL database hosted on Neon (serverless)
- Connection string provided via DATABASE_URL environment variable
- Database schema pushed using drizzle-kit migrations

## Changelog
- June 30, 2025: Initial setup with in-memory storage
- June 30, 2025: Migrated from in-memory storage to PostgreSQL database with persistent data storage
- June 30, 2025: Integrated TensorFlow.js for comprehensive AI-powered memory analysis, including text sentiment analysis, emotion recognition, pattern detection, optimized spaced repetition intervals, and personalized insights generation
- June 30, 2025: Enhanced AI capabilities with MediaPipe facial emotion detection during video recording and TensorFlow voice tone analysis for audio content, providing real-time emotional feedback and comprehensive multimodal memory analysis

## User Preferences

Preferred communication style: Simple, everyday language.