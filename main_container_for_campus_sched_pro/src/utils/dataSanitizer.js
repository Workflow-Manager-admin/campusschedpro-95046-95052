/**
 * Data sanitization utilities for handling API/database inputs
 */

/**
 * Sanitizes a string input
 * @param {any} value - Input value
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeString(value, options = {}) {
  const {
    trim = true,
    maxLength = null,
    allowEmpty = false,
    defaultValue = ''
  } = options;

  if (value == null) {
    return allowEmpty ? defaultValue : '';
  }

  let sanitized = String(value);
  if (trim) {
    sanitized = sanitized.trim();
  }

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return allowEmpty ? sanitized : (sanitized || defaultValue);
}

/**
 * Sanitizes a number input
 * @param {any} value - Input value
 * @param {Object} options - Sanitization options
 * @returns {number} Sanitized number
 */
export function sanitizeNumber(value, options = {}) {
  const {
    min = null,
    max = null,
    allowFloat = true,
    defaultValue = 0
  } = options;

  if (value == null) {
    return defaultValue;
  }

  let num = allowFloat ? parseFloat(value) : parseInt(value, 10);
  
  if (isNaN(num)) {
    return defaultValue;
  }

  if (min != null) {
    num = Math.max(min, num);
  }
  
  if (max != null) {
    num = Math.min(max, num);
  }

  return num;
}

/**
 * Sanitizes an array input
 * @param {any} value - Input value
 * @param {Object} options - Sanitization options
 * @returns {Array} Sanitized array
 */
export function sanitizeArray(value, options = {}) {
  const {
    maxLength = null,
    unique = true,
    sanitizeItems = (item) => item,
    defaultValue = []
  } = options;

  if (!Array.isArray(value)) {
    return defaultValue;
  }

  let sanitized = value
    .map(sanitizeItems)
    .filter(item => item != null);

  if (unique) {
    sanitized = [...new Set(sanitized)];
  }

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes an email address
 * @param {string} email - Email address to sanitize
 * @returns {string} Sanitized email address
 */
export function sanitizeEmail(email) {
  if (!email) return '';
  
  // Convert to string and trim
  let sanitized = String(email).trim().toLowerCase();
  
  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitizes a UUID string
 * @param {string} uuid - UUID to sanitize
 * @returns {string|null} Sanitized UUID or null if invalid
 */
export function sanitizeUUID(uuid) {
  if (!uuid) return null;
  
  const sanitized = String(uuid).trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sanitized)) {
    return null;
  }
  
  return sanitized.toLowerCase();
}

/**
 * Sanitizes a room object
 * @param {Object} room - Room object to sanitize
 * @returns {Object} Sanitized room object
 */
export function sanitizeRoom(room) {
  if (!room || typeof room !== 'object') {
    return null;
  }

  return {
    id: sanitizeUUID(room.id),
    name: sanitizeString(room.name, { maxLength: 100 }),
    type: sanitizeString(room.type, { maxLength: 50 }),
    capacity: sanitizeNumber(room.capacity, { min: 0, max: 1000 }),
    building: sanitizeString(room.building, { maxLength: 100 }),
    floor: sanitizeString(room.floor, { maxLength: 10, defaultValue: '1' }),
    equipment: sanitizeArray(room.equipment, {
      maxLength: 20,
      sanitizeItems: item => sanitizeString(item, { maxLength: 50 })
    })
  };
}

/**
 * Sanitizes a course object
 * @param {Object} course - Course object to sanitize
 * @returns {Object} Sanitized course object
 */
export function sanitizeCourse(course) {
  if (!course || typeof course !== 'object') {
    return null;
  }

  return {
    id: sanitizeUUID(course.id),
    name: sanitizeString(course.name, { maxLength: 200 }),
    code: sanitizeString(course.code, { maxLength: 20 }),
    credits: sanitizeNumber(course.credits, { min: 0, max: 20 }),
    expectedEnrollment: sanitizeNumber(course.expectedEnrollment, { min: 0, max: 500 }),
    requiresLab: Boolean(course.requiresLab),
    department: sanitizeString(course.department, { maxLength: 100, allowEmpty: true }),
    academicYear: sanitizeString(course.academicYear, { maxLength: 20, allowEmpty: true }),
    requiredEquipment: sanitizeArray(course.requiredEquipment, {
      maxLength: 20,
      sanitizeItems: item => sanitizeString(item, { maxLength: 50 })
    })
  };
}

/**
 * Sanitizes a faculty object
 * @param {Object} faculty - Faculty object to sanitize
 * @returns {Object} Sanitized faculty object
 */
export function sanitizeFaculty(faculty) {
  if (!faculty || typeof faculty !== 'object') {
    return null;
  }

  return {
    id: sanitizeUUID(faculty.id),
    name: sanitizeString(faculty.name, { maxLength: 100 }),
    email: sanitizeEmail(faculty.email),
    department: sanitizeString(faculty.department, { maxLength: 100, allowEmpty: true }),
    status: sanitizeString(faculty.status, { maxLength: 20, defaultValue: 'Available' }),
    expertise: sanitizeArray(faculty.expertise, {
      maxLength: 10,
      sanitizeItems: item => sanitizeString(item, { maxLength: 50 })
    })
  };
}
