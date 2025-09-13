/**
 * FURS Code Formatter Utility
 * Formats data for QR, PDF417, and Code128 codes according to FURS specifications
 */

/**
 * Convert hexadecimal string to decimal string with padding
 * @param hex - Hexadecimal string (32 characters for ZOI)
 * @param targetLength - Target length (39 for ZOI)
 * @returns Decimal string with leading zeros if needed
 */
export function hexToDecimalPadded(hex: string, targetLength: number = 39): string {
  // Remove any spaces or formatting
  const cleanHex = hex.replace(/\s/g, '').toLowerCase();

  // Convert hex to BigInt then to decimal string
  const decimal = BigInt('0x' + cleanHex).toString(10);

  // Pad with leading zeros if needed
  return decimal.padStart(targetLength, '0');
}

/**
 * Format date for code generation
 * @param date - Date object or ISO string
 * @returns Date in YYMMDDHHMMSS format
 */
export function formatDateForCode(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const year = dateObj.getFullYear().toString().slice(-2);
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Calculate control character for FURS code
 * @param dataString - String of digits to calculate control character for
 * @returns Control character (0-9)
 */
export function calculateControlCharacter(dataString: string): string {
  // Sum all digits
  const sum = dataString.split('').reduce((acc, digit) => {
    return acc + parseInt(digit, 10);
  }, 0);

  // Return modulo 10
  return (sum % 10).toString();
}

/**
 * Format data for FURS code (60 digits)
 * @param zoi - ZOI in hexadecimal format (32 characters)
 * @param taxNumber - Tax number (8 digits)
 * @param issueDateTime - Invoice issue date and time
 * @returns 60-digit string for code generation
 */
export function formatCodeData(
  zoi: string,
  taxNumber: number,
  issueDateTime: Date | string
): string {
  // Convert ZOI from hex to decimal (39 digits)
  const zoiDecimal = hexToDecimalPadded(zoi, 39);

  // Format tax number (8 digits)
  const taxNumberStr = taxNumber.toString().padStart(8, '0');

  // Format date/time (12 digits: YYMMDDHHMMSS)
  const dateTimeStr = formatDateForCode(issueDateTime);

  // Concatenate first 59 digits
  const dataWithoutControl = `${zoiDecimal}${taxNumberStr}${dateTimeStr}`;

  // Calculate and append control character
  const controlChar = calculateControlCharacter(dataWithoutControl);

  return `${dataWithoutControl}${controlChar}`;
}

/**
 * Split code data for Code128 format
 * @param codeData - 60-digit code data
 * @param parts - Number of parts to split into (2-6)
 * @returns Array of strings for each Code128 barcode
 */
export function splitForCode128(codeData: string, parts: number): string[] {
  if (parts < 2 || parts > 6) {
    throw new Error('Number of parts must be between 2 and 6');
  }

  if (codeData.length !== 60) {
    throw new Error('Code data must be exactly 60 digits');
  }

  const result: string[] = [];

  // Determine prefix and data length per part
  let prefix: string;
  let dataPerPart: number;

  switch (parts) {
    case 2:
      // 2 x 30: prefix "4" + sequence number + 28 data digits
      dataPerPart = 30;
      prefix = '4';
      break;
    case 3:
      // 3 x 20: prefix "4" + sequence number + 18 data digits
      dataPerPart = 20;
      prefix = '4';
      break;
    case 4:
      // 4 x 15: prefix "44" + sequence number + 12 data digits
      dataPerPart = 15;
      prefix = '44';
      break;
    case 5:
      // 5 x 12: prefix "4" + sequence number + 10 data digits
      dataPerPart = 12;
      prefix = '4';
      break;
    case 6:
      // 6 x 10: prefix "4" + sequence number + 8 data digits
      dataPerPart = 10;
      prefix = '4';
      break;
    default:
      throw new Error('Invalid number of parts');
  }

  // Calculate actual data digits per part (excluding prefix and sequence)
  const prefixLength = prefix.length + 1; // prefix + sequence number
  const actualDataPerPart = dataPerPart - prefixLength;

  // Split the data
  for (let i = 0; i < parts; i++) {
    const sequenceNumber = (i + 1).toString();
    const startIdx = i * actualDataPerPart;
    const endIdx = startIdx + actualDataPerPart;
    const dataPart = codeData.slice(startIdx, endIdx);

    result.push(`${prefix}${sequenceNumber}${dataPart}`);
  }

  return result;
}

/**
 * Validate ZOI format
 * @param zoi - ZOI string to validate
 * @returns True if valid hexadecimal string of 32 characters
 */
export function validateZOI(zoi: string): boolean {
  return /^[0-9a-fA-F]{32}$/.test(zoi);
}

/**
 * Validate tax number format
 * @param taxNumber - Tax number to validate
 * @returns True if valid 8-digit number
 */
export function validateTaxNumber(taxNumber: number): boolean {
  const str = taxNumber.toString();
  return /^\d{8}$/.test(str);
}