import { configureStore } from '@reduxjs/toolkit';

/* ------------------------------------------------------------------
   Add slices here as you create them, e.g.
   import carsReducer from '../features/cars/carsSlice';
   import winnersReducer from '../features/winners/winnersSlice';
-------------------------------------------------------------------*/

export const store = configureStore({
  reducer: {
    // cars: carsReducer,
    // winners: winnersReducer,
  },
  // middleware: (getDefault) => getDefault().concat(customApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
