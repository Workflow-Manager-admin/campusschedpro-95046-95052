// Action types
export const SET_SELECTED_COURSES = 'SET_SELECTED_COURSES';
export const SET_YEAR_FILTER = 'SET_YEAR_FILTER';
export const TOGGLE_PRINT_VIEW = 'TOGGLE_PRINT_VIEW';

// Action creators
export const setSelectedCourses = (courses) => ({
  type: SET_SELECTED_COURSES,
  payload: courses
});

export const setYearFilter = (filter) => ({
  type: SET_YEAR_FILTER,
  payload: filter
});

export const togglePrintView = () => ({
  type: TOGGLE_PRINT_VIEW
});
