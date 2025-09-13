import * as crypto from 'crypto';
import * as forge from 'node-forge';

/**
 * Generate unique ID for testing
 * @param prefix - Prefix for the ID
 * @returns Generated ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return prefix + timestamp.substr(-4) + random;
}

/**
 * Generate ZOI (Protected ID) for invoice
 * @param privateKey - Private key for signing
 * @param taxNumber - Tax number
 * @param issueDateTime - Issue date time (ISO string)
 * @param invoiceNumber - Invoice number
 * @param businessPremiseId - Business premise ID
 * @param electronicDeviceId - Electronic device ID
 * @param totalAmount - Total amount
 * @returns ZOI hash
 */
export function generateZOI(
  privateKey: forge.pki.PrivateKey,
  taxNumber: number,
  issueDateTime: string,
  invoiceNumber: string,
  businessPremiseId: string,
  electronicDeviceId: string,
  totalAmount: number
): string {
  // Format datetime for ZOI (YYYY-MM-DD HH:MM:SS)
  const formattedDateTime = new Date(issueDateTime).toISOString().slice(0, 19).replace('T', ' ');

  // Create ZOI input string
  const zoiInput = `${taxNumber}${formattedDateTime}${invoiceNumber}${businessPremiseId}${electronicDeviceId}${totalAmount.toFixed(2)}`;

  // Sign with RSA SHA256
  const md = forge.md.sha256.create();
  md.update(zoiInput, 'utf8');
  const signature = (privateKey as any).sign(md);

  // Create MD5 hash of signature
  const signatureBuffer = Buffer.from(signature, 'binary');
  const md5Hash = crypto.createHash('md5').update(signatureBuffer).digest('hex');

  return md5Hash;
}

/**
 * Validate tax number format (Slovenia)
 * @param taxNumber - Tax number to validate
 * @returns True if valid
 */
export function validateTaxNumber(taxNumber: number): boolean {
  if (typeof taxNumber !== 'number') {
    return false;
  }

  const taxStr = taxNumber.toString();
  return /^\d{8}$/.test(taxStr);
}
/**
 * Generate message ID for FURS requests
 * @returns UUID in uppercase
 */
export function generateMessageId(): string {
  return crypto.randomUUID().toUpperCase();
}

/**
 * Format date for FURS API
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForFurs(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19) + 'Z';
}

/**
 * Format datetime for ZOI calculation
 * @param datetime - Datetime to format
 * @returns Formatted datetime (YYYY-MM-DD HH:MM:SS)
 */
export function formatDateTimeForZOI(datetime: string | Date): string {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
