// This file will combine all reducers when the application grows
// For now, it's just a placeholder for future development

export const combineReducers = (reducers) => {
  const nextState = {};
  const reducerKeys = Object.keys(reducers);
  
  return (state = {}, action) => {
    reducerKeys.forEach(key => {
      const reducer = reducers[key];
      nextState[key] = reducer(state[key], action);
    });
    
    return nextState;
  };
};
