# API Reference - furs-client-ts

Complete TypeScript API documentation for the FURS client library.

## 📋 Table of Contents

- [FursClient Class](#fursclient-class)
- [Configuration Types](#configuration-types)
- [Request/Response Types](#requestresponse-types)
- [Error Types](#error-types)
- [Utility Types](#utility-types)

## FursClient Class

The main client class for FURS integration.

### Constructor

```typescript
new FursClient(config: FursClientConfig)
```

**Parameters:**
- `config: FursClientConfig` - Client configuration object

**Throws:**
- `FursValidationError` - Invalid configuration
- `FursAuthenticationError` - Certificate loading failed

**Example:**
```typescript
const client = new FursClient({
  certPath: './test-certificate.p12',
  certPassword: 'password',
  taxNumber: 12345678,
  environment: 'test',
  debug: true
});
```

### Methods

#### `registerBusinessPremise()`

Register a business premise with FURS.

```typescript
async registerBusinessPremise(
  businessPremise: BusinessPremiseRequest
): Promise<BusinessPremiseResult>
```

**Parameters:**
- `businessPremise: BusinessPremiseRequest` - Business premise configuration

**Returns:**
- `Promise<BusinessPremiseResult>` - Registration result with premise ID

**Throws:**
- `FursError` - FURS server error
- `FursValidationError` - Invalid input data
- `FursNetworkError` - Network communication error

**Example:**
```typescript
const premise: BusinessPremiseRequest = {
  identifier: {
    RealEstateBP: {
      PropertyID: {
        CadastralNumber: 365,
        BuildingNumber: 12,
        BuildingSectionNumber: 3
      },
      Address: {
        Street: 'Tržaška cesta',
        HouseNumber: '24',
        Community: 'Ljubljana',
        City: 'Ljubljana',
        PostalCode: '1000'
      }
    }
  },
  validityDate: '2026-01-01T22:30:47',
  specialNotes: 'Main business location'
};

const result = await client.registerBusinessPremise(premise);
console.log('Premise ID:', result.businessPremiseId);
```

#### `fiscalizeInvoice()`

Fiscalize an invoice with FURS and generate ZOI.

```typescript
async fiscalizeInvoice(
  invoice: InvoiceRequest
): Promise<InvoiceResult>
```

**Parameters:**
- `invoice: InvoiceRequest` - Invoice data to fiscalize

**Returns:**
- `Promise<InvoiceResult>` - Fiscalization result with EOR and ZOI

**Throws:**
- `FursError` - FURS server error
- `FursValidationError` - Invalid invoice data
- `FursNetworkError` - Network communication error

**Example:**
```typescript
const invoice: InvoiceRequest = {
  businessPremiseId: 'BP123',
  electronicDeviceId: 'ED001',
  invoiceAmount: 122.0,
  taxesPerSeller: [{
    VAT: [{
      TaxRate: 22.0,
      TaxableAmount: 100.0,
      TaxAmount: 22.0
    }]
  }]
};

const result = await client.fiscalizeInvoice(invoice);
console.log('EOR:', result.uniqueInvoiceId);
console.log('ZOI:', result.zoi);
```

## Configuration Types

### FursClientConfig

Main configuration interface for the FURS client.

```typescript
interface FursClientConfig {
  /** Path to P12 certificate file */
  certPath: string;
  
  /** Certificate password */
  certPassword: string;
  
  /** 8-digit tax number */
  taxNumber: number;
  
  /** Environment: 'test' or 'production' */
  environment?: 'test' | 'production';
  
  /** Custom endpoint URLs */
  endpoints?: Partial<FursEndpoints>;
  
  /** Enable debug logging */
  debug?: boolean;
}
```

**Field Details:**

- **`certPath`**: Path to your P12 certificate file
  - **Required**: Yes
  - **Example**: `'./certificates/test-cert.p12'`

- **`certPassword`**: Password for the P12 certificate
  - **Required**: Yes
  - **Security**: Use environment variables

- **`taxNumber`**: Your 8-digit Slovenian tax number
  - **Required**: Yes
  - **Format**: 8 digits (e.g., 12345678)
  - **Validation**: Automatically validated

- **`environment`**: FURS environment to use
  - **Required**: No (defaults to 'test')
  - **Options**: `'test'` | `'production'`
  - **Test**: `blagajne-test.fu.gov.si:9002`
  - **Production**: `blagajne.fu.gov.si:9003`

- **`debug`**: Enable detailed logging
  - **Required**: No (defaults to false)
  - **Development**: Set to `true`
  - **Production**: Set to `false`

### FursEndpoints

Custom endpoint configuration.

```typescript
interface FursEndpoints {
  /** Business premise registration endpoint */
  businessPremise: string;
  
  /** Invoice fiscalization endpoint */
  invoice: string;
}
```

**Default Values:**
```typescript
{
  businessPremise: '/v1/cash_registers/invoices/register',
  invoice: '/v1/cash_registers/invoices'
}
```

## Request/Response Types

### BusinessPremiseRequest

Configuration for registering a business premise.

```typescript
interface BusinessPremiseRequest {
  /** Custom business premise ID (auto-generated if omitted) */
  businessPremiseId?: string;
  
  /** Business premise identifier */
  identifier: BusinessPremiseIdentifier;
  
  /** Validity date in ISO format */
  validityDate: string;
  
  /** Software supplier information */
  softwareSupplier?: SoftwareSupplier[];
  
  /** Special notes */
  specialNotes?: string;
}
```

### BusinessPremiseIdentifier

```typescript
interface BusinessPremiseIdentifier {
  /** Real estate business premise */
  RealEstateBP?: RealEstateBP;
  
  /** Premise type identifier */
  PremiseType?: PremiseType;
}
```

### RealEstateBP

```typescript
interface RealEstateBP {
  /** Property identification */
  PropertyID: PropertyID;
  
  /** Address information */
  Address: Address;
}
```

### PropertyID

```typescript
interface PropertyID {
  /** Cadastral number */
  CadastralNumber: number;
  
  /** Building number */
  BuildingNumber: number;
  
  /** Building section number (optional) */
  BuildingSectionNumber?: number;
}
```

### Address

```typescript
interface Address {
  /** Street name */
  Street: string;
  
  /** House number */
  HouseNumber: string;
  
  /** Additional house number (optional) */
  HouseNumberAdditional?: string;
  
  /** Community name */
  Community: string;
  
  /** City name */
  City: string;
  
  /** Postal code */
  PostalCode: string;
}
```

### BusinessPremiseResult

Response from business premise registration.

```typescript
interface BusinessPremiseResult {
  /** Generated or provided business premise ID */
  businessPremiseId: string;
  
  /** Whether registration was successful */
  success: boolean;
  
  /** Full FURS response (optional) */
  response?: any;
}
```

### InvoiceRequest

Invoice data for fiscalization.

```typescript
interface InvoiceRequest {
  /** Business premise ID */
  businessPremiseId: string;
  
  /** Electronic device ID */
  electronicDeviceId: string;
  
  /** Custom invoice number (auto-generated if omitted) */
  invoiceNumber?: string;
  
  /** Total invoice amount */
  invoiceAmount: number;
  
  /** Payment amount (defaults to invoice amount) */
  paymentAmount?: number;
  
  /** Tax information per seller */
  taxesPerSeller: TaxesPerSeller[];
  
  /** Issue date/time in ISO format */
  issueDateTime?: string;
  
  /** Numbering structure */
  numberingStructure?: 'B' | 'C';
  
  /** Operator tax number */
  operatorTaxNumber?: number;
}
```

### TaxesPerSeller

```typescript
interface TaxesPerSeller {
  /** VAT information */
  VAT: VATInfo[];
}
```

### VATInfo

```typescript
interface VATInfo {
  /** VAT tax rate (e.g., 22.0 for 22%) */
  TaxRate: number;
  
  /** Taxable amount (before VAT) */
  TaxableAmount: number;
  
  /** Tax amount (VAT) */
  TaxAmount: number;
}
```

### InvoiceResult

Response from invoice fiscalization.

```typescript
interface InvoiceResult {
  /** Generated or provided invoice number */
  invoiceNumber: string;
  
  /** EOR - Unique invoice ID from FURS */
  uniqueInvoiceId: string;
  
  /** ZOI - Protected ID for QR codes */
  zoi: string;
  
  /** Whether fiscalization was successful */
  success: boolean;
  
  /** Full FURS response (optional) */
  response?: any;
}
```

## Error Types

### FursError

Base error class for all FURS-related errors.

```typescript
class FursError extends Error {
  readonly code: FursErrorCode | null;
  readonly details: any;
  
  constructor(message: string, code?: FursErrorCode, details?: any)
}
```

### FursValidationError

Thrown for input validation errors.

```typescript
class FursValidationError extends FursError {
  constructor(message: string, details?: any)
}
```

**Common Causes:**
- Invalid certificate path
- Wrong certificate password format
- Invalid tax number format
- Missing required fields

### FursAuthenticationError

Thrown for certificate/authentication errors.

```typescript
class FursAuthenticationError extends FursError {
  constructor(message: string, details?: any)
}
```

**Common Causes:**
- Certificate file not found
- Incorrect certificate password
- Corrupted certificate file
- Expired certificate

### FursNetworkError

Thrown for network communication errors.

```typescript
class FursNetworkError extends FursError {
  constructor(message: string, details?: any)
}
```

**Common Causes:**
- Network connectivity issues
- FURS server unavailable
- Timeout errors
- DNS resolution failures

### FursServerError

Thrown for FURS server errors.

```typescript
class FursServerError extends FursError {
  constructor(message: string, code: FursErrorCode, details?: any)
}
```

**Common FURS Error Codes:**
- `S100` - System error (often temporary)
- `V001` - Validation error
- `A001` - Authentication error

## Utility Types

### Environment

```typescript
type Environment = 'test' | 'production';
```

### ENVIRONMENTS

```typescript
const ENVIRONMENTS = {
  TEST: 'test' as const,
  PRODUCTION: 'production' as const
} as const;
```

### FursErrorCode

```typescript
type FursErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | string; // For FURS-specific error codes
```

## 🎯 Usage Patterns

### Error Handling Pattern

```typescript
import { 
  FursError, 
  FursValidationError, 
  FursAuthenticationError,
  FursNetworkError,
  FursServerError 
} from 'furs-client-ts';

try {
  const result = await client.fiscalizeInvoice(invoice);
  // Handle success
} catch (error) {
  if (error instanceof FursValidationError) {
    // Handle validation errors
    console.error('Validation:', error.message);
  } else if (error instanceof FursAuthenticationError) {
    // Handle auth errors
    console.error('Authentication:', error.message);
  } else if (error instanceof FursNetworkError) {
    // Handle network errors
    console.error('Network:', error.message);
  } else if (error instanceof FursServerError) {
    // Handle server errors
    console.error('Server:', error.message, error.code);
  } else if (error instanceof FursError) {
    // Handle other FURS errors
    console.error('FURS:', error.message, error.code);
  } else {
    // Handle unexpected errors
    console.error('Unexpected:', error);
  }
}
```

### Configuration Pattern

```typescript
// Development
const devClient = new FursClient({
  certPath: './certificates/test-certificate.p12',
  certPassword: process.env.FURS_CERT_PASSWORD!,
  taxNumber: parseInt(process.env.FURS_TAX_NUMBER!),
  environment: 'test',
  debug: true
});

// Production
const prodClient = new FursClient({
  certPath: process.env.FURS_CERT_PATH!,
  certPassword: process.env.FURS_CERT_PASSWORD!,
  taxNumber: parseInt(process.env.FURS_TAX_NUMBER!),
  environment: 'production',
  debug: false
});
```

---

## 📚 Related Documentation

- [Getting Started Guide](./getting-started.md)
- [Error Handling Guide](./error-handling.md)
- [Testing Guide](./testing.md)
- [Production Deployment](./production-deployment.md)

For more examples and advanced usage, see the [examples directory](../examples/) in the repository.
