import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface EngineResponse { velocity: number; distance: number }

export const engineApi = createApi({
  reducerPath: 'engineApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000' }),
  endpoints: (builder) => ({
    /* ─── start / stop ─── */
    startEngine: builder.mutation<EngineResponse, { id: number; status: 'started' }>({
      query: ({ id, status }) => ({
        url: '/engine',
        method: 'PATCH',
        params: { id, status },
      }),
    }),
    stopEngine: builder.mutation<EngineResponse, { id: number; status: 'stopped' }>({
      query: ({ id, status }) => ({
        url: '/engine',
        method: 'PATCH',
        params: { id, status },
      }),
    }),

    /* ─── drive ─── */
    driveEngine: builder.mutation<{ success: boolean }, { id: number; status: 'drive' }>({
      query: ({ id, status }) => ({
        url: '/engine',
        method: 'PATCH',
        params: { id, status },
      }),
    }),
  }),
});

export const {
  useStartEngineMutation,
  useStopEngineMutation,
  useDriveEngineMutation,
} = engineApi;




