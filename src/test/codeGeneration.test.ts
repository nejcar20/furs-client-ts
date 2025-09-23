/**
 * Code Generation Tests
 * Tests for QR, PDF417, and Code128 generation according to FURS specifications
 */

import {
  formatCodeData,
  hexToDecimalPadded,
  formatDateForCode,
  calculateControlCharacter,
  splitForCode128,
  validateZOI,
  validateTaxNumber,
} from '../utils/codeFormatter';

import {
  FursCodeGenerator,
  CodeType,
  CodeFormat,
  InvoiceCodeData,
} from '../services/codeGenerator';

// Test data from FURS specification
const TEST_DATA_1 = {
  zoi: 'a7e5f55e1dbb48b799268e1a6d8618a3',
  taxNumber: 12345678,
  issueDateTime: new Date('2015-08-15T10:13:32'),
  expectedDecimal: '223175087923687075112234402528973166755',
  expectedFormatted: '223175087923687075112234402528973166755123456781508151013321',
  expectedControl: '1',
};

const TEST_DATA_2 = {
  zoi: '3024e56bf1ddd2e7eeb5715c6859a913',
  taxNumber: 12345678,
  issueDateTime: new Date('2015-08-15T10:13:32'),
  expectedDecimal: '063994519708649896901260100447252359443',
  expectedFormatted: '063994519708649896901260100447252359443123456781508151013320',
  expectedControl: '0',
};

/**
 * Test hex to decimal conversion with padding
 */
function testHexToDecimal(): void {
  console.log('\n📊 Testing Hex to Decimal Conversion:');

  // Test case 1
  const decimal1 = hexToDecimalPadded(TEST_DATA_1.zoi);
  console.log(`  ZOI: ${TEST_DATA_1.zoi}`);
  console.log(`  Expected: ${TEST_DATA_1.expectedDecimal}`);
  console.log(`  Result:   ${decimal1}`);
  console.log(`  ✅ Test 1: ${decimal1 === TEST_DATA_1.expectedDecimal ? 'PASSED' : 'FAILED'}`);

  // Test case 2 (with leading zero)
  const decimal2 = hexToDecimalPadded(TEST_DATA_2.zoi);
  console.log(`\n  ZOI: ${TEST_DATA_2.zoi}`);
  console.log(`  Expected: ${TEST_DATA_2.expectedDecimal}`);
  console.log(`  Result:   ${decimal2}`);
  console.log(`  ✅ Test 2: ${decimal2 === TEST_DATA_2.expectedDecimal ? 'PASSED' : 'FAILED'}`);
}

/**
 * Test date formatting for codes
 */
function testDateFormatting(): void {
  console.log('\n📅 Testing Date Formatting:');

  const date = new Date('2015-08-15T10:13:32');
  const formatted = formatDateForCode(date);
  const expected = '150815101332';

  console.log(`  Date: ${date.toISOString()}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Result:   ${formatted}`);
  console.log(`  ✅ Test: ${formatted === expected ? 'PASSED' : 'FAILED'}`);
}

/**
 * Test control character calculation
 */
function testControlCharacter(): void {
  console.log('\n🔢 Testing Control Character Calculation:');

  // Test case 1
  const data1 = TEST_DATA_1.expectedDecimal + TEST_DATA_1.taxNumber.toString() + '150815101332';
  const control1 = calculateControlCharacter(data1);
  console.log(`  Data length: ${data1.length}`);
  console.log(`  Expected control: ${TEST_DATA_1.expectedControl}`);
  console.log(`  Result:           ${control1}`);
  console.log(`  ✅ Test 1: ${control1 === TEST_DATA_1.expectedControl ? 'PASSED' : 'FAILED'}`);

  // Test case 2
  const data2 = TEST_DATA_2.expectedDecimal + TEST_DATA_2.taxNumber.toString() + '150815101332';
  const control2 = calculateControlCharacter(data2);
  console.log(`\n  Data length: ${data2.length}`);
  console.log(`  Expected control: ${TEST_DATA_2.expectedControl}`);
  console.log(`  Result:           ${control2}`);
  console.log(`  ✅ Test 2: ${control2 === TEST_DATA_2.expectedControl ? 'PASSED' : 'FAILED'}`);
}

/**
 * Test complete code data formatting
 */
function testCodeDataFormatting(): void {
  console.log('\n📦 Testing Complete Code Data Formatting:');

  // Test case 1
  const formatted1 = formatCodeData(
    TEST_DATA_1.zoi,
    TEST_DATA_1.taxNumber,
    TEST_DATA_1.issueDateTime
  );
  console.log(`  Expected: ${TEST_DATA_1.expectedFormatted}`);
  console.log(`  Result:   ${formatted1}`);
  console.log(`  Length:   ${formatted1.length} (should be 60)`);
  console.log(`  ✅ Test 1: ${formatted1 === TEST_DATA_1.expectedFormatted ? 'PASSED' : 'FAILED'}`);

  // Test case 2
  const formatted2 = formatCodeData(
    TEST_DATA_2.zoi,
    TEST_DATA_2.taxNumber,
    TEST_DATA_2.issueDateTime
  );
  console.log(`\n  Expected: ${TEST_DATA_2.expectedFormatted}`);
  console.log(`  Result:   ${formatted2}`);
  console.log(`  Length:   ${formatted2.length} (should be 60)`);
  console.log(`  ✅ Test 2: ${formatted2 === TEST_DATA_2.expectedFormatted ? 'PASSED' : 'FAILED'}`);
}

/**
 * Test Code128 data splitting
 */
function testCode128Splitting(): void {
  console.log('\n🔀 Testing Code128 Data Splitting:');

  const codeData = TEST_DATA_1.expectedFormatted;

  // Test 2 parts
  const parts2 = splitForCode128(codeData, 2);
  console.log(`  2 parts (2x30):`);
  parts2.forEach((part, i) => {
    console.log(`    Part ${i + 1}: ${part} (length: ${part.length})`);
  });

  // Test 3 parts
  const parts3 = splitForCode128(codeData, 3);
  console.log(`\n  3 parts (3x20):`);
  parts3.forEach((part, i) => {
    console.log(`    Part ${i + 1}: ${part} (length: ${part.length})`);
  });

  // Test 4 parts
  const parts4 = splitForCode128(codeData, 4);
  console.log(`\n  4 parts (4x15):`);
  parts4.forEach((part, i) => {
    console.log(`    Part ${i + 1}: ${part} (length: ${part.length})`);
  });

  // Verify prefixes
  console.log('\n  Prefix validation:');
  console.log(`    2 parts: ${parts2[0].startsWith('41') ? '✅' : '❌'} prefix '41'`);
  console.log(`    3 parts: ${parts3[0].startsWith('41') ? '✅' : '❌'} prefix '41'`);
  console.log(`    4 parts: ${parts4[0].startsWith('441') ? '✅' : '❌'} prefix '441'`);
}

/**
 * Test validation functions
 */
function testValidation(): void {
  console.log('\n✅ Testing Validation Functions:');

  // Test ZOI validation
  console.log('  ZOI Validation:');
  console.log(`    Valid ZOI:   ${validateZOI(TEST_DATA_1.zoi) ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`    Invalid ZOI: ${!validateZOI('invalid') ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`    Too short:   ${!validateZOI('a7e5f55e') ? '✅ PASSED' : '❌ FAILED'}`);

  // Test tax number validation
  console.log('\n  Tax Number Validation:');
  console.log(`    Valid (12345678): ${validateTaxNumber(12345678) ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`    Invalid (123):    ${!validateTaxNumber(123) ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(
    `    Invalid (123456789): ${!validateTaxNumber(123456789) ? '✅ PASSED' : '❌ FAILED'}`
  );
}

/**
 * Test code generation (basic functionality check)
 */
async function testCodeGeneration(): Promise<void> {
  console.log('\n🎯 Testing Code Generation:');

  const generator = new FursCodeGenerator();
  const invoiceData: InvoiceCodeData = {
    zoi: TEST_DATA_1.zoi,
    taxNumber: TEST_DATA_1.taxNumber,
    issueDateTime: TEST_DATA_1.issueDateTime,
  };

  try {
    // Test QR code generation
    const qrResult = await generator.generateCode(invoiceData, {
      type: CodeType.QR,
      format: CodeFormat.TERMINAL,
    });
    console.log('\n  QR Code Generation:');
    console.log(`    Type: ${qrResult.type}`);
    console.log(`    Format: ${qrResult.format}`);
    console.log(`    Data length: ${(qrResult.data as string).length}`);
    console.log(`    ✅ QR Code generated successfully`);

    // Test PDF417 generation
    const pdf417Result = await generator.generateCode(invoiceData, {
      type: CodeType.PDF417,
      format: CodeFormat.SVG,
    });
    console.log('\n  PDF417 Generation:');
    console.log(`    Type: ${pdf417Result.type}`);
    console.log(`    Format: ${pdf417Result.format}`);
    console.log(`    Data type: ${typeof pdf417Result.data}`);
    console.log(`    ✅ PDF417 generated successfully`);

    // Test Code128 generation
    const code128Result = await generator.generateCode(invoiceData, {
      type: CodeType.CODE128,
      format: CodeFormat.STRINGS,
    });
    console.log('\n  Code128 Generation:');
    console.log(`    Type: ${code128Result.type}`);
    console.log(`    Format: ${code128Result.format}`);
    console.log(`    Parts: ${(code128Result.data as string[]).length}`);
    console.log(`    ✅ Code128 generated successfully`);

    // Display the terminal QR code
    console.log('\n  Generated QR Code (Terminal):');
    console.log(qrResult.data);
  } catch (error: any) {
    console.error(`  ❌ Code generation failed: ${error.message}`);
  }
}

/**
 * Run all tests
 */
export async function runCodeGenerationTests(): Promise<void> {
  console.log('========================================');
  console.log('     FURS Code Generation Tests');
  console.log('========================================');

  testHexToDecimal();
  testDateFormatting();
  testControlCharacter();
  testCodeDataFormatting();
  testCode128Splitting();
  testValidation();
  await testCodeGeneration();

  console.log('\n========================================');
  console.log('        All Tests Completed');
  console.log('========================================\n');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCodeGenerationTests().catch(console.error);
}
