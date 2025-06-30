import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Winner { id: number; wins: number; time: number } // ms

export const winnersApi = createApi({
  reducerPath: 'winnersApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000' }),
  tagTypes: ['Winners'],
  endpoints: (builder) => ({
    getWinners: builder.query<
      { data: Winner[]; total: number },
      { page: number; limit: number; sort: string; order: 'asc' | 'desc' }
    >({
      query: ({ page, limit, sort, order }) => ({
        url: '/winners',
        params: { _page: page, _limit: limit, _sort: sort, _order: order },
      }),
      transformResponse: (response: Winner[], meta) => ({
        data: response,
        total: Number(meta?.response?.headers.get('X-Total-Count') ?? response.length),
      }),
      providesTags: (r) =>
        r
          ? [
              { type: 'Winners', id: 'LIST' },
              ...r.data.map(({ id }) => ({ type: 'Winners' as const, id })),
            ]
          : [{ type: 'Winners', id: 'LIST' }],
    }),

    createWinner: builder.mutation<Winner, Winner>({
      query: (body) => ({ url: '/winners', method: 'POST', body }),
      invalidatesTags: [{ type: 'Winners', id: 'LIST' }],
    }),

    updateWinner: builder.mutation<
      Winner,
      { id: number; wins: number; time: number }
    >({
      query: ({ id, ...patch }) => ({
        url: `/winners/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: 'Winners', id }],
    }),
  }),
});

export const {
  useGetWinnersQuery,
  useCreateWinnerMutation,
  useUpdateWinnerMutation,
} = winnersApi;
