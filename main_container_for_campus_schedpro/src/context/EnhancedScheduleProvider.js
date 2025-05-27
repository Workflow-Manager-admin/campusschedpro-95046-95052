import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { supabase } from "../utils/supabaseClient";
import { upsertSchedule, upsertEntity, removeEntity, fetchAllEntities } from "../utils/scheduleHelpers";
import { fetchRooms, upsertRoom, removeRoom, bulkImportRooms } from "../utils/roomUtils";
import { downloadTemplate } from "../utils/excelUtils";
import { bulkImportData } from "../utils/contextHelpers";
import { bulkImportFaculty } from "../utils/facultyUtils";

// Context
const ScheduleContext = createContext();

// PUBLIC_INTERFACE
export const useSchedule = () => useContext(ScheduleContext);

// PUBLIC_INTERFACE
export const EnhancedScheduleProvider = ({ children }) => {
  // Top-level loading & error state for all data
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ open: false, severity: "info", message: "" });

  // All main entities (hydra from Supabase only)
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // In-memory, non-persistent UI state only (resets on reload)
  const [viewFilters, setViewFilters] = useState({});
  const [currentTab, setCurrentTab] = useState("courses");

  // PUBLIC_INTERFACE
  const updateViewFilters = (newFilters) => {
    setViewFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // PUBLIC_INTERFACE
  const updateCurrentTab = (tab) => setCurrentTab(tab);

  // PUBLIC_INTERFACE
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setErrors({});
    try {
      const results = await Promise.all([
        fetchAllEntities("courses"),
        fetchAllEntities("faculty"),
        fetchRooms(),
        fetchAllEntities("schedules"),
      ]);
      setCourses(results[0]);
      setFaculty(results[1]);
      setRooms(results[2]);
      setSchedules(results[3]);
      setIsLoading(false);
      setErrors({});
    } catch (e) {
      setErrors({ general: "Failed to load from database. Check your Supabase connection or try again." });
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // PUBLIC_INTERFACE
  const handleUpsertEntity = async (type, entity) => {
    setIsLoading(true);
    setNotification({ open: false, severity: "info", message: "" });
    try {
      await upsertEntity(type, entity);
      await refreshData();
      setNotification({ open: true, severity: "success", message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!` });
    } catch (e) {
      setNotification({ open: true, severity: "error", message: `Failed to update ${type}: ${e.message}` });
    }
    setIsLoading(false);
  };

  // PUBLIC_INTERFACE
  const handleUpsertSchedule = async (schedule) => {
    setIsLoading(true);
    setNotification({ open: false, severity: "info", message: "" });
    try {
      await upsertSchedule(schedule);
      await refreshData();
      setNotification({ open: true, severity: "success", message: "Schedule updated successfully!" });
    } catch (e) {
      setNotification({ open: true, severity: "error", message: `Failed to update schedule: ${e.message}` });
    }
    setIsLoading(false);
  };

  // PUBLIC_INTERFACE
  const handleRemoveEntity = async (type, entityId) => {
    setIsLoading(true);
    setNotification({ open: false, severity: "info", message: "" });
    try {
      await removeEntity(type, entityId);
      await refreshData();
      setNotification({ open: true, severity: "success", message: `${type.charAt(0).toUpperCase() + type.slice(1)} removed.` });
    } catch (e) {
      setNotification({ open: true, severity: "error", message: `Failed to remove ${type}: ${e.message}` });
    }
    setIsLoading(false);
  };

  // PUBLIC_INTERFACE
  const handleBulkImport = async (type, data, options = {}) => {
    setIsLoading(true);
    setNotification({ open: false, severity: "info", message: "" });
    try {
      if (type === "faculty") {
        await bulkImportFaculty(data);
      } else if (type === "rooms") {
        await bulkImportRooms(data);
      } else {
        await bulkImportData(type, data, options);
      }
      await refreshData();
      setNotification({ open: true, severity: "success", message: `Bulk import completed for ${type}` });
    } catch (error) {
      setNotification({ open: true, severity: "error", message: `Bulk import failed: ${error?.message || "Unknown error"}` });
    }
    setIsLoading(false);
  };

  // PUBLIC_INTERFACE
  const handleDownloadTemplate = (type) => {
    downloadTemplate(type);
  };

  // PUBLIC_INTERFACE
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // PUBLIC_INTERFACE
  const contextValue = {
    courses,
    setCourses,
    rooms,
    setRooms,
    faculty,
    setFaculty,
    schedules,
    setSchedules,

    isLoading,
    errors,
    notification,
    handleCloseNotification,

    viewFilters,
    updateViewFilters,
    currentTab,
    updateCurrentTab,

    refreshData,
    handleUpsertEntity,
    handleRemoveEntity,
    handleUpsertSchedule,
    handleBulkImport,
    handleDownloadTemplate,
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

EnhancedScheduleProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
