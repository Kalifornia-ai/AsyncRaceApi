import { configureStore } from '@reduxjs/toolkit';
import { garageApi } from '../api/garageApi';
import { winnersApi } from '../api/winnersApi';
import uiReducer from './uiSlice';

export const setupStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
      [garageApi.reducerPath]: garageApi.reducer,
      [winnersApi.reducerPath]: winnersApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(garageApi.middleware, winnersApi.middleware),
  });

export const store = setupStore(); // ← runtime instance

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
