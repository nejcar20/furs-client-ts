# Changelog

All notable changes to the `furs-client-ts` project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.2] - 2025-09-10

### Changes
CI fix

## [v1.0.1] - 2025-09-10

### Changes
CI pipeline

## [1.0.0] - 2025-09-10

### 🎉 Initial Release

The first stable release of the professional TypeScript client for FURS (Slovenian Financial Administration).

### Added

#### 🏢 Core Features
- **Business Premise Registration** - Complete implementation with typed interfaces
- **Invoice Fiscalization** - Full invoice processing with ZOI generation
- **P12 Certificate Authentication** - Secure certificate handling and JWT signing
- **Environment Support** - Both test and production FURS environments

#### 🎯 TypeScript Features
- **Complete Type Definitions** - Full TypeScript support with interfaces for all operations
- **Type-Safe Configuration** - Strongly typed client configuration and validation
- **Custom Error Types** - Typed error classes for different failure scenarios
- **IntelliSense Support** - Rich IDE support with auto-completion and documentation

#### 🛠️ Developer Experience
- **Comprehensive Testing** - Unit tests and integration tests with real FURS API
- **Debug Logging** - Optional detailed logging for troubleshooting
- **Source Maps** - Full debugging support with TypeScript source maps
- **Examples** - Complete TypeScript examples and usage guides

### Technical Details

#### Dependencies
- `node-forge@^1.3.1` - Certificate handling and cryptographic operations
- `@types/node@^20.0.0` - Node.js type definitions
- `@types/node-forge@^1.3.0` - node-forge type definitions
- `typescript@^5.0.0` - TypeScript compiler

#### Requirements
- Node.js >= 14.0.0
- TypeScript >= 4.0.0 (for development)
- Valid FURS P12 certificate

#### Tested Environments
- ✅ FURS Test Environment (`blagajne-test.fu.gov.si:9002`)
- ✅ Windows 10/11
- ✅ Node.js 14.x, 16.x, 18.x, 20.x
- ✅ TypeScript 4.x, 5.x

### Security
- Secure P12 certificate handling
- Proper JWT signing with RSA-SHA256
- No sensitive data logging (certificates/passwords excluded from logs)
- Input validation and sanitization

### Author
- Created and maintained by **nejcar20**
- Repository: https://github.com/nejcar20/furs-client-ts

## [Unreleased]

### Planned Features
- Support for additional FURS operations
- Enhanced error recovery mechanisms
- Performance optimizations
- Additional validation rules

---

## Support Matrix

| Version | Node.js | TypeScript | FURS API | Support Status |
|---------|---------|------------|----------|----------------|
| 1.0.0   | >=14.0.0| >=4.0.0    | Current  | ✅ Active      |

---

**Note**: For detailed information about FURS API changes and requirements, please refer to the official FURS documentation.
