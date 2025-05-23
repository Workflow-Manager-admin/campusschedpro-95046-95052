import { createStore, combineReducers } from 'redux';
import studentReducer from './reducers/studentReducer';

// Combine all reducers
const rootReducer = combineReducers({
  student: studentReducer,
  // Add other reducers here as the app grows
  ui: (state = { selectedTab: null, darkMode: false }, action) => {
    switch (action.type) {
      case 'SET_SELECTED_TAB':
        return {
          ...state,
          selectedTab: action.payload
        };
      case 'TOGGLE_DARK_MODE':
        return {
          ...state,
          darkMode: !state.darkMode
        };
      default:
        return state;
    }
  }
});

// Create store
const store = createStore(
  rootReducer,
  // Enable Redux DevTools Extension if available
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;
