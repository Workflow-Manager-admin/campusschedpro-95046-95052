import React from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';

class DataFetchErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isRetrying: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Data fetch error:', error, errorInfo);
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    try {
      if (this.props.onRetry) {
        await this.props.onRetry();
      }
      this.setState({ hasError: false, error: null, isRetrying: false });
    } catch (error) {
      this.setState({ hasError: true, error, isRetrying: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="data-fetch-error" style={{ padding: '20px' }}>
          <Alert 
            severity="error"
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                startIcon={this.state.isRetrying ? <CircularProgress size={16} /> : null}
              >
                {this.state.isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            }
          >
            {this.props.errorMessage || 'Failed to fetch data. Please try again.'}
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DataFetchErrorBoundary;
