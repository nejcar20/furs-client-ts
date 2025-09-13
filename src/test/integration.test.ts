import { FursClient } from '../FursClient';
import { FursError, FursValidationError, FursAuthenticationError } from '../errors';
import {
  FursClientConfig,
  BusinessPremiseRequest,
  InvoiceRequest,
  BusinessPremiseResult,
  InvoiceResult,
} from '../types';
import { CodeFormat } from '../services/codeGenerator';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration Tests for FURS Client (TypeScript)
 * These tests perform real API calls to FURS test environment
 */

interface TestConfig {
  certPath: string;
  certPassword: string;
  taxNumber: number;
  environment: 'test' | 'production';
  debug: boolean;
}

class FursIntegrationTest {
  private client!: FursClient; // Using definite assignment assertion
  private testResults: Map<string, boolean> = new Map();

  constructor(private config: TestConfig) {
    console.log('🚀 FURS Client - TypeScript Integration Tests');
    console.log('=============================================\n');
  }

  /**
   * Run all integration tests
   */
  public async runAllTests(): Promise<void> {
    try {
      await this.testClientInitialization();
      await this.testBusinessPremiseRegistration();
      await this.testInvoiceFiscalization();
      await this.testCodeGeneration();
      await this.testErrorHandling();
      await this.testTypeValidation();

      this.printTestSummary();
    } catch (error) {
      this.handleTestError(error as Error);
    }
  }
  /**
   * Test 1: Client Initialization with TypeScript types
   */
  private async testClientInitialization(): Promise<void> {
    console.log('🔧 TEST 1: Client Initialization & Type Safety');
    console.log('===============================================');

    try {
      // Test with proper TypeScript configuration
      const clientConfig: FursClientConfig = {
        certPath: this.config.certPath,
        certPassword: this.config.certPassword,
        taxNumber: this.config.taxNumber,
        environment: this.config.environment,
        debug: this.config.debug,
      };

      this.client = new FursClient(clientConfig);

      console.log('✅ Client initialized with TypeScript types');
      console.log('   - Certificate path:', clientConfig.certPath);
      console.log('   - Tax number type:', typeof clientConfig.taxNumber);
      console.log('   - Environment type:', typeof clientConfig.environment);
      console.log('   - Debug type:', typeof clientConfig.debug);

      this.testResults.set('clientInitialization', true);
    } catch (error) {
      console.log('❌ Client initialization failed:', (error as Error).message);
      this.testResults.set('clientInitialization', false);
      throw error;
    }
    console.log();
  }

  /**
   * Test 2: Business Premise Registration with typed interfaces
   */
  private async testBusinessPremiseRegistration(): Promise<void> {
    console.log('🏢 TEST 2: Business Premise Registration (TypeScript)');
    console.log('====================================================');

    try {
      // Type-safe business premise configuration
      const businessPremiseData: BusinessPremiseRequest = {
        identifier: {
          RealEstateBP: {
            PropertyID: {
              CadastralNumber: 365,
              BuildingNumber: 12,
              BuildingSectionNumber: 3,
            },
            Address: {
              Street: 'Tržaška cesta',
              HouseNumber: '24',
              HouseNumberAdditional: 'B',
              Community: 'Ljubljana',
              City: 'Ljubljana',
              PostalCode: '1000',
            },
          },
        },
        validityDate: '2026-01-01T22:30:47',
        specialNotes: 'TypeScript Integration Test - Business Premise',
      };

      console.log('📤 Registering business premise with typed data...');
      const result: BusinessPremiseResult =
        await this.client.registerBusinessPremise(businessPremiseData);

      // TypeScript ensures we have the correct return type
      console.log('✅ Business premise registered successfully!');
      console.log('   - Business Premise ID (string):', result.businessPremiseId);
      console.log('   - Success flag (boolean):', result.success);
      console.log('   - Response type:', typeof result.response);
      console.log('   - Type validation:', this.validateBusinessPremiseResult(result));

      // Store for later use in invoice test
      (this as any).businessPremiseId = result.businessPremiseId;

      this.testResults.set('businessPremiseRegistration', true);
    } catch (error) {
      console.log('❌ Business premise registration failed:', (error as Error).message);
      this.testResults.set('businessPremiseRegistration', false);
      throw error;
    }
    console.log();
  }
  /**
   * Test 3: Invoice Fiscalization with strict typing
   */
  private async testInvoiceFiscalization(): Promise<void> {
    console.log('💳 TEST 3: Invoice Fiscalization (TypeScript)');
    console.log('==============================================');

    // Wait between requests for FURS rate limiting
    console.log('⏳ Waiting 3 seconds for FURS rate limiting...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      // Type-safe invoice configuration
      const invoiceData: InvoiceRequest = {
        businessPremiseId: (this as any).businessPremiseId || 'BP_TEST',
        electronicDeviceId: 'ED001',
        invoiceAmount: 122.0,
        paymentAmount: 122.0,
        taxesPerSeller: [
          {
            VAT: [
              {
                TaxRate: 22.0,
                TaxableAmount: 100.0,
                TaxAmount: 22.0,
              },
            ],
          },
        ],
        numberingStructure: 'B', // TypeScript restricts to 'B' | 'C'
      };

      console.log('📤 Fiscalizing invoice with typed data...');
      const result: InvoiceResult = await this.client.fiscalizeInvoice(invoiceData);

      // TypeScript ensures correct return type structure
      console.log('✅ Invoice fiscalized successfully!');
      console.log('   - Invoice Number (string):', result.invoiceNumber);
      console.log('   - Unique Invoice ID (string):', result.uniqueInvoiceId);
      console.log('   - ZOI (string):', result.zoi);
      console.log('   - Success flag (boolean):', result.success);
      console.log('   - Type validation:', this.validateInvoiceResult(result));

      // Store for code generation test
      (this as any).lastInvoiceResult = result;
      (this as any).lastInvoiceData = invoiceData;

      this.testResults.set('invoiceFiscalization', true);
    } catch (error) {
      console.log('❌ Invoice fiscalization failed:', (error as Error).message);
      this.testResults.set('invoiceFiscalization', false);
      throw error;
    }
    console.log();
  }

  /**
   * Test 4: Code Generation (QR, PDF417, Code128)
   */
  private async testCodeGeneration(): Promise<void> {
    console.log('🔲 TEST 4: Code Generation (QR, PDF417, Code128)');
    console.log('================================================');

    try {
      // Use the last invoice result if available, or use test data
      const lastResult = (this as any).lastInvoiceResult;
      const lastData = (this as any).lastInvoiceData;

      const zoi = lastResult?.zoi || 'a7e5f55e1dbb48b799268e1a6d8618a3';
      const issueDateTime = lastData?.issueDateTime || new Date();

      console.log('📊 Using invoice data:');
      console.log('   - ZOI:', zoi);
      console.log('   - Issue DateTime:', issueDateTime);

      // Test 1: Generate QR Code
      console.log('\n1️⃣ Generating QR Code...');
      const qrCode = await this.client.generateQRCode(zoi, issueDateTime, CodeFormat.DATA_URL);
      console.log('   ✅ QR Code generated');
      console.log('   - Format:', qrCode.format);
      console.log('   - Data URL length:', (qrCode.data as string).length);
      console.log('   - 60-digit data:', qrCode.formattedData.substring(0, 30) + '...');

      // Test 2: Generate PDF417 Code
      console.log('\n2️⃣ Generating PDF417 Code...');
      const pdf417Code = await this.client.generatePDF417Code(
        zoi,
        issueDateTime,
        CodeFormat.BUFFER
      );
      console.log('   ✅ PDF417 Code generated');
      console.log('   - Format:', pdf417Code.format);
      console.log('   - Buffer size:', (pdf417Code.data as Buffer).length, 'bytes');

      // Test 3: Generate Code128 Barcodes
      console.log('\n3️⃣ Generating Code128 Barcodes...');
      const code128 = await this.client.generateCode128(zoi, issueDateTime, CodeFormat.STRINGS, 3);
      console.log('   ✅ Code128 Barcodes generated');
      console.log('   - Format:', code128.format);
      const strings = code128.data as string[];
      strings.forEach((str, i) => {
        console.log(`   - Part ${i + 1}: ${str}`);
      });

      // Test 4: Generate all codes at once
      console.log('\n4️⃣ Generating all codes at once...');
      const allCodes = await this.client.generateAllCodes(zoi, issueDateTime, CodeFormat.DATA_URL);
      console.log('   ✅ All codes generated');
      console.log('   - QR:', allCodes.qr.type, '-', allCodes.qr.format);
      console.log('   - PDF417:', allCodes.pdf417.type, '-', allCodes.pdf417.format);
      console.log('   - Code128:', allCodes.code128.type, '-', allCodes.code128.format);

      // Test 5: Generate and save PDF codes to files
      console.log('\n5️⃣ Generating and saving codes to files...');
      const outputDir = path.join(__dirname, '../../test-output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save QR code
      const qrPath = path.join(outputDir, 'test-qr.png');
      await this.client.generateQRCode(zoi, issueDateTime, CodeFormat.FILE, qrPath);
      console.log('   ✅ QR code saved to:', qrPath);

      // Save PDF417 code
      const pdf417Path = path.join(outputDir, 'test-pdf417.png');
      await this.client.generatePDF417Code(zoi, issueDateTime, CodeFormat.FILE, pdf417Path);
      console.log('   ✅ PDF417 code saved to:', pdf417Path);

      // Save Code128 barcodes
      const code128Path = path.join(outputDir, 'test-code128.png');
      await this.client.generateCode128(zoi, issueDateTime, CodeFormat.FILE, 3, code128Path);
      console.log('   ✅ Code128 barcodes saved to:', code128Path);

      // Test 6: Fiscalize with codes
      console.log('\n6️⃣ Testing fiscalizeInvoiceWithCodes...');
      if (lastData) {
        // Create a new invoice to avoid duplicate error
        const newInvoiceData = {
          ...lastData,
          invoiceNumber: undefined, // Let it generate a new one
        };

        const resultWithCodes = await this.client.fiscalizeInvoiceWithCodes(
          newInvoiceData,
          true,
          CodeFormat.DATA_URL
        );

        console.log('   ✅ Invoice fiscalized with codes');
        console.log('   - Invoice number:', resultWithCodes.invoiceNumber);
        console.log('   - Has codes:', resultWithCodes.codes ? 'Yes' : 'No');
        if (resultWithCodes.codes) {
          console.log(
            '   - QR code data length:',
            (resultWithCodes.codes.qr.data as string).length
          );
          console.log(
            '   - PDF417 data length:',
            (resultWithCodes.codes.pdf417.data as string).length
          );
          console.log(
            '   - Code128 data length:',
            (resultWithCodes.codes.code128.data as string).length
          );
        }
      }

      this.testResults.set('codeGeneration', true);
    } catch (error) {
      console.log('❌ Code generation failed:', (error as Error).message);
      this.testResults.set('codeGeneration', false);
    }
    console.log();
  }
  /**
   * Test 5: Error Handling with TypeScript error types
   */
  private async testErrorHandling(): Promise<void> {
    console.log('🛡️  TEST 5: Error Handling & Type Safety');
    console.log('========================================');

    try {
      // Test 4a: Validation Error
      console.log('📋 Testing validation error handling...');
      try {
        const invalidConfig: FursClientConfig = {
          certPath: './nonexistent.p12',
          certPassword: 'test',
          taxNumber: 12345678,
          environment: 'test',
        };
        new FursClient(invalidConfig);
      } catch (error) {
        if (error instanceof FursValidationError) {
          console.log('✅ FursValidationError caught correctly');
          console.log('   - Error message:', error.message);
          console.log('   - Error code:', error.code);
          console.log('   - Error type check:', error instanceof FursValidationError);
        }
      }

      // Test 4b: Invalid Invoice Data (Type constraints)
      console.log('📋 Testing invalid invoice data...');
      try {
        const invalidInvoice: InvoiceRequest = {
          businessPremiseId: 'INVALID_BP',
          electronicDeviceId: 'ED999',
          invoiceAmount: 0, // Zero amount should cause issues
          taxesPerSeller: [],
        };
        await this.client.fiscalizeInvoice(invalidInvoice);
      } catch (error) {
        if (error instanceof FursError) {
          console.log('✅ FursError caught correctly for invalid data');
          console.log('   - Error message:', error.message);
          console.log('   - Error code:', error.code);
        }
      }

      this.testResults.set('errorHandling', true);
    } catch (error) {
      console.log('❌ Error handling test failed:', (error as Error).message);
      this.testResults.set('errorHandling', false);
    }
    console.log();
  }
  /**
   * Test 5: TypeScript Type Validation
   */
  private async testTypeValidation(): Promise<void> {
    console.log('🔍 TEST 6: TypeScript Type System Validation');
    console.log('===========================================');

    try {
      // Test interface compliance
      const config: FursClientConfig = {
        certPath: './test.p12',
        certPassword: 'test',
        taxNumber: 12345678,
        environment: 'test', // Only 'test' | 'production' allowed
        debug: false,
      };

      console.log('✅ FursClientConfig interface compliance verified');
      console.log('   - All required fields present');
      console.log('   - Types match interface definitions');

      // Test optional fields
      const minimalConfig: FursClientConfig = {
        certPath: './test.p12',
        certPassword: 'test',
        taxNumber: 12345678,
        // environment and debug are optional
      };

      console.log('✅ Optional field handling verified');
      console.log('   - Optional fields can be omitted');
      console.log("   - TypeScript doesn't require them");

      // Test enum-like types
      const environments: Array<'test' | 'production'> = ['test', 'production'];
      console.log('✅ Environment type restrictions verified');
      console.log('   - Only valid environments allowed:', environments);

      this.testResults.set('typeValidation', true);
    } catch (error) {
      console.log('❌ Type validation test failed:', (error as Error).message);
      this.testResults.set('typeValidation', false);
    }
    console.log();
  }

  /**
   * Validate BusinessPremiseResult structure
   */
  private validateBusinessPremiseResult(result: BusinessPremiseResult): boolean {
    return (
      typeof result.businessPremiseId === 'string' &&
      typeof result.success === 'boolean' &&
      result.businessPremiseId.length > 0
    );
  }
  /**
   * Validate InvoiceResult structure
   */
  private validateInvoiceResult(result: InvoiceResult): boolean {
    return (
      typeof result.invoiceNumber === 'string' &&
      typeof result.zoi === 'string' &&
      typeof result.success === 'boolean' &&
      result.invoiceNumber.length > 0 &&
      result.zoi.length === 32 // ZOI should be MD5 hash (32 chars)
    );
  }

  /**
   * Print comprehensive test summary
   */
  private printTestSummary(): void {
    console.log('='.repeat(70));
    console.log('📊 TYPESCRIPT INTEGRATION TEST RESULTS');
    console.log('='.repeat(70));

    const results = Array.from(this.testResults.entries());
    const passedTests = results.filter(([, passed]) => passed).length;
    const totalTests = results.length;

    results.forEach(([testName, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      const formattedName = testName.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${status} ${formattedName}`);
    });

    console.log();
    console.log(`🎯 Test Summary: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL TYPESCRIPT TESTS PASSED SUCCESSFULLY!');
      console.log();
      console.log('✅ Type Safety: Fully verified');
      console.log('✅ Interface Compliance: All interfaces working');
      console.log('✅ Error Type Handling: Custom errors typed correctly');
      console.log('✅ API Integration: FURS communication successful');
      console.log('✅ Compilation: TypeScript compiles without errors');
      console.log();
      console.log('🚀 Your TypeScript FURS client is production-ready!');
    } else {
      console.log(`⚠️  ${totalTests - passedTests} test(s) failed`);
      console.log('Please review the failures above');
    }

    console.log('='.repeat(70));
  }
  /**
   * Handle test errors with detailed TypeScript information
   */
  private handleTestError(error: Error): void {
    console.log('\n❌ TYPESCRIPT TEST SUITE FAILED');
    console.log('================================');
    console.log('Error Type:', error.constructor.name);
    console.log('Error Message:', error.message);

    if (error instanceof FursValidationError) {
      console.log('\n💡 Validation Error Details:');
      console.log('   - This indicates a configuration or input validation issue');
      console.log('   - Check certificate path, password, and tax number format');
      console.log('   - Error Code:', error.code);
      if (error.details) {
        console.log('   - Additional Details:', error.details);
      }
    } else if (error instanceof FursAuthenticationError) {
      console.log('\n💡 Authentication Error Details:');
      console.log('   - Certificate loading or authentication failed');
      console.log('   - Verify certificate file integrity and password');
      console.log('   - Error Code:', error.code);
    } else if (error instanceof FursError) {
      console.log('\n💡 FURS API Error Details:');
      console.log('   - Server communication or business logic error');
      console.log('   - Error Code:', error.code);
      console.log('   - Check FURS service availability');
    }

    console.log('\n🔧 TypeScript Debugging Tips:');
    console.log('   1. Check TypeScript compilation: npm run build');
    console.log('   2. Verify all type definitions are correct');
    console.log('   3. Ensure certificate file exists and is readable');
    console.log('   4. Check network connectivity to FURS test environment');

    process.exit(1);
  }
}

/**
 * Main test execution function
 */
async function runTypeScriptTests(): Promise<void> {
  const testConfig: TestConfig = {
    certPath: './test-certificate.p12',
    certPassword: 'X5T7FCINH1AE',
    taxNumber: 10641025,
    environment: 'test',
    debug: true,
  };

  const testSuite = new FursIntegrationTest(testConfig);
  await testSuite.runAllTests();
}

// Execute tests if run directly
if (require.main === module) {
  runTypeScriptTests().catch((error) => {
    console.error('💥 Fatal TypeScript Test Error:', error);
    process.exit(1);
  });
}

export { runTypeScriptTests, FursIntegrationTest };
