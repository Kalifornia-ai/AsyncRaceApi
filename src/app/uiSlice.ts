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

    /* Race lifecycle */
    startRace(state) {
      state.isRacing = true;
      state.banner   = null;
    },
    resetRace(state) {
      state.isRacing = false;
      state.banner   = null;
    },
    finishRace(state, { payload }: PayloadAction<string>) {
      state.isRacing = false;
      state.banner   = payload;
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
  resetRace,
  finishRace,
} = uiSlice.actions;

export default uiSlice.reducer;


