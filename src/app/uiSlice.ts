import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/* ───────────────── Types ───────────────── */
export type SortKey   = 'wins' | 'time';
export type SortOrder = 'asc'  | 'desc';

interface DraftCar {
  name:  string;
  color: string;
}

interface UIState {
  garagePage:  number;
  winnersPage: number;
  sort:  SortKey;
  order: SortOrder;
  selectedCarId: number | null;
  draftCar?: DraftCar;
  isRacing: boolean;
  banner:   string | null;
  totalCars: number;
  singleCarId:   number | null;
  trackVisible: boolean, 

}

/* ───────────────── Initial ─────────────── */
const initialState: UIState = {
  garagePage:  1,
  winnersPage: 1,
  sort:  'wins',
  order: 'desc',
  selectedCarId: null,
  isRacing: false,
  banner:   null,
  totalCars: 0,
  singleCarId:  null,
  trackVisible: false,
};

/* ───────────────── Slice ───────────────── */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /* Pagination */
    setGaragePage(state, { payload }: PayloadAction<number>)  { state.garagePage  = payload; },
    setWinnersPage(state, { payload }: PayloadAction<number>) { state.winnersPage = payload; },

    /* Winners sort */
    setSort(state, { payload }: PayloadAction<SortKey>) {
      if (state.sort === payload) {
        state.order = state.order === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort  = payload;
        state.order = 'asc';
      }
    },
    setOrder(state, { payload }: PayloadAction<SortOrder>) { state.order = payload; },

    /* Car selection & draft */
    selectCar(state, { payload }: PayloadAction<number | null>) { state.selectedCarId = payload; },
    saveDraft(state, { payload }: PayloadAction<DraftCar | undefined>) {
      state.draftCar = payload;
    },

    setTotalCars: (s, a: PayloadAction<number>) => { s.totalCars = a.payload },

    /* Race lifecycle */
    startRace(state) {
      state.isRacing = true;
      state.singleCarId = null;
      state.banner   = null;
      state.trackVisible = true; 
    },
    resetRace(state) {
      state.isRacing = false;
      state.banner   = null;
      state.trackVisible = false; 
      state.singleCarId  = null;
    },
    finishRace(state, { payload }: PayloadAction<string>) {
      state.isRacing = false;
      state.banner   = payload;

    },
    startSingleCar: (s,a: PayloadAction<number>) => { s.singleCarId = a.payload },
    stopSingleCar:  (s) => { s.singleCarId = null },

    
  },
});

/* ───────────────── Exports ─────────────── */
export const {
  setGaragePage,
  setWinnersPage,
  setSort,
  setOrder,
  selectCar,
  saveDraft,
  startRace,
  setTotalCars, 
  resetRace,
  finishRace,
  startSingleCar, stopSingleCar,
} = uiSlice.actions;

export default uiSlice.reducer;


