import { createContext } from 'react';

// Define initial context value with all required fields
const initialContextValue = {
  scheduleData: null,
  roomAllocations: null,
  courses: null,
  conflicts: null,
  loading: false,
  error: null,
  progress: 0,
  retryCount: 0,
  notification: { open: false, message: '', severity: 'info' },
  handleCloseNotification: () => {},
  refreshData: () => {},
  showNotification: () => {},
  schedule: {},
  setSchedule: () => {},
  errors: {}
};

// Create context with initial value
const ScheduleContext = createContext(initialContextValue);
ScheduleContext.displayName = 'ScheduleContext'; // For React DevTools

// Re-export hook from EnhancedScheduleProvider
export { useSchedule } from './EnhancedScheduleProvider';

export default ScheduleContext;
