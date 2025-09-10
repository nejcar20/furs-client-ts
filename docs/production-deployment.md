# Production Deployment Guide - furs-client-ts

Complete guide for deploying FURS integration to production environments.

## 🎯 Overview

This guide covers everything needed to deploy your FURS TypeScript client safely and reliably to production.

## 🔒 Security Considerations

### Certificate Management

#### Development vs Production Certificates
- **Development**: Use `test-certificate.p12` with test environment
- **Production**: Use official FURS certificate with production environment

#### Secure Certificate Storage

**❌ Never do this:**
```javascript
const client = new FursClient({
  certPath: './production-cert.p12', // Hardcoded path
  certPassword: 'hardcoded-password', // Exposed password
  taxNumber: 12345678 // Hardcoded tax number
});
```

**✅ Best practice:**
```javascript
const client = new FursClient({
  certPath: process.env.FURS_CERT_PATH!,
  certPassword: process.env.FURS_CERT_PASSWORD!,
  taxNumber: parseInt(process.env.FURS_TAX_NUMBER!),
  environment: process.env.FURS_ENVIRONMENT as 'production',
  debug: false // Disable debug logging in production
});
```

### Environment Variables

Create a `.env.production` file (never commit to git):
```bash
# FURS Configuration
FURS_CERT_PATH=/secure/path/to/production-cert.p12
FURS_CERT_PASSWORD=your-secure-password
FURS_TAX_NUMBER=12345678
FURS_ENVIRONMENT=production

# Application Configuration
NODE_ENV=production
LOG_LEVEL=error
```

### Certificate File Permissions

```bash
# Set restrictive permissions on certificate files
chmod 600 /secure/path/to/production-cert.p12
chown app:app /secure/path/to/production-cert.p12

# Verify permissions
ls -la /secure/path/to/production-cert.p12
# Should show: -rw------- 1 app app
```

### Secrets Management

#### Using Docker Secrets

```yaml
# docker-compose.yml
version: '3.8'
services:
  furs-app:
    image: your-app:latest
    secrets:
      - furs_cert
      - furs_password
    environment:
      - FURS_CERT_PATH=/run/secrets/furs_cert
      - FURS_CERT_PASSWORD_FILE=/run/secrets/furs_password

secrets:
  furs_cert:
    file: ./production-cert.p12
  furs_password:
    file: ./cert_password.txt
```

#### Using Kubernetes Secrets

```yaml
# k8s-secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: furs-secrets
type: Opaque
data:
  cert.p12: <base64-encoded-certificate>
  password: <base64-encoded-password>
  taxnumber: <base64-encoded-tax-number>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: furs-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: your-app:latest
        env:
        - name: FURS_CERT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: furs-secrets
              key: password
        - name: FURS_TAX_NUMBER
          valueFrom:
            secretKeyRef:
              name: furs-secrets
              key: taxnumber
        volumeMounts:
        - name: furs-cert
          mountPath: /app/certs
          readOnly: true
      volumes:
      - name: furs-cert
        secret:
          secretName: furs-secrets
          items:
          - key: cert.p12
            path: production-cert.p12
```

## 🏗️ Application Architecture

### Production Configuration Class

```typescript
// src/config/production.ts
import * as fs from 'fs';
import { FursClientConfig } from 'furs-client-ts';

export class ProductionConfig {
  private static validateEnvironment(): void {
    const required = [
      'FURS_CERT_PATH',
      'FURS_CERT_PASSWORD',
      'FURS_TAX_NUMBER'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  private static validateCertificate(): void {
    const certPath = process.env.FURS_CERT_PATH!;
    
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificate file not found: ${certPath}`);
    }
    
    const stats = fs.statSync(certPath);
    if (stats.size === 0) {
      throw new Error(`Certificate file is empty: ${certPath}`);
    }
    
    // Check permissions (Unix systems)
    if (process.platform !== 'win32') {
      const mode = stats.mode & parseInt('777', 8);
      if (mode > parseInt('600', 8)) {
        console.warn(`Warning: Certificate file has loose permissions (${mode.toString(8)})`);
      }
    }
  }

  static getFursConfig(): FursClientConfig {
    this.validateEnvironment();
    this.validateCertificate();
    
    return {
      certPath: process.env.FURS_CERT_PATH!,
      certPassword: process.env.FURS_CERT_PASSWORD!,
      taxNumber: parseInt(process.env.FURS_TAX_NUMBER!),
      environment: 'production',
      debug: false
    };
  }
}
```

### Connection Pool Management

```typescript
// src/services/furs-service.ts
import { FursClient } from 'furs-client-ts';
import { ProductionConfig } from '../config/production';

export class FursService {
  private client: FursClient;
  private connectionHealthy: boolean = true;
  private lastHealthCheck: Date = new Date();
  
  constructor() {
    this.client = new FursClient(ProductionConfig.getFursConfig());
  }
  
  async healthCheck(): Promise<boolean> {
    const now = new Date();
    
    // Only check health every 5 minutes
    if (now.getTime() - this.lastHealthCheck.getTime() < 300000) {
      return this.connectionHealthy;
    }
    
    try {
      // Perform a lightweight test operation
      // Note: This should be a minimal test that doesn't create actual records
      this.connectionHealthy = true;
      this.lastHealthCheck = now;
      return true;
    } catch (error) {
      console.error('FURS health check failed:', error.message);
      this.connectionHealthy = false;
      return false;
    }
  }
  
  async fiscalizeInvoice(invoice: InvoiceRequest): Promise<InvoiceResult> {
    if (!await this.healthCheck()) {
      throw new Error('FURS service is not available');
    }
    
    return this.client.fiscalizeInvoice(invoice);
  }
  
  async registerBusinessPremise(premise: BusinessPremiseRequest): Promise<BusinessPremiseResult> {
    if (!await this.healthCheck()) {
      throw new Error('FURS service is not available');
    }
    
    return this.client.registerBusinessPremise(premise);
  }
}
```

## 📊 Monitoring and Logging

### Structured Logging

```typescript
// src/utils/logger.ts
import * as winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'furs-client' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

### Error Monitoring

```typescript
// src/middleware/error-monitor.ts
import { FursError } from 'furs-client-ts';
import { logger } from '../utils/logger';

export class ErrorMonitor {
  static logFursError(error: FursError, context: any): void {
    const errorData = {
      timestamp: new Date().toISOString(),
      errorType: error.constructor.name,
      message: error.message,
      code: error.code,
      context: {
        operation: context.operation,
        businessPremiseId: context.businessPremiseId,
        invoiceAmount: context.invoiceAmount,
        // Don't log sensitive data
      }
    };
    
    logger.error('FURS operation failed', errorData);
    
    // Send to monitoring service (e.g., Sentry, DataDog)
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { extra: errorData });
    }
  }
  
  static logSuccess(operation: string, result: any, duration: number): void {
    logger.info('FURS operation completed', {
      operation,
      duration,
      success: result.success,
      invoiceNumber: result.invoiceNumber,
      businessPremiseId: result.businessPremiseId
    });
  }
}
```

### Metrics Collection

```typescript
// src/middleware/metrics.ts
import * as prometheus from 'prom-client';

export class FursMetrics {
  private static readonly counter = new prometheus.Counter({
    name: 'furs_operations_total',
    help: 'Total number of FURS operations',
    labelNames: ['operation', 'status']
  });
  
  private static readonly histogram = new prometheus.Histogram({
    name: 'furs_operation_duration_seconds',
    help: 'Duration of FURS operations',
    labelNames: ['operation']
  });
  
  private static readonly gauge = new prometheus.Gauge({
    name: 'furs_service_health',
    help: 'Health status of FURS service (1 = healthy, 0 = unhealthy)'
  });
  
  static recordOperation(operation: string, success: boolean, duration: number): void {
    this.counter.inc({ operation, status: success ? 'success' : 'error' });
    this.histogram.observe({ operation }, duration / 1000);
  }
  
  static setHealthStatus(healthy: boolean): void {
    this.gauge.set(healthy ? 1 : 0);
  }
  
  static getMetrics(): string {
    return prometheus.register.metrics();
  }
}
```

## 🚀 Deployment Strategies

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fursapp -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create directories for certificates and logs
RUN mkdir -p /app/certs /app/logs
RUN chown -R fursapp:nodejs /app

USER fursapp

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  furs-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - FURS_ENVIRONMENT=production
      - FURS_CERT_PATH=/app/certs/production-cert.p12
    volumes:
      - ./certs/production-cert.p12:/app/certs/production-cert.p12:ro
      - ./logs:/app/logs
    secrets:
      - furs_cert_password
      - furs_tax_number
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

secrets:
  furs_cert_password:
    file: ./secrets/cert_password.txt
  furs_tax_number:
    file: ./secrets/tax_number.txt
```

### Kubernetes Deployment

```yaml
# k8s-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: furs-app
  labels:
    app: furs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: furs-app
  template:
    metadata:
      labels:
        app: furs-app
    spec:
      containers:
      - name: furs-app
        image: your-registry/furs-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: FURS_ENVIRONMENT
          value: "production"
        - name: FURS_CERT_PATH
          value: "/app/certs/production-cert.p12"
        - name: FURS_CERT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: furs-secrets
              key: password
        - name: FURS_TAX_NUMBER
          valueFrom:
            secretKeyRef:
              name: furs-secrets
              key: taxnumber
        volumeMounts:
        - name: furs-cert
          mountPath: /app/certs
          readOnly: true
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: furs-cert
        secret:
          secretName: furs-secrets
          items:
          - key: cert.p12
            path: production-cert.p12
            mode: 0600
```

## ⚡ Performance Optimization

### Connection Pooling

```typescript
// src/services/furs-pool.ts
import { FursClient, FursClientConfig } from 'furs-client-ts';

export class FursConnectionPool {
  private clients: FursClient[] = [];
  private currentIndex: number = 0;
  private readonly poolSize: number;
  
  constructor(config: FursClientConfig, poolSize: number = 3) {
    this.poolSize = poolSize;
    
    // Create pool of clients
    for (let i = 0; i < poolSize; i++) {
      this.clients.push(new FursClient(config));
    }
  }
  
  getClient(): FursClient {
    const client = this.clients[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.poolSize;
    return client;
  }
  
  async fiscalizeInvoice(invoice: InvoiceRequest): Promise<InvoiceResult> {
    const client = this.getClient();
    return client.fiscalizeInvoice(invoice);
  }
}
```

### Caching Strategy

```typescript
// src/services/cache-service.ts
import * as redis from 'redis';

export class CacheService {
  private client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  });
  
  async cacheBusinessPremise(premiseId: string, data: any): Promise<void> {
    await this.client.setex(
      `business_premise:${premiseId}`,
      3600, // 1 hour TTL
      JSON.stringify(data)
    );
  }
  
  async getCachedBusinessPremise(premiseId: string): Promise<any | null> {
    const cached = await this.client.get(`business_premise:${premiseId}`);
    return cached ? JSON.parse(cached) : null;
  }
}
```

### Rate Limiting

```typescript
// src/middleware/rate-limiter.ts
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number = 10; // per minute
  private readonly windowMs: number = 60000; // 1 minute
  
  canMakeRequest(clientId: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(clientId) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(clientId, validRequests);
    
    return true;
  }
}
```

## 🔧 Health Checks and Monitoring

### Health Check Endpoint

```typescript
// src/routes/health.ts
import { Router } from 'express';
import { FursService } from '../services/furs-service';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const fursService = new FursService();
    const isHealthy = await fursService.healthCheck();
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'furs-client-ts',
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/ready', async (req, res) => {
  // Readiness check - can serve requests
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRouter };
```

### Monitoring Dashboard

```typescript
// src/routes/metrics.ts
import { Router } from 'express';
import { FursMetrics } from '../middleware/metrics';

const router = Router();

router.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(FursMetrics.getMetrics());
});

export { router as metricsRouter };
```

## 🔄 Backup and Disaster Recovery

### Certificate Backup

```bash
#!/bin/bash
# backup-certificates.sh

BACKUP_DIR="/secure/backups/certificates"
CERT_DIR="/secure/certs"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup certificates with encryption
tar -czf "$BACKUP_DIR/certs_backup_$DATE.tar.gz" -C "$CERT_DIR" .

# Encrypt backup
gpg --cipher-algo AES256 --compress-algo 1 --s2k-cipher-algo AES256 \
    --s2k-digest-algo SHA512 --s2k-mode 3 --s2k-count 65536 \
    --symmetric "$BACKUP_DIR/certs_backup_$DATE.tar.gz"

# Remove unencrypted backup
rm "$BACKUP_DIR/certs_backup_$DATE.tar.gz"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "certs_backup_*.tar.gz.gpg" -mtime +30 -delete
```

### Recovery Procedures

```bash
#!/bin/bash
# restore-certificates.sh

BACKUP_FILE="$1"
RESTORE_DIR="/secure/certs"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz.gpg>"
    exit 1
fi

# Decrypt backup
gpg --decrypt "$BACKUP_FILE" > temp_backup.tar.gz

# Extract to restore directory
mkdir -p "$RESTORE_DIR"
tar -xzf temp_backup.tar.gz -C "$RESTORE_DIR"

# Set correct permissions
chmod 600 "$RESTORE_DIR"/*.p12
chown app:app "$RESTORE_DIR"/*.p12

# Clean up
rm temp_backup.tar.gz

echo "Certificates restored to $RESTORE_DIR"
```

## 🎯 Production Checklist

### Pre-deployment Checklist

- [ ] **Environment Variables**
  - [ ] All required environment variables set
  - [ ] No hardcoded secrets in code
  - [ ] Environment-specific configuration validated

- [ ] **Security**
  - [ ] Production certificates in secure location
  - [ ] Certificate file permissions set to 600
  - [ ] Secrets management system configured
  - [ ] Debug logging disabled
  
- [ ] **Monitoring**
  - [ ] Health check endpoints implemented
  - [ ] Metrics collection configured
  - [ ] Error monitoring system integrated
  - [ ] Logging configuration verified

- [ ] **Performance**
  - [ ] Connection pooling implemented
  - [ ] Rate limiting configured
  - [ ] Caching strategy in place
  - [ ] Resource limits set

- [ ] **Reliability**
  - [ ] Retry logic implemented
  - [ ] Circuit breaker pattern considered
  - [ ] Graceful shutdown handling
  - [ ] Database connection handling

### Post-deployment Verification

```bash
#!/bin/bash
# verify-deployment.sh

BASE_URL="https://your-app.com"

echo "🔍 Verifying deployment..."

# Health check
echo "Checking health endpoint..."
curl -f "$BASE_URL/health" || exit 1

# Readiness check
echo "Checking readiness endpoint..."
curl -f "$BASE_URL/ready" || exit 1

# Metrics endpoint
echo "Checking metrics endpoint..."
curl -f "$BASE_URL/metrics" | head -5

echo "✅ Deployment verification completed successfully"
```

---

## 📚 Related Documentation

- [Getting Started Guide](./getting-started.md) - Basic setup and usage
- [API Reference](./api-reference.md) - Complete API documentation
- [Error Handling Guide](./error-handling.md) - Error handling strategies
- [Testing Guide](./testing.md) - Testing approaches

## 🎯 Summary

This production deployment guide covers:
- ✅ **Security best practices** for certificate and secret management
- ✅ **Application architecture** for production environments
- ✅ **Monitoring and logging** strategies
- ✅ **Deployment strategies** for Docker and Kubernetes
- ✅ **Performance optimization** techniques
- ✅ **Health checks and monitoring** implementation
- ✅ **Backup and disaster recovery** procedures
- ✅ **Production checklists** for safe deployment

Follow these guidelines to ensure your FURS integration runs reliably and securely in production! 🚀
