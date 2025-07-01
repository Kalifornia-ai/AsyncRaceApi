import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  page: number;
  selectedCarId: number | null;
}

const initialState: UIState = { page: 1, selectedCarId: null };

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setPage: (state, { payload }: PayloadAction<number>) => {
      state.page = payload;
    },
    selectCar: (state, { payload }: PayloadAction<number | null>) => {
      state.selectedCarId = payload;
    },
    clearSelectedCar: (state) => {
      state.selectedCarId = null;
    },
  },
});

export const { setPage, selectCar, clearSelectedCar } = uiSlice.actions;
export default uiSlice.reducer;

