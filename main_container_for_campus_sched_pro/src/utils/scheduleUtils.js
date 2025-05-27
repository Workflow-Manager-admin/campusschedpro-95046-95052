/**
 * Utility functions for course scheduling validation, conflict detection and resolution
 */

import { supabase } from './supabaseClient';

/**
 * PUBLIC_INTERFACE
 * Check if a time slot is available for a course with enhanced validation
 */
export const isSlotAvailable = (schedule, slotId, course) => {
  if (!schedule || !slotId || !course) return false;
  
  const slotContent = schedule[slotId] || [];
  const currentCourses = Array.isArray(slotContent) ? slotContent : [];
  
  if (currentCourses.length === 0) return true;
  
  return !currentCourses.some(existingCourse => {
    if (!existingCourse) return false;
    if (existingCourse.code === course.code) return false;
    
    // Check for instructor conflicts
    if (existingCourse.instructor === course.instructor) return true;
    
    // Check for room conflicts
    if (existingCourse.room && course.room && existingCourse.room === course.room) return true;
    
    // Check for student group conflicts
    if (existingCourse.studentGroup && course.studentGroup && 
        existingCourse.studentGroup === course.studentGroup) return true;
    
    return false;
  });
};

/**
 * PUBLIC_INTERFACE
 * Enhanced conflict detection with detailed analysis
 */
export const findScheduleConflicts = async (schedule) => {
  const conflicts = [];
  const constraintViolations = [];
  
  for (const [slotId, courses] of Object.entries(schedule)) {
    const validCourses = Array.isArray(courses) ? courses : [];
    if (validCourses.length > 1) {
      for (let i = 0; i < validCourses.length; i++) {
        for (let j = i + 1; j < validCourses.length; j++) {
          const course1 = validCourses[i];
          const course2 = validCourses[j];
          
          // Instructor conflicts
          if (course1.instructor === course2.instructor) {
            conflicts.push({
              id: `instructor-${slotId}-${course1.code}-${course2.code}`,
              type: 'instructor',
              slotId,
              courses: [course1, course2],
              message: `Instructor ${course1.instructor} is scheduled for both ${course1.code} and ${course2.code} at ${slotId}`,
              severity: 'high'
            });
          }
          
          // Room conflicts
          if (course1.room && course2.room && course1.room === course2.room) {
            conflicts.push({
              id: `room-${slotId}-${course1.code}-${course2.code}`,
              type: 'room',
              slotId,
              courses: [course1, course2],
              message: `Room ${course1.room} is double-booked for ${course1.code} and ${course2.code} at ${slotId}`,
              severity: 'high'
            });
          }
          
          // Student group conflicts
          if (course1.studentGroup && course2.studentGroup && 
              course1.studentGroup === course2.studentGroup) {
            conflicts.push({
              id: `group-${slotId}-${course1.code}-${course2.code}`,
              type: 'student_group',
              slotId,
              courses: [course1, course2],
              message: `Student group ${course1.studentGroup} has conflicting courses: ${course1.code} and ${course2.code} at ${slotId}`,
              severity: 'medium'
            });
          }
        }
      }
    }
    
    // Check individual course constraints
    for (const course of validCourses) {
      // Validate room constraints
      if (course.room) {
        const { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', course.roomId)
          .single();
          
        if (room) {
          const constraints = checkRoomConstraints(course, room);
          if (!constraints.suitable) {
            constraintViolations.push({
              id: `constraint-${slotId}-${course.code}`,
              type: 'room_constraint',
              slotId,
              course,
              message: constraints.message,
              severity: 'medium'
            });
          }
        }
      }
      
      // Check department scheduling policies
      if (course.department) {
        const policyViolations = checkDepartmentPolicies(course, slotId);
        if (policyViolations.length > 0) {
          constraintViolations.push(...policyViolations.map(violation => ({
            id: `policy-${slotId}-${course.code}-${violation.type}`,
            type: 'department_policy',
            slotId,
            course,
            message: violation.message,
            severity: 'low'
          })));
        }
      }
    }
  }
  
  return [...conflicts, ...constraintViolations];
};

/**
 * PUBLIC_INTERFACE
 * Find available time slots with enhanced scheduling logic
 */
export const findAvailableTimeSlots = (schedule, course, options = {}) => {
  const {
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    times = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
    preferSameDay = true,
    avoidConsecutive = false,
    respectBreaks = true
  } = options;

  const availableSlots = [];
  const instructorSchedule = getInstructorSchedule(schedule, course.instructor);
  
  for (const day of days) {
    for (const time of times) {
      const slotId = `${day}-${time}`;
      
      if (!isSlotAvailable(schedule, slotId, course)) continue;
      
      // Check instructor's consecutive slots if needed
      if (avoidConsecutive) {
        const prevSlot = getPreviousTimeSlot(slotId);
        const nextSlot = getNextTimeSlot(slotId);
        if (instructorSchedule[prevSlot] || instructorSchedule[nextSlot]) continue;
      }
      
      // Respect lunch breaks and department meeting times
      if (respectBreaks && isBreakTime(time)) continue;
      
      availableSlots.push({
        slotId,
        priority: calculateSlotPriority(slotId, course, options)
      });
    }
  }
  
  return availableSlots
    .sort((a, b) => b.priority - a.priority)
    .map(slot => slot.slotId);
};

/**
 * PUBLIC_INTERFACE
 * Suggest alternative time slots with comprehensive analysis
 */
export const suggestAlternativeTimeSlots = (schedule, course, conflictSlotId) => {
  const { day } = formatSlotId(conflictSlotId);
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // First try same day options
  const sameDayOptions = findAvailableTimeSlots(schedule, course, {
    days: [day],
    preferSameDay: true,
    avoidConsecutive: course.requiresLab,
    respectBreaks: true
  });
  
  if (sameDayOptions.length > 0) return sameDayOptions;
  
  // Then try other days with department preferences
  const departmentPreferences = course.departmentPreferences || {};
  const preferredDays = departmentPreferences.preferredDays || allDays;
  const otherDays = preferredDays.filter(d => d !== day);
  
  return findAvailableTimeSlots(schedule, course, {
    days: otherDays,
    preferSameDay: false,
    avoidConsecutive: course.requiresLab,
    respectBreaks: true
  });
};

/**
 * Check room constraints for a course
 */
const checkRoomConstraints = (course, room) => {
  if (course.expectedEnrollment > room.capacity) {
    return {
      suitable: false,
      message: `Room capacity (${room.capacity}) is insufficient for expected enrollment (${course.expectedEnrollment})`
    };
  }
  
  if (course.requiresLab && !room.type.toLowerCase().includes('lab')) {
    return {
      suitable: false,
      message: 'Course requires a lab but room is not a laboratory'
    };
  }
  
  if (course.requiredEquipment) {
    const missingEquipment = course.requiredEquipment.filter(
      eq => !room.equipment.includes(eq)
    );
    if (missingEquipment.length > 0) {
      return {
        suitable: false,
        message: `Room missing required equipment: ${missingEquipment.join(', ')}`
      };
    }
  }
  
  return { suitable: true };
};

/**
 * Get instructor's current schedule
 */
const getInstructorSchedule = (schedule, instructorId) => {
  const instructorSchedule = {};
  
  Object.entries(schedule).forEach(([slotId, courses]) => {
    if (Array.isArray(courses) && 
        courses.some(course => course.instructor === instructorId)) {
      instructorSchedule[slotId] = true;
    }
  });
  
  return instructorSchedule;
};

/**
 * Check department scheduling policies
 */
const checkDepartmentPolicies = (course, slotId) => {
  const violations = [];
  const { day, time } = formatSlotId(slotId);
  const policies = course.departmentPolicies || {};
  
  if (policies.restrictedTimes && 
      policies.restrictedTimes.includes(time)) {
    violations.push({
      type: 'restricted_time',
      message: `${time} is a restricted time for ${course.department}`
    });
  }
  
  if (policies.maxCoursesPerDay) {
    // Implementation for max courses per day check
  }
  
  return violations;
};

/**
 * Calculate priority score for a time slot
 */
const calculateSlotPriority = (slotId, course, options) => {
  let priority = 0;
  const { day, time } = formatSlotId(slotId);
  
  // Preferred days get higher priority
  if (course.departmentPreferences?.preferredDays?.includes(day)) {
    priority += 2;
  }
  
  // Preferred times get higher priority
  if (course.departmentPreferences?.preferredTimes?.includes(time)) {
    priority += 2;
  }
  
  // Morning slots for lower year courses
  if (course.yearLevel <= 2 && ismorningSlot(time)) {
    priority += 1;
  }
  
  return priority;
};

/**
 * Format slot ID into day and time
 */
export const formatSlotId = (slotId) => {
  const [day, time] = slotId.split('-');
  return { day, time };
};

/**
 * Get adjacent time slots
 */
const getPreviousTimeSlot = (slotId) => {
  const { day, time } = formatSlotId(slotId);
  const timeIndex = ALL_TIMES.indexOf(time);
  if (timeIndex > 0) {
    return `${day}-${ALL_TIMES[timeIndex - 1]}`;
  }
  return null;
};

const getNextTimeSlot = (slotId) => {
  const { day, time } = formatSlotId(slotId);
  const timeIndex = ALL_TIMES.indexOf(time);
  if (timeIndex < ALL_TIMES.length - 1) {
    return `${day}-${ALL_TIMES[timeIndex + 1]}`;
  }
  return null;
};

/**
 * Check if a time is a break period
 */
const isBreakTime = (time) => {
  return time === '12:00 PM'; // Lunch break
};

/**
 * Check if a time is a morning slot
 */
const ismorningSlot = (time) => {
  return ['9:00 AM', '10:00 AM', '11:00 AM'].includes(time);
};

// Constants
const ALL_TIMES = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
];
