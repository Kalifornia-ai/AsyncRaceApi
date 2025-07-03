// src/api/winnersApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Winner {
  id:   number;
  wins: number;
  time: number;            // ms
}

export const winnersApi = createApi({
  reducerPath: 'winnersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API ?? 'http://localhost:3000',
  }),
  tagTypes: ['Winners'],
  endpoints: (builder) => ({
    /* ───────── GET /winners ───────── */
    getWinners: builder.query<
      { data: Winner[]; total: number },
      { page: number; limit: number; sort: 'wins' | 'time'; order: 'asc' | 'desc' }
    >({
      query: ({ page, limit, sort, order }) => ({
        url: '/winners',
        params: { _page: page, _limit: limit, _sort: sort, _order: order },
      }),
      transformResponse: (res: Winner[], meta) => ({
        data: res,
        total: Number(meta?.response?.headers.get('X-Total-Count') ?? res.length),
      }),
      providesTags: (r) =>
        r
          ? [
              { type: 'Winners', id: 'LIST' },
              ...r.data.map(({ id }) => ({ type: 'Winners' as const, id })),
            ]
          : [{ type: 'Winners', id: 'LIST' }],
    }),

    /* ───────── POST /winners ───────── */
    createWinner: builder.mutation<Winner, Winner>({
      query: (body) => ({ url: '/winners', method: 'POST', body }),
      invalidatesTags: [{ type: 'Winners', id: 'LIST' }],
    }),

    /* ───────── PUT /winners/:id ────── */
   // PATCH /winners/:id  body → { wins, time }
updateWinner: builder.mutation<
Winner,
{ id: number; wins: number; time: number }
>({
query: ({ id, ...body }) => ({
  url: `/winners/${id}`,
  method: 'PUT',
  body,                      // { wins, time }
}),
invalidatesTags: (_r, _e, { id }) => [
  { type: 'Winners', id },
  { type: 'Winners', id: 'LIST' },
],
}),

    /* ───────── DELETE /winners/:id ─── */
    deleteWinner: builder.mutation<void, number>({
      query: (id) => ({ url: `/winners/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Winners', id },
        { type: 'Winners', id: 'LIST' },
      ],
    }),
  }),
});

/* RTK-Query hooks */
export const {
  useGetWinnersQuery,
  useCreateWinnerMutation,
  useUpdateWinnerMutation,
  useDeleteWinnerMutation,
} = winnersApi;
