// src/api/winnersApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryMeta } from '@reduxjs/toolkit/query';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface Winner {
  id: number;
  wins: number;
  time: number;          // ms
}

/* ------------------------------------------------------------------ */
/*  Env                                                                */
/* ------------------------------------------------------------------ */
const API_URL: string =
  typeof import.meta.env.VITE_API === 'string'
    ? import.meta.env.VITE_API
    : 'http://localhost:3000';

/* ------------------------------------------------------------------ */
/*  API slice                                                          */
/* ------------------------------------------------------------------ */
export const winnersApi = createApi({
  reducerPath: 'winnersApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ['Winners'],

  endpoints: (builder) => ({
    /* --------------------------- GET ------------------------------ */
    getWinners: builder.query<
      { data: Winner[]; total: number },
      { page: number; limit: number; sort: 'wins' | 'time'; order: 'asc' | 'desc' }
    >({
      query: ({ page, limit, sort, order }) => ({
        url: '/winners',
        params: { _page: page, _limit: limit, _sort: sort, _order: order },
      }),
      transformResponse: (res: Winner[], meta: FetchBaseQueryMeta | undefined) => ({
        data: res,
        total: Number(meta?.response?.headers?.get('X-Total-Count') ?? res.length),
      }),
      providesTags: (r) =>
        r
          ? [
              { type: 'Winners', id: 'LIST' },
              ...r.data.map(({ id }) => ({ type: 'Winners' as const, id })),
            ]
          : [{ type: 'Winners', id: 'LIST' }],
    }),

    /* -------------------------- CREATE ---------------------------- */
    createWinner: builder.mutation<Winner, Winner>({
      query: (body) => ({ url: '/winners', method: 'POST', body }),
      invalidatesTags: [{ type: 'Winners', id: 'LIST' }],
    }),

    /* -------------------------- UPDATE ---------------------------- */
    updateWinner: builder.mutation<Winner, { id: number; wins: number; time: number }>({
      query: ({ id, ...body }) => ({
        url: `/winners/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Winners', id },
        { type: 'Winners', id: 'LIST' },
      ],
    }),

    /* -------------------------- DELETE ---------------------------- */
    deleteWinner: builder.mutation<void, number>({
      query: (id) => ({ url: `/winners/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Winners', id },
        { type: 'Winners', id: 'LIST' },
      ],
    }),
  }),
});

/* ------------------------------------------------------------------ */
/*  React hooks                                                        */
/* ------------------------------------------------------------------ */
export const {
  useGetWinnersQuery,
  useCreateWinnerMutation,
  useUpdateWinnerMutation,
  useDeleteWinnerMutation,
} = winnersApi;
