# BrainTrack App

> An AI-powered memory enhancement and spaced repetition application that helps you capture, organize, and retain important memories using advanced machine learning techniques.

## Features

- **AI-Powered Memory Analysis**: Utilizes TensorFlow.js for sentiment analysis, emotion detection, and voice tone analysis
- **Intelligent Spaced Repetition**: Machine learning optimized review scheduling for maximum retention
- **Multi-Modal Memory Capture**: Support for text, video, and audio memory recording
- **Real-Time Facial Analysis**: MediaPipe FaceMesh integration for emotional state detection during capture
- **Personalized Analytics**: Track your memory performance with AI-generated insights
- **Similar Memory Detection**: Find related memories using AI embeddings and cosine similarity
- **Secure Authentication**: Session-based authentication with bcrypt password hashing
- **Responsive Design**: Modern React UI with Tailwind CSS and Radix UI components

## Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TanStack Query** - Data fetching and caching
- **Wouter** - Lightweight routing
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **MediaPipe** - Face mesh detection
- **Recharts** - Data visualization

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Type-safe database queries
- **TensorFlow.js Node** - Server-side AI processing
- **Passport.js** - Authentication middleware
- **Express Session** - Session management
- **Zod** - Runtime type validation

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/braintrack-app.git
cd braintrack-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

```env
# Database connection string (required)
DATABASE_URL=postgresql://username:password@localhost:5432/braintrack

# Session secret - generate a secure random string (required)
SESSION_SECRET=your-secure-random-string-here

# Node environment
NODE_ENV=development
```

**Important**: Generate a secure session secret using one of these methods:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Set Up the Database

#### Create the Database

```bash
# Log into PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE braintrack;

# Exit PostgreSQL
\q
```

#### Run Database Migrations

```bash
# Push database schema to PostgreSQL
npm run db:push
```

This will create all necessary tables:
- `users` - User accounts and authentication
- `memories` - Memory storage with AI analysis
- `user_analytics` - User performance metrics

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend & API**: http://localhost:5000

## Production Build

### Build the Application

```bash
npm run build
```

This command:
1. Builds the React frontend with Vite
2. Bundles the Express backend with esbuild
3. Outputs to the `dist/` directory

### Start Production Server

```bash
npm start
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## Project Structure

```
braintrack-app/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Page components
│   │   └── main.tsx     # Application entry point
│   └── index.html       # HTML template
├── server/              # Backend Express application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations
│   ├── ai-service.ts    # TensorFlow AI services
│   ├── db.ts            # Database configuration
│   └── vite.ts          # Vite integration
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema and Zod validators
├── dist/                # Production build output
├── migrations/          # Database migration files
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── drizzle.config.ts    # Drizzle ORM configuration
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | No |
| GET | `/api/auth/me` | Get current user | No |

### Memories

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/memories` | Get all user memories | Yes |
| GET | `/api/memories/:id` | Get specific memory | Yes |
| GET | `/api/memories/due` | Get memories due for review | Yes |
| POST | `/api/memories` | Create new memory | Yes |
| PUT | `/api/memories/:id` | Update memory | Yes |
| DELETE | `/api/memories/:id` | Delete memory | Yes |
| POST | `/api/memories/:id/review` | Submit memory review | Yes |
| GET | `/api/memories/:id/similar` | Find similar memories | Yes |

### Analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/analytics` | Get user analytics with AI insights | Yes |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Check application and database health | No |

## Architecture Overview

### Frontend Architecture

The frontend follows a component-based architecture with:

1. **Page Components**: Full-page views (Dashboard, Capture, Review)
2. **UI Components**: Reusable components from Radix UI
3. **State Management**: TanStack Query for server state, React hooks for local state
4. **Routing**: Wouter for lightweight client-side routing

### Backend Architecture

The backend uses a layered architecture:

1. **Routes Layer** (`routes.ts`): HTTP endpoints and request handling
2. **Service Layer** (`ai-service.ts`): Business logic and AI processing
3. **Storage Layer** (`storage.ts`): Database operations and queries
4. **Database Layer** (`db.ts`): PostgreSQL connection and Drizzle ORM

### AI/ML Features

The application uses TensorFlow.js for:

- **Text Analysis**: Sentiment scoring, keyword extraction, theme identification
- **Emotion Analysis**: Multi-dimensional emotion detection from text
- **Voice Analysis**: Tone detection from audio recordings
- **Memory Similarity**: Cosine similarity for finding related memories
- **Optimized Scheduling**: ML-based spaced repetition intervals

### Database Schema

```typescript
// Users table
users {
  id: serial
  email: text (unique)
  password: text (hashed)
  name: text
  createdAt: timestamp
}

// Memories table
memories {
  id: serial
  userId: integer (foreign key)
  title: text
  description: text
  emotion: integer (1-10)
  type: text (personal/social/educational)
  tags: text[]
  location: text
  videoData: text (base64)
  audioData: text (base64)
  transcribedAudio: text
  sentimentScore: real
  aiSuggestedTags: text[]
  nextReview: timestamp
  reviewCount: integer
  lastScore: integer
  reviewHistory: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}

// User Analytics table
user_analytics {
  id: serial
  userId: integer (foreign key, unique)
  totalMemories: integer
  dueForReview: integer
  reviewStreak: integer
  accuracyRate: real
  retentionRates: jsonb
  reviewConsistency: real
  avgRecallScore: real
  insights: jsonb
  updatedAt: timestamp
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | - | Secret key for session encryption |
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `5000` | Server port (fixed at 5000) |

## Security Considerations

1. **Password Security**: All passwords are hashed using bcrypt with 10 salt rounds
2. **Session Management**: Sessions are stored server-side with httpOnly cookies
3. **SQL Injection Protection**: Drizzle ORM provides parameterized queries
4. **Input Validation**: Zod schemas validate all user inputs
5. **Environment Variables**: Sensitive data stored in environment variables
6. **CORS**: Configure CORS for production domains
7. **HTTPS**: Use HTTPS in production (set `cookie.secure: true`)

## Troubleshooting

### Database Connection Issues

**Problem**: `DATABASE_URL must be set` error

**Solution**:
```bash
# Ensure .env file exists with DATABASE_URL
cat .env | grep DATABASE_URL

# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"
```

### TensorFlow.js Errors

**Problem**: TensorFlow.js fails to initialize

**Solution**:
```bash
# Reinstall TensorFlow dependencies
npm install @tensorflow/tfjs @tensorflow/tfjs-node
```

### Port Already in Use

**Problem**: Port 5000 is already in use

**Solution**:
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port (not recommended)
```

### Session Lost on Server Restart

**Problem**: Users logged out after server restart in development

**Solution**: This is expected behavior with MemoryStore in development. In production, sessions persist in PostgreSQL.

### Build Fails

**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Check for type errors
npm run check

# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization

1. **Database Indexing**: Add indexes on frequently queried columns
2. **Pagination**: Use limit/offset parameters for large datasets
3. **Caching**: TanStack Query caches API responses
4. **Lazy Loading**: Components loaded on demand
5. **Image Optimization**: Base64 encoding for small files only
6. **Bundle Splitting**: Vite automatically splits code

## Development Tips

1. **Type Safety**: Run `npm run check` before committing
2. **Database Changes**: Always run `npm run db:push` after schema changes
3. **Hot Reload**: Frontend hot reloads automatically, backend requires restart
4. **Debugging**: Use Chrome DevTools for frontend, VS Code debugger for backend
5. **Testing**: Write tests for critical business logic

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

## Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [TensorFlow.js](https://www.tensorflow.org/js)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)
