import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  supabase, 
  fetchCourses, 
  fetchFaculty, 
  fetchRooms, 
  fetchCourseScheduleView,
  cleanup as cleanupSupabase 
} from '../utils/supabaseClient';
import { 
  getConnectionState, 
  ConnectionState 
} from '../utils/supabaseConnectionMonitor';
import { handleSupabaseError, isConnectionError } from '../utils/supabaseErrorHandler';
import { findScheduleConflicts } from '../utils/scheduleHelpers';
import { useDataFetch } from '../hooks/useDataFetch';

const ScheduleContext = createContext();

/**
 * Custom hook to access the schedule context
 * @returns {Object} Schedule context value
 */
export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}

/**
 * Enhanced Schedule Provider with robust error handling and connection monitoring
 */
export function EnhancedScheduleProvider({ children }) {
  const [schedule, setSchedule] = useState({});
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(ConnectionState.CONNECTING);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Function to show notifications
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  // Handle notification close
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Setup data fetchers with retry logic
  const courseFetcher = useDataFetch(fetchCourses);
  const facultyFetcher = useDataFetch(fetchFaculty);
  const roomsFetcher = useDataFetch(fetchRooms);
  const scheduleFetcher = useDataFetch(fetchCourseScheduleView);

  // Handle data fetching errors
  const handleFetchError = useCallback((error, context) => {
    const handledError = handleSupabaseError(error, context);
    setErrors(prev => ({ ...prev, [context]: handledError.message }));
    
    // Only show notification for non-connection errors (connection errors are handled by monitor)
    if (!isConnectionError(error)) {
      showNotification(handledError.message, 'error');
    }
  }, [showNotification]);

  // Clear specific error
  const clearError = useCallback((context) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[context];
      return newErrors;
    });
  }, []);

  // Monitor connection status
  useEffect(() => {
    const subscription = getConnectionState().subscribe(state => {
      setConnectionStatus(state);
      if (state === ConnectionState.DISCONNECTED) {
        showNotification('Lost connection to the database. Attempting to reconnect...', 'warning');
      } else if (state === ConnectionState.CONNECTED) {
        showNotification('Connection restored', 'success');
      } else if (state === ConnectionState.ERROR) {
        showNotification('Failed to connect to the database. Please try again later.', 'error');
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanupSupabase();
    };
  }, [showNotification]);

  // Load all data with retry logic
  const loadData = useCallback(async () => {
    if (connectionStatus === ConnectionState.ERROR) {
      showNotification('Cannot load data: Database connection unavailable', 'error');
      return;
    }

    setIsLoading(true);
    clearError('data');

    try {
      // Fetch all data in parallel with retry logic
      const [coursesData, facultyData, roomsData, scheduleData] = await Promise.all([
        courseFetcher.execute().catch(error => {
          handleFetchError(error, 'courses');
          return [];
        }),
        facultyFetcher.execute().catch(error => {
          handleFetchError(error, 'faculty');
          return [];
        }),
        roomsFetcher.execute().catch(error => {
          handleFetchError(error, 'rooms');
          return [];
        }),
        scheduleFetcher.execute().catch(error => {
          handleFetchError(error, 'schedule');
          return [];
        })
      ]);

      // Update state with fetched data
      setCourses(coursesData);
      setFaculty(facultyData);
      setRooms(roomsData);
      setSchedule(scheduleData);

      // Check for conflicts
      const newConflicts = findScheduleConflicts(scheduleData);
      setConflicts(newConflicts);

      if (newConflicts.length > 0) {
        showNotification(`Found ${newConflicts.length} scheduling conflicts`, 'warning');
      }
    } catch (error) {
      handleFetchError(error, 'data');
    } finally {
      setIsLoading(false);
    }
  }, [
    connectionStatus,
    courseFetcher,
    facultyFetcher,
    roomsFetcher,
    scheduleFetcher,
    handleFetchError,
    clearError,
    showNotification
  ]);

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    loadData();

    // Set up real-time subscriptions with error handling
    const setupSubscription = (channel, table) => {
      return supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          loadData().catch(error => handleFetchError(error, `real-time-update-${table}`));
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${table} changes`);
          } else if (status === 'CLOSED') {
            console.log(`Subscription to ${table} closed`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error in ${table} subscription`);
            handleFetchError(new Error(`Subscription error for ${table}`), `subscription-${table}`);
          }
        });
    };

    const subscriptions = [
      setupSubscription('courses', 'courses'),
      setupSubscription('faculty', 'faculty'),
      setupSubscription('rooms', 'rooms'),
      setupSubscription('schedule', 'schedule')
    ];

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [loadData, handleFetchError]);

  // Context value
  const value = {
    schedule,
    courses,
    faculty,
    rooms,
    conflicts,
    isLoading,
    connectionStatus,
    errors,
    notification,
    showNotification,
    handleCloseNotification,
    refreshData: loadData,
    clearError
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

export default EnhancedScheduleProvider;
