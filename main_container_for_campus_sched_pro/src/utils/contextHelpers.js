import { enhancedSaveRoom, enhancedSaveCourse, enhancedSaveFaculty } from './entityHelpers';
import { safeScheduleCourse, safeUnscheduleCourse } from './scheduleHelpers';

/**
 * Wrapper for addRoom function in ScheduleContext
 * @param {Object} newRoom - Room data to add
 * @returns {Promise<Object>} - Result with success status and data
 */
export const safeAddRoom = async (newRoom) => {
  try {
    // Validate room data
    if (!newRoom.name || !newRoom.type || !newRoom.building) {
      return {
        success: false,
        id: null,
        message: 'Room name, type, and building are required'
      };
    }
    
    // Use enhanced save function
    const result = await enhancedSaveRoom({
      ...newRoom
      // Removed explicit null ID setting to allow database default
    });
    
    return {
      success: result.success,
      id: result.data?.id || null,
      message: result.message
    };
  } catch (error) {
    // Removed console.error for ESLint compliance
    return {
      success: false,
      id: null,
      message: `Unexpected error: ${error.message}`
    };
  }
};

/**
 * Wrapper for updateRoom function in ScheduleContext
 * @param {Object} updatedRoom - Room data to update
 * @returns {Promise<Object>} - Result with success status and data
 */
export const safeUpdateRoom = async (updatedRoom) => {
  try {
    // Validate room data
    if (!updatedRoom.id || !updatedRoom.name || !updatedRoom.type || !updatedRoom.building) {
      return {
        success: false,
        id: null,
        message: 'Room ID, name, type, and building are required'
      };
    }
    
    // Use enhanced save function
    const result = await enhancedSaveRoom(updatedRoom);
    
    return {
      success: result.success,
      id: result.data?.id || null,
      message: result.message
    };
  } catch (error) {
    // Removed console.error for ESLint compliance
    return {
      success: false,
      id: null,
      message: `Unexpected error: ${error.message}`
    };
  }
};

/**
 * Wrapper for addCourse function in ScheduleContext
 * @param {Object} newCourse - Course data to add
 * @returns {Promise<Object>} - Result with success status and data
 */
export const safeAddCourse = async (newCourse) => {
  try {
    // Validate course data
    if (!newCourse.name || !newCourse.code) {
      return {
        success: false,
        id: null,
        message: 'Course name and code are required'
      };
    }
    
    // Use enhanced save function
    const result = await enhancedSaveCourse({
      ...newCourse
      // Removed explicit null ID setting to allow database default
    });
    
    return {
      success: result.success,
      id: result.data?.id || null,
      message: result.message
    };
  } catch (error) {
    // Removed console.error for ESLint compliance
    return {
      success: false,
      id: null,
      message: `Unexpected error: ${error.message}`
    };
  }
};

/**
 * Wrapper for updateCourse function in ScheduleContext
 * @param {Object} updatedCourse - Course data to update
 * @returns {Promise<Object>} - Result with success status and data
 */
export const safeUpdateCourse = async (updatedCourse) => {
  try {
    // Validate course data
    if (!updatedCourse.id || !updatedCourse.name || !updatedCourse.code) {
      return {
        success: false,
        id: null,
        message: 'Course ID, name, and code are required'
      };
    }
    
    // Use enhanced save function
    const result = await enhancedSaveCourse(updatedCourse);
    
    return {
      success: result.success,
      id: result.data?.id || null,
      message: result.message
    };
  } catch (error) {
    console.error('Error in safeUpdateCourse:', error);
    return {
      success: false,
      id: null,
      message: `Unexpected error: ${error.message}`
    };
  }
};

/**
 * Wrapper for saveFaculty function to use in FacultyManagement
 * @param {Object} faculty - Faculty data to save
 * @returns {Promise<Object>} - Result with success status and data
 */
export const safeSaveFaculty = async (faculty) => {
  try {
    // Validate faculty data
    if (!faculty.name || !faculty.email) {
      return {
        success: false,
        id: null,
        message: 'Faculty name and email are required'
      };
    }
    
    // Use enhanced save function
    const result = await enhancedSaveFaculty(faculty);
    
    return {
      success: result.success,
      id: result.data?.id || null,
      message: result.message
    };
  } catch (error) {
    console.error('Error in safeSaveFaculty:', error);
    return {
      success: false,
      id: null,
      message: `Unexpected error: ${error.message}`
    };
  }
};
