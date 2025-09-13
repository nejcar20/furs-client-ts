/**
 * QR Code Generation Service
 * Generates QR codes according to FURS specifications
 */

import * as QRCode from 'qrcode';
import { formatCodeData } from '../utils/codeFormatter';

/**
 * QR Code options according to FURS specifications
 */
export interface FursQRCodeOptions {
  /** Error correction level (FURS requires 'M') */
  errorCorrectionLevel?: 'M';
  /** Module size in pixels (minimum 4x4) */
  moduleSize?: number;
  /** Margin size in modules (minimum 4) */
  margin?: number;
  /** Total size in mm (minimum 12x12) */
  size?: number;
}

/**
 * Default QR code options per FURS specification
 */
const DEFAULT_QR_OPTIONS: FursQRCodeOptions = {
  errorCorrectionLevel: 'M',
  moduleSize: 4,
  margin: 4,
  size: 12,
};

/**
 * Generate QR code data URL for FURS invoice
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - QR code generation options
 * @returns Data URL of the QR code image
 */
export async function generateQRCodeDataURL(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursQRCodeOptions = {}
): Promise<string> {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const qrOptions = { ...DEFAULT_QR_OPTIONS, ...options };

  const qrCodeOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: qrOptions.errorCorrectionLevel || 'M',
    margin: qrOptions.margin,
    width: 25 * (qrOptions.moduleSize || 4), // 25x25 modules
    type: 'image/png',
  };

  return await QRCode.toDataURL(codeData, qrCodeOptions);
}

/**
 * Generate QR code buffer for FURS invoice
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - QR code generation options
 * @returns Buffer containing the QR code image
 */
export async function generateQRCodeBuffer(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursQRCodeOptions = {}
): Promise<Buffer> {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const qrOptions = { ...DEFAULT_QR_OPTIONS, ...options };

  const qrCodeOptions: QRCode.QRCodeToBufferOptions = {
    errorCorrectionLevel: qrOptions.errorCorrectionLevel || 'M',
    margin: qrOptions.margin,
    width: 25 * (qrOptions.moduleSize || 4), // 25x25 modules
    type: 'png',
  };

  return await QRCode.toBuffer(codeData, qrCodeOptions);
}

/**
 * Generate QR code SVG string for FURS invoice
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - QR code generation options
 * @returns SVG string of the QR code
 */
export async function generateQRCodeSVG(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursQRCodeOptions = {}
): Promise<string> {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const qrOptions = { ...DEFAULT_QR_OPTIONS, ...options };

  const qrCodeOptions: QRCode.QRCodeToStringOptions = {
    errorCorrectionLevel: qrOptions.errorCorrectionLevel || 'M',
    margin: qrOptions.margin,
    width: 25 * (qrOptions.moduleSize || 4), // 25x25 modules
    type: 'svg',
  };

  return await QRCode.toString(codeData, qrCodeOptions);
}

/**
 * Generate QR code to file for FURS invoice
 * @param filePath - Path where to save the QR code image
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - QR code generation options
 */
export async function generateQRCodeToFile(
  filePath: string,
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursQRCodeOptions = {}
): Promise<void> {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const qrOptions = { ...DEFAULT_QR_OPTIONS, ...options };

  const qrCodeOptions: QRCode.QRCodeToFileOptions = {
    errorCorrectionLevel: qrOptions.errorCorrectionLevel || 'M',
    margin: qrOptions.margin,
    width: 25 * (qrOptions.moduleSize || 4), // 25x25 modules
    type: 'png',
  };

  await QRCode.toFile(filePath, codeData, qrCodeOptions);
}

/**
 * Generate QR code for terminal display (ASCII art)
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @returns ASCII representation of the QR code
 */
export async function generateQRCodeTerminal(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string
): Promise<string> {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);

  return await QRCode.toString(codeData, {
    type: 'terminal',
    errorCorrectionLevel: 'M',
  });
}
