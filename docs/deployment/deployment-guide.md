
# Deployment Guide - Immigration AI SaaS

## Overview

This guide provides comprehensive instructions for deploying the Immigration AI SaaS platform in various environments, from development to production.

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: Stable internet connection

#### Recommended Requirements
- **CPU**: 4+ cores, 3.0 GHz
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: High-speed internet with low latency

### Software Dependencies

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or yarn 1.22.0+)
- **Docker**: Version 20.10+ (for containerized deployment)
- **Git**: For version control

## Environment Setup

### Development Environment

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd immigration-ai-saas
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Application Configuration
   VITE_APP_NAME=Immigration AI SaaS
   VITE_APP_VERSION=1.0.0
   
   # Environment
   NODE_ENV=development
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Staging Environment

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Application Deployment**
   ```bash
   # Clone and setup application
   git clone <repository-url> /var/www/immigration-ai
   cd /var/www/immigration-ai
   npm install
   npm run build
   
   # Configure environment
   cp .env.example .env.production
   # Edit .env.production with staging configuration
   ```

3. **Process Management**
   ```bash
   # Start application with PM2
   pm2 start ecosystem.config.js --env staging
   pm2 save
   pm2 startup
   ```

### Production Environment

#### Option 1: Traditional Server Setup

1. **Server Preparation**
   ```bash
   # Security updates
   sudo apt update && sudo apt upgrade -y
   
   # Install dependencies
   sudo apt install -y nginx certbot python3-certbot-nginx
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install process manager
   sudo npm install -g pm2
   ```

2. **Application Setup**
   ```bash
   # Create application directory
   sudo mkdir -p /var/www/immigration-ai
   sudo chown -R $USER:$USER /var/www/immigration-ai
   
   # Deploy application
   cd /var/www/immigration-ai
   git clone <repository-url> .
   npm install --production
   npm run build
   ```

3. **Nginx Configuration**
   ```nginx
   # /etc/nginx/sites-available/immigration-ai
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       root /var/www/immigration-ai/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "no-referrer-when-downgrade" always;
       add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
   }
   ```

4. **SSL Certificate**
   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/immigration-ai /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   
   # Install SSL certificate
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

#### Option 2: Docker Deployment

1. **Docker Configuration**
   
   Create `Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   
   # Install dependencies
   RUN npm ci --only=production
   
   # Copy application code
   COPY . .
   
   # Build application
   RUN npm run build
   
   # Expose port
   EXPOSE 3000
   
   # Start application
   CMD ["npm", "start"]
   ```

2. **Docker Compose Setup**
   
   Create `docker-compose.yml`:
   ```yaml
   version: '3.8'
   
   services:
     immigration-ai:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
         - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
       volumes:
         - ./uploads:/app/uploads
       restart: unless-stopped
     
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/ssl/certs
       depends_on:
         - immigration-ai
       restart: unless-stopped
   ```

3. **Deploy with Docker**
   ```bash
   # Build and start services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Update deployment
   docker-compose pull
   docker-compose up -d --force-recreate
   ```

## Supabase Configuration

### Database Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note project URL and anon key

2. **Run Migrations**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link to project
   supabase link --project-ref your-project-id
   
   # Run migrations
   supabase db push
   ```

3. **Configure Storage**
   ```sql
   -- Create storage bucket for documents
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('documents', 'documents', false);
   
   -- Set up storage policies
   CREATE POLICY "Users can upload their own documents" ON storage.objects
   FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
   
   CREATE POLICY "Users can view their own documents" ON storage.objects
   FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
   ```

### Authentication Configuration

1. **Configure Auth Providers**
   - Email/Password: Enable in Supabase dashboard
   - Social Providers: Configure as needed (Google, GitHub, etc.)

2. **Set Email Templates**
   - Customize confirmation emails
   - Update password reset templates
   - Configure invite templates

## Environment Variables

### Required Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Application
VITE_APP_NAME=Immigration AI SaaS
VITE_APP_VERSION=1.0.0
NODE_ENV=production

# Optional API Keys (for future features)
VITE_OPENAI_API_KEY=your-openai-key
VITE_SENDGRID_API_KEY=your-sendgrid-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

### Security Considerations

1. **Never commit sensitive keys** to version control
2. **Use environment-specific configurations**
3. **Rotate keys regularly**
4. **Use secrets management** in production
5. **Limit key permissions** to minimum required

## CI/CD Pipeline

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/immigration-ai
            git pull origin main
            npm ci --production
            npm run build
            pm2 reload immigration-ai
```

## Monitoring and Logging

### Application Monitoring

1. **Setup PM2 Monitoring**
   ```bash
   # Install PM2 monitoring
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 30
   ```

2. **Configure Logging**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'immigration-ai',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production'
       },
       log_file: './logs/combined.log',
       out_file: './logs/out.log',
       error_file: './logs/error.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
     }]
   }
   ```

### Health Checks

Create monitoring endpoints and scripts to check:
- Application availability
- Database connectivity
- Storage accessibility
- API response times

## Backup and Recovery

### Database Backups

1. **Automated Supabase Backups**
   - Enable in Supabase dashboard
   - Configure retention policy
   - Test restore procedures

2. **Custom Backup Scripts**
   ```bash
   #!/bin/bash
   # backup.sh
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backups"
   
   # Create backup directory
   mkdir -p $BACKUP_DIR
   
   # Backup application files
   tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/immigration-ai
   
   # Cleanup old backups (keep 30 days)
   find $BACKUP_DIR -name "app_*.tar.gz" -mtime +30 -delete
   ```

### Disaster Recovery Plan

1. **Recovery Time Objective (RTO)**: 4 hours
2. **Recovery Point Objective (RPO)**: 1 hour
3. **Backup verification**: Weekly automated tests
4. **Documentation**: Maintain step-by-step recovery procedures

## Security Checklist

### Pre-Deployment Security

- [ ] All dependencies updated to latest secure versions
- [ ] Environment variables properly configured
- [ ] SSL certificates installed and configured
- [ ] Firewall configured (only necessary ports open)
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Input validation in place
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### Post-Deployment Security

- [ ] Security scanning completed
- [ ] Penetration testing performed
- [ ] Access logs monitoring configured
- [ ] Intrusion detection system active
- [ ] Regular security updates scheduled
- [ ] Incident response plan documented

## Performance Optimization

### Frontend Optimization

1. **Bundle Analysis**
   ```bash
   npm run build -- --analyze
   ```

2. **Optimization Techniques**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Caching strategies
   - CDN implementation

### Backend Optimization

1. **Database Optimization**
   - Query optimization
   - Index optimization
   - Connection pooling
   - Read replicas

2. **Caching Strategy**
   - Application-level caching
   - Database query caching
   - Static asset caching
   - CDN caching

## Troubleshooting

### Common Deployment Issues

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review environment variables
- Check for TypeScript errors

#### Runtime Issues
- Review application logs
- Check database connectivity
- Verify API endpoints
- Validate environment configuration

#### Performance Issues
- Monitor resource usage
- Analyze database queries
- Review network connectivity
- Check for memory leaks

### Support Resources

- **Documentation**: Complete guides and API references
- **Community**: Discord/Slack channels
- **Issue Tracking**: GitHub issues
- **Professional Support**: Available for enterprise customers

---

*This deployment guide should be reviewed and updated regularly as the platform evolves and new deployment patterns emerge.*
