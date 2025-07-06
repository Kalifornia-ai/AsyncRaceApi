import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import type { Car } from '../types/car';

const API_URL = import.meta.env.VITE_API ?? 'http://localhost:3000';

export const garageApi = createApi({
  reducerPath: 'garageApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ['Cars'],
  endpoints: (builder) => ({
    /* ───────── Cars ───────── */
    getCars: builder.query<{ data: Car[]; total: number }, { page: number; limit: number }>({
      query: ({ page, limit }) => ({
        url: '/garage',
        params: { _page: page, _limit: limit },
      }),
      transformResponse: (response: Car[], meta: FetchBaseQueryMeta | undefined) => ({
        data: response,
        total: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Cars' as const, id })),
              { type: 'Cars', id: 'PARTIAL-LIST' },
            ]
          : [{ type: 'Cars', id: 'PARTIAL-LIST' }],
    }),

    createCar: builder.mutation<Car, Omit<Car, 'id'>>({
      query: (body) => ({ url: '/garage', method: 'POST', body }),
      invalidatesTags: [{ type: 'Cars', id: 'PARTIAL-LIST' }],
    }),

    updateCar: builder.mutation<Car, Partial<Car> & Pick<Car, 'id'>>({
      query: ({ id, ...patch }) => ({
        url: `/garage/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Cars', id }],
    }),

    deleteCar: builder.mutation<{ id: number }, number>({
      query: (id) => ({ url: `/garage/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Cars', id },
        { type: 'Cars', id: 'PARTIAL-LIST' },
      ],
    }),

    /* ───────── Engine ───────── */
    startEngine: builder.mutation<{ velocity: number; distance: number; id: number }, number>({
      query: (id) => ({
        url: `/engine?id=${id}&status=started`,
        method: 'PATCH',
      }),
    }),

    stopEngine: builder.mutation<void, number>({
      query: (id) => ({
        url: `/engine?id=${id}&status=stopped`,
        method: 'PATCH',
      }),
    }),

    driveEngine: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/engine?id=${id}&status=drive`,
        method: 'PATCH',
      }),
    }),
  }), // ← closes endpoints
}); // ← closes createApi

/* ───────── Hooks ───────── */
export const {
  useGetCarsQuery,
  useCreateCarMutation,
  useUpdateCarMutation,
  useLazyGetCarsQuery,
  useDeleteCarMutation,
  useStartEngineMutation,
  useStopEngineMutation,
  useDriveEngineMutation,
} = garageApi;
