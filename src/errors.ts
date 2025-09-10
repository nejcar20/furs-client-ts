import { FursErrorCode } from './types';

/**
 * Custom error classes for FURS Client
 */

/**
 * Base FURS error class
 */
export class FursError extends Error {
  public readonly code: FursErrorCode | null;
  public readonly details: any;

  constructor(message: string, code: FursErrorCode | null = null, details: any = null) {
    super(message);
    this.name = 'FursError';
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FursError);
    }
  }
}

/**
 * Validation error - invalid input data
 */
export class FursValidationError extends FursError {
  constructor(message: string, details: any = null) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'FursValidationError';
  }
}
/**
 * Authentication error - certificate or credential issues
 */
export class FursAuthenticationError extends FursError {
  constructor(message: string, details: any = null) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'FursAuthenticationError';
  }
}

/**
 * Network error - connection issues
 */
export class FursNetworkError extends FursError {
  constructor(message: string, details: any = null) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'FursNetworkError';
  }
}

/**
 * Server error - FURS server returned an error
 */
export class FursServerError extends FursError {
  constructor(message: string, code: FursErrorCode, details: any = null) {
    super(message, code, details);
    this.name = 'FursServerError';
  }
}
