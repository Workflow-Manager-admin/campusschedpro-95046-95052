/**
 * Data mapping utilities for transforming Supabase results to frontend models
 */

/**
 * Safe getter function for potentially null/undefined nested properties
 * @param {Object} obj - The object to get property from
 * @param {string[]} path - Array of property names forming the path
 * @param {any} defaultValue - Default value if property is not found
 * @returns {any} The property value or default value
 */
function safeGet(obj, path, defaultValue = null) {
  try {
    return path.reduce((curr, key) => curr?.[key], obj) ?? defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Maps a room from Supabase to frontend model
 * @param {Object} dbRoom - Room data from database
 * @returns {Object} Frontend room model
 */
export function mapRoom(dbRoom) {
  if (!dbRoom) return null;

  return {
    id: dbRoom.id || null,
    name: dbRoom.name || '',
    type: dbRoom.type || '',
    capacity: typeof dbRoom.capacity === 'number' ? dbRoom.capacity : 0,
    building: safeGet(dbRoom, ['building', 'name'], ''),
    floor: dbRoom.floor || '1',
    equipment: Array.isArray(dbRoom.equipment) ? 
      dbRoom.equipment.map(e => e.name).filter(Boolean) : []
  };
}

/**
 * Maps a course from Supabase to frontend model
 * @param {Object} dbCourse - Course data from database
 * @returns {Object} Frontend course model
 */
export function mapCourse(dbCourse) {
  if (!dbCourse) return null;

  return {
    id: dbCourse.id || null,
    name: dbCourse.name || '',
    code: dbCourse.code || '',
    credits: typeof dbCourse.credits === 'number' ? dbCourse.credits : 0,
    instructor: safeGet(dbCourse, ['faculty', 'name'], ''),
    expectedEnrollment: typeof dbCourse.expected_enrollment === 'number' ? 
      dbCourse.expected_enrollment : 0,
    requiresLab: Boolean(dbCourse.requires_lab),
    requiredEquipment: Array.isArray(dbCourse.required_equipment) ? 
      dbCourse.required_equipment.map(e => e.name).filter(Boolean) : [],
    department: safeGet(dbCourse, ['department', 'name'], ''),
    academicYear: safeGet(dbCourse, ['academic_year', 'name'], '')
  };
}

/**
 * Maps a faculty member from Supabase to frontend model
 * @param {Object} dbFaculty - Faculty data from database
 * @returns {Object} Frontend faculty model
 */
export function mapFaculty(dbFaculty) {
  if (!dbFaculty) return null;

  return {
    id: dbFaculty.id || null,
    name: dbFaculty.name || '',
    email: dbFaculty.email || '',
    department: safeGet(dbFaculty, ['department', 'name'], ''),
    status: dbFaculty.status || 'Available',
    expertise: Array.isArray(dbFaculty.expertise) ? 
      dbFaculty.expertise.map(e => e.expertise).filter(Boolean) : [],
    assignments: Array.isArray(dbFaculty.assignments) ? 
      dbFaculty.assignments.map(a => ({
        id: a.course?.id || null,
        code: a.course?.code || '',
        name: a.course?.name || '',
        schedule: a.schedule || []
      })).filter(a => a.id) : []
  };
}

/**
 * Maps a schedule entry from Supabase to frontend model
 * @param {Object} dbSchedule - Schedule data from database
 * @returns {Object} Frontend schedule model
 */
export function mapSchedule(dbSchedule) {
  if (!dbSchedule) return null;

  return {
    id: dbSchedule.id || null,
    courseId: safeGet(dbSchedule, ['course', 'id'], null),
    courseName: safeGet(dbSchedule, ['course', 'name'], ''),
    courseCode: safeGet(dbSchedule, ['course', 'code'], ''),
    facultyId: safeGet(dbSchedule, ['faculty', 'id'], null),
    facultyName: safeGet(dbSchedule, ['faculty', 'name'], ''),
    roomId: safeGet(dbSchedule, ['room', 'id'], null),
    roomName: safeGet(dbSchedule, ['room', 'name'], ''),
    timeSlot: {
      id: safeGet(dbSchedule, ['time_slot', 'id'], null),
      day: safeGet(dbSchedule, ['time_slot', 'day'], ''),
      time: safeGet(dbSchedule, ['time_slot', 'time'], '')
    }
  };
}

/**
 * Maps an array of database objects to frontend models
 * @param {Array} dbArray - Array of database objects
 * @param {Function} mapperFn - Mapping function to use
 * @returns {Array} Array of mapped frontend models
 */
export function mapArray(dbArray, mapperFn) {
  if (!Array.isArray(dbArray)) return [];
  return dbArray.map(item => mapperFn(item)).filter(Boolean);
}
