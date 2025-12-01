# FURS Test Environment CA Certificates

This directory contains the CA certificates required for TLS validation when connecting to FURS test environment.

## Required Certificates

Download these certificates from [FURS Digital Certificates](https://www.fu.gov.si/nadzor/podrocja/davcne_blagajne/pomocnik_za_uporabnike_in_razvijalce_programske_opreme_za_davcne_blagajne/digitalna_potrdila/):

1. **blagajne-test.fu.gov.si.cer** - TLS connection certificate for test environment
2. **DavPotRacTEST.cer** - Digital signature certificate for test environment
3. **sigov-ca2.xcert.crt** - SIGOV-CA intermediate certificate
4. **si-trust-root.crt** - SI-TRUST root certificate

## Purpose

These certificates are used to validate the FURS server's TLS certificate when making requests to:
- `blagajne-test.fu.gov.si:9002`

## Security

These are **public CA certificates** and are safe to commit to version control. They only contain public keys used to verify the FURS server's identity.

**Never commit your private P12 certificate!** Your client certificate should be stored securely and never included in version control.
