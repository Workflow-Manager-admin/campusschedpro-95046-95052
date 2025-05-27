import { useState, useCallback } from 'react';
import { isRetryableError, getRetryDelay, handleSupabaseError } from '../utils/supabaseErrorHandler';

// Enhanced retry configuration
const DEFAULT_OPTIONS = {
  maxRetries: 3,
  initialRetryDelay: 1000,
  maxRetryDelay: 10000,
  retryMultiplier: 2,
  shouldRetry: true
};

export const useDataFetch = (fetchFunction, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState({ retrying: false, attempt: 0 });

  // Merge default options with provided options
  const config = { ...DEFAULT_OPTIONS, ...options };

  const executeWithRetry = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    setProgress({ retrying: false, attempt: 0 });
    
    let currentRetry = 0;

    const attempt = async () => {
      try {
        const result = await fetchFunction(...args);
        setLoading(false);
        setRetryCount(0);
        setProgress({ retrying: false, attempt: 0 });
        return result;
      } catch (err) {
        // Use supabaseErrorHandler to process the error
        const processedError = handleSupabaseError(err, 'Data Fetch', currentRetry);
        
        // Check if we should retry based on error type and retry count
        if (config.shouldRetry && 
            currentRetry < config.maxRetries && 
            isRetryableError(err)) {
          currentRetry++;
          
          // Update state to show retry progress
          setProgress({ 
            retrying: true, 
            attempt: currentRetry,
            maxAttempts: config.maxRetries 
          });
          
          // Calculate delay using utility function
          const delay = getRetryDelay(currentRetry);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Try again
          return attempt();
        }
        
        // If we've exhausted retries or error isn't retryable
        setLoading(false);
        setError(processedError);
        setProgress({ retrying: false, attempt: 0 });
        throw processedError;
      }
    };

    return attempt();
  }, [fetchFunction, config]);

  const manualRetry = useCallback(async () => {
    if (error) {
      setRetryCount(prev => prev + 1);
      return executeWithRetry();
    }
  }, [error, executeWithRetry]);

  return {
    execute: executeWithRetry,
    retry: manualRetry,
    loading,
    error,
    progress,
    clearError: () => {
      setError(null);
      setProgress({ retrying: false, attempt: 0 });
    }
  };
};

export default useDataFetch;
