            TaxableAmount: 82.0 + (i * 8.2),
            TaxAmount: 18.0 + (i * 1.8),
          }]
        }]
      };
      
      const result = await client.fiscalizeInvoice(invoice);
      expect(result.success).toBe(true);
      invoices.push(result);
      
      // Wait between requests to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 3: Verify all invoices were processed
    expect(invoices).toHaveLength(3);
    invoices.forEach((invoice, index) => {
      expect(invoice.invoiceNumber).toBeDefined();
      expect(invoice.zoi).toMatch(/^[a-f0-9]{32}$/);
      expect(invoice.uniqueInvoiceId).toBeDefined();
    });
    
    console.log('E2E Test Results:', {
      businessPremiseId: premiseResult.businessPremiseId,
      invoiceCount: invoices.length,
      zois: invoices.map(inv => inv.zoi)
    });
  }, 60000); // 60 second timeout for full workflow
});
```

## 🚦 Test Coverage

### Coverage Configuration

Add to `package.json`:
```json
{
  "scripts": {
    "test:coverage": "jest --coverage",
    "test:coverage:watch": "jest --coverage --watch"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/test/**",
      "!src/examples/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## 🔧 Test Utilities

### Test Helpers

```typescript
// tests/helpers/test-utils.ts
import { FursClient, BusinessPremiseRequest, InvoiceRequest } from '../../src';

export class TestHelpers {
  static createValidBusinessPremise(): BusinessPremiseRequest {
    return {
      identifier: {
        RealEstateBP: {
          PropertyID: {
            CadastralNumber: 365 + Math.floor(Math.random() * 1000),
            BuildingNumber: 12,
          },
          Address: {
            Street: 'Test Street',
            HouseNumber: '1',
            Community: 'Ljubljana',
            City: 'Ljubljana',
            PostalCode: '1000',
          },
        },
      },
      validityDate: '2026-01-01T22:30:47',
      specialNotes: 'Test premise'
    };
  }

  static createValidInvoice(businessPremiseId: string): InvoiceRequest {
    return {
      businessPremiseId,
      electronicDeviceId: 'ED001',
      invoiceAmount: 122.0,
      taxesPerSeller: [{
        VAT: [{
          TaxRate: 22.0,
          TaxableAmount: 100.0,
          TaxAmount: 22.0,
        }]
      }]
    };
  }

  static async setupTestPremise(client: FursClient): Promise<string> {
    const premise = this.createValidBusinessPremise();
    const result = await client.registerBusinessPremise(premise);
    return result.businessPremiseId;
  }

  static waitForRateLimit(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

### Custom Matchers

```typescript
// tests/helpers/custom-matchers.ts
import { InvoiceResult, BusinessPremiseResult } from '../../src';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidZOI(): R;
      toBeValidBusinessPremiseResult(): R;
      toBeValidInvoiceResult(): R;
    }
  }
}

expect.extend({
  toBeValidZOI(received: string) {
    const pass = typeof received === 'string' && /^[a-f0-9]{32}$/.test(received);
    return {
      message: () => `expected ${received} to be a valid ZOI (32-character hex string)`,
      pass,
    };
  },

  toBeValidBusinessPremiseResult(received: BusinessPremiseResult) {
    const pass = received.success === true &&
                 typeof received.businessPremiseId === 'string' &&
                 received.businessPremiseId.length > 0;
    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid business premise result`,
      pass,
    };
  },

  toBeValidInvoiceResult(received: InvoiceResult) {
    const pass = received.success === true &&
                 typeof received.invoiceNumber === 'string' &&
                 typeof received.zoi === 'string' &&
                 /^[a-f0-9]{32}$/.test(received.zoi);
    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid invoice result`,
      pass,
    };
  }
});
```

## 🎭 Performance Testing

### Load Testing

```typescript
// tests/performance/load.test.ts
import { FursClient } from '../../src';
import { TEST_CONFIG } from '../integration/config';
import { TestHelpers } from '../helpers/test-utils';

describe('Performance Tests', () => {
  let client: FursClient;
  let businessPremiseId: string;

  beforeAll(async () => {
    client = new FursClient(TEST_CONFIG);
    businessPremiseId = await TestHelpers.setupTestPremise(client);
  }, 30000);

  it('should handle concurrent invoice requests', async () => {
    const concurrentRequests = 5;
    const invoices = Array.from({ length: concurrentRequests }, (_, i) => ({
      businessPremiseId,
      electronicDeviceId: `ED${i.toString().padStart(3, '0')}`,
      invoiceAmount: 100.0 + i,
      taxesPerSeller: [{
        VAT: [{
          TaxRate: 22.0,
          TaxableAmount: 82.0 + i,
          TaxAmount: 18.0 + (i * 0.22),
        }]
      }]
    }));

    const startTime = Date.now();
    
    // Process invoices concurrently (but be mindful of FURS rate limits)
    const results = await Promise.all(
      invoices.map(async (invoice, index) => {
        // Stagger requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 200));
        return client.fiscalizeInvoice(invoice);
      })
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all succeeded
    results.forEach(result => {
      expect(result).toBeValidInvoiceResult();
    });

    console.log(`Processed ${concurrentRequests} invoices in ${duration}ms`);
    expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
  }, 45000);
});
```

## 🐛 Test Debugging

### Debug Configuration

```typescript
// tests/debug/debug.test.ts
import { FursClient } from '../../src';

describe('Debug Tests', () => {
  it('should provide detailed error information', async () => {
    const client = new FursClient({
      certPath: './test-certificate.p12',
      certPassword: 'wrong-password', // Intentionally wrong
      taxNumber: 12345678,
      environment: 'test',
      debug: true // Enable debug logging
    });

    try {
      await client.fiscalizeInvoice({
        businessPremiseId: 'TEST',
        electronicDeviceId: 'ED001',
        invoiceAmount: 100,
        taxesPerSeller: []
      });
    } catch (error) {
      console.log('Debug error details:', {
        name: error.constructor.name,
        message: error.message,
        code: error.code,
        details: error.details
      });
    }
  });
});
```

### Test Data Inspection

```typescript
// tests/debug/inspect-data.test.ts
describe('Data Inspection', () => {
  it('should inspect JWT structure', async () => {
    // This test helps understand the JWT structure
    const client = new FursClient(TEST_CONFIG);
    
    // Mock the JWT creation to inspect structure
    const originalCreateJWT = (client as any).createJWT;
    (client as any).createJWT = function(payload: any) {
      console.log('JWT Payload:', JSON.stringify(payload, null, 2));
      return originalCreateJWT.call(this, payload);
    };

    await client.fiscalizeInvoice({
      businessPremiseId: 'TEST',
      electronicDeviceId: 'ED001',
      invoiceAmount: 100,
      taxesPerSeller: []
    });
  });
});
```

## 📊 Test Scripts

### Package.json Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:all": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:performance": "jest tests/performance"
  }
}
```

## 🔐 Certificate Management for Testing

### Test Certificate Setup

Create a dedicated test certificate management system:

```typescript
// tests/helpers/certificate-manager.ts
import * as fs from 'fs';
import * as path from 'path';

export class CertificateManager {
  private static readonly TEST_CERT_PATH = './test-certificate.p12';
  
  static hasCertificate(): boolean {
    return fs.existsSync(this.TEST_CERT_PATH);
  }
  
  static validateCertificate(): boolean {
    if (!this.hasCertificate()) {
      return false;
    }
    
    try {
      const stats = fs.statSync(this.TEST_CERT_PATH);
      return stats.size > 0;
    } catch {
      return false;
    }
  }
  
  static skipIfNoCertificate(testName: string): void {
    if (!this.hasCertificate()) {
      console.warn(`⚠️  Skipping ${testName} - no test certificate available`);
      console.warn('   Add test-certificate.p12 to run integration tests');
      return;
    }
  }
}
```

### Conditional Test Execution

```typescript
// tests/integration/conditional.test.ts
import { CertificateManager } from '../helpers/certificate-manager';

describe('Integration Tests (Conditional)', () => {
  beforeAll(() => {
    CertificateManager.skipIfNoCertificate('Integration Tests');
  });

  it.skipIf(!CertificateManager.hasCertificate())(
    'should run only if certificate is available',
    async () => {
      // Test implementation
    }
  );
});
```

## 🎯 Test Best Practices

### 1. Test Organization

```
tests/
├── unit/           # Fast, isolated tests
├── integration/    # Tests with real FURS API
├── e2e/           # Complete workflow tests
├── performance/   # Load and performance tests
├── helpers/       # Test utilities and helpers
├── mocks/         # Mock implementations
└── fixtures/      # Test data and fixtures
```

### 2. Test Naming

```typescript
describe('FursClient', () => {
  describe('registerBusinessPremise', () => {
    it('should register premise with valid data', async () => {
      // Test implementation
    });
    
    it('should throw validation error with invalid data', async () => {
      // Test implementation
    });
    
    it('should handle FURS server errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

### 3. Test Data Management

```typescript
// tests/fixtures/test-data.ts
export const TEST_BUSINESS_PREMISES = {
  VALID_REAL_ESTATE: {
    identifier: {
      RealEstateBP: {
        PropertyID: { CadastralNumber: 365, BuildingNumber: 12 },
        Address: {
          Street: 'Test Street',
          HouseNumber: '1',
          Community: 'Ljubljana',
          City: 'Ljubljana',
          PostalCode: '1000'
        }
      }
    },
    validityDate: '2026-01-01T22:30:47'
  },
  
  INVALID_MISSING_FIELDS: {
    identifier: {
      RealEstateBP: {
        PropertyID: { CadastralNumber: 365 }
        // Missing BuildingNumber
      }
    }
  }
};
```

### 4. Async Test Handling

```typescript
describe('Async Operations', () => {
  it('should handle async operations correctly', async () => {
    // Use async/await consistently
    const result = await client.fiscalizeInvoice(invoice);
    expect(result.success).toBe(true);
  });
  
  it('should handle promise rejections', async () => {
    // Test error cases
    await expect(client.fiscalizeInvoice(invalidInvoice))
      .rejects
      .toThrow(FursValidationError);
  });
});
```

## 🚀 Continuous Integration

### GitHub Actions Test Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        FURS_CERT_PASSWORD: ${{ secrets.FURS_CERT_PASSWORD }}
        FURS_TAX_NUMBER: ${{ secrets.FURS_TAX_NUMBER }}
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

---

## 📚 Related Documentation

- [Getting Started Guide](./getting-started.md) - Basic setup and usage
- [API Reference](./api-reference.md) - Complete API documentation  
- [Error Handling Guide](./error-handling.md) - Error handling strategies
- [Production Deployment](./production-deployment.md) - Production considerations

## 🎯 Summary

This testing guide covers:
- ✅ **Unit tests** for individual components
- ✅ **Integration tests** with real FURS API
- ✅ **Mock testing** for isolated testing
- ✅ **End-to-end tests** for complete workflows
- ✅ **Performance testing** for load scenarios
- ✅ **Test utilities** and helpers
- ✅ **CI/CD integration** for automated testing

Remember to include your `test-certificate.p12` file to run integration tests successfully!
