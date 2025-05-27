import { supabase } from './supabaseClient';
import { validateRoom, validateCourse, validateFaculty } from './validationUtils';

/**
 * Enhanced function to save a room with better error handling
 * @param {Object} room - Room object to save
 * @returns {Promise<{success: boolean, data: Object|null, message: string, errors?: string[]}>}
 */
export const enhancedSaveRoom = async (room) => {
  try {
    // Validate room data
    const validation = validateRoom(room);
    if (!validation.isValid) {
      return {
        success: false,
        data: null,
        message: 'Invalid room data',
        errors: validation.errors
      };
    }
    
    // Get building ID
    const buildingId = await getOrCreateBuilding(room.building);
    if (!buildingId) {
      return { 
        success: false, 
        data: null, 
        message: `Failed to get or create building: ${room.building}` 
      };
    }
    
    // If room has an id, update, otherwise insert
    const roomData = {
      name: room.name,
      type: room.type,
      capacity: room.capacity || 0,
      floor: room.floor || '1',
      building_id: buildingId
    };
    
    // Only include ID if it's defined (for updates)
    if (room.id) {
      roomData.id = room.id;
    }
    
    const { data, error } = await supabase
      .from('rooms')
      .upsert(roomData)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving room:', error);
      return { 
        success: false, 
        data: null, 
        message: `Failed to save room: ${error.message}` 
      };
    }
    
    if (!data || !data.id) {
      return { 
        success: false, 
        data: null, 
        message: 'Room was saved but no ID was returned' 
      };
    }
    
    // Handle equipment if provided
    if (room.equipment && room.equipment.length > 0) {
      // First remove existing equipment
      await supabase
        .from('room_equipment')
        .delete()
        .eq('room_id', data.id);
      
      // Add new equipment
      for (const item of room.equipment) {
        const equipmentId = await getOrCreateEquipment(item);
        if (equipmentId) {
          await supabase
            .from('room_equipment')
            .insert({
              room_id: data.id,
              equipment_id: equipmentId
            })
            .select();
        }
      }
    }
    
    return { 
      success: true, 
      data: { id: data.id }, 
      message: `Room ${room.name} saved successfully` 
    };
  } catch (error) {
    console.error('Error in enhancedSaveRoom:', error);
    return { 
      success: false, 
      data: null, 
      message: `Unexpected error: ${error.message}` 
    };
  }
};

/**
 * Enhanced function to save a course with better error handling
 * @param {Object} course - Course object to save
 * @returns {Promise<{success: boolean, data: Object|null, message: string}>}
 */
export const enhancedSaveCourse = async (course) => {
  try {
    if (!course.name || !course.code) {
      return { 
        success: false, 
        data: null, 
        message: 'Course name and code are required' 
      };
    }
    
    // Get required IDs
    const departmentId = course.department ? 
      await getOrCreateDepartment(course.department) : null;
    
    const academicYearId = course.academicYear ? 
      await getOrCreateAcademicYear(course.academicYear) : null;
    
    // If course has an id, update, otherwise insert
    const courseData = {
      name: course.name,
      code: course.code,
      credits: course.credits || 0,
      expected_enrollment: course.expectedEnrollment || 0,
      requires_lab: course.requiresLab || false,
      department_id: departmentId,
      academic_year_id: academicYearId
    };
    
    // Only include ID if it's defined (for updates)
    if (course.id) {
      courseData.id = course.id;
    }
    
    const { data, error } = await supabase
      .from('courses')
      .upsert(courseData)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving course:', error);
      return { 
        success: false, 
        data: null, 
        message: `Failed to save course: ${error.message}` 
      };
    }
    
    if (!data || !data.id) {
      return { 
        success: false, 
        data: null, 
        message: 'Course was saved but no ID was returned' 
      };
    }
    
    // Handle required equipment if provided
    if (course.requiredEquipment && course.requiredEquipment.length > 0) {
      // First remove existing equipment
      await supabase
        .from('course_equipment')
        .delete()
        .eq('course_id', data.id);
      
      // Add new equipment
      for (const item of course.requiredEquipment) {
        const equipmentId = await getOrCreateEquipment(item);
        if (equipmentId) {
          await supabase
            .from('course_equipment')
            .insert({
              course_id: data.id,
              equipment_id: equipmentId
            })
            .select();
        }
      }
    }
    
    return { 
      success: true, 
      data: { id: data.id }, 
      message: `Course ${course.code} saved successfully` 
    };
  } catch (error) {
    console.error('Error in enhancedSaveCourse:', error);
    return { 
      success: false, 
      data: null, 
      message: `Unexpected error: ${error.message}` 
    };
  }
};

/**
 * Enhanced function to save a faculty with better error handling
 * @param {Object} faculty - Faculty object to save
 * @returns {Promise<{success: boolean, data: Object|null, message: string}>}
 */
export const enhancedSaveFaculty = async (faculty) => {
  try {
    if (!faculty.name || !faculty.email) {
      return { 
        success: false, 
        data: null, 
        message: 'Faculty name and email are required' 
      };
    }
    
    // Get department ID if specified
    const departmentId = faculty.department ? 
      await getOrCreateDepartment(faculty.department) : null;
    
    // If faculty has an id, update, otherwise insert
    const facultyData = {
      name: faculty.name,
      email: faculty.email,
      department_id: departmentId,
      status: faculty.status || 'Available'
    };
    
    // Only include ID if it's defined (for updates)
    if (faculty.id) {
      facultyData.id = faculty.id;
    }
    
    const { data, error } = await supabase
      .from('faculty')
      .upsert(facultyData)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving faculty:', error);
      return { 
        success: false, 
        data: null, 
        message: `Failed to save faculty: ${error.message}` 
      };
    }
    
    if (!data || !data.id) {
      return { 
        success: false, 
        data: null, 
        message: 'Faculty was saved but no ID was returned' 
      };
    }
    
    // Handle expertise if provided
    if (faculty.expertise && faculty.expertise.length > 0) {
      // First remove existing expertise
      await supabase
        .from('faculty_expertise')
        .delete()
        .eq('faculty_id', data.id);
      
      // Add new expertise
      const expertiseRecords = faculty.expertise.map(exp => ({
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
      message: `Faculty ${faculty.name} saved successfully` 
    };
  } catch (error) {
    console.error('Error in enhancedSaveFaculty:', error);
    return { 
      success: false, 
      data: null, 
      message: `Unexpected error: ${error.message}` 
    };
  }
};

// Helper functions to get or create related entities

/**
 * Get or create a department
 * @param {string} name - Department name
 * @returns {Promise<string|null>} Department ID or null if failed
 */
async function getOrCreateDepartment(name) {
  if (!name) return null;
  
  try {
    // Check if department exists
    const { data: existing } = await supabase
      .from('departments')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    
    if (existing) return existing.id;
    
    // Create new department
    const { data, error } = await supabase
      .from('departments')
      .insert({ name })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating department:', error);
      return null;
    }
    
    return data ? data.id : null;
  } catch (error) {
    console.error('Error in getOrCreateDepartment:', error);
    return null;
  }
}

/**
 * Get or create a building
 * @param {string} name - Building name
 * @returns {Promise<string|null>} Building ID or null if failed
 */
async function getOrCreateBuilding(name) {
  if (!name) return null;
  
  try {
    // Check if building exists
    const { data: existing } = await supabase
      .from('buildings')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    
    if (existing) return existing.id;
    
    // Create new building
    const { data, error } = await supabase
      .from('buildings')
      .insert({ name })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating building:', error);
      return null;
    }
    
    return data ? data.id : null;
  } catch (error) {
    console.error('Error in getOrCreateBuilding:', error);
    return null;
  }
}

/**
 * Get or create equipment
 * @param {string} name - Equipment name
 * @returns {Promise<string|null>} Equipment ID or null if failed
 */
async function getOrCreateEquipment(name) {
  if (!name) return null;
  
  try {
    // Check if equipment exists
    const { data: existing } = await supabase
      .from('equipment_types')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    
    if (existing) return existing.id;
    
    // Create new equipment
    const { data, error } = await supabase
      .from('equipment_types')
      .insert({ name })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating equipment:', error);
      return null;
    }
    
    return data ? data.id : null;
  } catch (error) {
    console.error('Error in getOrCreateEquipment:', error);
    return null;
  }
}

/**
 * Get or create an academic year
 * @param {string} name - Academic year name
 * @returns {Promise<string|null>} Academic year ID or null if failed
 */
async function getOrCreateAcademicYear(name) {
  if (!name) return null;
  
  try {
    // Check if academic year exists
    const { data: existing } = await supabase
      .from('academic_years')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    
    if (existing) return existing.id;
    
    // Create new academic year
    const { data, error } = await supabase
      .from('academic_years')
      .insert({ name })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating academic year:', error);
      return null;
    }
    
    return data ? data.id : null;
  } catch (error) {
    console.error('Error in getOrCreateAcademicYear:', error);
    return null;
  }
}
