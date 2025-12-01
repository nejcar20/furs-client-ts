import * as fs from 'fs';
import * as https from 'https';
import * as crypto from 'crypto';
import * as forge from 'node-forge';

import { loadCertificate, loadCACertificates } from './utils/certificate';
import { createJWT, decodeJWT } from './utils/jwt';
import {
  generateZOI,
  generateId,
  validateTaxNumber,
  generateMessageId,
  formatDateForFurs,
} from './utils/crypto';
import { FursError, FursValidationError, FursAuthenticationError } from './errors';
import {
  codeGenerator,
  CodeType,
  CodeFormat,
  CodeGenerationOptions,
  CodeGenerationResult,
  InvoiceCodeData,
} from './services/codeGenerator';

import {
  FursClientConfig,
  FursEndpoints,
  CertificateInfo,
  BusinessPremiseRequest,
  BusinessPremiseResult,
  InvoiceRequest,
  InvoiceResult,
  FursResponse,
  Environment,
} from './types';

/**
 * FURS Client for invoice fiscalization and business premise registration
 */
export class FursClient {
  private readonly config: Required<FursClientConfig> & {
    baseUrl: string;
    port: number;
    endpoints: FursEndpoints;
  };
  private privateKey!: forge.pki.PrivateKey;
  private certificateInfo!: CertificateInfo;
  private certData!: Buffer;
  private caCerts: string[] = [];

  /**
   * Create a new FURS client
   * @param config - Configuration options
   */
  constructor(config: FursClientConfig) {
    this.validateConfig(config);

    const environment = config.environment || 'test';
    const caCertsPath = config.caCertsPath || `certs-${environment}`;

    this.config = {
      ...config,
      environment,
      debug: config.debug || false,
      strictTLS: config.strictTLS !== false, // Default to true
      caCertsPath,
      endpoints: {
        businessPremise: '/v1/cash_registers/invoices/register',
        invoice: '/v1/cash_registers/invoices',
        ...config.endpoints,
      },
      baseUrl: '',
      port: 0,
    };

    // Set environment-specific configuration
    this.setEnvironment();

    // Load certificate
    this.loadCertificateData();

    // Load CA certificates for TLS validation
    this.loadCACertificates();

    this.log('FURS Client initialized', {
      environment: this.config.environment,
      strictTLS: this.config.strictTLS,
      caCertsLoaded: this.caCerts.length,
    });
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: FursClientConfig): void {
    if (!config) {
      throw new FursValidationError('Configuration is required');
    }

    const required: (keyof FursClientConfig)[] = ['certPath', 'certPassword', 'taxNumber'];
    for (const field of required) {
      if (!config[field]) {
        throw new FursValidationError(`Configuration field '${field}' is required`);
      }
    }
    if (!fs.existsSync(config.certPath)) {
      throw new FursValidationError(`Certificate file not found: ${config.certPath}`);
    }

    if (!validateTaxNumber(config.taxNumber)) {
      throw new FursValidationError('Invalid tax number format. Must be 8 digits.');
    }
  }

  /**
   * Set environment-specific configuration
   */
  private setEnvironment(): void {
    const environments = {
      test: {
        baseUrl: 'blagajne-test.fu.gov.si',
        port: 9002,
      },
      production: {
        baseUrl: 'blagajne.fu.gov.si',
        port: 9003,
      },
    };

    const env = environments[this.config.environment as Environment];
    if (!env) {
      throw new FursValidationError(
        `Invalid environment: ${this.config.environment}. Use 'test' or 'production'`
      );
    }

    this.config.baseUrl = env.baseUrl;
    this.config.port = env.port;
  }
  /**
   * Load certificate data
   */
  private loadCertificateData(): void {
    try {
      const certData = fs.readFileSync(this.config.certPath);
      const { privateKey, certificateInfo } = loadCertificate(certData, this.config.certPassword);

      this.privateKey = privateKey;
      this.certificateInfo = certificateInfo;
      this.certData = certData;

      this.log('Certificate loaded successfully', {
        subject: certificateInfo.subject_name,
      });
    } catch (error: any) {
      throw new FursAuthenticationError(`Failed to load certificate: ${error.message}`);
    }
  }

  /**
   * Load CA certificates for TLS validation
   */
  private loadCACertificates(): void {
    if (!this.config.strictTLS) {
      this.log('Strict TLS disabled - skipping CA certificate validation');
      return;
    }

    try {
      this.caCerts = loadCACertificates(this.config.caCertsPath);
      this.log('CA certificates loaded successfully', {
        count: this.caCerts.length,
        path: this.config.caCertsPath,
      });
    } catch (error: any) {
      this.log('Warning: Failed to load CA certificates', {
        error: error.message,
        path: this.config.caCertsPath,
      });
      // If strictTLS is enabled but CA certs can't be loaded, throw an error
      throw new FursAuthenticationError(
        `Failed to load CA certificates for TLS validation: ${error.message}`
      );
    }
  }

  /**
   * Register a business premise
   * @param businessPremise - Business premise data
   * @returns Registration result
   */
  public async registerBusinessPremise(
    businessPremise: BusinessPremiseRequest
  ): Promise<BusinessPremiseResult> {
    this.log('Registering business premise...');

    const businessPremiseId = businessPremise.businessPremiseId || generateId('BP');
    const now = new Date();

    const payload = {
      BusinessPremiseRequest: {
        Header: {
          MessageID: generateMessageId(),
          DateTime: formatDateForFurs(now),
        },
        BusinessPremise: {
          TaxNumber: this.config.taxNumber,
          BusinessPremiseID: businessPremiseId,
          BPIdentifier: businessPremise.identifier,
          ValidityDate: businessPremise.validityDate,
          SoftwareSupplier: businessPremise.softwareSupplier || [
            { TaxNumber: this.config.taxNumber },
          ],
          SpecialNotes: businessPremise.specialNotes || '',
        },
      },
    };

    try {
      const result = await this.sendRequest(payload, this.config.endpoints.businessPremise);

      if (result.decoded?.BusinessPremiseResponse?.Error) {
        const error = result.decoded.BusinessPremiseResponse.Error;
        throw new FursError(
          `FURS Error ${error.ErrorCode}: ${error.ErrorMessage}`,
          error.ErrorCode
        );
      }

      this.log('Business premise registered successfully', {
        businessPremiseId,
      });

      return {
        businessPremiseId,
        success: true,
        response: result.decoded?.BusinessPremiseResponse,
      };
    } catch (error: any) {
      this.log('Business premise registration failed', {
        error: error.message,
      });
      throw error;
    }
  }
  /**
   * Fiscalize an invoice
   * @param invoice - Invoice data
   * @returns Fiscalization result
   */
  public async fiscalizeInvoice(invoice: InvoiceRequest): Promise<InvoiceResult> {
    this.log('Fiscalizing invoice...');

    const invoiceNumber = invoice.invoiceNumber || generateId('INV');
    const now = new Date();
    const issueDateTime = invoice.issueDateTime || now.toISOString();
    console.log('Invoice data: ', invoice);
    // Generate ZOI (Protected ID)
    const zoi = generateZOI(
      this.privateKey,
      this.config.taxNumber,
      issueDateTime,
      invoiceNumber,
      invoice.businessPremiseId,
      invoice.electronicDeviceId,
      invoice.invoiceAmount
    );
    const payload = {
      InvoiceRequest: {
        Header: {
          MessageID: generateMessageId(),
          DateTime: formatDateForFurs(now),
        },
        Invoice: {
          TaxNumber: this.config.taxNumber,
          IssueDateTime: issueDateTime.slice(0, 19),
          NumberingStructure: invoice.numberingStructure || 'B',
          InvoiceIdentifier: {
            BusinessPremiseID: invoice.businessPremiseId,
            ElectronicDeviceID: invoice.electronicDeviceId,
            InvoiceNumber: invoiceNumber,
          },
          InvoiceAmount: invoice.invoiceAmount,
          PaymentAmount: invoice.paymentAmount || invoice.invoiceAmount,
          TaxesPerSeller: invoice.taxesPerSeller,
          OperatorTaxNumber: invoice.operatorTaxNumber || this.config.taxNumber,
          ProtectedID: zoi,
        },
      },
    };
    try {
      const result = await this.sendRequest(payload, this.config.endpoints.invoice);

      if (result.decoded?.InvoiceResponse?.Error) {
        const error = result.decoded.InvoiceResponse.Error;
        throw new FursError(
          `FURS Error ${error.ErrorCode}: ${error.ErrorMessage}`,
          error.ErrorCode
        );
      }

      this.log('Processing fiscalization result', {
        hasDecoded: !!result.decoded,
        decodedValid: result.decoded?.valid,
        decodedError: result.decoded?.error,
        hasPayload: !!result.decoded?.payload,
        payloadKeys: result.decoded?.payload ? Object.keys(result.decoded.payload) : [],
        fullDecoded: result.decoded,
      });

      const uniqueInvoiceId = result.decoded?.payload?.InvoiceResponse?.UniqueInvoiceID;
      if (!uniqueInvoiceId) {
        this.log('UniqueInvoiceID missing in response', {
          response: result.decoded?.payload?.InvoiceResponse,
          invoiceNumber,
          uniqueInvoiceId,
          zoi,
          decoded: result.decoded,
          payload: result.decoded?.payload,
        });
      } else {
        this.log('Invoice fiscalized successfully', {
          invoiceNumber,
          uniqueInvoiceId,
          zoi,
          decoded: result.decoded,
          payload: result.decoded?.payload,
          response: result.decoded?.payload?.InvoiceResponse,
        });
      }
      return {
        invoiceNumber,
        uniqueInvoiceId,
        zoi,
        success: invoiceNumber && uniqueInvoiceId,
        response: result.decoded?.payload.InvoiceResponse,
      };
    } catch (error: any) {
      this.log('Invoice fiscalization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate QR code for a fiscalized invoice
   * @param zoi - ZOI from fiscalized invoice
   * @param issueDateTime - Invoice issue date/time
   * @param format - Output format (buffer, dataUrl, svg, file)
   * @param filePath - File path if format is 'file'
   * @returns Generated QR code
   */
  public async generateQRCode(
    zoi: string,
    issueDateTime: Date | string,
    format: CodeFormat = CodeFormat.DATA_URL,
    filePath?: string
  ): Promise<CodeGenerationResult> {
    const invoiceData: InvoiceCodeData = {
      zoi,
      taxNumber: this.config.taxNumber,
      issueDateTime,
    };

    const options: CodeGenerationOptions = {
      type: CodeType.QR,
      format,
      filePath,
    };

    return await codeGenerator.generateCode(invoiceData, options);
  }

  /**
   * Generate PDF417 code for a fiscalized invoice
   * @param zoi - ZOI from fiscalized invoice
   * @param issueDateTime - Invoice issue date/time
   * @param format - Output format (buffer, dataUrl, svg, file)
   * @param filePath - File path if format is 'file'
   * @returns Generated PDF417 code
   */
  public async generatePDF417Code(
    zoi: string,
    issueDateTime: Date | string,
    format: CodeFormat = CodeFormat.DATA_URL,
    filePath?: string
  ): Promise<CodeGenerationResult> {
    const invoiceData: InvoiceCodeData = {
      zoi,
      taxNumber: this.config.taxNumber,
      issueDateTime,
    };

    const options: CodeGenerationOptions = {
      type: CodeType.PDF417,
      format,
      filePath,
    };

    return await codeGenerator.generateCode(invoiceData, options);
  }

  /**
   * Generate Code128 barcode for a fiscalized invoice
   * @param zoi - ZOI from fiscalized invoice
   * @param issueDateTime - Invoice issue date/time
   * @param format - Output format (buffer, dataUrl, svg, file, strings)
   * @param parts - Number of Code128 parts (2-6)
   * @param filePath - File path if format is 'file'
   * @returns Generated Code128 barcode(s)
   */
  public async generateCode128(
    zoi: string,
    issueDateTime: Date | string,
    format: CodeFormat = CodeFormat.DATA_URL,
    parts: number = 3,
    filePath?: string
  ): Promise<CodeGenerationResult> {
    const invoiceData: InvoiceCodeData = {
      zoi,
      taxNumber: this.config.taxNumber,
      issueDateTime,
    };

    const options: CodeGenerationOptions = {
      type: CodeType.CODE128,
      format,
      filePath,
      code128Options: { parts },
    };

    return await codeGenerator.generateCode(invoiceData, options);
  }

  /**
   * Generate all code types for a fiscalized invoice
   * @param zoi - ZOI from fiscalized invoice
   * @param issueDateTime - Invoice issue date/time
   * @param format - Output format for all codes
   * @returns Object with QR, PDF417, and Code128 codes
   */
  public async generateAllCodes(
    zoi: string,
    issueDateTime: Date | string,
    format: CodeFormat = CodeFormat.DATA_URL
  ): Promise<{
    qr: CodeGenerationResult;
    pdf417: CodeGenerationResult;
    code128: CodeGenerationResult;
  }> {
    const invoiceData: InvoiceCodeData = {
      zoi,
      taxNumber: this.config.taxNumber,
      issueDateTime,
    };

    return await codeGenerator.generateAllCodes(invoiceData, format);
  }

  /**
   * Fiscalize invoice and generate codes
   * @param invoice - Invoice data
   * @param generateCodes - Whether to generate codes
   * @param codeFormat - Format for generated codes
   * @returns Fiscalization result with optional codes
   */
  public async fiscalizeInvoiceWithCodes(
    invoice: InvoiceRequest,
    generateCodes: boolean = true,
    codeFormat: CodeFormat = CodeFormat.DATA_URL
  ): Promise<
    InvoiceResult & {
      codes?: {
        qr: CodeGenerationResult;
        pdf417: CodeGenerationResult;
        code128: CodeGenerationResult;
      };
    }
  > {
    // First fiscalize the invoice
    const result = await this.fiscalizeInvoice(invoice);

    // Generate codes if requested
    if (generateCodes && result.success) {
      const codes = await this.generateAllCodes(
        result.zoi,
        invoice.issueDateTime || new Date(),
        codeFormat
      );

      return {
        ...result,
        codes,
      };
    }

    return result;
  }

  /**
   * Send HTTPS request to FURS
   */
  private sendRequest(payload: any, endpoint: string): Promise<FursResponse> {
    return new Promise((resolve, reject) => {
      try {
        const token = createJWT(payload, this.privateKey, this.certificateInfo);
        const requestData = JSON.stringify({ token });

        const options: https.RequestOptions = {
          hostname: this.config.baseUrl,
          port: this.config.port,
          path: endpoint,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Length': Buffer.byteLength(requestData),
          },
          pfx: this.certData,
          passphrase: this.config.certPassword,
          rejectUnauthorized: this.config.strictTLS,
          ca: this.config.strictTLS ? this.caCerts : undefined,
        };

        this.log('Sending request to FURS', {
          endpoint,
          dataLength: requestData.length,
          strictTLS: this.config.strictTLS,
          caCertsCount: this.caCerts.length,
        });

        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              this.log('Raw response data', {
                dataLength: data.length,
                dataPreview: data.substring(0, 500) + (data.length > 500 ? '...' : ''),
              });

              // Check if response is HTML (error page)
              if (data.trim().startsWith('<')) {
                const error = `FURS returned HTML error page instead of JSON. Status: ${res.statusCode}. This usually means: 1) Wrong certificate (production requires production cert), 2) Certificate not registered with FURS, 3) IP not whitelisted, or 4) Invalid request format. Response: ${data.substring(0, 500)}`;
                this.log('HTML error page received', { error });
                reject(new FursError(error));
                return;
              }

              const response = JSON.parse(data);

              this.log('Parsed FURS response', {
                statusCode: res.statusCode,
                hasToken: !!response.token,
                responseKeys: Object.keys(response),
                tokenPreview: response.token ? response.token.substring(0, 50) + '...' : 'NO TOKEN',
              });

              const decoded = response.token ? decodeJWT(response.token) : null;

              this.log('JWT decode result', {
                hasDecoded: !!decoded,
                decodedValid: decoded?.valid,
                decodedError: decoded?.error,
              });

              if (decoded && !decoded.valid) {
                this.log('JWT decoding failed', {
                  error: decoded.error,
                });
              }

              resolve({
                statusCode: res.statusCode!,
                response,
                decoded,
              });
            } catch (e: any) {
              resolve({
                statusCode: res.statusCode!,
                response: data,
                error: e.message,
              });
            }
          });
        });

        req.on('error', (error) => {
          reject(new FursError(`Request failed: ${error.message}`));
        });

        req.write(requestData);
        req.end();
      } catch (error: any) {
        reject(new FursError(`Failed to send request: ${error.message}`));
      }
    });
  }

  /**
   * Debug logging
   */
  private log(message: string, data: Record<string, any> = {}): void {
    if (this.config.debug) {
      console.log(`[FURS Client] ${message}`, Object.keys(data).length ? data : '');
    }
  }
}
