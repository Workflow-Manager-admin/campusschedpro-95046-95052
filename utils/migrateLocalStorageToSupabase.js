/**
 * Migration Utility: localStorage to Supabase
 * 
 * This script helps transfer existing localStorage data to Supabase.
 * It can be run in the browser console or as part of your application.
 */

import { 
  saveFaculty, 
  saveCourse, 
  saveRoom, 
  scheduleCourse, 
  getTimeSlotId,
  supabase
} from './supabaseClient';

/**
 * Migrates all localStorage data to Supabase
 * @returns {Promise<Object>} Migration results with success status and counts
 */
export async function migrateLocalStorageToSupabase() {
  console.log('Starting migration from localStorage to Supabase...');
  
  const results = {
    success: false,
    courses: { total: 0, migrated: 0, errors: 0 },
    faculty: { total: 0, migrated: 0, errors: 0 },
    rooms: { total: 0, migrated: 0, errors: 0 },
    schedule: { total: 0, migrated: 0, errors: 0 }
  };
  
  try {
    // Load data from localStorage
    const courses = loadFromLocalStorage('campusSchedPro_courses', []);
    const rooms = loadFromLocalStorage('campusSchedPro_rooms', []);
    const schedule = loadFromLocalStorage('campusSchedPro_schedule', {});
    const allocations = loadFromLocalStorage('campusSchedPro_allocations', []);
    
    // Extract faculty from courses (since faculty may not be directly stored in localStorage)
    const uniqueFaculty = extractUniqueFaculty(courses);
    
    // Migrate faculty
    results.faculty.total = uniqueFaculty.length;
    console.log(`Migrating ${uniqueFaculty.length} faculty members...`);
    
    for (const faculty of uniqueFaculty) {
      try {
        await saveFaculty(faculty);
        results.faculty.migrated++;
      } catch (error) {
        console.error(`Error migrating faculty ${faculty.name}:`, error);
        results.faculty.errors++;
      }
    }
    
    // Migrate courses
    results.courses.total = courses.length;
    console.log(`Migrating ${courses.length} courses...`);
    
    const courseIdMap = {}; // Map old IDs to new UUIDs
    
    for (const course of courses) {
      try {
        const newId = await saveCourse(course);
        courseIdMap[course.id] = newId;
        results.courses.migrated++;
      } catch (error) {
        console.error(`Error migrating course ${course.code}:`, error);
        results.courses.errors++;
      }
    }
    
    // Migrate rooms
    results.rooms.total = rooms.length;
    console.log(`Migrating ${rooms.length} rooms...`);
    
    const roomIdMap = {}; // Map old IDs to new UUIDs
    
    for (const room of rooms) {
      try {
        const newId = await saveRoom(room);
        roomIdMap[room.id] = newId;
        results.rooms.migrated++;
      } catch (error) {
        console.error(`Error migrating room ${room.name}:`, error);
        results.rooms.errors++;
      }
    }
    
    // Migrate schedule
    const scheduleEntries = Object.entries(schedule);
    results.schedule.total = scheduleEntries.reduce(
      (count, [_, courses]) => count + courses.length, 0
    );
    
    console.log(`Migrating ${results.schedule.total} schedule entries...`);
    
    for (const [slotId, coursesInSlot] of scheduleEntries) {
      // Parse the slot ID into day and time
      const [day, time] = slotId.split('-');
      
      // Get the time slot ID from the database
      const timeSlotId = await getTimeSlotId(day, time);
      
      if (!timeSlotId) {
        console.error(`Time slot not found for ${slotId}`);
        results.schedule.errors += coursesInSlot.length;
        continue;
      }
      
      for (const course of coursesInSlot) {
        try {
          // Get faculty ID if instructor is provided
          const facultyId = course.instructor 
            ? await getFacultyIdByName(course.instructor) 
            : null;
          
          // Get room ID if room is provided
          const roomId = course.room 
            ? await getRoomIdByName(course.room) 
            : null;
          
          // Schedule the course
          await scheduleCourse(
            courseIdMap[course.id] || course.id,
            facultyId,
            roomId,
            timeSlotId
          );
          
          results.schedule.migrated++;
        } catch (error) {
          console.error(`Error migrating schedule entry for ${course.code} at ${slotId}:`, error);
          results.schedule.errors++;
        }
      }
    }
    
    // Set migration success flag
    results.success = true;
    console.log('Migration completed successfully!');
    
    return results;
    
  } catch (error) {
    console.error('Migration failed with error:', error);
    return {
      ...results,
      error: error.message
    };
  }
}

/**
 * Extracts unique faculty members from courses
 * @param {Array} courses - Course array from localStorage
 * @returns {Array} Array of unique faculty objects
 */
function extractUniqueFaculty(courses) {
  const facultyMap = new Map();
  
  courses.forEach(course => {
    if (course.instructor && !facultyMap.has(course.instructor)) {
      // Extract department from course if available
      const department = course.department || 'Unknown Department';
      
      facultyMap.set(course.instructor, {
        name: course.instructor,
        department,
        email: generateEmail(course.instructor),
        expertise: [],
        status: 'Available'
      });
    }
  });
  
  return Array.from(facultyMap.values());
}

/**
 * Generate a placeholder email for faculty
 * @param {string} name - Faculty name
 * @returns {string} Generated email address
 */
function generateEmail(name) {
  if (!name) return 'unknown@university.edu';
  
  const cleanName = name
    .toLowerCase()
    .replace(/^(dr\.|prof\.) /i, '')
    .replace(/[^a-z0-9]/g, '.');
    
  return `${cleanName}@university.edu`;
}

/**
 * Helper to safely load from localStorage
 * @param {string} key - localStorage key
 * @param {*} fallback - Fallback value if key not found
 * @returns {*} Data from localStorage or fallback
 */
function loadFromLocalStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Get faculty ID by name
 * @param {string} name - Faculty name
 * @returns {Promise<string|null>} Faculty ID or null if not found
 */
async function getFacultyIdByName(name) {
  if (!name) return null;
  
  const { data, error } = await supabase
    .from('faculty')
    .select('id')
    .ilike('name', name)
    .maybeSingle();
    
  if (error) {
    console.error('Error fetching faculty ID:', error);
    return null;
  }
  
  return data?.id || null;
}

/**
 * Get room ID by name
 * @param {string} name - Room name
 * @returns {Promise<string|null>} Room ID or null if not found
 */
async function getRoomIdByName(name) {
  if (!name) return null;
  
  const { data, error } = await supabase
    .from('rooms')
    .select('id')
    .ilike('name', name)
    .maybeSingle();
    
  if (error) {
    console.error('Error fetching room ID:', error);
    return null;
  }
  
  return data?.id || null;
}

/**
 * Helper component to display migration UI
 */
export function MigrationHelper({ onComplete }) {
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const handleMigration = async () => {
    try {
      setStatus('migrating');
      setError(null);
      
      const migrationResults = await migrateLocalStorageToSupabase();
      setResults(migrationResults);
      
      if (migrationResults.success) {
        setStatus('success');
        if (onComplete) onComplete(migrationResults);
      } else {
        setStatus('error');
        setError('Migration completed with errors. See console for details.');
      }
    } catch (err) {
      setStatus('error');
      setError(err.message);
      console.error('Migration failed:', err);
    }
  };
  
  return (
    <div className="migration-helper">
      <h2>Data Migration Tool</h2>
      <p>This tool will migrate your data from localStorage to Supabase.</p>
      
      {status === 'idle' && (
        <button 
          className="btn btn-primary"
          onClick={handleMigration}
        >
          Start Migration
        </button>
      )}
      
      {status === 'migrating' && (
        <div className="migration-status">
          <div className="spinner"></div>
          <p>Migration in progress...</p>
        </div>
      )}
      
      {status === 'success' && results && (
        <div className="migration-results success">
          <h3>Migration Completed Successfully</h3>
          
          <div className="results-table">
            <div className="result-row">
              <div className="result-label">Courses:</div>
              <div className="result-value">
                {results.courses.migrated}/{results.courses.total} 
                {results.courses.errors > 0 && 
                  <span className="error-count">({results.courses.errors} errors)</span>
                }
              </div>
            </div>
            
            <div className="result-row">
              <div className="result-label">Faculty:</div>
              <div className="result-value">
                {results.faculty.migrated}/{results.faculty.total}
                {results.faculty.errors > 0 && 
                  <span className="error-count">({results.faculty.errors} errors)</span>
                }
              </div>
            </div>
            
            <div className="result-row">
              <div className="result-label">Rooms:</div>
              <div className="result-value">
                {results.rooms.migrated}/{results.rooms.total}
                {results.rooms.errors > 0 && 
                  <span className="error-count">({results.rooms.errors} errors)</span>
                }
              </div>
            </div>
            
            <div className="result-row">
              <div className="result-label">Schedule Entries:</div>
              <div className="result-value">
                {results.schedule.migrated}/{results.schedule.total}
                {results.schedule.errors > 0 && 
                  <span className="error-count">({results.schedule.errors} errors)</span>
                }
              </div>
            </div>
          </div>
          
          {(results.courses.errors > 0 || 
            results.faculty.errors > 0 || 
            results.rooms.errors > 0 ||
            results.schedule.errors > 0) && (
            <div className="warning-message">
              Some items could not be migrated. Check the console for details.
            </div>
          )}
          
          <button 
            className="btn"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      )}
      
      {status === 'error' && (
        <div className="migration-error">
          <h3>Migration Failed</h3>
          <p>{error || 'An unexpected error occurred during migration.'}</p>
          <p>Check the browser console for more details.</p>
          <button 
            className="btn"
            onClick={() => setStatus('idle')}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
