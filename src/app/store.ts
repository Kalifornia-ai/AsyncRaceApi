import { configureStore } from '@reduxjs/toolkit';
import { garageApi } from '../api/garageApi';
import uiReducer from './uiSlice';
import { winnersApi }  from '../api/winnersApi'; 

/* ------------------------------------------------------------------
   Add slices here as you create them, e.g.
   import carsReducer from '../features/cars/carsSlice';
   import winnersReducer from '../features/winners/winnersSlice';
-------------------------------------------------------------------*/

export const store = configureStore({
    reducer: {
        ui: uiReducer,
        [garageApi.reducerPath]: garageApi.reducer,
        [winnersApi.reducerPath]:  winnersApi.reducer, 
      },
      middleware: (getDefault) =>
        getDefault().concat(
        garageApi.middleware,
        winnersApi.middleware, ),  
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
