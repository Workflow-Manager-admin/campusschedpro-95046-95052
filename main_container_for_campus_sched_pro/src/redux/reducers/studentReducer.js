import { SET_SELECTED_COURSES, SET_YEAR_FILTER, TOGGLE_PRINT_VIEW } from '../actions/studentActions';

const initialState = {
  selectedCourses: [],
  yearFilter: 'All Years',
  printViewActive: false
};

const studentReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SELECTED_COURSES:
      return {
        ...state,
        selectedCourses: action.payload
      };
    case SET_YEAR_FILTER:
      return {
        ...state,
        yearFilter: action.payload
      };
    case TOGGLE_PRINT_VIEW:
      return {
        ...state,
        printViewActive: !state.printViewActive
      };
    default:
      return state;
  }
};

export default studentReducer;
