/**
 * Utility functions for validating entity data structures
 */

/**
 * Common validation types
 */
export const ValidationTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  EMAIL: 'email',
  UUID: 'uuid'
};

/**
 * Validate a single field
 * @param {any} value - The value to validate
 * @param {string} type - The expected type from ValidationTypes
 * @param {boolean} required - Whether the field is required
 * @returns {boolean} True if valid, false otherwise
 */
export function validateField(value, type, required = true) {
  // Handle null/undefined
  if (value == null) {
    return !required;
  }

  switch (type) {
    case ValidationTypes.STRING:
      return typeof value === 'string' && (value.trim().length > 0 || !required);
    
    case ValidationTypes.NUMBER:
      return typeof value === 'number' && !isNaN(value);
    
    case ValidationTypes.BOOLEAN:
      return typeof value === 'boolean';
    
    case ValidationTypes.ARRAY:
      return Array.isArray(value);
    
    case ValidationTypes.EMAIL:
      return typeof value === 'string' && 
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    
    case ValidationTypes.UUID:
      return typeof value === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    
    default:
      return false;
  }
}

/**
 * Validate a room object
 * @param {Object} room - Room object to validate
 * @returns {{isValid: boolean, errors: string[]}} Validation result
 */
export function validateRoom(room) {
  const errors = [];

  if (!room) {
    return { isValid: false, errors: ['Room object is required'] };
  }

  // Required fields
  if (!validateField(room.name, ValidationTypes.STRING)) {
    errors.push('Room name is required and must be a non-empty string');
  }
  
  if (!validateField(room.type, ValidationTypes.STRING)) {
    errors.push('Room type is required and must be a non-empty string');
  }
  
  if (!validateField(room.building, ValidationTypes.STRING)) {
    errors.push('Building name is required and must be a non-empty string');
  }

  // Optional fields with type validation
  if (room.capacity != null && !validateField(room.capacity, ValidationTypes.NUMBER, false)) {
    errors.push('Room capacity must be a number');
  }

  if (room.floor != null && !validateField(room.floor, ValidationTypes.STRING, false)) {
    errors.push('Floor must be a string');
  }

  if (room.equipment != null && !validateField(room.equipment, ValidationTypes.ARRAY, false)) {
    errors.push('Equipment must be an array');
  }

  if (room.id != null && !validateField(room.id, ValidationTypes.UUID, false)) {
    errors.push('Room ID must be a valid UUID');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a course object
 * @param {Object} course - Course object to validate
 * @returns {{isValid: boolean, errors: string[]}} Validation result
 */
export function validateCourse(course) {
  const errors = [];

  if (!course) {
    return { isValid: false, errors: ['Course object is required'] };
  }

  // Required fields
  if (!validateField(course.name, ValidationTypes.STRING)) {
    errors.push('Course name is required and must be a non-empty string');
  }
  
  if (!validateField(course.code, ValidationTypes.STRING)) {
    errors.push('Course code is required and must be a non-empty string');
  }

  // Optional fields with type validation
  if (course.credits != null && !validateField(course.credits, ValidationTypes.NUMBER, false)) {
    errors.push('Credits must be a number');
  }

  if (course.expectedEnrollment != null && !validateField(course.expectedEnrollment, ValidationTypes.NUMBER, false)) {
    errors.push('Expected enrollment must be a number');
  }

  if (course.requiresLab != null && !validateField(course.requiresLab, ValidationTypes.BOOLEAN, false)) {
    errors.push('Requires lab must be a boolean');
  }

  if (course.department != null && !validateField(course.department, ValidationTypes.STRING, false)) {
    errors.push('Department must be a string');
  }

  if (course.academicYear != null && !validateField(course.academicYear, ValidationTypes.STRING, false)) {
    errors.push('Academic year must be a string');
  }

  if (course.requiredEquipment != null && !validateField(course.requiredEquipment, ValidationTypes.ARRAY, false)) {
    errors.push('Required equipment must be an array');
  }

  if (course.id != null && !validateField(course.id, ValidationTypes.UUID, false)) {
    errors.push('Course ID must be a valid UUID');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a faculty object
 * @param {Object} faculty - Faculty object to validate
 * @returns {{isValid: boolean, errors: string[]}} Validation result
 */
export function validateFaculty(faculty) {
  const errors = [];

  if (!faculty) {
    return { isValid: false, errors: ['Faculty object is required'] };
  }

  // Required fields
  if (!validateField(faculty.name, ValidationTypes.STRING)) {
    errors.push('Faculty name is required and must be a non-empty string');
  }
  
  if (!validateField(faculty.email, ValidationTypes.EMAIL)) {
    errors.push('Faculty email is required and must be a valid email address');
  }

  // Optional fields with type validation
  if (faculty.department != null && !validateField(faculty.department, ValidationTypes.STRING, false)) {
    errors.push('Department must be a string');
  }

  if (faculty.status != null && !validateField(faculty.status, ValidationTypes.STRING, false)) {
    errors.push('Status must be a string');
  }

  if (faculty.expertise != null && !validateField(faculty.expertise, ValidationTypes.ARRAY, false)) {
    errors.push('Expertise must be an array');
  }

  if (faculty.id != null && !validateField(faculty.id, ValidationTypes.UUID, false)) {
    errors.push('Faculty ID must be a valid UUID');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
