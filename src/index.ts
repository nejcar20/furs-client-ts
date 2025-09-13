/**
 * FURS Client - Main Entry Point
 * A TypeScript client for FURS (Slovenian tax authority) integration
 */

export { FursClient } from './FursClient';
export {
  FursError,
  FursValidationError,
  FursAuthenticationError,
  FursNetworkError,
  FursServerError
} from './errors';

export {
  FursClientConfig,
  BusinessPremiseRequest,
  BusinessPremiseResult,
  InvoiceRequest,
  InvoiceResult,
  CertificateInfo,
  FursResponse,
  Environment,
  ENVIRONMENTS
} from './types';

// Code generation exports
export {
  CodeType,
  CodeFormat,
  CodeGenerationOptions,
  CodeGenerationResult,
  InvoiceCodeData,
  FursCodeGenerator,
  codeGenerator
} from './services/codeGenerator';

export {
  FursQRCodeOptions,
  generateQRCodeBuffer,
  generateQRCodeDataURL,
  generateQRCodeSVG,
  generateQRCodeToFile,
  generateQRCodeTerminal
} from './services/qrCodeService';

export {
  FursPDF417Options,
  generatePDF417Buffer,
  generatePDF417DataURL,
  generatePDF417SVG,
  generatePDF417ToFile
} from './services/pdf417Service';

export {
  FursCode128Options,
  generateCode128Buffer,
  generateCode128DataURL,
  generateCode128SVG,
  generateCode128ToFile,
  getCode128Strings
} from './services/code128Service';

export {
  formatCodeData,
  hexToDecimalPadded,
  formatDateForCode,
  calculateControlCharacter,
  splitForCode128,
  validateZOI,
  validateTaxNumber as validateTaxNumberFormat
} from './utils/codeFormatter';

// Default export for CommonJS compatibility
import { FursClient } from './FursClient';
export default FursClient;
