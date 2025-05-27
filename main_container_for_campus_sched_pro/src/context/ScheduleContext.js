import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { fetchCourseScheduleView } from "../utils/supabaseClient";
import { detectConflicts } from "../utils/conflictDetection";

// Create ScheduleContext and hook
const ScheduleContext = createContext();

// PUBLIC_INTERFACE
export function useSchedule() {
  return useContext(ScheduleContext);
}

// Utility: Map the schedule rows returned from Supabase view to internal model
function mapScheduleRowsToModel(scheduleRows) {
  // Adjust field mapping here as per the shape returned from fetchCourseScheduleView
  // Example assumes view fields: id, course_code, course_name, faculty_name, room_code, day, start_time, end_time, equipment (can be customized further)
  return scheduleRows.map(row => ({
    id: row.id,
    courseCode: row.course_code,
    courseName: row.course_name,
    facultyName: row.faculty_name,
    roomCode: row.room_code,
    day: row.day,
    startTime: row.start_time,
    endTime: row.end_time,
    equipment: row.equipment, // If any, else remove/massage as needed
    // Add any other required mappings here
  }));
}

// PUBLIC_INTERFACE
export function ScheduleProvider({ children }) {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Fetch data using the Supabase view; replaces legacy fetchSchedules
  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setErrors({});
    try {
      const rows = await fetchCourseScheduleView();
      // Handle API shape and error here
      if (Array.isArray(rows)) {
        setSchedule(mapScheduleRowsToModel(rows));
      } else {
        throw new Error("Schedule data format is invalid!");
      }
    } catch (error) {
      setErrors({ general: "Failed to fetch course schedule.", details: error.message });
      setSchedule([]);
      setNotification({
        open: true,
        message: "Failed to load course schedule from Supabase.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Notification handler
  const handleCloseNotification = useCallback(() => {
    setNotification((n) => ({ ...n, open: false }));
  }, []);

  // Notification handler
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  // Initialize conflicts array
  const [conflicts, setConflicts] = useState([]);

  // Detect conflicts whenever schedule changes
  useEffect(() => {
    if (schedule && Object.keys(schedule).length > 0) {
      const detectedConflicts = detectConflicts(schedule);
      setConflicts(detectedConflicts);
    }
  }, [schedule]);

  // Exposed context value
  const value = {
    schedule,
    setSchedule,
    loading,
    errors,
    refreshData: loadSchedule,
    notification,
    handleCloseNotification,
    showNotification,
    conflicts
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}
