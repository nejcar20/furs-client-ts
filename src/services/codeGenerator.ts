/**
 * FURS Code Generator
 * Main facade for generating QR, PDF417, and Code128 codes
 */

import {
  generateQRCodeBuffer,
  generateQRCodeDataURL,
  generateQRCodeSVG,
  generateQRCodeToFile,
  generateQRCodeTerminal,
  FursQRCodeOptions
} from './qrCodeService';

import {
  generatePDF417Buffer,
  generatePDF417DataURL,
  generatePDF417SVG,
  generatePDF417ToFile,
  FursPDF417Options
} from './pdf417Service';

import {
  generateCode128Buffer,
  generateCode128DataURL,
  generateCode128SVG,
  generateCode128ToFile,
  getCode128Strings,
  FursCode128Options
} from './code128Service';

import {
  formatCodeData,
  hexToDecimalPadded,
  formatDateForCode,
  calculateControlCharacter,
  validateZOI,
  validateTaxNumber
} from '../utils/codeFormatter';

/**
 * Code type enumeration
 */
export enum CodeType {
  QR = 'QR',
  PDF417 = 'PDF417',
  CODE128 = 'CODE128'
}

/**
 * Code format enumeration
 */
export enum CodeFormat {
  BUFFER = 'buffer',
  DATA_URL = 'dataUrl',
  SVG = 'svg',
  FILE = 'file',
  TERMINAL = 'terminal',
  STRINGS = 'strings'
}

/**
 * Combined code generation options
 */
export interface CodeGenerationOptions {
  /** Code type to generate */
  type: CodeType;
  /** Output format */
  format: CodeFormat;
  /** File path (required for FILE format) */
  filePath?: string;
  /** QR code specific options */
  qrOptions?: FursQRCodeOptions;
  /** PDF417 specific options */
  pdf417Options?: FursPDF417Options;
  /** Code128 specific options */
  code128Options?: FursCode128Options;
}

/**
 * Invoice data for code generation
 */
export interface InvoiceCodeData {
  /** ZOI in hexadecimal format (32 characters) */
  zoi: string;
  /** Tax number (8 digits) */
  taxNumber: number;
  /** Invoice issue date and time */
  issueDateTime: Date | string;
}

/**
 * Code generation result
 */
export interface CodeGenerationResult {
  /** Generated code type */
  type: CodeType;
  /** Output format */
  format: CodeFormat;
  /** The generated code data */
  data: Buffer | string | string[];
  /** The 60-digit formatted data used */
  formattedData: string;
  /** Individual components */
  components: {
    zoiDecimal: string;
    taxNumber: string;
    dateTime: string;
    controlCharacter: string;
  };
}

/**
 * Main class for FURS code generation
 */
export class FursCodeGenerator {
  /**
   * Generate code for FURS invoice
   * @param invoiceData - Invoice data containing ZOI, tax number, and issue date
   * @param options - Code generation options
   * @returns Code generation result
   */
  async generateCode(
    invoiceData: InvoiceCodeData,
    options: CodeGenerationOptions
  ): Promise<CodeGenerationResult> {
    // Validate input
    if (!validateZOI(invoiceData.zoi)) {
      throw new Error('Invalid ZOI format. Must be 32 hexadecimal characters.');
    }

    if (!validateTaxNumber(invoiceData.taxNumber)) {
      throw new Error('Invalid tax number. Must be 8 digits.');
    }

    // Format the data
    const formattedData = formatCodeData(
      invoiceData.zoi,
      invoiceData.taxNumber,
      invoiceData.issueDateTime
    );

    // Extract components for result
    const zoiDecimal = hexToDecimalPadded(invoiceData.zoi);
    const taxNumberStr = invoiceData.taxNumber.toString().padStart(8, '0');
    const dateTimeStr = formatDateForCode(invoiceData.issueDateTime);
    const controlChar = calculateControlCharacter(
      zoiDecimal + taxNumberStr + dateTimeStr
    );

    // Generate the code based on type and format
    let data: Buffer | string | string[];

    switch (options.type) {
      case CodeType.QR:
        data = await this.generateQRCode(invoiceData, options);
        break;
      case CodeType.PDF417:
        data = await this.generatePDF417Code(invoiceData, options);
        break;
      case CodeType.CODE128:
        data = await this.generateCode128Code(invoiceData, options);
        break;
      default:
        throw new Error(`Unsupported code type: ${options.type}`);
    }

    return {
      type: options.type,
      format: options.format,
      data,
      formattedData,
      components: {
        zoiDecimal,
        taxNumber: taxNumberStr,
        dateTime: dateTimeStr,
        controlCharacter: controlChar
      }
    };
  }

  /**
   * Generate QR code
   */
  private async generateQRCode(
    invoiceData: InvoiceCodeData,
    options: CodeGenerationOptions
  ): Promise<Buffer | string> {
    const { zoi, taxNumber, issueDateTime } = invoiceData;
    const qrOptions = options.qrOptions || {};

    switch (options.format) {
      case CodeFormat.BUFFER:
        return await generateQRCodeBuffer(zoi, taxNumber, issueDateTime, qrOptions);
      case CodeFormat.DATA_URL:
        return await generateQRCodeDataURL(zoi, taxNumber, issueDateTime, qrOptions);
      case CodeFormat.SVG:
        return await generateQRCodeSVG(zoi, taxNumber, issueDateTime, qrOptions);
      case CodeFormat.FILE:
        if (!options.filePath) {
          throw new Error('File path is required for FILE format');
        }
        await generateQRCodeToFile(options.filePath, zoi, taxNumber, issueDateTime, qrOptions);
        return `File saved to: ${options.filePath}`;
      case CodeFormat.TERMINAL:
        return await generateQRCodeTerminal(zoi, taxNumber, issueDateTime);
      default:
        throw new Error(`Unsupported format for QR code: ${options.format}`);
    }
  }

  /**
   * Generate PDF417 code
   */
  private async generatePDF417Code(
    invoiceData: InvoiceCodeData,
    options: CodeGenerationOptions
  ): Promise<Buffer | string> {
    const { zoi, taxNumber, issueDateTime } = invoiceData;
    const pdf417Options = options.pdf417Options || {};

    switch (options.format) {
      case CodeFormat.BUFFER:
        return await generatePDF417Buffer(zoi, taxNumber, issueDateTime, pdf417Options);
      case CodeFormat.DATA_URL:
        return await generatePDF417DataURL(zoi, taxNumber, issueDateTime, pdf417Options);
      case CodeFormat.SVG:
        return await generatePDF417SVG(zoi, taxNumber, issueDateTime, pdf417Options);
      case CodeFormat.FILE:
        if (!options.filePath) {
          throw new Error('File path is required for FILE format');
        }
        await generatePDF417ToFile(options.filePath, zoi, taxNumber, issueDateTime, pdf417Options);
        return `File saved to: ${options.filePath}`;
      default:
        throw new Error(`Unsupported format for PDF417 code: ${options.format}`);
    }
  }

  /**
   * Generate Code128 code
   */
  private async generateCode128Code(
    invoiceData: InvoiceCodeData,
    options: CodeGenerationOptions
  ): Promise<Buffer | string | string[]> {
    const { zoi, taxNumber, issueDateTime } = invoiceData;
    const code128Options = options.code128Options || {};

    switch (options.format) {
      case CodeFormat.BUFFER:
        return await generateCode128Buffer(zoi, taxNumber, issueDateTime, code128Options);
      case CodeFormat.DATA_URL:
        return await generateCode128DataURL(zoi, taxNumber, issueDateTime, code128Options);
      case CodeFormat.SVG:
        return generateCode128SVG(zoi, taxNumber, issueDateTime, code128Options);
      case CodeFormat.FILE:
        if (!options.filePath) {
          throw new Error('File path is required for FILE format');
        }
        await generateCode128ToFile(options.filePath, zoi, taxNumber, issueDateTime, code128Options);
        return `File saved to: ${options.filePath}`;
      case CodeFormat.STRINGS:
        return getCode128Strings(zoi, taxNumber, issueDateTime, code128Options.parts || 3);
      default:
        throw new Error(`Unsupported format for Code128: ${options.format}`);
    }
  }

  /**
   * Generate all code types for an invoice
   * @param invoiceData - Invoice data
   * @param format - Output format (buffer, dataUrl, or svg)
   * @returns Object with all three code types
   */
  async generateAllCodes(
    invoiceData: InvoiceCodeData,
    format: CodeFormat = CodeFormat.BUFFER
  ): Promise<{
    qr: CodeGenerationResult;
    pdf417: CodeGenerationResult;
    code128: CodeGenerationResult;
  }> {
    const [qr, pdf417, code128] = await Promise.all([
      this.generateCode(invoiceData, { type: CodeType.QR, format }),
      this.generateCode(invoiceData, { type: CodeType.PDF417, format }),
      this.generateCode(invoiceData, { type: CodeType.CODE128, format })
    ]);

    return { qr, pdf417, code128 };
  }

  /**
   * Validate invoice data for code generation
   * @param invoiceData - Invoice data to validate
   * @returns True if valid, throws error otherwise
   */
  validateInvoiceData(invoiceData: InvoiceCodeData): boolean {
    if (!validateZOI(invoiceData.zoi)) {
      throw new Error('Invalid ZOI format. Must be 32 hexadecimal characters.');
    }

    if (!validateTaxNumber(invoiceData.taxNumber)) {
      throw new Error('Invalid tax number. Must be 8 digits.');
    }

    try {
      // Validate date
      const date = typeof invoiceData.issueDateTime === 'string'
        ? new Date(invoiceData.issueDateTime)
        : invoiceData.issueDateTime;

      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      throw new Error('Invalid issue date/time format');
    }

    return true;
  }
}

// Export singleton instance
export const codeGenerator = new FursCodeGenerator();

// Re-export utility functions
export {
  formatCodeData,
  hexToDecimalPadded,
  formatDateForCode,
  calculateControlCharacter,
  splitForCode128,
  validateZOI,
  validateTaxNumber
} from '../utils/codeFormatter';