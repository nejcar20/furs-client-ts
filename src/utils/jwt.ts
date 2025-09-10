import * as forge from 'node-forge';
import { JWTHeader, JWTDecoded, CertificateInfo } from '../types';

/**
 * Base64URL encode (without padding)
 * @param input - Input data
 * @returns Base64URL encoded string
 */
export function base64urlEncode(input: string | Buffer): string {
  let base64: string;

  if (typeof input === 'string') {
    base64 = Buffer.from(input, 'utf8').toString('base64');
  } else {
    base64 = forge.util.encode64(input.toString('binary'));
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64URL decode
 * @param data - Base64URL encoded data
 * @returns Decoded string
 */
export function base64urlDecode(data: string): string {
  const padding = 4 - (data.length % 4);
  const paddedData = data + '='.repeat(padding % 4);

  return Buffer.from(
    paddedData.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  ).toString('utf8');
}
/**
 * Create JWT according to FURS specification
 * @param payload - JWT payload
 * @param privateKey - Private key for signing
 * @param certificateInfo - Certificate information
 * @returns JWT token
 */
export function createJWT(payload: any, privateKey: forge.pki.PrivateKey, certificateInfo: CertificateInfo): string {
  // Create JWS Header according to FURS spec
  const header: JWTHeader = {
    alg: 'RS256',
    subject_name: certificateInfo.subject_name,
    issuer_name: certificateInfo.issuer_name,
    serial: certificateInfo.serial,
  };

  // Encode header and payload to BASE64URL
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));

  // Create signing input (header.payload)
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Sign with RSA SHA256
  const md = forge.md.sha256.create();
  md.update(signingInput, 'utf8');
  const signature = (privateKey as any).sign(md);

  // Convert signature from forge binary string to proper base64url
  const signatureBytes = new Uint8Array(signature.length);
  for (let i = 0; i < signature.length; i++) {
    signatureBytes[i] = signature.charCodeAt(i);
  }
  const encodedSignature = Buffer.from(signatureBytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Create final JWT
  const jwt = `${signingInput}.${encodedSignature}`;

  return jwt;
}

/**
 * Decode and verify JWT structure
 * @param jwt - JWT token to decode
 * @returns Decoded JWT parts
 */
export function decodeJWT(jwt: string): JWTDecoded {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format - should have 3 parts');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const header = JSON.parse(base64urlDecode(encodedHeader)) as JWTHeader;
    const payload = JSON.parse(base64urlDecode(encodedPayload));

    return {
      header,
      payload,
      signature: encodedSignature,
      valid: true,
    };
  } catch (error: any) {
    return { 
      header: {} as JWTHeader,
      payload: {},
      signature: '',
      valid: false, 
      error: error.message 
    };
  }
}
