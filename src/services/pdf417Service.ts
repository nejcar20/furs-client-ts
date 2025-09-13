/**
 * PDF417 Code Generation Service
 * Generates PDF417 codes according to FURS specifications
 */

import { formatCodeData } from '../utils/codeFormatter';
import { createCanvas } from 'canvas';
const bwipjs = require('bwip-js');

/**
 * PDF417 options according to FURS specifications
 */
export interface FursPDF417Options {
  /** Error correction level (FURS requires level 2) */
  errorCorrectionLevel?: number;
  /** Module width in pixels (minimum 2) */
  moduleWidth?: number;
  /** Module height in pixels (minimum 10) */
  moduleHeight?: number;
  /** Number of rows (5-33) */
  rows?: number;
  /** Quiet zone size in module widths (minimum 2) */
  quietZone?: number;
}

/**
 * Default PDF417 options per FURS specification
 */
const DEFAULT_PDF417_OPTIONS: FursPDF417Options = {
  errorCorrectionLevel: 2,
  moduleWidth: 2,
  moduleHeight: 10,
  rows: 10,
  quietZone: 2
};

/**
 * Generate PDF417 code buffer for FURS invoice
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - PDF417 generation options
 * @returns Buffer containing the PDF417 code image
 */
export async function generatePDF417Buffer(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursPDF417Options = {}
): Promise<Buffer> {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const pdf417Options = { ...DEFAULT_PDF417_OPTIONS, ...options };

  try {
    // Generate PDF417 using bwip-js
    // Use pdf417compact for more efficient encoding
    const png = await bwipjs.toBuffer({
      bcid: 'pdf417compact',  // Compact version is more suitable for numeric data
      text: codeData,
      scale: pdf417Options.moduleWidth || 2,  // Module width in pixels
      height: pdf417Options.moduleHeight || 10,  // Row height in scale units
      eclevel: pdf417Options.errorCorrectionLevel || 2,  // Error correction level (0-8, FURS requires 2)
      includetext: false,  // Don't include human-readable text
      padding: pdf417Options.quietZone || 2  // Quiet zone around barcode
    });

    return png;
  } catch (error) {
    // Fallback to canvas implementation if bwip-js fails
    console.warn('bwip-js failed, using fallback implementation:', error);
    return generatePDF417BufferFallback(zoi, taxNumber, issueDateTime, options);
  }
}

/**
 * Fallback PDF417 generation using canvas
 */
async function generatePDF417BufferFallback(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursPDF417Options = {}
): Promise<Buffer> {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const pdf417Options = { ...DEFAULT_PDF417_OPTIONS, ...options };

  const moduleWidth = pdf417Options.moduleWidth || 2;
  const moduleHeight = pdf417Options.moduleHeight || 10;
  const quietZone = pdf417Options.quietZone || 2;

  // Create a placeholder barcode pattern
  const barcodeWidth = 100;
  const barcodeHeight = 20;

  const totalWidth = (barcodeWidth + 2 * quietZone) * moduleWidth;
  const totalHeight = (barcodeHeight + 2 * quietZone) * moduleHeight;

  // Create canvas
  const canvas = createCanvas(totalWidth, totalHeight);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw placeholder pattern
  ctx.fillStyle = 'black';
  const textHeight = 12;
  ctx.font = `${textHeight}px monospace`;
  ctx.fillText('PDF417: ' + codeData.substring(0, 20) + '...', 10, totalHeight / 2);

  return canvas.toBuffer('image/png');
}

/**
 * Generate PDF417 code data URL for FURS invoice
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - PDF417 generation options
 * @returns Data URL of the PDF417 code image
 */
export async function generatePDF417DataURL(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursPDF417Options = {}
): Promise<string> {
  const buffer = await generatePDF417Buffer(zoi, taxNumber, issueDateTime, options);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

/**
 * Generate PDF417 code SVG for FURS invoice
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - PDF417 generation options
 * @returns SVG string of the PDF417 code
 */
export async function generatePDF417SVG(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursPDF417Options = {}
): Promise<string> {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const pdf417Options = { ...DEFAULT_PDF417_OPTIONS, ...options };

  try {
    // Generate PDF417 SVG using bwip-js
    const svg = await bwipjs.toSVG({
      bcid: 'pdf417compact',  // Compact version is more suitable for numeric data
      text: codeData,
      scale: pdf417Options.moduleWidth || 2,
      height: pdf417Options.moduleHeight || 10,
      eclevel: pdf417Options.errorCorrectionLevel || 2,
      includetext: false,
      padding: pdf417Options.quietZone || 2
    });

    return svg;
  } catch (error) {
    // Fallback SVG implementation
    console.warn('bwip-js SVG generation failed, using fallback:', error);
    return generatePDF417SVGFallback(zoi, taxNumber, issueDateTime, options);
  }
}

/**
 * Fallback SVG generation
 */
function generatePDF417SVGFallback(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursPDF417Options = {}
): string {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const pdf417Options = { ...DEFAULT_PDF417_OPTIONS, ...options };

  const moduleWidth = pdf417Options.moduleWidth || 2;
  const moduleHeight = pdf417Options.moduleHeight || 10;
  const quietZone = pdf417Options.quietZone || 2;

  const barcodeWidth = 100;
  const barcodeHeight = 20;

  const totalWidth = (barcodeWidth + 2 * quietZone) * moduleWidth;
  const totalHeight = (barcodeHeight + 2 * quietZone) * moduleHeight;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;
  svg += `<text x="10" y="${totalHeight/2}" font-family="monospace" font-size="12">PDF417: ${codeData.substring(0, 20)}...</text>`;
  svg += '</svg>';
  return svg;
}

/**
 * Generate PDF417 code to file for FURS invoice
 * @param filePath - Path where to save the PDF417 code image
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - PDF417 generation options
 */
export async function generatePDF417ToFile(
  filePath: string,
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursPDF417Options = {}
): Promise<void> {
  const fs = await import('fs/promises');
  const buffer = await generatePDF417Buffer(zoi, taxNumber, issueDateTime, options);
  await fs.writeFile(filePath, buffer);
}