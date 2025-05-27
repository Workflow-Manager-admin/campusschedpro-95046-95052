/**
 * Utility functions for room management and allocation
 */

/**
 * Check if a room meets the requirements for a course
 * @param {Object} room - Room information
 * @param {Object} course - Course to be scheduled in the room
 * @returns {Object} - Validation result with status and message
 */
/**
 * PUBLIC_INTERFACE
 * Check if a room meets the requirements for a course with enhanced validation
 */
export const isRoomSuitableForCourse = (room, course) => {
  // Validate input parameters
  if (!room || !course) {
    return {
      suitable: false,
      message: 'Invalid room or course data provided'
    };
  }

  // Basic room validation
  if (!room.id || !room.name || !room.capacity) {
    return {
      suitable: false,
      message: 'Invalid room configuration'
    };
  }

  // Course validation
  if (!course.id || !course.code) {
    return {
      suitable: false,
      message: 'Invalid course configuration'
    };
  }

  // Check room type compatibility
  const roomType = (room.type || '').toLowerCase();
  const courseType = (course.type || '').toLowerCase();
  
  if (courseType && !roomType.includes(courseType)) {
    return {
      suitable: false,
      message: `${course.code} requires a ${course.type} room, but ${room.name} is a ${room.type}`
    };
  }

  // Check capacity with buffer
  const requiredCapacity = course.expectedEnrollment || 0;
  const capacityBuffer = Math.ceil(requiredCapacity * 0.1); // 10% buffer
  
  if (requiredCapacity > 0 && (requiredCapacity + capacityBuffer) > room.capacity) {
    return {
      suitable: false,
      message: `Room ${room.name} capacity (${room.capacity}) is insufficient for ${course.code} (${requiredCapacity} students + ${capacityBuffer} buffer)`
    };
  }

  // Check if course requires lab facilities
  if (course.requiresLab && !roomType.includes('lab')) {
    return {
      suitable: false,
      message: `${course.code} requires a lab, but ${room.name} is not a lab facility`
    };
  }

  // Check accessibility requirements
  if (course.requiresAccessibility && !room.isAccessible) {
    return {
      suitable: false,
      message: `${course.code} requires an accessible room, but ${room.name} is not accessibility-compliant`
    };
  }

  // Check multimedia requirements
  if (course.requiresMultimedia && !room.hasMultimedia) {
    return {
      suitable: false,
      message: `${course.code} requires multimedia equipment, but ${room.name} lacks multimedia facilities`
    };
  }

  // Check specific equipment requirements
  if (course.requiredEquipment && course.requiredEquipment.length > 0) {
    if (!Array.isArray(room.equipment)) {
      return {
        suitable: false,
        message: `${room.name} has no equipment information available`
      };
    }

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

  // Check software requirements for computer labs
  if (course.requiredSoftware && course.requiredSoftware.length > 0) {
    if (!room.installedSoftware || !Array.isArray(room.installedSoftware)) {
      return {
        suitable: false,
        message: `${room.name} has no software information available`
      };
    }

    const missingSoftware = course.requiredSoftware.filter(
      software => !room.installedSoftware.some(s => s.toLowerCase().includes(software.toLowerCase()))
    );

    if (missingSoftware.length > 0) {
      return {
        suitable: false,
        message: `${room.name} is missing required software for ${course.code}: ${missingSoftware.join(', ')}`
      };
    }
  }

  // Check special requirements
  if (course.specialRequirements && course.specialRequirements.length > 0) {
    const unmetRequirements = course.specialRequirements.filter(
      req => !room.features || !room.features.includes(req)
    );

    if (unmetRequirements.length > 0) {
      return {
        suitable: false,
        message: `${room.name} does not meet special requirements for ${course.code}: ${unmetRequirements.join(', ')}`
      };
    }
  }

  return {
    suitable: true,
    message: 'Room is suitable for this course',
    details: {
      capacityUtilization: Math.round((requiredCapacity / room.capacity) * 100) + '%',
      availableEquipment: room.equipment || [],
      features: room.features || []
    }
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
