import { createClient } from '@supabase/supabase-js';
import { getTimeSlotId } from './getTimeSlotId';
export { getTimeSlotId };

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL||'https://alsthvnrqazftrtluxss.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsc3Rodm5ycWF6ZnRydGx1eHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NTI1MjIsImV4cCI6MjA2MzAyODUyMn0.eY4c5y2ld6z6SJZhrhtOp38bg0PsSyQbhPOyfQjThyk';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Faculty Management Functions ---

// Fetch all faculty members
export const getAllFaculty = async () => {
  const { data, error } = await supabase
    .from('faculty')
    .select(`
      id,
      name,
      email,
      status,
      departments:department_id (name),
      expertise:faculty_expertise (expertise)
    `);
  
  if (error) {
    console.error('Error fetching faculty:', error);
    return [];
  }
  
  // Transform data to match application structure
  return data.map(faculty => ({
    id: faculty.id,
    name: faculty.name,
    department: faculty.departments?.name || '',
    email: faculty.email,
    expertise: faculty.expertise?.map(item => item.expertise) || [],
    status: faculty.status,
    assignments: [] // To be populated with course assignments
  }));
};

// Fetch faculty teaching assignments
export const getFacultyAssignments = async (facultyId) => {
  const { data, error } = await supabase
    .from('schedule')
    .select(`
      course_id,
      courses:course_id (id, name, code, credits),
      time_slots:time_slot_id (day, time)
    `)
    .eq('faculty_id', facultyId);
    
  if (error) {
    console.error('Error fetching faculty assignments:', error);
    return [];
  }
  
  // Group by course
  const assignmentsByCourse = {};
  
  data.forEach(item => {
    if (!item.courses) return;
    
    const courseId = item.courses.id;
    const schedule = `${item.time_slots.day}-${item.time_slots.time}`;
    
    if (!assignmentsByCourse[courseId]) {
      assignmentsByCourse[courseId] = {
        id: courseId,
        name: item.courses.name,
        code: item.courses.code,
        credits: item.courses.credits,
        schedule: [schedule]
      };
    } else {
      assignmentsByCourse[courseId].schedule.push(schedule);
    }
  });
  
  return Object.values(assignmentsByCourse);
};

// Create or update faculty
export const saveFaculty = async (faculty) => {
  // If faculty has an id, update, otherwise insert
  const facultyData = {
    name: faculty.name,
    email: faculty.email,
    department_id: await getDepartmentId(faculty.department),
    status: faculty.status || 'Available'
  };
  
  // Only include ID if it's defined (for updates)
  if (faculty.id) {
    facultyData.id = faculty.id;
  }
  
  const { data, error } = await supabase
    .from('faculty')
    .upsert(facultyData)
    .select('id')
    .single();
    
  if (error) {
    console.error('Error saving faculty:', error);
    return null;
  }
  
  // Update expertise
  if (faculty.expertise && faculty.expertise.length > 0) {
    // First, remove existing expertise
    await supabase
      .from('faculty_expertise')
      .delete()
      .eq('faculty_id', data.id);
      
    // Then insert new expertise
    const expertiseRecords = faculty.expertise.map(exp => ({
      faculty_id: data.id,
      expertise: exp
    }));
    
    await supabase
      .from('faculty_expertise')
      .insert(expertiseRecords)
      .select();
  }
  
  return data.id;
};

// Delete faculty
export const deleteFaculty = async (facultyId) => {
  const { error } = await supabase
    .from('faculty')
    .delete()
    .eq('id', facultyId);
    
  if (error) {
    console.error('Error deleting faculty:', error);
    return false;
  }
  
  return true;
};

// --- Course Management Functions ---

// Fetch all courses
export const getAllCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      id,
      name,
      code,
      credits,
      expected_enrollment,
      requires_lab,
      departments:department_id (name),
      academic_years:academic_year_id (name),
      equipment:course_equipment (
        equipment:equipment_id (name)
      )
    `);
  
  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  
  // Transform data to match application structure with better null handling
  return data.map(course => {
    if (!course || !course.id) return null;
    
    return {
      id: course.id,
      name: course.name || '',
      code: course.code || '',
      credits: course.credits || 0,
      expectedEnrollment: course.expected_enrollment || 0,
      requiresLab: Boolean(course.requires_lab),
      department: course.departments?.name || '',
      academicYear: course.academic_years?.name || '',
      requiredEquipment: Array.isArray(course.equipment) 
        ? course.equipment
            .filter(item => item && item.equipment)
            .map(item => item.equipment.name)
            .filter(Boolean)
        : []
    };
  }).filter(Boolean);
};

// Fetch course assignments (instructor and room)
export const getCourseAssignments = async (courseIds) => {
  if (!courseIds || courseIds.length === 0) return {};
  
  const { data, error } = await supabase
    .from('schedule')
    .select(`
      course_id,
      faculty:faculty_id (id, name),
      rooms:room_id (id, name, building:building_id(name)),
      time_slots:time_slot_id (day, time)
    `)
    .in('course_id', courseIds);
    
  if (error) {
    console.error('Error fetching course assignments:', error);
    return {};
  }
  
  const assignments = {};
  
  data.forEach(item => {
    if (!assignments[item.course_id]) {
      assignments[item.course_id] = {
        instructor: item.faculty?.name || '',
        instructorId: item.faculty?.id || null,
        room: item.rooms?.name || '',
        roomId: item.rooms?.id || null,
        building: item.rooms?.building?.name || '',
        schedule: []
      };
    }
    
    assignments[item.course_id].schedule.push(
      `${item.time_slots.day}-${item.time_slots.time}`
    );
  });
  
  return assignments;
};

// Create or update course
export const saveCourse = async (course) => {
  // Get department and academic year IDs
  const departmentId = await getDepartmentId(course.department);
  const academicYearId = await getAcademicYearId(course.academicYear);
  
  // If course has an id, update, otherwise insert
  const courseData = {
    name: course.name,
    code: course.code,
    credits: course.credits,
    expected_enrollment: course.expectedEnrollment,
    requires_lab: course.requiresLab,
    department_id: departmentId,
    academic_year_id: academicYearId
    // room_id removed; not present in schema
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
    return null;
  }
  
  if (!data || !data.id) {
    console.error('Course was saved but no ID was returned');
    return null;
  }
  
  // Update required equipment
  if (course.requiredEquipment && course.requiredEquipment.length > 0) {
    // First, remove existing equipment
    await supabase
      .from('course_equipment')
      .delete()
      .eq('course_id', data.id);
      
    // Get equipment IDs
    const equipmentRecords = [];
    for (const equipment of course.requiredEquipment) {
      const equipmentId = await getEquipmentId(equipment);
      if (equipmentId) {
        equipmentRecords.push({
          course_id: data.id,
          equipment_id: equipmentId
        });
      }
    }
    
    // Insert new equipment
    if (equipmentRecords.length > 0) {
      await supabase
        .from('course_equipment')
        .insert(equipmentRecords)
        .select();
    }
  }
  
  return data.id;
};

// Delete course
export const deleteCourse = async (courseId) => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);
    
  if (error) {
    console.error('Error deleting course:', error);
    return false;
  }
  
  return true;
};

// --- Room Management Functions ---

// Fetch all rooms
export const getAllRooms = async () => {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id,
      name,
      type,
      capacity,
      floor,
      buildings:building_id (name),
      equipment:room_equipment (
        equipment:equipment_id (name)
      )
    `);
  
  if (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
  
  // Transform data to match application structure
  return data.map(room => ({
    id: room.id,
    name: room.name,
    type: room.type,
    capacity: room.capacity,
    floor: room.floor,
    building: room.buildings?.name || '',
    equipment: room.equipment?.map(item => item.equipment?.name) || []
  }));
};

// Create or update room
export const saveRoom = async (room) => {
  // Get building ID
  const buildingId = await getBuildingId(room.building);
  
  // If room has an id, update, otherwise insert
  const roomData = {
    name: room.name,
    type: room.type,
    capacity: room.capacity,
    floor: room.floor,
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
    return null;
  }
  
  if (!data || !data.id) {
    console.error('Room was saved but no ID was returned');
    return null;
  }
  
  // Update equipment
  if (room.equipment && room.equipment.length > 0) {
    // First, remove existing equipment
    await supabase
      .from('room_equipment')
      .delete()
      .eq('room_id', data.id);
      
    // Get equipment IDs
    const equipmentRecords = [];
    for (const equipment of room.equipment) {
      const equipmentId = await getEquipmentId(equipment);
      if (equipmentId) {
        equipmentRecords.push({
          room_id: data.id,
          equipment_id: equipmentId
        });
      }
    }
    
    // Insert new equipment
    if (equipmentRecords.length > 0) {
      await supabase
        .from('room_equipment')
        .insert(equipmentRecords)
        .select();
    }
  }
  
  return data.id;
};

// Delete room
export const deleteRoom = async (roomId) => {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId);
    
  if (error) {
    console.error('Error deleting room:', error);
    return false;
  }
  
  return true;
};

// --- Schedule Management Functions ---

// Fetch complete schedule
export const getSchedule = async () => {
  try {
    // Get all courses first to have a complete reference
    const coursesData = await getAllCourses();
    
    // Create a map for quick lookup by ID
    const courseMap = {};
    coursesData.forEach(course => {
      courseMap[course.id] = course;
    });
    
    // Get schedule data from view
    const { data, error } = await supabase
      .from('course_schedule_view')
      .select(`
        course_id,
        course_name,
        course_code,
        course_credits,
        faculty_id,
        faculty_name,
        room_id,
        room_name,
        day,
        time
      `);
      
    if (error) {
      console.error('Error fetching schedule:', error);
      return {};
    }
    
    // Transform data to match application structure
    const schedule = {};
    
    const normalizeDay = (day) => {
      // Ensure first letter uppercase, rest lowercase; trim whitespace.
      if (!day) return '';
      const trimmed = day.trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    };
    const normalizeTime = (time) => {
      // Remove whitespace, standardize AM/PM casing and leading zero issues.
      if (!time) return '';
      let trimmed = time.trim();
      // Capitalize AM/PM, remove any leading zeros, standardize spacing (e.g., '9:00 AM', not '9:00AM' or '09:00 am').
      trimmed = trimmed.replace(/\s*([AaPp][Mm])$/, " $1"); // space before AM/PM
      // capitalize AM/PM
      trimmed = trimmed.replace(/([AaPp][Mm])$/, (m) => m.toUpperCase());
      // Remove leading zero (e.g., 09:00 AM  --> 9:00 AM)
      trimmed = trimmed.replace(/^0+/, '');
      return trimmed;
    };

    data.forEach(item => {
      if (!item || !item.day || !item.time) return;

      // Normalize to precisely match Timetable key format (e.g., "Monday-9:00 AM")
      const slotId = `${normalizeDay(item.day)}-${normalizeTime(item.time)}`;
      
      if (!schedule[slotId]) {
        schedule[slotId] = [];
      }
      
      // Get academic year and department from course map
      const courseInfo = courseMap[item.course_id] || {};
      const academicYear = courseInfo.academicYear || '';
      const department = courseInfo.department || '';
      
      // Only add valid courses to the schedule
      if (item.course_id && item.course_name) {
        schedule[slotId].push({
          id: item.course_id,
          name: item.course_name || '',
          code: item.course_code || '',
          credits: item.course_credits || 0,
          instructor: item.faculty_name || '',
          instructorId: item.faculty_id || null,
          room: item.room_name || '',
          roomId: item.room_id || null,
          academicYear,
          department
        });
      }
    });
    
    return schedule;
  } catch (error) {
    return {};
  }
};

// Schedule a course in a time slot
/**
 * PUBLIC_INTERFACE
 * Schedule a course in a time slot. Ensures all fields are valid and non-null; logs error if payload malformed or references invalid IDs.
 * @param {string} courseId 
 * @param {string|null} facultyId 
 * @param {string|null} roomId 
 * @param {string} timeSlotId 
 * @returns {Promise<boolean>}
 */
export const scheduleCourse = async (courseId, facultyId, roomId, timeSlotId) => {
  // Validate payload keys - all must be non-null, truthy, and string
  if (!courseId || typeof courseId !== "string"
      || !timeSlotId || typeof timeSlotId !== "string"
      || !facultyId || typeof facultyId !== "string"
      || !roomId || typeof roomId !== "string") {
    const errorObj = {
      courseId, facultyId, roomId, timeSlotId,
      at: Date.now(),
      reason: "InvalidCourseSchedulingPayload"
    };
    if (typeof window !== "undefined") {
      window._scheduleDebug = window._scheduleDebug || {};
      window._scheduleDebug.scheduleCourseInvalidPayload = errorObj;
    }
    console.error("[scheduleCourse] Invalid payload: ", errorObj);
    // Optionally: Display a user-facing notification here if called from UI context
    return false;
  }

  // Check existence of referenced records (defensive but not strictly required if data is always correct)
  // (These can be removed for performance if not necessary)
  const [course, faculty, room, slot] = await Promise.all([
    supabase.from('courses').select('id').eq('id', courseId).maybeSingle(),
    supabase.from('faculty').select('id').eq('id', facultyId).maybeSingle(),
    supabase.from('rooms').select('id').eq('id', roomId).maybeSingle(),
    supabase.from('time_slots').select('id').eq('id', timeSlotId).maybeSingle()
  ]);
  if (!course.data || !faculty.data || !room.data || !slot.data) {
    const errorRefObj = {
      courseId, facultyId, roomId, timeSlotId,
      courseExists: !!course.data,
      facultyExists: !!faculty.data,
      roomExists: !!room.data,
      slotExists: !!slot.data,
      at: Date.now(),
      reason: "ReferencedRecordNotFound"
    };
    if (typeof window !== "undefined") {
      window._scheduleDebug = window._scheduleDebug || {};
      window._scheduleDebug.scheduleCourseMissingRef = errorRefObj;
    }
    console.error("[scheduleCourse] One or more referenced IDs do not exist:", errorRefObj);
    return false;
  }

  // Check if this course is already scheduled in this time slot
  const { data: existing, error: checkError } = await supabase
    .from('schedule')
    .select('id')
    .eq('course_id', courseId)
    .eq('time_slot_id', timeSlotId)
    .maybeSingle();
    
  if (checkError) {
    console.error('[scheduleCourse] Error checking schedule:', checkError);
    return false;
  }
  
  if (existing) {
    // Update existing schedule
    const { error } = await supabase
      .from('schedule')
      .update({ faculty_id: facultyId, room_id: roomId })
      .eq('id', existing.id);
      
    if (error) {
      console.error('[scheduleCourse] Error updating schedule:', error);
      return false;
    }
  } else {
    // Insert new schedule
    const payload = {
      course_id: courseId,
      faculty_id: facultyId,
      room_id: roomId,
      time_slot_id: timeSlotId
    };
    const { error } = await supabase
      .from('schedule')
      .insert(payload);

    if (error) {
      console.error('[scheduleCourse] Error inserting schedule:', {
        payload, error
      });
      return false;
    }
  }
  
  return true;
};

/**
 * PUBLIC_INTERFACE
 * Remove a course from a time slot by courseId and timeSlotId (NOT day/time-text).
 * @param {string} courseId 
 * @param {string} timeSlotId 
 * @returns {Promise<boolean>}
 */
export const unscheduleCourse = async (courseId, timeSlotId) => {
  try {
    if (!courseId || !timeSlotId) {
      console.error('Invalid unscheduleCourse arguments:', courseId, timeSlotId);
      return false;
    }
    // Delete the schedule entry matching course and time slot
    const { error } = await supabase
      .from('schedule')
      .delete()
      .eq('course_id', courseId)
      .eq('time_slot_id', timeSlotId);

    if (error) {
      console.error('Error removing course from schedule:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Unexpected error in unscheduleCourse:', error);
    return false;
  }
};

// --- Helper Functions ---

// Get department ID, create if it doesn't exist
const getDepartmentId = async (departmentName) => {
  if (!departmentName) return null;
  
  // Check if department exists
  const { data: existing } = await supabase
    .from('departments')
    .select('id')
    .eq('name', departmentName)
    .maybeSingle();
    
  if (existing) return existing.id;
  
  // Create new department
  const { data } = await supabase
    .from('departments')
    .insert({ name: departmentName })
    .select()
    .single();
    
  return data?.id || null;
};

// Get building ID, create if it doesn't exist
const getBuildingId = async (buildingName) => {
  if (!buildingName) return null;
  
  // Check if building exists
  const { data: existing } = await supabase
    .from('buildings')
    .select('id')
    .eq('name', buildingName)
    .maybeSingle();
    
  if (existing) return existing.id;
  
  // Create new building
  const { data } = await supabase
    .from('buildings')
    .insert({ name: buildingName })
    .select()
    .single();
    
  return data?.id || null;
};

// Get equipment ID, create if it doesn't exist
const getEquipmentId = async (equipmentName) => {
  if (!equipmentName) return null;
  
  // Check if equipment exists
  const { data: existing } = await supabase
    .from('equipment_types')
    .select('id')
    .eq('name', equipmentName)
    .maybeSingle();
    
  if (existing) return existing.id;
  
  // Create new equipment
  const { data } = await supabase
    .from('equipment_types')
    .insert({ name: equipmentName })
    .select()
    .single();
    
  return data?.id || null;
};

// Fetch all departments
export const getAllDepartments = async () => {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name')
    .order('name');
  
  if (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
  
  return data || [];
};

// Get academic year ID, create if it doesn't exist
const getAcademicYearId = async (yearName) => {
  if (!yearName) return null;
  
  // Check if academic year exists
  const { data: existing } = await supabase
    .from('academic_years')
    .select('id')
    .eq('name', yearName)
    .maybeSingle();
    
  if (existing) return existing.id;
  
  // Create new academic year
  const { data } = await supabase
    .from('academic_years')
    .insert({ name: yearName })
    .select()
    .single();
    
  return data?.id || null;
};

// Parse time slot ID to get day and time
export const parseTimeSlotId = (slotId) => {
  const [day, time] = slotId.split('-');
  return { day, time };
};
