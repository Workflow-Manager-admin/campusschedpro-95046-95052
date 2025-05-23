import { createClient } from '@supabase/supabase-js';

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
  const { data, error } = await supabase
    .from('faculty')
    .upsert({
      id: faculty.id, // Will be null for new faculty
      name: faculty.name,
      email: faculty.email,
      department_id: await getDepartmentId(faculty.department),
      status: faculty.status || 'Available'
    })
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
      .insert(expertiseRecords);
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
  
  // Transform data to match application structure
  return data.map(course => ({
    id: course.id,
    name: course.name,
    code: course.code,
    credits: course.credits,
    expectedEnrollment: course.expected_enrollment,
    requiresLab: course.requires_lab,
    department: course.departments?.name || '',
    academicYear: course.academic_years?.name || '',
    requiredEquipment: course.equipment?.map(item => item.equipment?.name) || []
  }));
};

// Fetch course assignments (instructor and room)
export const getCourseAssignments = async (courseIds) => {
  if (!courseIds || courseIds.length === 0) return {};
  
  const { data, error } = await supabase
    .from('schedule')
    .select(`
      course_id,
      faculty:faculty_id (name),
      rooms:room_id (name),
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
        room: item.rooms?.name || '',
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
  const { data, error } = await supabase
    .from('courses')
    .upsert({
      id: course.id, // Will be null for new courses
      name: course.name,
      code: course.code,
      credits: course.credits,
      expected_enrollment: course.expectedEnrollment,
      requires_lab: course.requiresLab,
      department_id: departmentId,
      academic_year_id: academicYearId
    })
    .select('id')
    .single();
    
  if (error) {
    console.error('Error saving course:', error);
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
        .insert(equipmentRecords);
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
  const { data, error } = await supabase
    .from('rooms')
    .upsert({
      id: room.id, // Will be null for new rooms
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      floor: room.floor,
      building_id: buildingId
    })
    .select('id')
    .single();
    
  if (error) {
    console.error('Error saving room:', error);
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
        .insert(equipmentRecords);
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
  const { data, error } = await supabase
    .from('course_schedule_view')
    .select('*');
    
  if (error) {
    console.error('Error fetching schedule:', error);
    return {};
  }
  
  // Transform data to match application structure
  const schedule = {};
  
  data.forEach(item => {
    const slotId = `${item.day}-${item.time}`;
    
    if (!schedule[slotId]) {
      schedule[slotId] = [];
    }
    
    schedule[slotId].push({
      id: item.course_id,
      name: item.course_name,
      code: item.course_code,
      credits: item.course_credits,
      instructor: item.faculty_name || '',
      room: item.room_name || ''
    });
  });
  
  return schedule;
};

// Schedule a course in a time slot
export const scheduleCourse = async (courseId, facultyId, roomId, timeSlotId) => {
  // Check if this course is already scheduled in this time slot
  const { data: existing, error: checkError } = await supabase
    .from('schedule')
    .select('id')
    .eq('course_id', courseId)
    .eq('time_slot_id', timeSlotId)
    .maybeSingle();
    
  if (checkError) {
    console.error('Error checking schedule:', checkError);
    return false;
  }
  
  if (existing) {
    // Update existing schedule
    const { error } = await supabase
      .from('schedule')
      .update({ faculty_id: facultyId, room_id: roomId })
      .eq('id', existing.id);
      
    if (error) {
      console.error('Error updating schedule:', error);
      return false;
    }
  } else {
    // Insert new schedule
    const { error } = await supabase
      .from('schedule')
      .insert({
        course_id: courseId,
        faculty_id: facultyId,
        room_id: roomId,
        time_slot_id: timeSlotId
      });
      
    if (error) {
      console.error('Error inserting schedule:', error);
      return false;
    }
  }
  
  return true;
};

// Remove a course from a time slot
export const unscheduleCourse = async (courseId, timeSlotId) => {
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
  const { data: created } = await supabase
    .from('departments')
    .insert({ name: departmentName })
    .select('id')
    .single();
    
  return created?.id || null;
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
  const { data: created } = await supabase
    .from('buildings')
    .insert({ name: buildingName })
    .select('id')
    .single();
    
  return created?.id || null;
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
  const { data: created } = await supabase
    .from('equipment_types')
    .insert({ name: equipmentName })
    .select('id')
    .single();
    
  return created?.id || null;
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
  const { data: created } = await supabase
    .from('academic_years')
    .insert({ name: yearName })
    .select('id')
    .single();
    
  return created?.id || null;
};

// Get time slot ID by day and time
export const getTimeSlotId = async (day, time) => {
  const { data } = await supabase
    .from('time_slots')
    .select('id')
    .eq('day', day)
    .eq('time', time)
    .maybeSingle();
    
  return data?.id || null;
};

// Parse time slot ID to get day and time
export const parseTimeSlotId = (slotId) => {
  const [day, time] = slotId.split('-');
  return { day, time };
};
