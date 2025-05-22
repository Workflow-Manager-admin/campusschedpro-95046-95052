/**
 * Utility functions for room management and allocation
 */

/**
 * Check if a room meets the requirements for a course
 * @param {Object} room - Room information
 * @param {Object} course - Course to be scheduled in the room
 * @returns {Object} - Validation result with status and message
 */
export const isRoomSuitableForCourse = (room, course) => {
  // Check capacity
  if (course.expectedEnrollment > room.capacity) {
    return {
      suitable: false,
      message: `Room ${room.name} capacity (${room.capacity}) is insufficient for ${course.code} (${course.expectedEnrollment} students)`
    };
  }

  // Check if course requires lab and room is a lab type
  if (course.requiresLab && room.type !== 'Computer Lab' && !room.type.toLowerCase().includes('lab')) {
    return {
      suitable: false,
      message: `${course.code} requires a lab, but ${room.name} is not a lab`
    };
  }

  // Check required equipment
  if (course.requiredEquipment && course.requiredEquipment.length > 0) {
    const missingEquipment = course.requiredEquipment.filter(
      equipment => !room.equipment.some(e => e.toLowerCase().includes(equipment.toLowerCase()))
    );

    if (missingEquipment.length > 0) {
      return {
        suitable: false,
        message: `${room.name} is missing required equipment for ${course.code}: ${missingEquipment.join(', ')}`
      };
    }
  }

  return {
    suitable: true,
    message: 'Room is suitable for this course'
  };
};

/**
 * Find available rooms for a specific course
 * @param {Array} rooms - List of all rooms
 * @param {Object} course - Course to find suitable rooms for
 * @returns {Array} - List of suitable rooms
 */
export const findSuitableRooms = (rooms, course) => {
  return rooms.filter(room => isRoomSuitableForCourse(room, course).suitable);
};

/**
 * Check if a room is available at a specific time slot
 * @param {Object} allocations - Current room allocations
 * @param {string} roomId - Room ID to check
 * @param {string} slotId - Time slot to check
 * @returns {boolean} - Whether the room is available
 */
export const isRoomAvailableAtTimeSlot = (allocations, roomId, slotId) => {
  const roomAllocation = allocations.find(allocation => allocation.roomId === roomId);
  if (!roomAllocation) return true;

  return !roomAllocation.courses.some(course => 
    course.schedule.includes(slotId)
  );
};

/**
 * Assign a room to a course
 * @param {Object} course - Course to assign room to
 * @param {Object} room - Room to assign
 * @returns {Object} - Updated course with room assigned
 */
export const assignRoomToCourse = (course, room) => {
  return {
    ...course,
    room: room.name
  };
};

/**
 * Get room usage statistics
 * @param {Array} allocations - Room allocations
 * @param {string} roomId - Room ID
 * @returns {Object} - Usage statistics
 */
export const getRoomUsageStats = (allocations, roomId) => {
  const allocation = allocations.find(a => a.roomId === roomId);
  if (!allocation) {
    return {
      totalCourses: 0,
      totalHours: 0,
      usagePercentage: 0
    };
  }

  // Count total course hours (each schedule slot = 1 hour)
  const totalHours = allocation.courses.reduce((sum, course) => {
    return sum + course.schedule.length;
  }, 0);

  // Calculate usage percentage (assuming 40 available hours per week - 8 hours x 5 days)
  const usagePercentage = Math.min(100, Math.round((totalHours / 40) * 100));

  return {
    totalCourses: allocation.courses.length,
    totalHours,
    usagePercentage
  };
};
