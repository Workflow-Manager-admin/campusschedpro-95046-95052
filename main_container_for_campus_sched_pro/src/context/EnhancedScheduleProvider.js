import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import useDataFetch from '../hooks/useDataFetch';
import { handleSupabaseError } from '../utils/supabaseErrorHandler';
import { supabase } from '../utils/supabaseClient';
import { isRoomSuitableForCourse } from '../utils/roomUtils';

const ScheduleContext = createContext();

// Subscription helper functions
const subscribeToSchedules = (callback) => {
  return supabase
    .from('schedules')
    .on('*', callback)
    .subscribe();
};

const subscribeToRoomAllocations = (callback) => {
  return supabase
    .from('room_allocations')
    .on('*', callback)
    .subscribe();
};

const subscribeToConflicts = (callback) => {
  return supabase
    .from('scheduling_conflicts')
    .on('*', callback)
    .subscribe();
};

const subscribeToCourses = (callback) => {
  return supabase
    .from('courses')
    .on('*', callback)
    .subscribe();
};

export const EnhancedScheduleProvider = ({ children }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [roomAllocations, setRoomAllocations] = useState(null);
  const [courses, setCourses] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [retryCount, setRetryCount] = useState(0);

  // Notification helper function
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

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
  // Set up real-time subscriptions for multiple data types
  useEffect(() => {
    const subscriptions = [];

    // Subscribe to schedule changes
    const scheduleSubscription = subscribeToSchedules((payload) => {
      setScheduleData((current) => {
        if (!current) return current;
        
        switch (payload.eventType) {
          case 'INSERT':
            return [...current, payload.new];
          case 'UPDATE':
            return current.map(item => 
              item.id === payload.new.id ? payload.new : item
            );
          case 'DELETE':
            return current.filter(item => item.id !== payload.old.id);
          default:
            return current;
        }
      });
    });
    subscriptions.push(scheduleSubscription);

    // Subscribe to room allocation changes
    const roomAllocationSubscription = subscribeToRoomAllocations((payload) => {
      setRoomAllocations((current) => {
        if (!current) return current;
        
        switch (payload.eventType) {
          case 'INSERT':
            return [...current, payload.new];
          case 'UPDATE':
            return current.map(item => 
              item.roomId === payload.new.roomId ? payload.new : item
            );
          case 'DELETE':
            return current.filter(item => item.roomId !== payload.old.roomId);
          default:
            return current;
        }
      });
    });
    subscriptions.push(roomAllocationSubscription);

    // Subscribe to conflict changes
    const conflictSubscription = subscribeToConflicts((payload) => {
      setConflicts((current) => {
        if (!current) return current;
        
        switch (payload.eventType) {
          case 'INSERT':
            showNotification(`New scheduling conflict detected: ${payload.new.message}`, 'warning');
            return [...current, payload.new];
          case 'UPDATE':
            return current.map(item => 
              item.id === payload.new.id ? payload.new : item
            );
          case 'DELETE':
            return current.filter(item => item.id !== payload.old.id);
          default:
            return current;
        }
      });
    });
    subscriptions.push(conflictSubscription);

    // Subscribe to course changes with enhanced room constraint handling
    const courseSubscription = subscribeToCourses((payload) => {
      setCourses((current) => {
        if (!current) return current;
        
        let updatedCourses;
        switch (payload.eventType) {
          case 'INSERT':
            updatedCourses = [...current, payload.new];
            // Check room constraints for newly added course
            if (payload.new.roomId) {
              checkRoomConstraints(payload.new);
            }
            return updatedCourses;
            
          case 'UPDATE':
            updatedCourses = current.map(item => 
              item.id === payload.new.id ? payload.new : item
            );
            // Check room constraints if room assignment changed
            if (payload.old.roomId !== payload.new.roomId && payload.new.roomId) {
              checkRoomConstraints(payload.new);
            }
            return updatedCourses;
            
          case 'DELETE':
            return current.filter(item => item.id !== payload.old.id);
            
          default:
            return current;
        }
      });
    });
    subscriptions.push(courseSubscription);

    // Cleanup function to remove all subscriptions
    return () => {
      subscriptions.forEach(subscription => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      });
    };
  }, [handleSubscriptionError]);

  // Check room constraints when course room assignment changes
  const checkRoomConstraints = useCallback(async (course) => {
    if (!course.roomId) return;

    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', course.roomId)
        .single();

      if (!room) {
        showNotification(`Error: Room not found for course ${course.code}`, 'error');
        return;
      }

      const suitabilityCheck = isRoomSuitableForCourse(room, course);
      
      if (!suitabilityCheck.suitable) {
        showNotification(suitabilityCheck.message, 'warning');
        
        // Log constraint violation
        await supabase
          .from('constraint_violations')
          .insert([{
            course_id: course.id,
            room_id: room.id,
            violation_type: 'room_constraint',
            message: suitabilityCheck.message,
            timestamp: new Date()
          }]);
      }
    } catch (error) {
      handleSupabaseError(error, 'Room Constraint Check');
    }
  }, [showNotification]);

  // Initial data fetch for all required data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch schedules
        const scheduleResult = await fetchScheduleData();
        setScheduleData(scheduleResult);

        // Fetch room allocations
        const { data: roomAllocationsData, error: roomAllocationsError } = await supabase
          .from('room_allocations')
          .select('*');
        if (roomAllocationsError) throw roomAllocationsError;
        setRoomAllocations(roomAllocationsData);

        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*');
        if (coursesError) throw coursesError;
        setCourses(coursesData);

        // Fetch conflicts
        const { data: conflictsData, error: conflictsError } = await supabase
          .from('scheduling_conflicts')
          .select('*');
        if (conflictsError) throw conflictsError;
        setConflicts(conflictsData);

      } catch (error) {
        const processedError = handleSupabaseError(error, 'Initial Data Load');
        showNotification(processedError.message, 'error');
      }
    };

    fetchAllData();
  }, [fetchScheduleData, showNotification]);

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
    roomAllocations,
    courses,
    conflicts,
    loading,
    error,
    progress,
    retryCount,
    notification,
    handleCloseNotification,
    refreshData: handleRetry,
    showNotification
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
    // Return a default context structure instead of throwing
    return {
      scheduleData: null,
      roomAllocations: null,
      courses: null,
      conflicts: null,
      loading: false,
      error: null,
      progress: 0,
      retryCount: 0,
      notification: { open: false, message: '', severity: 'info' },
      handleCloseNotification: () => {},
      refreshData: () => {},
      showNotification: () => {},
      errors: {} // Add errors field to match expected shape
    };
  }
  // Ensure errors field exists in returned context
  return {
    ...context,
    errors: context.error ? { general: context.error.message } : {}
  };
};

export default EnhancedScheduleProvider;
