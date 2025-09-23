#!/usr/bin/env node

/**
 * FURS Client - Basic Usage Example (TypeScript)
 * This example demonstrates how to use the FURS client package
 */

import { FursClient, FursValidationError, FursAuthenticationError, FursError } from '../index';
import { BusinessPremiseRequest, InvoiceRequest } from '../types';

async function main(): Promise<void> {
  console.log('🚀 FURS Client - TypeScript Usage Example');
  console.log('=========================================\n');

  try {
    // Initialize the client
    const client = new FursClient({
      certPath: './test-certificate.p12',
      certPassword: 'X5T7FCINH1AE',
      taxNumber: 10641025,
      environment: 'test', // or 'production'
      debug: true,
    });

    console.log('✅ Client initialized successfully\n');

    // Example 1: Register Business Premise
    console.log('📍 REGISTERING BUSINESS PREMISE');
    console.log('================================');

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
      specialNotes: 'Test business premise from TypeScript package',
    };

    const businessPremiseResult = await client.registerBusinessPremise(businessPremiseData);

    if (businessPremiseResult.success) {
      console.log('✅ Business premise registered!');
      console.log('   ID:', businessPremiseResult.businessPremiseId);
    }

    // Wait between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Example 2: Fiscalize Invoice
    console.log('\n💳 FISCALIZING INVOICE');
    console.log('======================');

    const invoiceData: InvoiceRequest = {
      businessPremiseId: businessPremiseResult.businessPremiseId,
      electronicDeviceId: 'ED001',
      invoiceAmount: 100.0,
      paymentAmount: 100.0,
      taxesPerSeller: [
        {
          VAT: [
            {
              TaxRate: 22.0,
              TaxableAmount: 81.97,
              TaxAmount: 18.03,
            },
          ],
        },
      ],
    };

    const invoiceResult = await client.fiscalizeInvoice(invoiceData);

    if (invoiceResult.success) {
      console.log('✅ Invoice fiscalized!');
      console.log('   Invoice Number:', invoiceResult.invoiceNumber);
      console.log('   EOR (Unique ID):', invoiceResult.uniqueInvoiceId);
      console.log('   ZOI:', invoiceResult.zoi);
    }
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);

    if (error instanceof FursValidationError) {
      console.error('   Type: Validation Error');
    } else if (error instanceof FursAuthenticationError) {
      console.error('   Type: Authentication Error');
    } else if (error instanceof FursError) {
      console.error('   Type: FURS Error');
      console.error('   Code:', error.code);
    }

    if ((error as FursError).details) {
      console.error('   Details:', (error as FursError).details);
    }

    process.exit(1);
  }
  console.log('\n' + '='.repeat(60));
  console.log('✅ TypeScript example completed successfully!');
  console.log('='.repeat(60));
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };
