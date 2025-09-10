# Error Handling Guide - furs-client-ts

Comprehensive guide to handling errors in the FURS TypeScript client.

## 🎯 Overview

The `furs-client-ts` library provides a robust error handling system with typed exceptions that help you identify and handle different types of failures appropriately.

## 🔍 Error Types Hierarchy

```
Error
└── FursError (base class)
    ├── FursValidationError
    ├── FursAuthenticationError
    ├── FursNetworkError
    └── FursServerError
```

## 🛡️ Error Classes

### FursError (Base Class)

The base class for all FURS-related errors.

```typescript
class FursError extends Error {
  readonly code: FursErrorCode | null;
  readonly details: any;
  
  constructor(message: string, code?: FursErrorCode, details?: any)
}
```

**Properties:**
- `message: string` - Human-readable error description
- `code: FursErrorCode | null` - Machine-readable error code
- `details: any` - Additional error context (optional)

### FursValidationError

Thrown when input data validation fails.

```typescript
class FursValidationError extends FursError {
  constructor(message: string, details?: any)
}
```

**Common Scenarios:**
- Invalid certificate path
- Missing required configuration
- Invalid tax number format
- Malformed invoice data

**Example:**
```typescript
try {
  const client = new FursClient({
    certPath: '', // Empty path
    certPassword: 'password',
    taxNumber: 123 // Too short
  });
} catch (error) {
  if (error instanceof FursValidationError) {
    console.error('Validation failed:', error.message);
    // Output: "Configuration field 'certPath' is required"
  }
}
```

### FursAuthenticationError

Thrown when certificate authentication fails.

```typescript
class FursAuthenticationError extends FursError {
  constructor(message: string, details?: any)
}
```

**Common Scenarios:**
- Certificate file not found
- Incorrect certificate password
- Corrupted certificate file
- Expired or invalid certificate

**Example:**
```typescript
try {
  const client = new FursClient({
    certPath: './missing-cert.p12',
    certPassword: 'wrong-password',
    taxNumber: 12345678
  });
} catch (error) {
  if (error instanceof FursAuthenticationError) {
    console.error('Authentication failed:', error.message);
    console.error('Check certificate path and password');
  }
}
```

### FursNetworkError

Thrown when network communication fails.

```typescript
class FursNetworkError extends FursError {
  constructor(message: string, details?: any)
}
```

**Common Scenarios:**
- No internet connection
- FURS servers unavailable
- DNS resolution failures
- Request timeouts
- SSL/TLS handshake failures

**Example:**
```typescript
try {
  await client.fiscalizeInvoice(invoice);
} catch (error) {
  if (error instanceof FursNetworkError) {
    console.error('Network error:', error.message);
    console.error('Check internet connection and FURS server status');
  }
}
```

### FursServerError

Thrown when FURS server returns an error.

```typescript
class FursServerError extends FursError {
  constructor(message: string, code: FursErrorCode, details?: any)
}
```

**Common FURS Error Codes:**
- `S100` - System error (temporary)
- `V001` - Data validation error
- `A001` - Authentication error
- `B001` - Business logic error

**Example:**
```typescript
try {
  await client.registerBusinessPremise(premise);
} catch (error) {
  if (error instanceof FursServerError) {
    console.error('FURS server error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'S100') {
      console.log('This is usually temporary, try again later');
    }
  }
}
```

## 🔧 Error Handling Patterns

### Basic Error Handling

```typescript
import { FursClient, FursError } from 'furs-client-ts';

try {
  const client = new FursClient(config);
  const result = await client.fiscalizeInvoice(invoice);
  console.log('Success:', result.zoi);
} catch (error) {
  if (error instanceof FursError) {
    console.error('FURS Error:', error.message);
    console.error('Code:', error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Comprehensive Error Handling

```typescript
import { 
  FursClient,
  FursError,
  FursValidationError,
  FursAuthenticationError,
  FursNetworkError,
  FursServerError
} from 'furs-client-ts';

async function handleFursOperation() {
  try {
    const client = new FursClient(config);
    const result = await client.fiscalizeInvoice(invoice);
    return { success: true, data: result };
    
  } catch (error) {
    // Handle specific error types
    if (error instanceof FursValidationError) {
      return {
        success: false,
        errorType: 'validation',
        message: 'Invalid input data',
        details: error.message,
        recoverable: true,
        action: 'Fix input data and retry'
      };
      
    } else if (error instanceof FursAuthenticationError) {
      return {
        success: false,
        errorType: 'authentication',
        message: 'Certificate authentication failed',
        details: error.message,
        recoverable: true,
        action: 'Check certificate file and password'
      };
      
    } else if (error instanceof FursNetworkError) {
      return {
        success: false,
        errorType: 'network',
        message: 'Network communication failed',
        details: error.message,
        recoverable: true,
        action: 'Check internet connection and retry'
      };
      
    } else if (error instanceof FursServerError) {
      return {
        success: false,
        errorType: 'server',
        message: 'FURS server error',
        details: error.message,
        code: error.code,
        recoverable: error.code === 'S100', // S100 is usually temporary
        action: error.code === 'S100' ? 'Retry later' : 'Contact FURS support'
      };
      
    } else if (error instanceof FursError) {
      return {
        success: false,
        errorType: 'furs',
        message: 'FURS operation failed',
        details: error.message,
        code: error.code,
        recoverable: false,
        action: 'Review error details and contact support'
      };
      
    } else {
      return {
        success: false,
        errorType: 'unexpected',
        message: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
        recoverable: false,
        action: 'Contact support with error details'
      };
    }
  }
}
```

### Retry Logic Pattern

```typescript
async function fiscalizeWithRetry(
  client: FursClient, 
  invoice: InvoiceRequest, 
  maxRetries: number = 3
): Promise<InvoiceResult> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.fiscalizeInvoice(invoice);
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry validation or authentication errors
      if (error instanceof FursValidationError || 
          error instanceof FursAuthenticationError) {
        throw error;
      }
      
      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Usage
try {
  const result = await fiscalizeWithRetry(client, invoice);
  console.log('Success after retries:', result.zoi);
} catch (error) {
  console.error('Failed after all retries:', error.message);
}
```

### Logging Pattern

```typescript
class FursLogger {
  static logError(error: Error, context: string) {
    const timestamp = new Date().toISOString();
    
    if (error instanceof FursError) {
      console.error(`[${timestamp}] FURS Error in ${context}:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        type: error.constructor.name
      });
    } else {
      console.error(`[${timestamp}] Unexpected Error in ${context}:`, {
        message: error.message,
        stack: error.stack
      });
    }
  }
}

// Usage
try {
  await client.fiscalizeInvoice(invoice);
} catch (error) {
  FursLogger.logError(error as Error, 'invoice-fiscalization');
  throw error; // Re-throw if needed
}
```

## 🏥 Error Recovery Strategies

### Validation Errors

```typescript
function handleValidationError(error: FursValidationError, config: FursClientConfig) {
  console.error('Validation failed:', error.message);
  
  // Common fixes for validation errors
  const fixes = {
    'Certificate file not found': 'Check the certPath configuration',
    'Invalid tax number format': 'Ensure tax number is 8 digits',
    'Configuration field': 'Check all required fields are provided'
  };
  
  for (const [errorPattern, solution] of Object.entries(fixes)) {
    if (error.message.includes(errorPattern)) {
      console.log('Suggested fix:', solution);
      break;
    }
  }
}
```

### Authentication Errors

```typescript
function handleAuthError(error: FursAuthenticationError) {
  console.error('Authentication failed:', error.message);
  
  // Suggest common solutions
  console.log('Common solutions:');
  console.log('1. Verify certificate file exists and is readable');
  console.log('2. Check certificate password is correct');
  console.log('3. Ensure certificate is not expired');
  console.log('4. Verify certificate format is P12/PFX');
}
```

### Network Errors

```typescript
async function handleNetworkError(error: FursNetworkError) {
  console.error('Network error:', error.message);
  
  // Check connectivity
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      timeout: 5000 
    });
    console.log('Internet connectivity: OK');
    console.log('Issue likely with FURS servers');
  } catch {
    console.log('Internet connectivity: FAILED');
    console.log('Check your network connection');
  }
}
```

### Server Errors

```typescript
function handleServerError(error: FursServerError) {
  console.error('FURS server error:', error.message);
  console.error('Error code:', error.code);
  
  // Handle specific FURS error codes
  switch (error.code) {
    case 'S100':
      console.log('System error - usually temporary, try again in a few minutes');
      break;
    case 'V001':
      console.log('Data validation error - check your invoice data');
      break;
    case 'A001':
      console.log('Authentication error - check your certificate');
      break;
    default:
      console.log('Unknown FURS error code - contact FURS support');
  }
}
```

## 🧪 Testing Error Handling

### Unit Tests

```typescript
import { FursClient, FursValidationError } from 'furs-client-ts';

describe('Error Handling', () => {
  it('should throw FursValidationError for invalid config', () => {
    expect(() => {
      new FursClient({
        certPath: '',
        certPassword: 'test',
        taxNumber: 123
      });
    }).toThrow(FursValidationError);
  });
  
  it('should handle authentication errors', async () => {
    const client = new FursClient({
      certPath: './nonexistent.p12',
      certPassword: 'test',
      taxNumber: 12345678
    });
    
    await expect(client.fiscalizeInvoice(invoice))
      .rejects
      .toThrow(FursAuthenticationError);
  });
});
```

### Integration Tests

```typescript
describe('FURS Integration Errors', () => {
  it('should handle invalid invoice data', async () => {
    const client = new FursClient(validConfig);
    
    const invalidInvoice = {
      // Missing required fields
    };
    
    await expect(client.fiscalizeInvoice(invalidInvoice))
      .rejects
      .toThrow(FursValidationError);
  });
});
```

## 🔍 Debugging Tips

### Enable Debug Logging

```typescript
const client = new FursClient({
  certPath: './test-certificate.p12',
  certPassword: 'password',
  taxNumber: 12345678,
  debug: true // Enable detailed logging
});
```

### Error Context

```typescript
try {
  await client.fiscalizeInvoice(invoice);
} catch (error) {
  if (error instanceof FursError) {
    console.error('Error context:', {
      operation: 'fiscalizeInvoice',
      errorType: error.constructor.name,
      message: error.message,
      code: error.code,
      details: error.details,
      invoice: {
        businessPremiseId: invoice.businessPremiseId,
        amount: invoice.invoiceAmount
      }
    });
  }
}
```

## 📊 Error Monitoring

### Production Error Tracking

```typescript
interface ErrorReport {
  timestamp: string;
  operation: string;
  errorType: string;
  message: string;
  code?: string;
  userId?: string;
  invoiceId?: string;
}

function reportError(error: Error, context: any): void {
  const report: ErrorReport = {
    timestamp: new Date().toISOString(),
    operation: context.operation,
    errorType: error.constructor.name,
    message: error.message,
    ...(error instanceof FursError && { code: error.code }),
    ...context
  };
  
  // Send to monitoring service
  sendToMonitoring(report);
}
```

## 🎯 Best Practices

1. **Always handle specific error types** - Don't just catch `Error`
2. **Log errors with context** - Include operation details
3. **Don't log sensitive data** - Avoid certificate passwords, etc.
4. **Implement retry logic** for transient errors
5. **Provide user-friendly messages** - Transform technical errors
6. **Monitor error patterns** - Track error frequency and types
7. **Test error scenarios** - Include error cases in tests

---

## 📚 Related Documentation

- [API Reference](./api-reference.md) - Complete API documentation
- [Getting Started](./getting-started.md) - Basic usage guide
- [Testing Guide](./testing.md) - Testing strategies
- [Production Deployment](./production-deployment.md) - Production considerations
