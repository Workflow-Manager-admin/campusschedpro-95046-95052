import React from 'react';
import { Alert, Button, Box, Typography, Collapse } from '@mui/material';
import { handleSupabaseError } from '../../utils/supabaseErrorHandler';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    const processedError = handleSupabaseError(error, 'Application Error');
    return { 
      hasError: true, 
      error: processedError 
    };
  }

  componentDidCatch(error, errorInfo) {
    const processedError = handleSupabaseError(error, 'Application Error');
    
    this.setState({
      error: processedError,
      errorInfo
    });

    // Log error to monitoring service
    console.error('Error caught by boundary:', processedError, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;

      return (
        <Box className="error-boundary-container" sx={{ p: 3 }}>
          <Alert 
            severity="error"
            variant="filled"
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              {this.props.fallback || 'Something went wrong'}
            </Typography>
            <Typography variant="body2">
              {error.message || 'An unexpected error occurred. Please try again.'}
            </Typography>
          </Alert>

          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 2 }}>
              <Button 
                size="small" 
                color="inherit" 
                onClick={this.toggleDetails}
                sx={{ mb: 1 }}
              >
                {showDetails ? 'Hide' : 'Show'} Error Details
              </Button>
              
              <Collapse in={showDetails}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 400
                }}>
                  <Typography variant="caption" component="pre" sx={{ mb: 2 }}>
                    {error.originalError?.toString()}
                  </Typography>
                  
                  {errorInfo && (
                    <Typography variant="caption" component="pre">
                      Component Stack:
                      {errorInfo.componentStack}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
