import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  fetchCourses,
  fetchFaculty, 
  fetchCourseScheduleView, 
  fetchSchedules 
} from "../../../utils/supabaseClient";

const ScheduleContext = createContext();

export const useSchedule = () => useContext(ScheduleContext);

export const ScheduleProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courseSchedule, setCourseSchedule] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  const handleCloseNotification = () => 
    setNotification((prev) => ({ ...prev, open: false }));

  // Fetch all core scheduling data flat
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setErrors({});
    try {
      const [
        fetchedCourses,
        fetchedFaculty,
        fetchedCourseScheduleView,
        fetchedSchedules
      ] = await Promise.all([
        fetchCourses(),
        fetchFaculty(),
        fetchCourseScheduleView(),
        fetchSchedules()
      ]);
      setCourses(fetchedCourses || []);
      setFaculty(fetchedFaculty || []);
      setCourseSchedule(fetchedCourseScheduleView || []);
      setSchedules(fetchedSchedules || []);
    } catch (err) {
      setErrors({ general: err.message || "Failed to load schedule data." });
      setNotification({
        open: true,
        message: err.message || "Failed to load schedule data.",
        severity: "error"
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshData = () => fetchAllData();

  return (
    <ScheduleContext.Provider value={{
      courses,
      faculty,
      courseSchedule,
      schedules,
      loading,
      errors,
      notification,
      handleCloseNotification,
      refreshData,
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};
