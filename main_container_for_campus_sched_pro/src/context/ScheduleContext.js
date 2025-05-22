import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { findScheduleConflicts } from '../utils/scheduleUtils';

// Initial sample data remains the same...
// (All the initial data constants remain unchanged)

// Local Storage Keys
const STORAGE_KEYS = {
  COURSES: 'campusSchedPro_courses',
  SCHEDULE: 'campusSchedPro_schedule',
  ROOMS: 'campusSchedPro_rooms',
  ALLOCATIONS: 'campusSchedPro_allocations'
};

/**
 * Check if localStorage is available
 * @returns {boolean} Whether localStorage is available
 */
const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Load data from localStorage with fallback value
 * @param {string} key - Storage key
 * @param {*} fallback - Default value if storage is empty
 * @returns {*} Parsed data or fallback value
 */
const loadFromStorage = (key, fallback) => {
  if (!isStorageAvailable()) return fallback;
  
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Error loading data from localStorage (${key}):`, error);
    return fallback;
  }
};

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} data - Data to store
 */
const saveToStorage = (key, data) => {
  if (!isStorageAvailable()) return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Error saving data to localStorage (${key}):`, error);
  }
};

// Rest of the context implementation remains the same...
// (All the context code remains unchanged)

// Function to clear all stored data in clearStoredData
const clearStoredData = useCallback(() => {
  if (isStorageAvailable()) {
    Object.values(STORAGE_KEYS).forEach(key => window.localStorage.removeItem(key));
  }
  setCourses(INITIAL_COURSES);
  setSchedule({});
  setRooms(INITIAL_ROOMS);
  setAllocations(INITIAL_ALLOCATIONS);
  showNotification('All stored data has been cleared', 'info');
}, [showNotification]);

// Rest of the component implementation remains the same...
// (All other code remains unchanged)
