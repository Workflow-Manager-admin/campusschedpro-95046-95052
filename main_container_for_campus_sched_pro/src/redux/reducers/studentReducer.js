import { SET_SELECTED_COURSES, SET_YEAR_FILTER, TOGGLE_PRINT_VIEW } from '../actions/studentActions';

// Minimal implementation with proper action handling to prevent build errors
const initialState = {
  selectedCourses: [],
  yearFilter: 'All Years',
  printViewActive: false
};

export default function studentReducer(state = initialState, action) {
  switch (action.type) {
    case SET_SELECTED_COURSES:
      return {
        ...state,
        selectedCourses: action.payload || []
      };
    case SET_YEAR_FILTER:
      return {
        ...state,
        yearFilter: action.payload || 'All Years'
      };
    case TOGGLE_PRINT_VIEW:
      return {
        ...state,
        printViewActive: !state.printViewActive
      };
    default:
      return state;
  }
}
