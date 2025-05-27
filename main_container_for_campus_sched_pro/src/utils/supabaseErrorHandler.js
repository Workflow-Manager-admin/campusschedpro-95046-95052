/**
 * Common error types for Supabase operations
 */
export const ErrorTypes = {
  AUTHENTICATION: 'auth_error',
  PERMISSION: 'permission_error',
  VALIDATION: 'validation_error',
  CONNECTION: 'connection_error',
  NOT_FOUND: 'not_found',
  SCHEMA_MISMATCH: 'schema_mismatch',
  DATA_INTEGRITY: 'data_integrity',
  UNKNOWN: 'unknown_error'
};

/**
 * Schema validation options
 */
const SchemaValidation = {
  REQUIRED_FIELDS: 'required_fields',
  TYPE_CHECK: 'type_check',
  RELATIONSHIP_CHECK: 'relationship_check'
};

/**
 * Validates response data against expected schema
 * @param {Object} data - Response data
 * @param {Object} schema - Expected schema
 * @returns {{isValid: boolean, errors: string[]}} Validation result
 */
export function validateResponseSchema(data, schema) {
  const errors = [];

  if (!data) {
    return { isValid: false, errors: ['Response data is null or undefined'] };
  }

  // Check required fields
  if (schema.requiredFields) {
    schema.requiredFields.forEach(field => {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  }

  // Check field types
  if (schema.fieldTypes) {
    Object.entries(schema.fieldTypes).forEach(([field, type]) => {
      if (field in data && data[field] !== null) {
        if (type === 'array' && !Array.isArray(data[field])) {
          errors.push(`Field ${field} should be an array`);
        } else if (type !== 'array' && typeof data[field] !== type) {
          errors.push(`Field ${field} should be of type ${type}`);
        }
      }
    });
  }

  // Check relationships
  if (schema.relationships) {
    schema.relationships.forEach(rel => {
      if (data[rel.field]) {
        if (rel.type === 'one' && typeof data[rel.field] !== 'object') {
          errors.push(`Relationship ${rel.field} should be an object`);
        } else if (rel.type === 'many' && !Array.isArray(data[rel.field])) {
          errors.push(`Relationship ${rel.field} should be an array`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Maps Supabase error codes to error types
 * @param {Object} error Supabase error object
 * @returns {string} Error type from ErrorTypes
 */
export function categorizeError(error) {
  if (!error) return ErrorTypes.UNKNOWN;

  // Check for network/connection errors
  if (!navigator.onLine || error.message?.includes('network') || error.message?.includes('connection')) {
    return ErrorTypes.CONNECTION;
  }

  // Authentication errors
  if (error.code?.startsWith('auth') || error.status === 401 || error.status === 403) {
    return ErrorTypes.AUTHENTICATION;
  }

  // Permission errors
  if (error.code === 'PGRST301' || error.status === 403) {
    return ErrorTypes.PERMISSION;
  }

  // Not found errors
  if (error.code === 'PGRST404' || error.status === 404) {
    return ErrorTypes.NOT_FOUND;
  }

  // Validation errors
  if (error.code?.includes('22') || error.code?.includes('23')) {
    return ErrorTypes.VALIDATION;
  }

  return ErrorTypes.UNKNOWN;
}

/**
 * Generates a user-friendly error message based on the error type
 * @param {Object} error Supabase error object
 * @param {string} context Additional context about where the error occurred
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error, context = '') {
  const errorType = categorizeError(error);
  const contextPrefix = context ? `${context}: ` : '';

  switch (errorType) {
    case ErrorTypes.AUTHENTICATION:
      return `${contextPrefix}Authentication failed. Please check your credentials and try again.`;
    
    case ErrorTypes.PERMISSION:
      return `${contextPrefix}You don't have permission to perform this action.`;
    
    case ErrorTypes.VALIDATION:
      return `${contextPrefix}Invalid data provided. Please check your input and try again.`;
    
    case ErrorTypes.CONNECTION:
      return `${contextPrefix}Connection error. Please check your internet connection and try again.`;
    
    case ErrorTypes.NOT_FOUND:
      return `${contextPrefix}The requested resource was not found.`;
    
    default:
      return `${contextPrefix}An unexpected error occurred. Please try again later.`;
  }
}

/**
 * Handles a Supabase error by logging it and returning a user-friendly message
 * @param {Object} error Supabase error object
 * @param {string} context Additional context about where the error occurred
 * @returns {Object} Object containing error type and user-friendly message
 */
export function handleSupabaseError(error, context = '') {
  const errorType = categorizeError(error);
  const userMessage = getUserFriendlyMessage(error, context);

  // Log the error for debugging
  console.error(`Supabase Error (${errorType}):`, {
    context,
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    stack: error.stack
  });

  return {
    type: errorType,
    message: userMessage,
    originalError: error
  };
}

/**
 * Checks if an error is a network/connection error
 * @param {Object} error Error object to check
 * @returns {boolean} True if it's a connection error
 */
export function isConnectionError(error) {
  return categorizeError(error) === ErrorTypes.CONNECTION;
}

/**
 * Checks if an error is an authentication error
 * @param {Object} error Error object to check
 * @returns {boolean} True if it's an authentication error
 */
export function isAuthError(error) {
  return categorizeError(error) === ErrorTypes.AUTHENTICATION;
}
