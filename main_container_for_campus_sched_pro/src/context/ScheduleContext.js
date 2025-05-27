import { createContext } from 'react';

// Create base context
const ScheduleContext = createContext(null);

// Re-export hook from EnhancedScheduleProvider for backward compatibility
export { useSchedule } from './EnhancedScheduleProvider';

export default ScheduleContext;
