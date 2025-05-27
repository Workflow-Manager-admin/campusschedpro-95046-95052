import { useState, useCallback } from 'react';

// Exponential backoff configuration
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRIES = 3;

export const useDataFetch = (fetchFunction, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeWithRetry = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    let retryCount = 0;
    let delay = INITIAL_RETRY_DELAY;

    const attempt = async () => {
      try {
        const result = await fetchFunction(...args);
        setLoading(false);
        return result;
      } catch (err) {
        // If we haven't exceeded max retries and the error is retryable
        if (retryCount < MAX_RETRIES && isRetryableError(err)) {
          retryCount++;
          // Implement exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for next retry
          return attempt(); // Retry the operation
        }
        
        // If we've exhausted retries or error isn't retryable, throw it
        setError(err);
        setLoading(false);
        throw err;
      }
    };

    return attempt();
  }, [fetchFunction]);

  return {
    execute: executeWithRetry,
    loading,
    error,
    clearError: () => setError(null)
  };
};

// Helper function to determine if an error is retryable
const isRetryableError = (error) => {
  // Network errors are retryable
  if (error.name === 'NetworkError' || error.name === 'TypeError') {
    return true;
  }
  
  // Supabase specific error handling
  if (error.statusCode) {
    // Retry on 5xx server errors and specific 4xx errors
    return (
      error.statusCode >= 500 || 
      error.statusCode === 429 || // Too Many Requests
      error.statusCode === 408    // Request Timeout
    );
  }
  
  return false;
};

export default useDataFetch;
