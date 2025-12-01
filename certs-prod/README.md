# FURS Production Environment CA Certificates

This directory contains the CA certificates required for TLS validation when connecting to FURS production environment.

## Required Certificates

Download these certificates from [FURS Digital Certificates](https://www.fu.gov.si/nadzor/podrocja/davcne_blagajne/pomocnik_za_uporabnike_in_razvijalce_programske_opreme_za_davcne_blagajne/digitalna_potrdila/):

1. **blagajne.fu.gov.si_2025.cer** - TLS connection certificate for production (updated Nov 2025)
2. **DavPotRac_2025.cer** - Digital signature certificate for production
3. **sigov-ca2.xcert.crt** - SIGOV-CA intermediate certificate
4. **si-trust-root.crt** - SI-TRUST root certificate

## Purpose

These certificates are used to validate the FURS server's TLS certificate when making requests to:
- `blagajne.fu.gov.si:9003` (production)
- `blagajne.fu.gov.si:9009` (temporary test environment for new certificate)

## Important Update - November 2025

On **November 11, 2025**, between 22:00-24:00, FURS will replace their TLS certificate. The new certificate is already included in this directory.

**Action Required:**
1. Test your application against the temporary environment at port 9009
2. Ensure all certificates in this directory are up to date
3. Verify `strictTLS: true` is enabled in production configuration

## Security

These are **public CA certificates** and are safe to commit to version control. They only contain public keys used to verify the FURS server's identity.

**Never commit your private P12 certificate!** Your client certificate should be stored securely and never included in version control.
