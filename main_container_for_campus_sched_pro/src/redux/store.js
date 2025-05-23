import { createStore } from 'redux';

// Initial state
const initialState = {
  // We can keep this minimal since most state is managed by ScheduleContext
  // Just adding a placeholder state to start with
  ui: {
    selectedTab: null,
    darkMode: false,
  }
};

// Simple reducer - can be expanded as needed
const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_SELECTED_TAB':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedTab: action.payload
        }
      };
    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          darkMode: !state.ui.darkMode
        }
      };
    default:
      return state;
  }
};

// Create store
const store = createStore(
  rootReducer,
  // Enable Redux DevTools Extension if available
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;
