# BrainTrack App - Production Deployment Guide

This guide provides step-by-step instructions for deploying the BrainTrack app to production, with a focus on Railway as the primary hosting platform.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Railway Deployment](#railway-deployment)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment Steps](#post-deployment-steps)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Security Checklist](#security-checklist)
8. [Troubleshooting](#troubleshooting)
9. [Alternative Deployment Platforms](#alternative-deployment-platforms)

---

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] Tested the application locally in production mode
- [ ] Reviewed and updated environment variables
- [ ] Generated a strong SESSION_SECRET
- [ ] Prepared PostgreSQL database
- [ ] Reviewed security settings
- [ ] Configured proper CORS origins
- [ ] Updated cookie.secure setting for HTTPS
- [ ] Tested database migrations
- [ ] Set up monitoring tools
- [ ] Prepared backup strategy

### Test Production Build Locally

```bash
# Build the application
npm run build

# Test the production build
NODE_ENV=production npm start
```

---

## Railway Deployment

Railway is a modern platform that simplifies deployment with automatic SSL, PostgreSQL provisioning, and continuous deployment from Git.

### Step 1: Create Railway Account

1. Visit [Railway.app](https://railway.app/)
2. Sign up with GitHub (recommended for easy deployment)
3. Verify your email address

### Step 2: Create New Project

```bash
# Install Railway CLI (optional but recommended)
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project (in your app directory)
railway init
```

**Or use the Railway Dashboard:**

1. Click "New Project" in Railway dashboard
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select your BrainTrack repository

### Step 3: Provision PostgreSQL Database

**Via Railway Dashboard:**

1. In your project, click "New" → "Database"
2. Select "PostgreSQL"
3. Railway will provision a PostgreSQL instance
4. The `DATABASE_URL` will be automatically added to your environment variables

**Via Railway CLI:**

```bash
# Add PostgreSQL to your project
railway add --plugin postgresql
```

### Step 4: Configure Environment Variables

**Via Railway Dashboard:**

1. Navigate to your project
2. Click on your service
3. Go to "Variables" tab
4. Add the following variables:

```env
# Required Environment Variables
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=<generate-secure-random-string>
NODE_ENV=production
PORT=5000
```

**Generate Secure SESSION_SECRET:**

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Via Railway CLI:**

```bash
# Set environment variables
railway variables set SESSION_SECRET="your-secret-here"
railway variables set NODE_ENV="production"
```

### Step 5: Deploy the Application

**Automatic Deployment (Recommended):**

Railway automatically deploys when you push to your connected Git branch.

```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

**Manual Deployment via CLI:**

```bash
railway up
```

### Step 6: Run Database Migrations

After the first deployment, you need to initialize the database schema:

**Via Railway Dashboard:**

1. Click on your service
2. Go to "Settings" tab
3. Scroll to "Deploy"
4. Add a custom build command:

```bash
npm run build && npm run db:push
```

**Or run migrations manually via CLI:**

```bash
# Connect to Railway environment
railway run npm run db:push
```

### Step 7: Access Your Application

1. Railway will provide a public URL (e.g., `your-app.up.railway.app`)
2. Click the URL or find it in the "Settings" tab
3. Test your application thoroughly

---

## Database Setup

### Initial Database Schema

The database schema is automatically created when you run:

```bash
npm run db:push
```

This creates the following tables:
- `users` - User accounts and authentication
- `memories` - Memory storage with AI analysis
- `user_analytics` - User performance metrics

### Database Connection Pooling

For production, configure connection pooling in `server/db.ts`:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Database Backups

**Automated Backups (Railway):**

Railway automatically backs up PostgreSQL databases. Configure backup retention:

1. Go to PostgreSQL plugin settings
2. Configure backup schedule and retention policy

**Manual Backup:**

```bash
# Backup database
railway run pg_dump $DATABASE_URL > backup.sql

# Restore database
railway run psql $DATABASE_URL < backup.sql
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret for session encryption | `base64-encoded-32-byte-string` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |

### Optional Variables (For Enhanced Security)

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `LOG_LEVEL` | Logging level | `info` |
| `MAX_UPLOAD_SIZE` | Max file upload size (MB) | `50` |

### Sensitive Variable Storage

Never commit sensitive variables to Git:

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

---

## Post-Deployment Steps

### 1. Update Session Cookie Settings

Ensure HTTPS-only cookies in production. Update `server/routes.ts`:

```typescript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));
```

### 2. Configure CORS for Production

Update CORS settings in `server/index.ts`:

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://yourdomain.com',
  credentials: true
}));
```

### 3. Set Up Custom Domain (Optional)

**On Railway:**

1. Go to project settings
2. Click "Domains"
3. Add custom domain
4. Update DNS records as instructed
5. Railway automatically provisions SSL certificate

### 4. Test Critical Flows

- [ ] User registration
- [ ] User login/logout
- [ ] Memory creation with AI analysis
- [ ] Memory review and spaced repetition
- [ ] Analytics dashboard
- [ ] Health check endpoint (`/health`)

### 5. Monitor Application Health

```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-07T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 12345.67,
  "database": {
    "status": "connected",
    "responseTime": 5
  }
}
```

---

## Monitoring and Logging

### Railway Built-in Monitoring

Railway provides basic monitoring:

1. View logs in the "Deployments" tab
2. Monitor resource usage in "Metrics"
3. Set up notifications for deployment failures

### Application Logging

Implement structured logging in your application:

```typescript
// Add logging middleware
app.use((req, res, next) => {
  console.log({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});
```

### Error Tracking (Recommended)

Consider integrating error tracking services:

- **Sentry**: Real-time error tracking
- **LogRocket**: Session replay and monitoring
- **Datadog**: Full-stack observability

### Health Check Monitoring

Set up external monitoring for the `/health` endpoint:

- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring
- **Better Uptime**: Status page + monitoring

---

## Security Checklist

### Before Launch

- [ ] **Environment Variables**: All secrets stored securely
- [ ] **SESSION_SECRET**: Strong random string (min 32 characters)
- [ ] **Database**: SSL/TLS enabled for connections
- [ ] **Cookies**: `secure: true` and `httpOnly: true` enabled
- [ ] **CORS**: Restricted to specific origins
- [ ] **Rate Limiting**: Implemented for auth endpoints
- [ ] **Input Validation**: All inputs validated with Zod
- [ ] **SQL Injection**: Using parameterized queries (Drizzle ORM)
- [ ] **Password Hashing**: Bcrypt with 10+ salt rounds
- [ ] **HTTPS**: Enabled (automatic on Railway)
- [ ] **Dependencies**: Updated to latest secure versions
- [ ] **File Upload**: Size limits enforced (50MB)

### Security Headers

Add security headers in `server/index.ts`:

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Regular Security Audits

```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Generate security report
npm audit --json > security-report.json
```

### Database Security

1. **Connection String**: Never expose in logs or client-side
2. **User Permissions**: Use least-privilege database users
3. **Backups**: Encrypt database backups
4. **Access Control**: Restrict database access to application only

---

## Troubleshooting

### Deployment Fails

**Problem**: Build fails during deployment

**Solution**:
```bash
# Check build logs in Railway dashboard
# Test build locally
npm run build

# Check TypeScript errors
npm run check
```

### Database Connection Errors

**Problem**: Cannot connect to database

**Solution**:
```bash
# Verify DATABASE_URL is set
railway variables

# Test connection
railway run psql $DATABASE_URL -c "SELECT 1"

# Check database plugin status in Railway
```

### Session Issues in Production

**Problem**: Users get logged out frequently

**Solution**:
- Verify `SESSION_SECRET` is set and consistent
- Check cookie settings (`secure: true` requires HTTPS)
- Ensure session store is PostgreSQL, not MemoryStore

### TensorFlow.js Memory Issues

**Problem**: Server crashes with "Out of Memory" errors

**Solution**:
```bash
# Increase Node.js memory limit in Railway
# Add to package.json start script:
"start": "NODE_ENV=production node --max-old-space-size=4096 dist/index.js"
```

### Slow AI Processing

**Problem**: Memory creation takes too long

**Solution**:
- Implement request queuing
- Cache AI model results
- Consider serverless functions for AI processing
- Optimize TensorFlow.js operations

### High Database Response Times

**Problem**: Slow query performance

**Solution**:
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_next_review ON memories(next_review);
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
```

---

## Alternative Deployment Platforms

### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create braintrack-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SESSION_SECRET="your-secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:push
```

### Vercel (Frontend) + Railway (Backend)

**Backend on Railway:**
- Deploy as described in Railway section

**Frontend on Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variable for API URL
vercel env add API_URL production
```

### DigitalOcean App Platform

```bash
# Create app from GitHub repo
doctl apps create --spec .do/app.yaml

# Configure environment variables via dashboard
# Deploy automatically on push
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t braintrack-app .
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="..." \
  braintrack-app
```

---

## Rollback Strategy

### Railway Rollback

```bash
# List deployments
railway deployments

# Rollback to previous deployment
railway rollback <deployment-id>
```

**Via Dashboard:**
1. Go to "Deployments" tab
2. Find previous stable deployment
3. Click "Redeploy"

### Database Rollback

```bash
# Restore from backup
railway run psql $DATABASE_URL < backup.sql
```

---

## Scaling Considerations

### Horizontal Scaling

- Railway supports automatic scaling
- Configure replicas in Railway settings
- Use PostgreSQL connection pooling

### Vertical Scaling

- Upgrade Railway plan for more resources
- Monitor CPU and memory usage
- Optimize database queries

### Caching Strategy

```typescript
// Implement Redis caching for expensive operations
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache AI analysis results
const cachedResult = await redis.get(`analysis:${memoryId}`);
if (cachedResult) {
  return JSON.parse(cachedResult);
}
```

---

## Support and Resources

- **Railway Documentation**: https://docs.railway.app/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **TensorFlow.js**: https://www.tensorflow.org/js
- **Express Best Practices**: https://expressjs.com/en/advanced/best-practice-security.html

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check application health endpoint
- Review performance metrics

### Weekly
- Review and address security alerts
- Analyze usage patterns
- Check database performance

### Monthly
- Update dependencies
- Review and rotate credentials
- Backup verification
- Performance optimization review

---

## Emergency Contacts

Document your team's emergency contacts and escalation procedures:

```
- Primary: [Name] - [Email] - [Phone]
- Secondary: [Name] - [Email] - [Phone]
- Database Admin: [Name] - [Email] - [Phone]
- DevOps Lead: [Name] - [Email] - [Phone]
```

---

## Conclusion

Following this deployment guide ensures your BrainTrack application is:
- Securely configured
- Properly monitored
- Ready for production traffic
- Maintainable and scalable

For questions or issues, refer to the main [README.md](README.md) or open a GitHub issue.

**Happy Deploying!**
