/**
 * Enhanced validation utilities with stronger type checking and sanitization
 */

import {
  sanitizeString,
  sanitizeNumber,
  sanitizeArray,
  sanitizeEmail,
  sanitizeUUID,
  sanitizeRoom,
  sanitizeCourse,
  sanitizeFaculty
} from './dataSanitizer';

/**
 * Enhanced validation types
 */
export const ValidationTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  EMAIL: 'email',
  UUID: 'uuid',
  OBJECT: 'object',
  DATE: 'date'
};

/**
 * Validation rules for specific field types
 */
const ValidationRules = {
  ROOM_NAME: {
    type: ValidationTypes.STRING,
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s-]+$/
  },
  COURSE_CODE: {
    type: ValidationTypes.STRING,
    required: true,
    minLength: 2,
    maxLength: 20,
    pattern: /^[A-Z0-9-]+$/i
  },
  EMAIL: {
    type: ValidationTypes.EMAIL,
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

/**
 * Validate a single field with enhanced type checking and rules
 * @param {any} value - The value to validate
 * @param {Object} rules - Validation rules
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
export function validateField(value, rules) {
  const {
    type,
    required = false,
    minLength,
    maxLength,
    pattern,
    min,
    max
  } = rules;

  // Handle null/undefined for non-required fields
  if (value == null || value === '') {
    return {
      isValid: !required,
      error: required ? 'This field is required' : null
    };
  }

  let error = null;

  switch (type) {
    case ValidationTypes.STRING:
      if (typeof value !== 'string') {
        error = 'Must be a string';
        break;
      }
      if (minLength && value.length < minLength) {
        error = `Must be at least ${minLength} characters`;
      }
      if (maxLength && value.length > maxLength) {
        error = `Must be no more than ${maxLength} characters`;
      }
      if (pattern && !pattern.test(value)) {
        error = 'Invalid format';
      }
      break;

    case ValidationTypes.NUMBER:
      const num = Number(value);
      if (isNaN(num)) {
        error = 'Must be a number';
        break;
      }
      if (min != null && num < min) {
        error = `Must be at least ${min}`;
      }
      if (max != null && num > max) {
        error = `Must be no more than ${max}`;
      }
      break;

    case ValidationTypes.BOOLEAN:
      if (typeof value !== 'boolean') {
        error = 'Must be a boolean';
      }
      break;

    case ValidationTypes.ARRAY:
      if (!Array.isArray(value)) {
        error = 'Must be an array';
        break;
      }
      if (minLength && value.length < minLength) {
        error = `Must have at least ${minLength} items`;
      }
      if (maxLength && value.length > maxLength) {
        error = `Must have no more than ${maxLength} items`;
      }
      break;

    case ValidationTypes.EMAIL:
      if (!ValidationRules.EMAIL.pattern.test(value)) {
        error = 'Invalid email address';
      }
      break;

    case ValidationTypes.UUID:
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        error = 'Invalid UUID format';
      }
      break;

    case ValidationTypes.DATE:
      if (!(value instanceof Date) || isNaN(value.getTime())) {
        error = 'Invalid date';
      }
      break;

    default:
      error = 'Invalid type';
  }

  return {
    isValid: !error,
    error
  };
}

/**
 * Enhanced room validation with sanitization
 * @param {Object} room - Room object to validate
 * @returns {{isValid: boolean, errors: Object, sanitized: Object|null}} Validation result
 */
export function validateRoom(room) {
  const errors = {};
  
  // First sanitize the input
  const sanitized = sanitizeRoom(room);
  if (!sanitized) {
    return {
      isValid: false,
      errors: { _general: 'Invalid room object' },
      sanitized: null
    };
  }

  // Validate required fields
  const nameValidation = validateField(sanitized.name, {
    ...ValidationRules.ROOM_NAME,
    required: true
  });
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }

  const typeValidation = validateField(sanitized.type, {
    type: ValidationTypes.STRING,
    required: true,
    minLength: 2,
    maxLength: 50
  });
  if (!typeValidation.isValid) {
    errors.type = typeValidation.error;
  }

  const buildingValidation = validateField(sanitized.building, {
    type: ValidationTypes.STRING,
    required: true,
    minLength: 2,
    maxLength: 100
  });
  if (!buildingValidation.isValid) {
    errors.building = buildingValidation.error;
  }

  // Validate optional fields
  if (sanitized.capacity != null) {
    const capacityValidation = validateField(sanitized.capacity, {
      type: ValidationTypes.NUMBER,
      min: 0,
      max: 1000
    });
    if (!capacityValidation.isValid) {
      errors.capacity = capacityValidation.error;
    }
  }

  if (sanitized.equipment?.length > 0) {
    const equipmentErrors = sanitized.equipment
      .map(item => validateField(item, {
        type: ValidationTypes.STRING,
        minLength: 1,
        maxLength: 50
      }))
      .filter(result => !result.isValid)
      .map(result => result.error);

    if (equipmentErrors.length > 0) {
      errors.equipment = equipmentErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
}

/**
 * Enhanced course validation with sanitization
 * @param {Object} course - Course object to validate
 * @returns {{isValid: boolean, errors: Object, sanitized: Object|null}} Validation result
 */
export function validateCourse(course) {
  const errors = {};
  
  // First sanitize the input
  const sanitized = sanitizeCourse(course);
  if (!sanitized) {
    return {
      isValid: false,
      errors: { _general: 'Invalid course object' },
      sanitized: null
    };
  }

  // Validate required fields
  const nameValidation = validateField(sanitized.name, {
    type: ValidationTypes.STRING,
    required: true,
    minLength: 2,
    maxLength: 200
  });
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }

  const codeValidation = validateField(sanitized.code, {
    ...ValidationRules.COURSE_CODE,
    required: true
  });
  if (!codeValidation.isValid) {
    errors.code = codeValidation.error;
  }

  // Validate optional fields
  if (sanitized.credits != null) {
    const creditsValidation = validateField(sanitized.credits, {
      type: ValidationTypes.NUMBER,
      min: 0,
      max: 20
    });
    if (!creditsValidation.isValid) {
      errors.credits = creditsValidation.error;
    }
  }

  if (sanitized.expectedEnrollment != null) {
    const enrollmentValidation = validateField(sanitized.expectedEnrollment, {
      type: ValidationTypes.NUMBER,
      min: 0,
      max: 500
    });
    if (!enrollmentValidation.isValid) {
      errors.expectedEnrollment = enrollmentValidation.error;
    }
  }

  if (sanitized.requiredEquipment?.length > 0) {
    const equipmentErrors = sanitized.requiredEquipment
      .map(item => validateField(item, {
        type: ValidationTypes.STRING,
        minLength: 1,
        maxLength: 50
      }))
      .filter(result => !result.isValid)
      .map(result => result.error);

    if (equipmentErrors.length > 0) {
      errors.requiredEquipment = equipmentErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
}

/**
 * Enhanced faculty validation with sanitization
 * @param {Object} faculty - Faculty object to validate
 * @returns {{isValid: boolean, errors: Object, sanitized: Object|null}} Validation result
 */
export function validateFaculty(faculty) {
  const errors = {};
  
  // First sanitize the input
  const sanitized = sanitizeFaculty(faculty);
  if (!sanitized) {
    return {
      isValid: false,
      errors: { _general: 'Invalid faculty object' },
      sanitized: null
    };
  }

  // Validate required fields
  const nameValidation = validateField(sanitized.name, {
    type: ValidationTypes.STRING,
    required: true,
    minLength: 2,
    maxLength: 100
  });
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }

  const emailValidation = validateField(sanitized.email, {
    ...ValidationRules.EMAIL,
    required: true
  });
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }

  // Validate optional fields
  if (sanitized.department) {
    const departmentValidation = validateField(sanitized.department, {
      type: ValidationTypes.STRING,
      minLength: 2,
      maxLength: 100
    });
    if (!departmentValidation.isValid) {
      errors.department = departmentValidation.error;
    }
  }

  if (sanitized.expertise?.length > 0) {
    const expertiseErrors = sanitized.expertise
      .map(item => validateField(item, {
        type: ValidationTypes.STRING,
        minLength: 1,
        maxLength: 50
      }))
      .filter(result => !result.isValid)
      .map(result => result.error);

    if (expertiseErrors.length > 0) {
      errors.expertise = expertiseErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
}
