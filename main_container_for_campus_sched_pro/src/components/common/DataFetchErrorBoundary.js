import React from 'react';
import { Alert, Button, CircularProgress, Typography, Box, LinearProgress } from '@mui/material';
import { handleSupabaseError } from '../../utils/supabaseErrorHandler';

class DataFetchErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      isRetrying: false,
      retryAttempt: 0,
      maxRetries: 3
    };
  }

  static getDerivedStateFromError(error) {
    const processedError = handleSupabaseError(error, 'Data Fetch');
    return { 
      hasError: true, 
      error: processedError
    };
  }

  componentDidCatch(error, errorInfo) {
    const processedError = handleSupabaseError(error, 'Data Fetch');
    console.error('Data fetch error:', processedError, errorInfo);
  }

  handleRetry = async () => {
    this.setState(prevState => ({ 
      isRetrying: true,
      retryAttempt: prevState.retryAttempt + 1
    }));

    try {
      if (this.props.onRetry) {
        await this.props.onRetry();
      }
      this.setState({ 
        hasError: false, 
        error: null, 
        isRetrying: false,
        retryAttempt: 0
      });
    } catch (error) {
      const processedError = handleSupabaseError(error, 'Data Fetch', this.state.retryAttempt);
      this.setState({ 
        hasError: true, 
        error: processedError, 
        isRetrying: false
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, isRetrying, retryAttempt, maxRetries } = this.state;
      const retryProgress = (retryAttempt / maxRetries) * 100;
      const canRetry = retryAttempt < maxRetries;

      return (
        <Box className="data-fetch-error" sx={{ p: 2 }}>
          <Alert 
            severity={error.type === 'NETWORK_ERROR' ? 'warning' : 'error'}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={this.handleRetry}
                disabled={isRetrying || !canRetry}
                startIcon={isRetrying ? <CircularProgress size={16} /> : null}
              >
                {isRetrying ? 'Retrying...' : canRetry ? 'Retry' : 'Max Retries Reached'}
              </Button>
            }
          >
            <Typography variant="body1">
              {error.message || 'An error occurred while fetching data.'}
            </Typography>
          </Alert>

          {isRetrying && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" display="block" gutterBottom>
                Retry Attempt: {retryAttempt} of {maxRetries}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={retryProgress}
                sx={{ mt: 1 }}
              />
            </Box>
          )}

          {process.env.NODE_ENV === 'development' && error.originalError && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'grey.100', 
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: 200
            }}>
              <Typography variant="caption" component="pre">
                {JSON.stringify(error.originalError, null, 2)}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default DataFetchErrorBoundary;
