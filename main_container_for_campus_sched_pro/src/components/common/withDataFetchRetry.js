import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import DataFetchErrorBoundary from './DataFetchErrorBoundary';
import useDataFetch from '../../hooks/useDataFetch';

/**
 * Higher-order component that adds retry logic and error handling to data fetching components
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} options - Configuration options for data fetching
 * @returns {React.Component} - Enhanced component with error handling and retry logic
 */
const withDataFetchRetry = (WrappedComponent, options = {}) => {
  return function WithDataFetchRetryComponent(props) {
    // Create a ref to store the fetch function
    const fetchRef = React.useRef(null);
    
    // Initialize the data fetch hook
    const {
      execute,
      retry,
      loading,
      error,
      progress,
      clearError
    } = useDataFetch(async (...args) => {
      if (fetchRef.current) {
        return fetchRef.current(...args);
      }
      return null;
    }, options);

    // Handle the retry action
    const handleRetry = React.useCallback(async () => {
      if (retry) {
        await retry();
      }
    }, [retry]);

    // Store the fetch function in the ref when the component mounts
    React.useEffect(() => {
      if (props.fetch) {
        fetchRef.current = props.fetch;
      }
    }, [props.fetch]);

    // Enhanced props with error handling and retry capabilities
    const enhancedProps = {
      ...props,
      fetch: execute,
      loading,
      error,
      progress,
      clearError,
      onRetry: handleRetry
    };

    return (
      <DataFetchErrorBoundary onRetry={handleRetry}>
        {loading && !error ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight={200}
          >
            <CircularProgress />
          </Box>
        ) : (
          <WrappedComponent {...enhancedProps} />
        )}
      </DataFetchErrorBoundary>
    );
  };
};

export default withDataFetchRetry;
