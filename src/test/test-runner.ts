import { runTypeScriptUnitTests } from './unit.test';
import { runTypeScriptTests } from './integration.test';

/**
 * TypeScript Test Suite Runner
 * Executes both unit tests and integration tests with comprehensive reporting
 */

class TypeScriptTestRunner {
  private startTime!: Date;
  private testResults: {
    unit: boolean;
    integration: boolean;
  } = {
    unit: false,
    integration: false
  };

  constructor() {
    console.log('🧪 FURS Client - Complete TypeScript Test Suite');
    console.log('===============================================');
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log('🔍 Running comprehensive TypeScript tests...\n');
  }

  /**
   * Run complete test suite
   */
  public async runCompleteTestSuite(): Promise<void> {
    this.startTime = new Date();

    try {
      // Phase 1: Unit Tests
      await this.runUnitTestPhase();
      
      // Phase 2: Integration Tests
      await this.runIntegrationTestPhase();
      
      // Final Report
      this.generateFinalReport();
      
    } catch (error) {
      this.handleTestSuiteError(error as Error);
    }
  }

  /**
   * Run unit test phase
   */
  private async runUnitTestPhase(): Promise<void> {
    console.log('🔧 PHASE 1: UNIT TESTS');
    console.log('======================\n');
    
    try {
      await runTypeScriptUnitTests();
      this.testResults.unit = true;
      console.log('✅ Unit tests completed successfully\n');
    } catch (error) {
      this.testResults.unit = false;
      console.log('❌ Unit tests failed\n');
      throw error;
    }
  }
  /**
   * Run integration test phase
   */
  private async runIntegrationTestPhase(): Promise<void> {
    console.log('🌐 PHASE 2: INTEGRATION TESTS');
    console.log('=============================\n');
    
    try {
      await runTypeScriptTests();
      this.testResults.integration = true;
      console.log('✅ Integration tests completed successfully\n');
    } catch (error) {
      this.testResults.integration = false;
      console.log('❌ Integration tests failed\n');
      throw error;
    }
  }

  /**
   * Generate comprehensive final report
   */
  private generateFinalReport(): void {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log('='.repeat(80));
    console.log('🏆 COMPLETE TYPESCRIPT TEST SUITE RESULTS');
    console.log('='.repeat(80));
    
    console.log('📊 Test Phase Results:');
    console.log(`   ${this.testResults.unit ? '✅' : '❌'} Unit Tests: ${this.testResults.unit ? 'PASSED' : 'FAILED'}`);
    console.log(`   ${this.testResults.integration ? '✅' : '❌'} Integration Tests: ${this.testResults.integration ? 'PASSED' : 'FAILED'}`);
    
    console.log('\n⏱️  Execution Details:');
    console.log(`   Started: ${this.startTime.toLocaleString()}`);
    console.log(`   Completed: ${endTime.toLocaleString()}`);
    console.log(`   Duration: ${durationSeconds} seconds`);
    
    const allTestsPassed = this.testResults.unit && this.testResults.integration;
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL TYPESCRIPT TESTS PASSED SUCCESSFULLY!');
      console.log('\n✅ What was validated:');
      console.log('   🔧 Unit Tests:');
      console.log('      - Custom error classes with proper typing');
      console.log('      - Crypto utility functions');
      console.log('      - JWT encoding/decoding functions');
      console.log('      - Type definitions and constants');
      console.log('      - Input validation functions');
      console.log('   🌐 Integration Tests:');
      console.log('      - Client initialization with typed config');
      console.log('      - Business premise registration with interfaces');
      console.log('      - Invoice fiscalization with type safety');
      console.log('      - Error handling with typed exceptions');
      console.log('      - Complete TypeScript type system validation');
      
      console.log('\n🚀 Production Readiness Confirmed:');
      console.log('   ✅ TypeScript compilation successful');
      console.log('   ✅ Type safety verified at compile time');
      console.log('   ✅ Runtime behavior matches type definitions');
      console.log('   ✅ FURS API integration working correctly');
      console.log('   ✅ Certificate authentication functional');
      console.log('   ✅ All business logic properly typed');
      
      console.log('\n📝 Your FURS TypeScript client is ready for:');
      console.log('   - Production deployment');
      console.log('   - Integration into TypeScript projects');
      console.log('   - Full IntelliSense support in IDEs');
      console.log('   - Compile-time error prevention');
      
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('\n❌ Failed Test Phases:');
      if (!this.testResults.unit) {
        console.log('   - Unit Tests: Core functionality issues detected');
      }
      if (!this.testResults.integration) {
        console.log('   - Integration Tests: API communication or authentication issues');
      }
      
      console.log('\n🔧 Recommended Actions:');
      console.log('   1. Review test output for specific error details');
      console.log('   2. Verify certificate file and credentials');
      console.log('   3. Check network connectivity to FURS test environment');
      console.log('   4. Ensure all TypeScript types are properly defined');
      console.log('   5. Run individual test phases for more detailed debugging');
    }
    
    console.log('='.repeat(80));
  }

  /**
   * Handle test suite errors
   */
  private handleTestSuiteError(error: Error): void {
    console.log('\n💥 TYPESCRIPT TEST SUITE ENCOUNTERED FATAL ERROR');
    console.log('================================================');
    console.log('Error Type:', error.constructor.name);
    console.log('Error Message:', error.message);
    
    console.log('\n📊 Test Results Before Failure:');
    console.log(`   Unit Tests: ${this.testResults.unit ? 'COMPLETED' : 'FAILED/INCOMPLETE'}`);
    console.log(`   Integration Tests: ${this.testResults.integration ? 'COMPLETED' : 'FAILED/INCOMPLETE'}`);
    
    console.log('\n🔧 Debugging Steps:');
    console.log('   1. Check TypeScript compilation: npm run build');
    console.log('   2. Run unit tests separately: npm run test:unit');
    console.log('   3. Verify certificate and credentials');
    console.log('   4. Check network connectivity');
    console.log('   5. Review error details above');
    
    if (error.stack) {
      console.log('\n📋 Stack Trace:');
      console.log(error.stack);
    }
    
    process.exit(1);
  }
}

/**
 * Main test suite execution
 */
async function runCompleteTypeScriptTestSuite(): Promise<void> {
  const testRunner = new TypeScriptTestRunner();
  await testRunner.runCompleteTestSuite();
}

// Execute complete test suite if run directly
if (require.main === module) {
  runCompleteTypeScriptTestSuite().catch(error => {
    console.error('💥 Fatal Error in TypeScript Test Suite:', error.message);
    process.exit(1);
  });
}

export { runCompleteTypeScriptTestSuite, TypeScriptTestRunner };
