import React from 'react';
import PropTypes from 'prop-types';

/**
 * Error boundary component for handling RoomAllocation errors
 * PUBLIC_INTERFACE
 */
class RoomAllocationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('RoomAllocation Error:', error);
      console.error('Error Info:', errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong.</h2>
          <button 
            className="btn" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

RoomAllocationErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default RoomAllocationErrorBoundary;
