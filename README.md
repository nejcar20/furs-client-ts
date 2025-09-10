# furs-client-ts

[![npm version](https://badge.fury.io/js/furs-client-ts.svg)](https://www.npmjs.com/package/furs-client-ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://github.com/nejcar20/furs-client-ts/workflows/CI/badge.svg)](https://github.com/nejcar20/furs-client-ts/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/furs-client-ts.svg)](https://nodejs.org/)

> **Professional TypeScript client for FURS (Financial Administration of the Republic of Slovenia) invoice fiscalization and business premise registration with full type safety and IntelliSense support.**

## ✨ Features

- 🏢 **Business Premise Registration** - Register and manage business premises with FURS
- 🧾 **Invoice Fiscalization** - Fiscalize invoices and generate EOR (Unique Invoice ID) 
- 🔐 **Certificate Authentication** - Secure P12 certificate-based authentication
- 🎯 **Full TypeScript Support** - Complete type definitions with IntelliSense
- 🛡️ **Type Safety** - Compile-time error prevention and runtime validation
- 🌍 **Environment Support** - Both test and production FURS environments
- ⚡ **Easy Integration** - Simple, intuitive API for rapid development
- 📚 **Self-Documenting** - Rich type definitions serve as inline documentation
- 🧪 **Thoroughly Tested** - Comprehensive unit and integration test coverage

## 🚀 Quick Start

### Installation

```bash
npm install furs-client-ts
```

### Basic Usage

```typescript
import { FursClient, InvoiceRequest, BusinessPremiseRequest } from 'furs-client-ts';

// Initialize with full type safety
const client = new FursClient({
  certPath: './your-certificate.p12',
  certPassword: 'your-password',
  taxNumber: 12345678,
  environment: 'test' // TypeScript ensures only 'test' | 'production'
});

// Register business premise with typed interfaces
const premise: BusinessPremiseRequest = {
  identifier: {
    RealEstateBP: {
      PropertyID: { CadastralNumber: 365, BuildingNumber: 12 },
      Address: {
        Street: 'Tržaška cesta',
        HouseNumber: '24',
        Community: 'Ljubljana',
        City: 'Ljubljana',
        PostalCode: '1000'
      }
    }
  },
  validityDate: '2026-01-01T22:30:47'
};

const premiseResult = await client.registerBusinessPremise(premise);

// Fiscalize invoice with compile-time validation
const invoice: InvoiceRequest = {
  businessPremiseId: premiseResult.businessPremiseId,
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

## 📋 Why Choose This Library?

### 🎯 **Type Safety First**
- **Compile-time validation** catches errors before they reach production
- **IntelliSense support** provides auto-completion and inline documentation
- **Strongly typed interfaces** for all FURS data structures
- **Type guards** prevent runtime type errors

### 🏆 **Production Ready**
- **Thoroughly tested** with both unit and integration tests
- **Real FURS integration** - tested against actual FURS test environment
- **Comprehensive error handling** with typed custom exceptions
- **Certificate validation** and secure authentication

### 🛠️ **Developer Experience**
- **Rich IDE support** with full IntelliSense in VS Code, WebStorm, etc.
- **Self-documenting code** through TypeScript interfaces
- **Extensive examples** and documentation
- **Easy debugging** with source maps and clear error messages

## 📊 What's Included

### Core Functionality
- ✅ Business premise registration and management
- ✅ Invoice fiscalization with ZOI generation
- ✅ P12 certificate handling and JWT signing
- ✅ Both test and production environment support
- ✅ Comprehensive error handling with custom error types

### TypeScript Features
- ✅ Complete type definitions for all operations
- ✅ Strongly typed configuration and responses
- ✅ Type-safe error handling with custom exception classes
- ✅ IntelliSense support in all major IDEs
- ✅ Compile-time validation of all parameters

### Developer Tools
- ✅ Comprehensive test suite (unit + integration)
- ✅ TypeScript examples and usage guides
- ✅ Debug logging and error diagnostics
- ✅ Source maps for easy debugging

## 🔧 Requirements

- Node.js >= 14.0.0
- TypeScript >= 4.0.0 (for development)
- Valid FURS P12 certificate
- Internet connection for FURS API access

## 📚 Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [TypeScript Examples](./examples/)
- [Error Handling](./docs/error-handling.md)
- [Testing Guide](./docs/testing.md)

## 🧪 Testing

```bash
# Run complete TypeScript test suite
npm test

# Run individual test phases
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript types
4. Add tests for your changes
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## ⭐ Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/nejcar20/furs-client-ts/issues)
- 💬 [Discussions](https://github.com/nejcar20/furs-client-ts/discussions)
- 📧 Email: Contact via GitHub

## 🎯 Used By

This library is trusted by:
- E-commerce platforms integrating with Slovenian tax system
- Accounting software companies
- POS system developers
- Invoice management applications

## 👨‍💻 Author

Created and maintained by **nejcar20**

- GitHub: [@nejcar20](https://github.com/nejcar20)
- Repository: [furs-client-ts](https://github.com/nejcar20/furs-client-ts)

---

**Made with ❤️ for the Slovenian developer community**

*Simplifying FURS integration with modern TypeScript development practices.*
