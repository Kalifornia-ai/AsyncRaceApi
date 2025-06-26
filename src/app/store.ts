import { configureStore } from '@reduxjs/toolkit';
import { garageApi } from '../api/garageApi';
import uiReducer from './uiSlice';

/* ------------------------------------------------------------------
   Add slices here as you create them, e.g.
   import carsReducer from '../features/cars/carsSlice';
   import winnersReducer from '../features/winners/winnersSlice';
-------------------------------------------------------------------*/

export const store = configureStore({
    reducer: {
        ui: uiReducer,
        [garageApi.reducerPath]: garageApi.reducer,
      },
      middleware: (getDefault) =>
        getDefault().concat(garageApi.middleware),  
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
