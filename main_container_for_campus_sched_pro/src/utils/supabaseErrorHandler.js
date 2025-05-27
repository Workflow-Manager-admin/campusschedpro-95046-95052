/**
 * Comprehensive error handling for Supabase operations
 */

// Error categories for proper handling and retry decisions
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  DATABASE: 'DATABASE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Retry configuration by error type
export const RetryConfig = {
  [ErrorTypes.NETWORK]: { shouldRetry: true, maxRetries: 3 },
  [ErrorTypes.AUTHENTICATION]: { shouldRetry: false },
  [ErrorTypes.PERMISSION]: { shouldRetry: false },
  [ErrorTypes.VALIDATION]: { shouldRetry: false },
  [ErrorTypes.NOT_FOUND]: { shouldRetry: false },
  [ErrorTypes.SERVER]: { shouldRetry: true, maxRetries: 3 },
  [ErrorTypes.RATE_LIMIT]: { shouldRetry: true, maxRetries: 2 },
  [ErrorTypes.DATABASE]: { shouldRetry: true, maxRetries: 2 },
  [ErrorTypes.UNKNOWN]: { shouldRetry: true, maxRetries: 1 }
};

/**
 * Categorize the error for proper handling
 * @param {Error} error - The error object to categorize
 * @returns {string} The error type
 */
export function categorizeError(error) {
  if (!error) return ErrorTypes.UNKNOWN;

  // Network and connection errors
  if (!navigator.onLine || 
      error.code === 'NETWORK_ERROR' || 
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('connection')) {
    return ErrorTypes.NETWORK;
  }

  // Rate limiting
  if (error.code === 429 || 
      error.message?.toLowerCase().includes('too many requests')) {
    return ErrorTypes.RATE_LIMIT;
  }

  // Authentication errors
  if (error.code?.startsWith('auth') || 
      error.status === 401 || 
      error.message?.toLowerCase().includes('unauthorized')) {
    return ErrorTypes.AUTHENTICATION;
  }

  // Permission errors
  if (error.code === 'PGRST301' || 
      error.status === 403 || 
      error.message?.toLowerCase().includes('permission')) {
    return ErrorTypes.PERMISSION;
  }

  // Not found errors
  if (error.code === 'PGRST404' || 
      error.status === 404 || 
      error.message?.toLowerCase().includes('not found')) {
    return ErrorTypes.NOT_FOUND;
  }

  // Database errors
  if (error.code?.startsWith('PGRST') || 
      error.message?.toLowerCase().includes('database')) {
    return ErrorTypes.DATABASE;
  }

  // Server errors
  if (error.status >= 500 || 
      error.message?.toLowerCase().includes('server')) {
    return ErrorTypes.SERVER;
  }

  // Validation errors
  if (error.code?.includes('22') || 
      error.code?.includes('23') || 
      error.message?.toLowerCase().includes('validation')) {
    return ErrorTypes.VALIDATION;
  }

  return ErrorTypes.UNKNOWN;
}

/**
 * Check if an error should be retried
 * @param {Error} error - The error object
 * @param {number} currentAttempt - Current retry attempt number
 * @returns {boolean} Whether to retry the operation
 */
export function shouldRetryError(error, currentAttempt = 0) {
  const errorType = categorizeError(error);
  const config = RetryConfig[errorType];
  
  return config?.shouldRetry && currentAttempt < (config.maxRetries || 0);
}

/**
 * Calculate delay for next retry attempt
 * @param {number} attempt - Current attempt number
 * @returns {number} Delay in milliseconds
 */
export function getRetryDelay(attempt) {
  const baseDelay = 1000; // 1 second
  const maxDelay = 10000; // 10 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  // Add some randomness to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Get a user-friendly error message
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {number} attempt - Current retry attempt (if applicable)
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error, context = '', attempt = 0) {
  const errorType = categorizeError(error);
  const config = RetryConfig[errorType];
  const contextPrefix = context ? `${context}: ` : '';
  const retryMessage = config?.shouldRetry && attempt < config.maxRetries 
    ? ' Retrying automatically...' 
    : '';

  switch (errorType) {
    case ErrorTypes.NETWORK:
      return `${contextPrefix}Network connection error. Please check your internet connection.${retryMessage}`;
    
    case ErrorTypes.AUTHENTICATION:
      return `${contextPrefix}Authentication failed. Please log in again.`;
    
    case ErrorTypes.PERMISSION:
      return `${contextPrefix}You don't have permission to perform this action.`;
    
    case ErrorTypes.VALIDATION:
      return `${contextPrefix}Invalid data provided. Please check your input and try again.`;
    
    case ErrorTypes.NOT_FOUND:
      return `${contextPrefix}The requested resource was not found.`;
    
    case ErrorTypes.RATE_LIMIT:
      return `${contextPrefix}Too many requests. Please wait a moment and try again.${retryMessage}`;
    
    case ErrorTypes.SERVER:
      return `${contextPrefix}Server error. Please try again later.${retryMessage}`;
    
    case ErrorTypes.DATABASE:
      return `${contextPrefix}Database error occurred.${retryMessage}`;
    
    default:
      return `${contextPrefix}An unexpected error occurred.${retryMessage}`;
  }
}

/**
 * Main error handler for Supabase operations
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {number} attempt - Current retry attempt (if applicable)
 * @returns {Object} Processed error information
 */
export function handleSupabaseError(error, context = '', attempt = 0) {
  const errorType = categorizeError(error);
  const canRetry = shouldRetryError(error, attempt);
  const userMessage = getUserFriendlyMessage(error, context, attempt);

  // Log the error for debugging
  console.error(`Supabase Error (${errorType}):`, {
    context,
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    attempt: attempt,
    canRetry,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });

  return {
    type: errorType,
    message: userMessage,
    canRetry,
    retryDelay: canRetry ? getRetryDelay(attempt) : null,
    attempt,
    originalError: error
  };
}

/**
 * Check if an error is related to network/connection issues
 * @param {Error} error - The error object
 * @returns {boolean} Whether it's a network error
 */
export function isConnectionError(error) {
  return categorizeError(error) === ErrorTypes.NETWORK;
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error object
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(error) {
  return shouldRetryError(error, 0);
}
