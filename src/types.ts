/**
 * FURS Client Types
 * Type definitions for all FURS-related data structures
 */

export interface FursClientConfig {
  /** Path to the P12 certificate file */
  certPath: string;
  /** Certificate password */
  certPassword: string;
  /** Tax number */
  taxNumber: number;
  /** Environment (test or production) */
  environment?: 'test' | 'production';
  /** Custom endpoints configuration */
  endpoints?: Partial<FursEndpoints>;
  /** Enable debug logging */
  debug?: boolean;
}

export interface FursEndpoints {
  /** Business premise registration endpoint */
  businessPremise: string;
  /** Invoice fiscalization endpoint */
  invoice: string;
}

export interface CertificateInfo {
  /** Certificate subject name in FURS format */
  subject_name: string;
  /** Certificate issuer name in FURS format */
  issuer_name: string;
  /** Certificate serial number as decimal string */
  serial: string;
  /** Certificate valid from date */
  validFrom: Date;  /** Certificate valid to date */
  validTo: Date;
}

export interface PropertyID {
  /** Cadastral number */
  CadastralNumber: number;
  /** Building number */
  BuildingNumber: number;
  /** Building section number */
  BuildingSectionNumber?: number;
}

export interface Address {
  /** Street name */
  Street: string;
  /** House number */
  HouseNumber: string;
  /** Additional house number */
  HouseNumberAdditional?: string;
  /** Community name */
  Community: string;
  /** City name */
  City: string;
  /** Postal code */
  PostalCode: string;
}

export interface RealEstateBP {
  /** Property identification */
  PropertyID: PropertyID;  /** Address information */
  Address: Address;
}

export interface PremiseType {
  /** Premise type code */
  PremiseType: 'A' | 'B' | 'C';
}

export interface BusinessPremiseIdentifier {
  /** Real estate business premise */
  RealEstateBP?: RealEstateBP;
  /** Premise type identifier */
  PremiseType?: PremiseType;
}

export interface SoftwareSupplier {
  /** Software supplier tax number */
  TaxNumber: number;
}

export interface BusinessPremiseRequest {
  /** Custom business premise ID (auto-generated if not provided) */
  businessPremiseId?: string;
  /** Business premise identifier */
  identifier: BusinessPremiseIdentifier;
  /** Validity date in ISO format */
  validityDate: string;
  /** Software supplier information */
  softwareSupplier?: SoftwareSupplier[];
  /** Special notes */
  specialNotes?: string;
}
export interface BusinessPremiseResult {
  /** Generated or provided business premise ID */
  businessPremiseId: string;
  /** Whether the registration was successful */
  success: boolean;
  /** Full FURS response */
  response?: any;
}

export interface VATInfo {
  /** VAT tax rate */
  TaxRate: number;
  /** Taxable amount */
  TaxableAmount: number;
  /** Tax amount */
  TaxAmount: number;
}

export interface TaxesPerSeller {
  /** VAT information */
  VAT: VATInfo[];
}

export interface InvoiceRequest {
  /** Business premise ID */
  businessPremiseId: string;
  /** Electronic device ID */
  electronicDeviceId: string;
  /** Custom invoice number (auto-generated if not provided) */
  invoiceNumber?: string;
  /** Total invoice amount */
  invoiceAmount: number;
  /** Payment amount (defaults to invoice amount) */
  paymentAmount?: number;
  /** Tax information per seller */
  taxesPerSeller: TaxesPerSeller[];  /** Issue date/time in ISO format */
  issueDateTime?: string;
  /** Numbering structure */
  numberingStructure?: 'B' | 'C';
  /** Operator tax number */
  operatorTaxNumber?: number;
}

export interface InvoiceResult {
  /** Generated or provided invoice number */
  invoiceNumber: string;
  /** EOR - Unique invoice ID from FURS */
  uniqueInvoiceId: string;
  /** ZOI - Protected ID */
  zoi: string;
  /** Whether the fiscalization was successful */
  success: boolean;
  /** Full FURS response */
  response?: any;
}

export interface JWTHeader {
  /** Algorithm used for signing */
  alg: string;
  /** Certificate subject name */
  subject_name: string;
  /** Certificate issuer name */
  issuer_name: string;
  /** Certificate serial number */
  serial: string;
}

export interface JWTDecoded {
  /** JWT header */
  header: JWTHeader;
  /** JWT payload */
  payload: any;
  /** JWT signature */
  signature: string;
  /** Whether the JWT is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}
export interface FursResponse {
  /** HTTP status code */
  statusCode: number;
  /** Raw response from FURS */
  response: any;
  /** Decoded JWT response */
  decoded?: any;
  /** Error message if parsing failed */
  error?: string;
}

// Environment constants
export const ENVIRONMENTS = {
  TEST: 'test' as const,
  PRODUCTION: 'production' as const
} as const;

export type Environment = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS];

// Error code types
export type FursErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR' 
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | string;
