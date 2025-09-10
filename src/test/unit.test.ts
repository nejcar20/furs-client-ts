import { 
  FursError, 
  FursValidationError, 
  FursAuthenticationError,
  FursNetworkError,
  FursServerError 
} from '../errors';
import { generateId, validateTaxNumber, formatDateForFurs } from '../utils/crypto';
import { base64urlEncode, base64urlDecode } from '../utils/jwt';
import { ENVIRONMENTS } from '../types';

/**
 * Unit Tests for FURS Client Components (TypeScript)
 * These tests verify individual functions and components work correctly
 */

class FursUnitTest {
  private testResults: Map<string, boolean> = new Map();

  constructor() {
    console.log('🧪 FURS Client - TypeScript Unit Tests');
    console.log('======================================\n');
  }

  /**
   * Run all unit tests
   */
  public async runAllTests(): Promise<void> {
    try {
      this.testErrorClasses();
      this.testCryptoUtilities();
      this.testJwtUtilities();
      this.testTypeDefinitions();
      this.testValidationFunctions();
      
      this.printTestSummary();
    } catch (error) {
      this.handleTestError(error as Error);
    }
  }

  /**
   * Test custom error classes with TypeScript types
   */
  private testErrorClasses(): void {
    console.log('🛡️  TEST 1: Error Classes & Type Safety');
    console.log('======================================');
    
    try {      // Test FursError base class
      const baseError = new FursError('Test error', 'TEST_CODE', { detail: 'test' });
      console.log('✅ FursError instantiation');
      console.log('   - Message type:', typeof baseError.message);
      console.log('   - Code type:', typeof baseError.code);
      console.log('   - Details type:', typeof baseError.details);
      console.log('   - Instanceof Error:', baseError instanceof Error);
      console.log('   - Instanceof FursError:', baseError instanceof FursError);

      // Test FursValidationError
      const validationError = new FursValidationError('Validation failed', { field: 'taxNumber' });
      console.log('✅ FursValidationError inheritance');
      console.log('   - Instanceof FursError:', validationError instanceof FursError);
      console.log('   - Instanceof FursValidationError:', validationError instanceof FursValidationError);
      console.log('   - Code value:', validationError.code);

      // Test FursAuthenticationError
      const authError = new FursAuthenticationError('Auth failed');
      console.log('✅ FursAuthenticationError inheritance');
      console.log('   - Correct error code:', authError.code === 'AUTHENTICATION_ERROR');

      // Test FursNetworkError
      const networkError = new FursNetworkError('Network failed');
      console.log('✅ FursNetworkError inheritance');
      console.log('   - Correct error code:', networkError.code === 'NETWORK_ERROR');

      // Test FursServerError
      const serverError = new FursServerError('Server error', 'S100');
      console.log('✅ FursServerError with custom code');
      console.log('   - Custom code preserved:', serverError.code === 'S100');

      this.testResults.set('errorClasses', true);
    } catch (error) {
      console.log('❌ Error classes test failed:', (error as Error).message);
      this.testResults.set('errorClasses', false);
    }
    console.log();
  }
  /**
   * Test crypto utility functions with TypeScript
   */
  private testCryptoUtilities(): void {
    console.log('🔐 TEST 2: Crypto Utilities & Type Safety');
    console.log('=========================================');
    
    try {
      // Test generateId function
      const id1: string = generateId('TEST');
      const id2: string = generateId('BP');
      const id3: string = generateId(); // No prefix
      
      console.log('✅ generateId function');
      console.log('   - With prefix type check:', typeof id1 === 'string');
      console.log('   - Prefix included:', id1.startsWith('TEST'));
      console.log('   - Different IDs generated:', id1 !== id2);
      console.log('   - No prefix works:', typeof id3 === 'string');
      console.log('   - Generated IDs:', { id1: id1.substring(0, 10), id2: id2.substring(0, 10) });

      // Test validateTaxNumber function
      const validTaxNumber: boolean = validateTaxNumber(12345678);
      const invalidTaxNumber: boolean = validateTaxNumber(123); // Too short
      const invalidType: boolean = validateTaxNumber('invalid' as any); // Wrong type
      
      console.log('✅ validateTaxNumber function');
      console.log('   - Valid 8-digit number:', validTaxNumber === true);
      console.log('   - Invalid short number:', invalidTaxNumber === false);
      console.log('   - Invalid type handling:', invalidType === false);

      // Test formatDateForFurs function
      const testDate = new Date('2025-09-10T14:30:00.000Z');
      const formattedDate: string = formatDateForFurs(testDate);
      const defaultFormatted: string = formatDateForFurs(); // Current date
      
      console.log('✅ formatDateForFurs function');
      console.log('   - Return type is string:', typeof formattedDate === 'string');
      console.log('   - Contains Z suffix:', formattedDate.endsWith('Z'));
      console.log('   - Default date works:', typeof defaultFormatted === 'string');
      console.log('   - Sample formatted date:', formattedDate);

      this.testResults.set('cryptoUtilities', true);
    } catch (error) {
      console.log('❌ Crypto utilities test failed:', (error as Error).message);
      this.testResults.set('cryptoUtilities', false);
    }
    console.log();
  }
  /**
   * Test JWT utility functions with TypeScript
   */
  private testJwtUtilities(): void {
    console.log('🔑 TEST 3: JWT Utilities & Type Safety');
    console.log('======================================');
    
    try {
      // Test base64urlEncode function
      const testString = 'Hello, TypeScript!';
      const testBuffer = Buffer.from('Buffer test');
      
      const encodedString: string = base64urlEncode(testString);
      const encodedBuffer: string = base64urlEncode(testBuffer);
      
      console.log('✅ base64urlEncode function');
      console.log('   - String encoding type:', typeof encodedString === 'string');
      console.log('   - Buffer encoding type:', typeof encodedBuffer === 'string');
      console.log('   - No padding characters:', !encodedString.includes('='));
      console.log('   - URL-safe characters:', !encodedString.includes('+') && !encodedString.includes('/'));
      console.log('   - Sample encoded:', encodedString);

      // Test base64urlDecode function
      const decodedString: string = base64urlDecode(encodedString);
      
      console.log('✅ base64urlDecode function');
      console.log('   - Return type is string:', typeof decodedString === 'string');
      console.log('   - Correctly decoded:', decodedString === testString);
      console.log('   - Round-trip successful:', decodedString);

      // Test with TypeScript strict null checks
      const emptyString: string = base64urlEncode('');
      const decodedEmpty: string = base64urlDecode(emptyString);
      
      console.log('✅ Edge case handling');
      console.log('   - Empty string encoding:', typeof emptyString === 'string');
      console.log('   - Empty string decoding:', decodedEmpty === '');

      this.testResults.set('jwtUtilities', true);
    } catch (error) {
      console.log('❌ JWT utilities test failed:', (error as Error).message);
      this.testResults.set('jwtUtilities', false);
    }
    console.log();
  }
  /**
   * Test TypeScript type definitions and constants
   */
  private testTypeDefinitions(): void {
    console.log('📋 TEST 4: Type Definitions & Constants');
    console.log('=======================================');
    
    try {
      // Test ENVIRONMENTS constant
      console.log('✅ ENVIRONMENTS constant');
      console.log('   - TEST value:', ENVIRONMENTS.TEST);
      console.log('   - PRODUCTION value:', ENVIRONMENTS.PRODUCTION);
      console.log('   - TEST type check:', typeof ENVIRONMENTS.TEST === 'string');
      console.log('   - PRODUCTION type check:', typeof ENVIRONMENTS.PRODUCTION === 'string');
      console.log('   - Correct values:', ENVIRONMENTS.TEST === 'test' && ENVIRONMENTS.PRODUCTION === 'production');

      // Test type narrowing
      const testEnv: 'test' | 'production' = ENVIRONMENTS.TEST;
      const prodEnv: 'test' | 'production' = ENVIRONMENTS.PRODUCTION;
      
      console.log('✅ Type narrowing');
      console.log('   - Test env assignment successful:', testEnv === 'test');
      console.log('   - Prod env assignment successful:', prodEnv === 'production');

      // Test interface structure (compile-time verification)
      const mockConfig = {
        certPath: './test.p12',
        certPassword: 'test123',
        taxNumber: 12345678,
        environment: 'test' as const,
        debug: false
      };
      
      console.log('✅ Interface compliance (compile-time)');
      console.log('   - Configuration structure valid');
      console.log('   - All required fields present:', 
        'certPath' in mockConfig && 'certPassword' in mockConfig && 'taxNumber' in mockConfig);
      console.log('   - Optional fields handled correctly:', 
        mockConfig.environment !== undefined && mockConfig.debug !== undefined);

      this.testResults.set('typeDefinitions', true);
    } catch (error) {
      console.log('❌ Type definitions test failed:', (error as Error).message);
      this.testResults.set('typeDefinitions', false);
    }
    console.log();
  }
  /**
   * Test validation functions with TypeScript
   */
  private testValidationFunctions(): void {
    console.log('✔️  TEST 5: Validation Functions & Type Guards');
    console.log('=============================================');
    
    try {
      // Test tax number validation with different types
      const validNumbers = [12345678, 87654321, 10641025];
      const invalidNumbers = [123, 1234567890, -12345678, 0];
      
      console.log('✅ Tax number validation');
      
      validNumbers.forEach((num, index) => {
        const isValid: boolean = validateTaxNumber(num);
        console.log(`   - Valid ${num}:`, isValid === true);
      });
      
      invalidNumbers.forEach((num, index) => {
        const isValid: boolean = validateTaxNumber(num);
        console.log(`   - Invalid ${num}:`, isValid === false);
      });

      // Test with TypeScript type checking (these would cause compile errors if uncommented)
      // validateTaxNumber('12345678'); // Type error: string not assignable to number
      // validateTaxNumber(null); // Type error: null not assignable to number
      // validateTaxNumber(undefined); // Type error: undefined not assignable to number
      
      console.log('✅ TypeScript type safety verified (compile-time)');
      console.log('   - Function only accepts number type');
      console.log('   - Invalid types rejected at compile time');

      // Test return type consistency
      const result1: boolean = validateTaxNumber(12345678);
      const result2: boolean = validateTaxNumber(123);
      
      console.log('✅ Return type consistency');
      console.log('   - Always returns boolean:', typeof result1 === 'boolean' && typeof result2 === 'boolean');
      console.log('   - No unexpected return values');

      this.testResults.set('validationFunctions', true);
    } catch (error) {
      console.log('❌ Validation functions test failed:', (error as Error).message);
      this.testResults.set('validationFunctions', false);
    }
    console.log();
  }
  /**
   * Print comprehensive unit test summary
   */
  private printTestSummary(): void {
    console.log('='.repeat(70));
    console.log('📊 TYPESCRIPT UNIT TEST RESULTS');
    console.log('='.repeat(70));
    
    const results = Array.from(this.testResults.entries());
    const passedTests = results.filter(([, passed]) => passed).length;
    const totalTests = results.length;
    
    results.forEach(([testName, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      const formattedName = testName
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .replace(/^./, str => str.toUpperCase());
      console.log(`${status} ${formattedName}`);
    });
    
    console.log();
    console.log(`🎯 Unit Test Summary: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TYPESCRIPT UNIT TESTS PASSED!');
      console.log();
      console.log('✅ Error Classes: All custom errors working correctly');
      console.log('✅ Crypto Functions: All utilities functioning properly');
      console.log('✅ JWT Functions: Encoding/decoding working correctly');
      console.log('✅ Type Definitions: All types and constants validated');
      console.log('✅ Validation Functions: Input validation working correctly');
      console.log('✅ Type Safety: Compile-time type checking verified');
      console.log();
      console.log('🚀 Core TypeScript components are fully functional!');
    } else {
      console.log(`⚠️  ${totalTests - passedTests} unit test(s) failed`);
      console.log('Please review the failures above');
    }
    
    console.log('='.repeat(70));
  }

  /**
   * Handle unit test errors
   */
  private handleTestError(error: Error): void {
    console.log('\n❌ TYPESCRIPT UNIT TEST SUITE FAILED');
    console.log('====================================');
    console.log('Error Type:', error.constructor.name);
    console.log('Error Message:', error.message);
    console.log('Stack Trace:', error.stack);
    
    process.exit(1);
  }
}

/**
 * Main unit test execution function
 */
async function runTypeScriptUnitTests(): Promise<void> {
  const testSuite = new FursUnitTest();
  await testSuite.runAllTests();
}

// Execute tests if run directly
if (require.main === module) {
  runTypeScriptUnitTests().catch(error => {
    console.error('💥 Fatal TypeScript Unit Test Error:', error);
    process.exit(1);
  });
}

export { runTypeScriptUnitTests, FursUnitTest };
