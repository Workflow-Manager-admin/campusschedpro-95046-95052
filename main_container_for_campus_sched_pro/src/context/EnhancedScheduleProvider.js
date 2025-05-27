import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import useDataFetch from '../hooks/useDataFetch';
import { handleSupabaseError } from '../utils/supabaseErrorHandler';
import { supabase } from '../utils/supabaseClient';

const ScheduleContext = createContext();

export const EnhancedScheduleProvider = ({ children }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [retryCount, setRetryCount] = useState(0);

  // Initialize data fetching with retry logic
  const {
    execute: fetchScheduleData,
    loading,
    error,
    progress,
    retry
  } = useDataFetch(async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*');

    if (error) {
      throw error;
    }

    return data;
  }, {
    maxRetries: 3,
    shouldRetry: true
  });

  // Handle real-time subscription errors
  const handleSubscriptionError = useCallback((error) => {
    const processedError = handleSupabaseError(error, 'Real-time Subscription');
    setNotification({
      open: true,
      message: processedError.message,
      severity: 'error'
    });
  }, []);

  // Set up real-time subscription with error handling
  useEffect(() => {
    const subscription = supabase
      .from('schedules')
      .on('*', (payload) => {
        setScheduleData((current) => {
          // Handle different real-time events
          switch (payload.eventType) {
            case 'INSERT':
              return [...(current || []), payload.new];
            case 'UPDATE':
              return current?.map(item => 
                item.id === payload.new.id ? payload.new : item
              );
            case 'DELETE':
              return current?.filter(item => item.id !== payload.old.id);
            default:
              return current;
          }
        });
      })
      .subscribe((status, err) => {
        if (err) {
          handleSubscriptionError(err);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSubscriptionError]);

  // Initial data fetch
  useEffect(() => {
    fetchScheduleData()
      .then(setScheduleData)
      .catch((error) => {
        const processedError = handleSupabaseError(error, 'Initial Data Load');
        setNotification({
          open: true,
          message: processedError.message,
          severity: 'error'
        });
      });
  }, [fetchScheduleData]);

  // Handle manual retry
  const handleRetry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    try {
      const data = await retry();
      setScheduleData(data);
      setNotification({
        open: true,
        message: 'Data successfully reloaded',
        severity: 'success'
      });
    } catch (error) {
      const processedError = handleSupabaseError(error, 'Manual Retry', retryCount);
      setNotification({
        open: true,
        message: processedError.message,
        severity: 'error'
      });
    }
  }, [retry, retryCount]);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Context value with enhanced error handling
  const contextValue = {
    scheduleData,
    loading,
    error,
    progress,
    retryCount,
    notification,
    handleCloseNotification,
    refreshData: handleRetry
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          action={
            notification.severity === 'error' && retryCount < 3 ? (
              <button className="btn btn-accent" onClick={handleRetry}>
                Retry
              </button>
            ) : null
          }
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export default EnhancedScheduleProvider;
