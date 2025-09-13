/**
 * Code Generation Example
 * Demonstrates how to generate QR, PDF417, and Code128 codes for FURS invoices
 */

import { FursClient } from '../FursClient';
import { CodeFormat } from '../services/codeGenerator';
import * as path from 'path';
import * as fs from 'fs';

async function runCodeGenerationExample() {
  console.log('========================================');
  console.log('  FURS Code Generation Example');
  console.log('========================================\n');

  // Initialize FURS client
  const client = new FursClient({
    certPath: path.join(__dirname, '../../test-cert.p12'),
    certPassword: 'password',
    taxNumber: 12345678,
    environment: 'test',
  });

  // Example ZOI from a fiscalized invoice
  const exampleZOI = 'a7e5f55e1dbb48b799268e1a6d8618a3';
  const issueDateTime = new Date('2015-08-15T10:13:32');

  console.log('📋 Invoice Data:');
  console.log(`  ZOI: ${exampleZOI}`);
  console.log(`  Tax Number: 12345678`);
  console.log(`  Issue Date/Time: ${issueDateTime.toISOString()}\n`);

  try {
    // Generate QR Code
    console.log('1️⃣ Generating QR Code...');
    const qrCode = await client.generateQRCode(exampleZOI, issueDateTime, CodeFormat.DATA_URL);
    console.log('  ✅ QR Code generated');
    console.log(`  Format: ${qrCode.format}`);
    console.log(`  60-digit data: ${qrCode.formattedData}`);
    console.log(`  Data URL length: ${(qrCode.data as string).length} characters\n`);

    // Generate PDF417 Code
    console.log('2️⃣ Generating PDF417 Code...');
    const pdf417Code = await client.generatePDF417Code(exampleZOI, issueDateTime, CodeFormat.SVG);
    console.log('  ✅ PDF417 Code generated');
    console.log(`  Format: ${pdf417Code.format}`);
    console.log(`  SVG length: ${(pdf417Code.data as string).length} characters\n`);

    // Generate Code128 Barcodes
    console.log('3️⃣ Generating Code128 Barcodes...');
    const code128 = await client.generateCode128(
      exampleZOI,
      issueDateTime,
      CodeFormat.STRINGS,
      3 // Split into 3 parts
    );
    console.log('  ✅ Code128 Barcodes generated');
    console.log(`  Format: ${code128.format}`);
    const strings = code128.data as string[];
    strings.forEach((str, i) => {
      console.log(`  Part ${i + 1}: ${str}`);
    });

    // Generate all codes at once
    console.log('\n4️⃣ Generating All Codes at Once...');
    const allCodes = await client.generateAllCodes(exampleZOI, issueDateTime, CodeFormat.DATA_URL);
    console.log('  ✅ All codes generated');
    console.log(`  QR Code: ${allCodes.qr.type} - ${allCodes.qr.format}`);
    console.log(`  PDF417: ${allCodes.pdf417.type} - ${allCodes.pdf417.format}`);
    console.log(`  Code128: ${allCodes.code128.type} - ${allCodes.code128.format}`);

    // Display terminal QR code
    console.log('\n5️⃣ Terminal QR Code:');
    const terminalQR = await client.generateQRCode(exampleZOI, issueDateTime, CodeFormat.TERMINAL);
    console.log(terminalQR.data);

    // Save codes to files (optional)
    const outputDir = path.join(__dirname, '../../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('\n6️⃣ Saving Codes to Files...');

    // Save QR code
    const qrFilePath = path.join(outputDir, 'invoice-qr.png');
    await client.generateQRCode(exampleZOI, issueDateTime, CodeFormat.FILE, qrFilePath);
    console.log(`  ✅ QR Code saved to: ${qrFilePath}`);

    // Save PDF417 code
    const pdf417FilePath = path.join(outputDir, 'invoice-pdf417.png');
    await client.generatePDF417Code(exampleZOI, issueDateTime, CodeFormat.FILE, pdf417FilePath);
    console.log(`  ✅ PDF417 saved to: ${pdf417FilePath}`);

    // Save Code128 barcodes
    const code128FilePath = path.join(outputDir, 'invoice-code128.png');
    await client.generateCode128(exampleZOI, issueDateTime, CodeFormat.FILE, 3, code128FilePath);
    console.log(`  ✅ Code128 saved to: ${code128FilePath}`);

    console.log('\n========================================');
    console.log('  Code Generation Complete!');
    console.log('========================================\n');

    // Display data breakdown
    console.log('📊 Data Breakdown:');
    console.log(`  ZOI (hex): ${exampleZOI}`);
    console.log(`  ZOI (decimal): ${qrCode.components.zoiDecimal}`);
    console.log(`  Tax Number: ${qrCode.components.taxNumber}`);
    console.log(`  Date/Time: ${qrCode.components.dateTime}`);
    console.log(`  Control Character: ${qrCode.components.controlCharacter}`);
    console.log(`  Full 60-digit code: ${qrCode.formattedData}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  runCodeGenerationExample().catch(console.error);
}
