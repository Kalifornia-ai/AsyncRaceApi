import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface EngineResponse { velocity: number; distance: number }

export const engineApi = createApi({
  reducerPath: 'engineApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000' }),
  endpoints: (builder) => ({
    /* ───────── start / stop ───────── */
    startEngine: builder.mutation<EngineResponse, number>({
      query: (id) => `/engine?id=${id}&status=started`,   // GET
    }),
    stopEngine: builder.mutation<void, number>({
      query: (id) => `/engine?id=${id}&status=stopped`,   // GET
    }),

    /* ───────── drive  (→ /drive) ───────── */
    drive: builder.mutation<{ success: boolean }, number>({
      // your server.js doesn’t care about the HTTP verb,
      // but PATCH matches the RS-School template
      query: (id) => ({
        url: `/drive?id=${id}`,
        method: 'PATCH',          // or 'GET' if you prefer
      }),
      transformResponse: (_: unknown, meta) => ({
        success: meta?.response?.status === 200,
      }),
      transformErrorResponse: () => ({ success: false }),
    }),
  }),
});

export const {
  useStartEngineMutation,
  useStopEngineMutation,
  useDriveMutation,
} = engineApi;




