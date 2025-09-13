/**
 * Code128 Barcode Generation Service
 * Generates Code128 barcodes according to FURS specifications
 */

const JsBarcode = require('jsbarcode');
import { createCanvas } from 'canvas';
import { formatCodeData, splitForCode128 } from '../utils/codeFormatter';

/**
 * Code128 options according to FURS specifications
 */
export interface FursCode128Options {
  /** Number of barcodes to split data into (2-6) */
  parts?: number;
  /** Module width in pixels (minimum 2) */
  moduleWidth?: number;
  /** Height of barcode in mm (minimum 3.5) */
  height?: number;
  /** Quiet zone size in mm (minimum 10 modules or 6mm) */
  quietZone?: number;
  /** Space between barcodes in mm (minimum 1) */
  spacing?: number;
  /** Display text below barcode */
  displayValue?: boolean;
}

/**
 * Default Code128 options per FURS specification
 */
const DEFAULT_CODE128_OPTIONS: FursCode128Options = {
  parts: 3,
  moduleWidth: 2,
  height: 35, // 3.5mm in pixels (assuming 10 pixels per mm)
  quietZone: 20, // 10 modules * 2 pixels per module
  spacing: 10, // 1mm in pixels
  displayValue: true
};

/**
 * Generate single Code128 barcode
 * @param data - Data to encode
 * @param options - Barcode options
 * @returns Canvas with the barcode
 */
function generateSingleCode128(
  data: string,
  options: FursCode128Options
): any {
  const canvas = createCanvas(1, 1); // Will be resized by JsBarcode

  JsBarcode(canvas, data, {
    format: 'CODE128C', // Use Code Set C for numeric data
    width: options.moduleWidth || 2,
    height: options.height || 35,
    margin: options.quietZone || 20,
    displayValue: options.displayValue !== false,
    fontSize: 12,
    textMargin: 2
  });

  return canvas;
}

/**
 * Generate Code128 barcodes buffer for FURS invoice
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - Code128 generation options
 * @returns Buffer containing the Code128 barcodes image
 */
export async function generateCode128Buffer(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursCode128Options = {}
): Promise<Buffer> {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const code128Options = { ...DEFAULT_CODE128_OPTIONS, ...options };

  // Split data for multiple barcodes
  const parts = code128Options.parts || 3;
  const splitData = splitForCode128(codeData, parts);

  // Generate individual barcodes
  const barcodes = splitData.map(data => generateSingleCode128(data, code128Options));

  // Calculate total canvas size
  const barcodeWidth = Math.max(...barcodes.map((bc: any) => bc.width));
  const barcodeHeight = barcodes[0].height;
  const spacing = code128Options.spacing || 10;
  const totalHeight = (barcodeHeight * parts) + (spacing * (parts - 1));

  // Create combined canvas
  const finalCanvas = createCanvas(barcodeWidth, totalHeight);
  const ctx = finalCanvas.getContext('2d');

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, barcodeWidth, totalHeight);

  // Draw each barcode
  let yOffset = 0;
  for (const barcode of barcodes) {
    ctx.drawImage(barcode, 0, yOffset);
    yOffset += barcodeHeight + spacing;
  }

  return finalCanvas.toBuffer('image/png');
}

/**
 * Generate Code128 barcodes data URL for FURS invoice
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - Code128 generation options
 * @returns Data URL of the Code128 barcodes image
 */
export async function generateCode128DataURL(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursCode128Options = {}
): Promise<string> {
  const buffer = await generateCode128Buffer(zoi, taxNumber, issueDateTime, options);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

/**
 * Generate Code128 barcodes SVG for FURS invoice
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - Code128 generation options
 * @returns SVG string of the Code128 barcodes
 */
export function generateCode128SVG(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursCode128Options = {}
): string {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  const code128Options = { ...DEFAULT_CODE128_OPTIONS, ...options };

  // Split data for multiple barcodes
  const parts = code128Options.parts || 3;
  const splitData = splitForCode128(codeData, parts);

  const moduleWidth = code128Options.moduleWidth || 2;
  const height = code128Options.height || 35;
  const quietZone = code128Options.quietZone || 20;
  const spacing = code128Options.spacing || 10;

  // Calculate dimensions
  const barcodeWidth = 400; // Approximate width
  const totalHeight = (height * parts) + (spacing * (parts - 1));

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${barcodeWidth}" height="${totalHeight}" viewBox="0 0 ${barcodeWidth} ${totalHeight}">`;
  svg += `<rect width="${barcodeWidth}" height="${totalHeight}" fill="white"/>`;

  // Generate each barcode (simplified representation)
  let yOffset = 0;
  for (let i = 0; i < splitData.length; i++) {
    const data = splitData[i];

    // Create a placeholder for the barcode
    svg += `<g transform="translate(${quietZone}, ${yOffset})">`;

    // Add text
    if (code128Options.displayValue !== false) {
      svg += `<text x="${barcodeWidth / 2 - quietZone}" y="${height - 5}" text-anchor="middle" font-family="monospace" font-size="12">${data}</text>`;
    }

    svg += '</g>';
    yOffset += height + spacing;
  }

  svg += '</svg>';
  return svg;
}

/**
 * Generate Code128 barcodes to file for FURS invoice
 * @param filePath - Path where to save the Code128 barcodes image
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param options - Code128 generation options
 */
export async function generateCode128ToFile(
  filePath: string,
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  options: FursCode128Options = {}
): Promise<void> {
  const fs = await import('fs/promises');
  const buffer = await generateCode128Buffer(zoi, taxNumber, issueDateTime, options);
  await fs.writeFile(filePath, buffer);
}

/**
 * Get individual Code128 barcode strings
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @param parts - Number of parts to split into (2-6)
 * @returns Array of barcode data strings
 */
export function getCode128Strings(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string,
  parts: number = 3
): string[] {
  const codeData = formatCodeData(zoi, taxNumber, issueDateTime);
  return splitForCode128(codeData, parts);
}