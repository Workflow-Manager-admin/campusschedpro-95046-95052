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
  const scheduleMap = {};
  
  scheduleRows.forEach(row => {
    const slotId = `${row.day_of_week}-${row.start_time}-${row.end_time}`;
    
    if (!scheduleMap[slotId]) {
      scheduleMap[slotId] = [];
    }
    
    scheduleMap[slotId].push({
      id: row.schedule_id,
      code: row.course_code,
      name: row.course_name,
      instructor: row.faculty_name,
      room: row.room_name,
      department: row.department,
      equipment: row.equipment_assigned ? row.equipment_assigned.split(',') : []
    });
  });
  
  return scheduleMap;
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
