# Getting Started with furs-client-ts

Welcome to the complete guide for getting started with the FURS TypeScript client!

## 🚀 Quick Start

### Installation

```bash
npm install furs-client-ts
```

### Basic Setup

```typescript
import { FursClient } from 'furs-client-ts';

const client = new FursClient({
  certPath: './path/to/your-certificate.p12',
  certPassword: 'your-certificate-password',
  taxNumber: 12345678, // Your 8-digit tax number
  environment: 'test', // Start with test environment
  debug: true // Enable logging during development
});
```

## 📋 Prerequisites

### 1. Node.js Environment
- **Node.js** >= 14.0.0
- **TypeScript** >= 4.0.0 (for development)
- **npm** or **yarn** package manager

### 2. FURS Certificate
You need a valid P12 certificate from FURS:
- **Test Environment**: Get test certificate from FURS
- **Production**: Use your official FURS certificate
- **Format**: `.p12` file with password

### 3. TypeScript Project Setup
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## 🏢 Your First Business Premise

### Step 1: Create Configuration
```typescript
import { FursClient, BusinessPremiseRequest } from 'furs-client-ts';

const client = new FursClient({
  certPath: './certificates/your-cert.p12',
  certPassword: process.env.FURS_CERT_PASSWORD!, // Use environment variables
  taxNumber: parseInt(process.env.FURS_TAX_NUMBER!),
  environment: 'test'
});
```

### Step 2: Define Business Premise
```typescript
const businessPremise: BusinessPremiseRequest = {
  identifier: {
    RealEstateBP: {
      PropertyID: {
        CadastralNumber: 365,
        BuildingNumber: 12,
        BuildingSectionNumber: 3, // Optional
      },
      Address: {
        Street: 'Tržaška cesta',
        HouseNumber: '24',
        HouseNumberAdditional: 'B', // Optional
        Community: 'Ljubljana',
        City: 'Ljubljana',
        PostalCode: '1000',
      },
    },
  },
  validityDate: '2026-01-01T22:30:47',
  specialNotes: 'My first business premise'
};
```

### Step 3: Register with FURS
```typescript
try {
  const result = await client.registerBusinessPremise(businessPremise);
  
  if (result.success) {
    console.log('✅ Business premise registered!');
    console.log('ID:', result.businessPremiseId);
    
    // Save this ID - you'll need it for invoices
    const premiseId = result.businessPremiseId;
  }
} catch (error) {
  console.error('❌ Registration failed:', error.message);
}
```

## 💳 Your First Invoice

### Step 1: Prepare Invoice Data
```typescript
import { InvoiceRequest } from 'furs-client-ts';

const invoice: InvoiceRequest = {
  businessPremiseId: 'BP_FROM_PREVIOUS_STEP', // Use the ID from above
  electronicDeviceId: 'ED001', // Your device ID
  invoiceAmount: 122.0, // Total amount including VAT
  paymentAmount: 122.0, // Amount paid (can be different)
  taxesPerSeller: [
    {
      VAT: [
        {
          TaxRate: 22.0, // 22% VAT rate
          TaxableAmount: 100.0, // Amount before VAT
          TaxAmount: 22.0, // VAT amount
        },
      ],
    },
  ],
  // Optional fields:
  numberingStructure: 'B', // or 'C'
  issueDateTime: new Date().toISOString(), // Current time
  operatorTaxNumber: 12345678, // Defaults to your tax number
};
```

### Step 2: Fiscalize Invoice
```typescript
try {
  const result = await client.fiscalizeInvoice(invoice);
  
  if (result.success) {
    console.log('✅ Invoice fiscalized!');
    console.log('Invoice Number:', result.invoiceNumber);
    console.log('EOR (Unique ID):', result.uniqueInvoiceId);
    console.log('ZOI (Protected ID):', result.zoi);
    
    // These are important for your records:
    // - EOR: Unique invoice identifier from FURS
    // - ZOI: Protected ID for QR codes on receipts
  }
} catch (error) {
  console.error('❌ Fiscalization failed:', error.message);
}
```

## 🛡️ Error Handling

```typescript
import { 
  FursError, 
  FursValidationError, 
  FursAuthenticationError 
} from 'furs-client-ts';

try {
  const result = await client.fiscalizeInvoice(invoice);
} catch (error) {
  if (error instanceof FursValidationError) {
    console.error('Validation Error:', error.message);
    console.error('Check your input data');
  } else if (error instanceof FursAuthenticationError) {
    console.error('Authentication Error:', error.message);
    console.error('Check your certificate and password');
  } else if (error instanceof FursError) {
    console.error('FURS Error:', error.message);
    console.error('Error Code:', error.code);
  } else {
    console.error('Unexpected Error:', error.message);
  }
}
```

## 🌍 Environment Configuration

### Test Environment (Development)
```typescript
const client = new FursClient({
  certPath: './certificates/test-cert.p12',
  certPassword: 'test-password',
  taxNumber: 12345678,
  environment: 'test', // Uses blagajne-test.fu.gov.si:9002
  debug: true
});
```

### Production Environment
```typescript
const client = new FursClient({
  certPath: './certificates/production-cert.p12',
  certPassword: process.env.FURS_CERT_PASSWORD!,
  taxNumber: parseInt(process.env.FURS_TAX_NUMBER!),
  environment: 'production', // Uses blagajne.fu.gov.si:9001
  debug: false // Disable debug logging in production
});
```

## 🔐 Security Best Practices

### 1. Environment Variables
Never hardcode sensitive information:

```bash
# .env file
FURS_CERT_PASSWORD=your-certificate-password
FURS_TAX_NUMBER=12345678
FURS_ENVIRONMENT=test
```

```typescript
// Use dotenv
import * as dotenv from 'dotenv';
dotenv.config();

const client = new FursClient({
  certPath: './certificates/cert.p12',
  certPassword: process.env.FURS_CERT_PASSWORD!,
  taxNumber: parseInt(process.env.FURS_TAX_NUMBER!),
  environment: process.env.FURS_ENVIRONMENT as 'test' | 'production'
});
```

### 2. Certificate Security
```bash
# Keep certificates secure
chmod 600 certificates/*.p12

# Add to .gitignore
echo "certificates/*.p12" >> .gitignore
echo ".env" >> .gitignore
```

### 3. Error Information
```typescript
// Don't log sensitive information
try {
  await client.fiscalizeInvoice(invoice);
} catch (error) {
  // ✅ Good - log error message only
  console.error('Fiscalization failed:', error.message);
  
  // ❌ Bad - might log sensitive data
  console.error('Full error:', error);
}
```

## 📊 Complete Example Application

```typescript
// app.ts
import { FursClient, BusinessPremiseRequest, InvoiceRequest } from 'furs-client-ts';
import * as dotenv from 'dotenv';

dotenv.config();

class FursApplication {
  private client: FursClient;
  
  constructor() {
    this.client = new FursClient({
      certPath: './certificates/test-cert.p12',
      certPassword: process.env.FURS_CERT_PASSWORD!,
      taxNumber: parseInt(process.env.FURS_TAX_NUMBER!),
      environment: 'test',
      debug: true
    });
  }
  
  async setupBusinessPremise(): Promise<string> {
    const premise: BusinessPremiseRequest = {
      identifier: {
        RealEstateBP: {
          PropertyID: {
            CadastralNumber: 365,
            BuildingNumber: 12,
          },
          Address: {
            Street: 'Main Street',
            HouseNumber: '1',
            Community: 'Ljubljana',
            City: 'Ljubljana',
            PostalCode: '1000',
          },
        },
      },
      validityDate: '2026-01-01T22:30:47',
    };
    
    const result = await this.client.registerBusinessPremise(premise);
    
    if (!result.success) {
      throw new Error('Failed to register business premise');
    }
    
    return result.businessPremiseId;
  }
  
  async createInvoice(businessPremiseId: string, amount: number): Promise<string> {
    // Calculate VAT (22%)
    const vatRate = 0.22;
    const taxableAmount = amount / (1 + vatRate);
    const vatAmount = amount - taxableAmount;
    
    const invoice: InvoiceRequest = {
      businessPremiseId,
      electronicDeviceId: 'ED001',
      invoiceAmount: amount,
      taxesPerSeller: [
        {
          VAT: [
            {
              TaxRate: 22.0,
              TaxableAmount: Number(taxableAmount.toFixed(2)),
              TaxAmount: Number(vatAmount.toFixed(2)),
            },
          ],
        },
      ],
    };
    
    const result = await this.client.fiscalizeInvoice(invoice);
    
    if (!result.success) {
      throw new Error('Failed to fiscalize invoice');
    }
    
    return result.zoi; // Return ZOI for QR code generation
  }
}

// Usage
async function main() {
  const app = new FursApplication();
  
  try {
    // Setup business premise
    console.log('Setting up business premise...');
    const premiseId = await app.setupBusinessPremise();
    console.log('✅ Business premise ID:', premiseId);
    
    // Create invoice
    console.log('Creating invoice...');
    const zoi = await app.createInvoice(premiseId, 122.0);
    console.log('✅ Invoice ZOI:', zoi);
    
  } catch (error) {
    console.error('❌ Application failed:', error.message);
  }
}

main();
```

## 🔄 Next Steps

1. **[API Reference](./api-reference.md)** - Complete API documentation
2. **[Error Handling](./error-handling.md)** - Comprehensive error handling guide
3. **[Testing Guide](./testing.md)** - How to test your integration
4. **[Production Deployment](./production-deployment.md)** - Production best practices

## 🤝 Need Help?

- 📖 **Documentation**: Check other guides in `/docs`
- 🐛 **Issues**: [GitHub Issues](https://github.com/nejcar20/furs-client-ts/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/nejcar20/furs-client-ts/discussions)
- 📧 **Contact**: Via GitHub profile

Happy coding with FURS! 🇸🇮
