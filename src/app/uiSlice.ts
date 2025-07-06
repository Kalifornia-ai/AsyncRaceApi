import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/* ───────────────── Types ───────────────── */
export type SortKey = 'wins' | 'time';
export type SortOrder = 'asc' | 'desc';

interface DraftCar {
  name: string;
  color: string;
}

interface UIState {
  garagePage: number;
  winnersPage: number;
  sort: SortKey;
  order: SortOrder;
  selectedCarId: number | null;
  draftCar?: DraftCar;
  isRacing: boolean;
  banner: string | null;
  totalCars: number;
  singleCarId: number | null;
  trackVisible: boolean;
  failedCars: number[];
}

/* ───────────────── Initial ─────────────── */
const initialState: UIState = {
  garagePage: 1,
  winnersPage: 1,
  sort: 'wins',
  order: 'desc',
  selectedCarId: null,
  isRacing: false,
  banner: null,
  totalCars: 0,
  singleCarId: null,
  trackVisible: false,
  failedCars: [],
};

/* ───────────────── Slice ───────────────── */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /* Pagination */
    setGaragePage(state, { payload }: PayloadAction<number>) {
      state.garagePage = payload;
    },
    setWinnersPage(state, { payload }: PayloadAction<number>) {
      state.winnersPage = payload;
      // nuke any running race when you go look at Winners
      state.isRacing = false;
      state.trackVisible = false;
      state.singleCarId = null;
      state.banner = null;
      state.failedCars = [];
    },

    /* Winners sort */
    setSort(state, { payload }: PayloadAction<SortKey>) {
      if (state.sort === payload) {
        state.order = state.order === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort = payload;
        state.order = 'asc';
      }
    },
    setOrder(state, { payload }: PayloadAction<SortOrder>) {
      state.order = payload;
    },

    /* Car selection & draft */
    selectCar(state, { payload }: PayloadAction<number | null>) {
      state.selectedCarId = payload;
    },
    saveDraft(state, { payload }: PayloadAction<DraftCar | undefined>) {
      state.draftCar = payload;
    },

    setTotalCars: (s, a: PayloadAction<number>) => {
      s.totalCars = a.payload;
    },

    /* Race lifecycle */
    startRace(state) {
      state.isRacing = true;
      state.singleCarId = null;
      state.banner = null;
      state.failedCars = [];
      state.trackVisible = true;
    },
    resetRace(state) {
      state.isRacing = false;
      state.banner = null;
      state.trackVisible = false;
      state.singleCarId = null;
      state.failedCars = [];
    },
    finishRace(state, { payload }: PayloadAction<string>) {
      state.isRacing = false;
      state.banner = payload;
      state.singleCarId = null;
    },
    startSingleCar: (s, a: PayloadAction<number>) => {
      s.singleCarId = a.payload;
      s.trackVisible = true; // keep lanes mounted while the car runs
      s.banner = null; // (optional) clear any old winner text
    },
    stopSingleCar: (s) => {
      s.singleCarId = null;
    },

    markCarFailed: (s, a: PayloadAction<number>) => {
      if (!s.failedCars.includes(a.payload)) s.failedCars.push(a.payload);
    },
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
  startSingleCar,
  stopSingleCar,
  markCarFailed,
} = uiSlice.actions;

export default uiSlice.reducer;
