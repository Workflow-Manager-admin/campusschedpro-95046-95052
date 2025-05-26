import React, { createContext, useContext, useState } from 'react';
import { ScheduleProvider, useSchedule } from './ScheduleContext';

// Create enhanced context for additional functionality
const EnhancedScheduleContext = createContext();

/**
 * Hook to use the enhanced schedule context
 * @returns {Object} Enhanced schedule context
 */
export const useEnhancedSchedule = () => {
  const context = useContext(EnhancedScheduleContext);
  if (!context) {
    throw new Error('useEnhancedSchedule must be used within an EnhancedScheduleProvider');
  }
  return context;
};

/**
 * Enhanced Schedule Provider component
 * Wraps the base ScheduleProvider and adds enhanced functions with error handling
 */
export const EnhancedScheduleProvider = ({ children }) => {
  // State to track error info
  const [errorInfo, setErrorInfo] = useState({
    lastError: null,
    lastErrorTime: null,
    errorCount: 0
  });

  /**
   * Helper function to safely execute operations with error handling
   */
  const safeExecute = async (operation, entityType = 'entity') => {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      // Log the error and update error state
      console.error(`Error occurred with ${entityType}:`, error);
      
      setErrorInfo(prev => ({
        lastError: error.message || 'Unknown error',
        lastErrorTime: new Date().toISOString(),
        errorCount: prev.errorCount + 1
      }));
      
      // Re-throw for component-level error handling
      throw error;
    }
  };

  /**
   * Render the enhanced provider with its wrapped context
   */
  return (
    <ScheduleProvider>
      <EnhancedScheduleProviderContent 
        safeExecute={safeExecute}
        errorInfo={errorInfo}
        setErrorInfo={setErrorInfo}
      >
        {children}
      </EnhancedScheduleProviderContent>
    </ScheduleProvider>
  );
};

/**
 * Inner component that consumes the base ScheduleContext and provides enhanced functions
 */
const EnhancedScheduleProviderContent = ({ children, safeExecute, errorInfo, setErrorInfo }) => {
  // Get the base context
  const baseContext = useSchedule();
  
  // Additional helper functions with enhanced error handling
  
  /**
   * Enhanced function to add a new room with validation
   */
  const addRoomEnhanced = (roomData) => {
    // Validate required room fields
    if (!roomData.name || !roomData.capacity) {
      const error = new Error('Room name and capacity are required');
      setErrorInfo(prev => ({
        lastError: error.message,
        lastErrorTime: new Date().toISOString(),
        errorCount: prev.errorCount + 1
      }));
      throw error;
    }
    
    // Use the safe executor
    return safeExecute(() => baseContext.addRoom(roomData), 'room');
  };
  
  /**
   * Enhanced function to add a course with validation
   */
  const addCourseEnhanced = (courseData) => {
    // Validate required course fields
    if (!courseData.name || !courseData.code) {
      const error = new Error('Course name and code are required');
      setErrorInfo(prev => ({
        lastError: error.message,
        lastErrorTime: new Date().toISOString(),
        errorCount: prev.errorCount + 1
      }));
      throw error;
    }
    
    // Use the safe executor
    return safeExecute(() => baseContext.addCourse(courseData), 'course');
  };
  
  /**
   * Enhanced function to remove a course from a slot with better error handling
   * and defensive programming against non-array coursesInSlot
   */
  // Get base context functions
  const { showNotification } = baseContext;
  
  const removeCourseFromSlotEnhanced = async (slotId, course, index) => {
    if (!slotId) {
      const error = new Error('Slot ID is required');
      setErrorInfo(prev => ({
        lastError: error.message,
        lastErrorTime: new Date().toISOString(),
        errorCount: prev.errorCount + 1
      }));
      showNotification && showNotification(`Error: ${error.message}`, 'error');
      return Promise.resolve(false);
    }
    
    if (!course) {
      const error = new Error('Course to remove is required');
      setErrorInfo(prev => ({
        lastError: error.message,
        lastErrorTime: new Date().toISOString(),
        errorCount: prev.errorCount + 1
      }));
      showNotification && showNotification(`Error: ${error.message}`, 'error');
      return Promise.resolve(false);
    }
    
    try {
      // Extract day and time from the slot ID
      const [day, time] = slotId.split('-');
      if (!day || !time) {
        throw new Error(`Invalid slot ID format: ${slotId}`);
      }
      
      // Get the current schedule for safety checks
      const { schedule } = baseContext;
      
      // Handle case where schedule is undefined
      if (!schedule) {
        showNotification && showNotification('Schedule is not available', 'error');
        return Promise.resolve(false);
      }
      
      // Safely navigate to the specific courses array - with defensive checks
      const slotExists = schedule && 
        schedule[day] && 
        schedule[day][time];
        
      if (!slotExists) {
        // Instead of throwing error, provide feedback and return gracefully
        setErrorInfo(prev => ({
          lastError: `Slot ${slotId} not found in schedule`,
          lastErrorTime: new Date().toISOString(),
          errorCount: prev.errorCount + 1
        }));
        showNotification && showNotification(`Error removing course: Slot ${slotId} not found in schedule`, 'warning');
        return Promise.resolve(false);
      }
      
      // Ensure we're working with an array before using array methods
      const coursesInSlot = Array.isArray(schedule[day][time]) ? 
        schedule[day][time] : [];
        
      if (typeof index === 'number' && index >= 0 && index < coursesInSlot.length) {
        // If index is provided, remove by index for better precision
        return baseContext.removeCourseFromSlot(coursesInSlot[index].id, day, time);
      } else {
        // Fallback to removing by course ID
        return baseContext.removeCourseFromSlot(course.id, day, time);
      }
    } catch (error) {
      // Log error and provide user feedback
      console.error(`Error removing course from slot ${slotId}:`, error);
      setErrorInfo(prev => ({
        lastError: error.message || 'Unknown error removing course',
        lastErrorTime: new Date().toISOString(),
        errorCount: prev.errorCount + 1
      }));
      return Promise.resolve(false);
    }
  };

  // Provide both the base context and our enhanced functions
  const enhancedContext = {
    ...baseContext,
    addRoomEnhanced,
    addCourseEnhanced,
    removeCourseFromSlotEnhanced,
    errorInfo
  };

  return (
    <EnhancedScheduleContext.Provider value={enhancedContext}>
      {children}
    </EnhancedScheduleContext.Provider>
  );
};

export default EnhancedScheduleProvider;
