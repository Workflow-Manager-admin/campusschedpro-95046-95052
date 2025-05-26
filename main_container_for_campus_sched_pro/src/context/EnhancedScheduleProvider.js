import React, { useCallback, useState } from 'react';
import { ScheduleProvider, useSchedule } from './ScheduleContext';
import PropTypes from 'prop-types';
import {
  safeAddRoom,
  safeUpdateRoom,
  safeAddCourse,
  safeUpdateCourse,
  safeSaveFaculty
} from '../utils/contextHelpers';

/**
 * Enhanced Context provider that wraps the standard ScheduleProvider
 * and adds improved error handling and entity creation functions
 */
export const EnhancedScheduleProvider = ({ children }) => {
  return (
    <ScheduleProvider>
      <EnhancedFunctionsWrapper>
        {children}
      </EnhancedFunctionsWrapper>
    </ScheduleProvider>
  );
};

EnhancedScheduleProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Wrapper component that enhances the ScheduleContext with improved functions
 */
const EnhancedFunctionsWrapper = ({ children }) => {
  // Get the standard context
  const standardContext = useSchedule();
  const { showNotification } = standardContext;
  
  // Override the addRoom function with our safer version
  const enhancedAddRoom = useCallback(async (newRoom) => {
    try {
      showNotification('Adding new room...', 'info');
      
      const result = await safeAddRoom(newRoom);
      
      if (!result.success) {
        showNotification(`Failed to add room: ${result.message}`, 'error');
        return null;
      }
      
      // Force refresh the data
      await standardContext.refreshData();
      
      showNotification(`Room ${newRoom.name} added successfully`, 'success');
      return result.id;
    } catch (error) {
      // Removed console.error for ESLint compliance
      showNotification(`Failed to add room: ${error.message}`, 'error');
      return null;
    }
  }, [showNotification, standardContext.refreshData]);
  
  // Override the updateRoom function with our safer version
  const enhancedUpdateRoom = useCallback(async (updatedRoom) => {
    try {
      showNotification('Updating room...', 'info');
      
      const result = await safeUpdateRoom(updatedRoom);
      
      if (!result.success) {
        showNotification(`Failed to update room: ${result.message}`, 'error');
        return null;
      }
      
      // Force refresh the data
      await standardContext.refreshData();
      
      showNotification(`Room ${updatedRoom.name} updated successfully`, 'success');
      return result.id;
    } catch (error) {
      // Removed console.error for ESLint compliance
      showNotification(`Failed to update room: ${error.message}`, 'error');
      return null;
    }
  }, [showNotification, standardContext.refreshData]);
  
  // Override the addCourse function with our safer version
  const enhancedAddCourse = useCallback(async (newCourse) => {
    try {
      showNotification('Adding new course...', 'info');
      
      const result = await safeAddCourse(newCourse);
      
      if (!result.success) {
        showNotification(`Failed to add course: ${result.message}`, 'error');
        return null;
      }
      
      // Force refresh the data
      await standardContext.refreshData();
      
      showNotification(`Course ${newCourse.code} added successfully`, 'success');
      return result.id;
    } catch (error) {
      // Removed console.error for ESLint compliance
      showNotification(`Failed to add course: ${error.message}`, 'error');
      return null;
    }
  }, [showNotification, standardContext.refreshData]);
  
  // Override the updateCourse function with our safer version
  const enhancedUpdateCourse = useCallback(async (updatedCourse) => {
    try {
      showNotification('Updating course...', 'info');
      
      const result = await safeUpdateCourse(updatedCourse);
      
      if (!result.success) {
        showNotification(`Failed to update course: ${result.message}`, 'error');
        return null;
      }
      
      // Force refresh the data
      await standardContext.refreshData();
      
      showNotification(`Course ${updatedCourse.code} updated successfully`, 'success');
      return result.id;
    } catch (error) {
      // Removed console.error for ESLint compliance
      showNotification(`Failed to update course: ${error.message}`, 'error');
      return null;
    }
  }, [showNotification, standardContext.refreshData]);
  
  // Create our enhanced context by overriding specific functions
  const enhancedContext = {
    ...standardContext,
    addRoom: enhancedAddRoom,
    updateRoom: enhancedUpdateRoom,
    addCourse: enhancedAddCourse,
    updateCourse: enhancedUpdateCourse
  };

  // Use React.Children to clone the children with our enhanced context
  return React.Children.map(children, child => {
    return React.cloneElement(child, { context: enhancedContext });
  });
};

EnhancedFunctionsWrapper.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Create a hook for using the enhanced schedule context
 */
export const useEnhancedSchedule = () => {
  return useSchedule();
};
