import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';
import { CertificateInfo } from '../types';

/**
 * Load and process P12 certificate
 * @param certData - Certificate file data
 * @param password - Certificate password
 * @returns Certificate information and private key
 */
export function loadCertificate(
  certData: Buffer,
  password: string
): {
  privateKey: forge.pki.PrivateKey;
  certificateInfo: CertificateInfo;
  certificateCount: number;
} {
  try {
    // Parse P12 certificate
    const p12Asn1 = forge.asn1.fromDer(certData.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    // Extract certificate bags
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    const certBag = certBags[forge.pki.oids.certBag];
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

    if (!certBag || certBag.length === 0) {
      throw new Error('No certificate found in P12 file');
    }

    if (!keyBag || keyBag.length === 0) {
      throw new Error('No private key found in P12 file');
    }

    // Get private key
    const privateKeyBag = keyBag[0];
    if (!privateKeyBag.key) {
      throw new Error('No private key found in certificate bag');
    }
    const privateKey = privateKeyBag.key;

    // Get certificate information
    const certificateInfo = getCertificateInfo(certBag);

    return {
      privateKey,
      certificateInfo,
      certificateCount: certBag.length,
    };
  } catch (error: any) {
    throw new Error(`Failed to load certificate: ${error.message}`);
  }
}

/**
 * Extract certificate information for FURS JWS Header
 * @param certBags - Certificate bags from P12
 * @returns Certificate information
 */
export function getCertificateInfo(certBags: forge.pkcs12.Bag[]): CertificateInfo {
  const cert = certBags[0].cert as forge.pki.Certificate;

  // Extract subject name in EXACT FURS format
  const subjectAttrs = cert.subject.attributes;
  const subjectParts: string[] = [];

  // 1. CN (Common Name) - with proper escaping
  const cn = subjectAttrs.find((attr) => attr.shortName === 'CN' || attr.type === '2.5.4.3');
  if (cn) {
    const cnValue = cn.value;
    if (typeof cnValue === 'string' && cnValue.includes(',')) {
      subjectParts.push(`CN=${cnValue.replace(/,/g, '\\,')}`);
    } else {
      subjectParts.push(`CN=${cnValue}`);
    }
  }

  // 2. OID 2.5.4.5 (serialNumber) - FURS expects simple decimal value
  const serialAttr = subjectAttrs.find((attr) => attr.type === '2.5.4.5');
  if (serialAttr) {
    subjectParts.push(`2.5.4.5=#1`);
  }

  // 3. OU attributes in FURS specific order
  const ouAttrs = subjectAttrs.filter(
    (attr) => attr.shortName === 'OU' || attr.type === '2.5.4.11'
  );
  const davPotRac = ouAttrs.find((ou) => ou.value === 'DavPotRacTEST');
  const taxNumber = ouAttrs.find((ou) => typeof ou.value === 'string' && /^\d+$/.test(ou.value));

  if (davPotRac) {
    subjectParts.push(`OU=${davPotRac.value}`);
  }
  if (taxNumber) {
    subjectParts.push(`OU=${taxNumber.value}`);
  }

  // 4. O (Organization)
  const o = subjectAttrs.find((attr) => attr.shortName === 'O' || attr.type === '2.5.4.10');
  if (o) {
    subjectParts.push(`O=${o.value}`);
  }

  // 5. C (Country)
  const c = subjectAttrs.find((attr) => attr.shortName === 'C' || attr.type === '2.5.4.6');
  if (c) {
    subjectParts.push(`C=${c.value}`);
  }
  const subject = subjectParts.join(',');

  // Extract issuer name in FURS format
  const issuerAttrs = cert.issuer.attributes;
  const issuerParts: string[] = [];

  const issuerCn = issuerAttrs.find((attr) => attr.shortName === 'CN' || attr.type === '2.5.4.3');
  if (issuerCn) {
    issuerParts.push(`CN=${issuerCn.value}`);
  }

  const issuerO = issuerAttrs.find((attr) => attr.shortName === 'O' || attr.type === '2.5.4.10');
  if (issuerO) {
    issuerParts.push(`O=${issuerO.value}`);
  }

  const issuerC = issuerAttrs.find((attr) => attr.shortName === 'C' || attr.type === '2.5.4.6');
  if (issuerC) {
    issuerParts.push(`C=${issuerC.value}`);
  }

  const issuer = issuerParts.join(',');

  // Get serial number as decimal
  const serialHex = cert.serialNumber;
  const serialBigInt = BigInt('0x' + serialHex);
  const serialDecimal = serialBigInt.toString(10);

  return {
    subject_name: subject,
    issuer_name: issuer,
    serial: serialDecimal,
    validFrom: cert.validity.notBefore,
    validTo: cert.validity.notAfter,
  };
}

/**
 * Load CA certificates from a directory for TLS validation
 * @param caCertsPath - Path to directory containing CA certificates
 * @returns Array of CA certificates in PEM format
 */
export function loadCACertificates(caCertsPath: string): string[] {
  const caCerts: string[] = [];

  if (!fs.existsSync(caCertsPath)) {
    throw new Error(`CA certificates directory not found: ${caCertsPath}`);
  }

  const files = fs.readdirSync(caCertsPath);
  const certFiles = files.filter(
    (file) => file.endsWith('.cer') || file.endsWith('.crt') || file.endsWith('.pem')
  );

  if (certFiles.length === 0) {
    throw new Error(`No certificate files found in: ${caCertsPath}`);
  }

  for (const certFile of certFiles) {
    const certPath = path.join(caCertsPath, certFile);
    const certData = fs.readFileSync(certPath);

    // Convert DER to PEM if needed
    let pemCert: string;
    try {
      // Try to read as PEM first
      pemCert = certData.toString('utf8');
      if (!pemCert.includes('BEGIN CERTIFICATE')) {
        // It's DER format, convert to PEM
        const derBuffer = certData.toString('binary');
        const asn1 = forge.asn1.fromDer(derBuffer);
        const cert = forge.pki.certificateFromAsn1(asn1);
        pemCert = forge.pki.certificateToPem(cert);
      }
      caCerts.push(pemCert);
    } catch (error: any) {
      throw new Error(`Failed to load CA certificate ${certFile}: ${error.message}`);
    }
  }

  return caCerts;
}
