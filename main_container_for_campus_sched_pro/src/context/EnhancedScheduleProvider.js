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
import { handleSupabaseError } from '../utils/supabaseErrorHandler';
import { findScheduleConflicts } from '../utils/scheduleHelpers';

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

  // Handle data fetching errors
  const handleFetchError = useCallback((error, context) => {
    const handledError = handleSupabaseError(error, context);
    setErrors(prev => ({ ...prev, [context]: handledError.message }));
    showNotification(handledError.message, 'error');
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

  // Load all data
  const loadData = useCallback(async () => {
    if (connectionStatus === ConnectionState.ERROR) {
      showNotification('Cannot load data: Database connection unavailable', 'error');
      return;
    }

    setIsLoading(true);
    clearError('data');

    try {
      // Fetch all data in parallel
      const [coursesData, facultyData, roomsData, scheduleData] = await Promise.all([
        fetchCourses().catch(error => {
          handleFetchError(error, 'courses');
          return [];
        }),
        fetchFaculty().catch(error => {
          handleFetchError(error, 'faculty');
          return [];
        }),
        fetchRooms().catch(error => {
          handleFetchError(error, 'rooms');
          return [];
        }),
        fetchCourseScheduleView().catch(error => {
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
  }, [connectionStatus, handleFetchError, clearError, showNotification]);

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    loadData();

    // Set up real-time subscriptions
    const coursesSubscription = supabase
      .channel('public:courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        loadData().catch(error => handleFetchError(error, 'real-time-update'));
      })
      .subscribe();

    const facultySubscription = supabase
      .channel('public:faculty')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, () => {
        loadData().catch(error => handleFetchError(error, 'real-time-update'));
      })
      .subscribe();

    const roomsSubscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        loadData().catch(error => handleFetchError(error, 'real-time-update'));
      })
      .subscribe();

    const scheduleSubscription = supabase
      .channel('public:schedule')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, () => {
        loadData().catch(error => handleFetchError(error, 'real-time-update'));
      })
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(coursesSubscription);
      supabase.removeChannel(facultySubscription);
      supabase.removeChannel(roomsSubscription);
      supabase.removeChannel(scheduleSubscription);
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
