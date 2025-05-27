import { supabase } from './supabaseClient';
import { validateRoom, validateCourse, validateFaculty } from './validationUtils';
import { handleSupabaseError } from './supabaseErrorHandler';

/**
 * Enhanced function to save a room with robust validation and sanitization
 * @param {Object} room - Room object to save
 * @returns {Promise<{success: boolean, data: Object|null, message: string, errors?: Object}>}
 */
export const enhancedSaveRoom = async (room) => {
  try {
    // Validate and sanitize room data
    const validation = validateRoom(room);
    if (!validation.isValid) {
      return {
        success: false,
        data: null,
        message: 'Invalid room data',
        errors: validation.errors
      };
    }

    const sanitizedRoom = validation.sanitized;
    
    // Get building ID
    const buildingId = await getOrCreateBuilding(sanitizedRoom.building);
    if (!buildingId) {
      return { 
        success: false, 
        data: null, 
        message: `Failed to get or create building: ${sanitizedRoom.building}`,
        errors: { building: 'Failed to create building' }
      };
    }
    
    // Prepare room data for database
    const roomData = {
      name: sanitizedRoom.name,
      type: sanitizedRoom.type,
      capacity: sanitizedRoom.capacity,
      floor: sanitizedRoom.floor,
      building_id: buildingId
    };
    
    // Only include ID for updates
    if (sanitizedRoom.id) {
      roomData.id = sanitizedRoom.id;
    }
    
    const { data, error } = await supabase
      .from('rooms')
      .upsert(roomData)
      .select()
      .single();
    
    if (error) {
      const handledError = handleSupabaseError(error, 'Saving room');
      return { 
        success: false, 
        data: null, 
        message: handledError.message,
        errors: { _supabase: handledError.message }
      };
    }
    
    if (!data?.id) {
      return { 
        success: false, 
        data: null, 
        message: 'Room was saved but no ID was returned',
        errors: { _general: 'Failed to get room ID' }
      };
    }
    
    // Handle equipment if provided
    if (sanitizedRoom.equipment?.length > 0) {
      // First remove existing equipment
      await supabase
        .from('room_equipment')
        .delete()
        .eq('room_id', data.id);
      
      // Add new equipment
      const equipmentPromises = sanitizedRoom.equipment.map(async (item) => {
        const equipmentId = await getOrCreateEquipment(item);
        if (equipmentId) {
          return supabase
            .from('room_equipment')
            .insert({
              room_id: data.id,
              equipment_id: equipmentId
            })
            .select();
        }
        return null;
      });

      await Promise.all(equipmentPromises);
    }
    
    return { 
      success: true, 
      data: { id: data.id }, 
      message: `Room ${sanitizedRoom.name} saved successfully` 
    };
  } catch (error) {
    const handledError = handleSupabaseError(error, 'Saving room');
    return { 
      success: false, 
      data: null, 
      message: handledError.message,
      errors: { _unexpected: handledError.message }
    };
  }
};

/**
 * Enhanced function to save a course with robust validation and sanitization
 * @param {Object} course - Course object to save
 * @returns {Promise<{success: boolean, data: Object|null, message: string, errors?: Object}>}
 */
export const enhancedSaveCourse = async (course) => {
  try {
    // Validate and sanitize course data
    const validation = validateCourse(course);
    if (!validation.isValid) {
      return {
        success: false,
        data: null,
        message: 'Invalid course data',
        errors: validation.errors
      };
    }

    const sanitizedCourse = validation.sanitized;
    
    // Get required IDs
    const [departmentId, academicYearId] = await Promise.all([
      sanitizedCourse.department ? getOrCreateDepartment(sanitizedCourse.department) : null,
      sanitizedCourse.academicYear ? getOrCreateAcademicYear(sanitizedCourse.academicYear) : null
    ]);
    
    // Prepare course data for database
    const courseData = {
      name: sanitizedCourse.name,
      code: sanitizedCourse.code,
      credits: sanitizedCourse.credits,
      expected_enrollment: sanitizedCourse.expectedEnrollment,
      requires_lab: sanitizedCourse.requiresLab,
      department_id: departmentId,
      academic_year_id: academicYearId
    };
    
    // Only include ID for updates
    if (sanitizedCourse.id) {
      courseData.id = sanitizedCourse.id;
    }
    
    const { data, error } = await supabase
      .from('courses')
      .upsert(courseData)
      .select()
      .single();
    
    if (error) {
      const handledError = handleSupabaseError(error, 'Saving course');
      return { 
        success: false, 
        data: null, 
        message: handledError.message,
        errors: { _supabase: handledError.message }
      };
    }
    
    if (!data?.id) {
      return { 
        success: false, 
        data: null, 
        message: 'Course was saved but no ID was returned',
        errors: { _general: 'Failed to get course ID' }
      };
    }
    
    // Handle required equipment if provided
    if (sanitizedCourse.requiredEquipment?.length > 0) {
      // First remove existing equipment
      await supabase
        .from('course_equipment')
        .delete()
        .eq('course_id', data.id);
      
      // Add new equipment
      const equipmentPromises = sanitizedCourse.requiredEquipment.map(async (item) => {
        const equipmentId = await getOrCreateEquipment(item);
        if (equipmentId) {
          return supabase
            .from('course_equipment')
            .insert({
              course_id: data.id,
              equipment_id: equipmentId
            })
            .select();
        }
        return null;
      });

      await Promise.all(equipmentPromises);
    }
    
    return { 
      success: true, 
      data: { id: data.id }, 
      message: `Course ${sanitizedCourse.code} saved successfully` 
    };
  } catch (error) {
    const handledError = handleSupabaseError(error, 'Saving course');
    return { 
      success: false, 
      data: null, 
      message: handledError.message,
      errors: { _unexpected: handledError.message }
    };
  }
};

/**
 * Enhanced function to save a faculty with robust validation and sanitization
 * @param {Object} faculty - Faculty object to save
 * @returns {Promise<{success: boolean, data: Object|null, message: string, errors?: Object}>}
 */
export const enhancedSaveFaculty = async (faculty) => {
  try {
    // Validate and sanitize faculty data
    const validation = validateFaculty(faculty);
    if (!validation.isValid) {
      return {
        success: false,
        data: null,
        message: 'Invalid faculty data',
        errors: validation.errors
      };
    }

    const sanitizedFaculty = validation.sanitized;
    
    // Get department ID if specified
    const departmentId = sanitizedFaculty.department ? 
      await getOrCreateDepartment(sanitizedFaculty.department) : null;
    
    // Prepare faculty data for database
    const facultyData = {
      name: sanitizedFaculty.name,
      email: sanitizedFaculty.email,
      department_id: departmentId,
      status: sanitizedFaculty.status
    };
    
    // Only include ID for updates
    if (sanitizedFaculty.id) {
      facultyData.id = sanitizedFaculty.id;
    }
    
    const { data, error } = await supabase
      .from('faculty')
      .upsert(facultyData)
      .select()
      .single();
    
    if (error) {
      const handledError = handleSupabaseError(error, 'Saving faculty');
      return { 
        success: false, 
        data: null, 
        message: handledError.message,
        errors: { _supabase: handledError.message }
      };
    }
    
    if (!data?.id) {
      return { 
        success: false, 
        data: null, 
        message: 'Faculty was saved but no ID was returned',
        errors: { _general: 'Failed to get faculty ID' }
      };
    }
    
    // Handle expertise if provided
    if (sanitizedFaculty.expertise?.length > 0) {
      // First remove existing expertise
      await supabase
        .from('faculty_expertise')
        .delete()
        .eq('faculty_id', data.id);
      
      // Add new expertise
      const expertiseRecords = sanitizedFaculty.expertise.map(exp => ({
        faculty_id: data.id,
        expertise: exp
      }));
      
      if (expertiseRecords.length > 0) {
        const { error: expertiseError } = await supabase
          .from('faculty_expertise')
          .insert(expertiseRecords)
          .select();
        
        if (expertiseError) {
          console.error('Error adding faculty expertise:', expertiseError);
        }
      }
    }
    
    return { 
      success: true, 
      data: { id: data.id }, 
      message: `Faculty ${sanitizedFaculty.name} saved successfully` 
    };
  } catch (error) {
    const handledError = handleSupabaseError(error, 'Saving faculty');
    return { 
      success: false, 
      data: null, 
      message: handledError.message,
      errors: { _unexpected: handledError.message }
    };
  }
};

// Helper functions to get or create related entities remain the same
// but with added error handling and sanitization

/**
 * Get or create a department with validation
 * @param {string} name - Department name
 * @returns {Promise<string|null>} Department ID or null if failed
 */
async function getOrCreateDepartment(name) {
  const sanitizedName = name?.trim();
  if (!sanitizedName) return null;
  
  try {
    // Check if department exists
    const { data: existing } = await supabase
      .from('departments')
      .select('id')
      .eq('name', sanitizedName)
      .maybeSingle();
    
    if (existing) return existing.id;
    
    // Create new department
    const { data, error } = await supabase
      .from('departments')
      .insert({ name: sanitizedName })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating department:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getOrCreateDepartment:', error);
    return null;
  }
}

/**
 * Get or create a building with validation
 * @param {string} name - Building name
 * @returns {Promise<string|null>} Building ID or null if failed
 */
async function getOrCreateBuilding(name) {
  const sanitizedName = name?.trim();
  if (!sanitizedName) return null;
  
  try {
    // Check if building exists
    const { data: existing } = await supabase
      .from('buildings')
      .select('id')
      .eq('name', sanitizedName)
      .maybeSingle();
    
    if (existing) return existing.id;
    
    // Create new building
    const { data, error } = await supabase
      .from('buildings')
      .insert({ name: sanitizedName })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating building:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getOrCreateBuilding:', error);
    return null;
  }
}

/**
 * Get or create equipment with validation
 * @param {string} name - Equipment name
 * @returns {Promise<string|null>} Equipment ID or null if failed
 */
async function getOrCreateEquipment(name) {
  const sanitizedName = name?.trim();
  if (!sanitizedName) return null;
  
  try {
    // Check if equipment exists
    const { data: existing } = await supabase
      .from('equipment_types')
      .select('id')
      .eq('name', sanitizedName)
      .maybeSingle();
    
    if (existing) return existing.id;
    
    // Create new equipment
    const { data, error } = await supabase
      .from('equipment_types')
      .insert({ name: sanitizedName })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating equipment:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getOrCreateEquipment:', error);
    return null;
  }
}

/**
 * Get or create an academic year with validation
 * @param {string} name - Academic year name
 * @returns {Promise<string|null>} Academic year ID or null if failed
 */
async function getOrCreateAcademicYear(name) {
  const sanitizedName = name?.trim();
  if (!sanitizedName) return null;
  
  try {
    // Check if academic year exists
    const { data: existing } = await supabase
      .from('academic_years')
      .select('id')
      .eq('name', sanitizedName)
      .maybeSingle();
    
    if (existing) return existing.id;
    
    // Create new academic year
    const { data, error } = await supabase
      .from('academic_years')
      .insert({ name: sanitizedName })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating academic year:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getOrCreateAcademicYear:', error);
    return null;
  }
}
