import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Car } from '../types/car';

/* ------------------------------------------------------------------ */
/*  Env                                                                */
/* ------------------------------------------------------------------ */
// `import.meta.env.*` is typed as `any` in Vite projects, so cast it.
const API_URL: string =
  typeof import.meta.env.VITE_API === 'string'
    ? import.meta.env.VITE_API
    : 'http://localhost:3000';

/* ------------------------------------------------------------------ */
/*  API slice                                                          */
/* ------------------------------------------------------------------ */
export const garageApi = createApi({
  reducerPath: 'garageApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ['Cars'],

  endpoints: (builder) => ({
    /* -------------------------- GET (paged) ------------------------- */
    getCars: builder.query<
      { data: Car[]; total: number },
      { page: number; limit: number }
    >({
      query: ({ page, limit }) => ({
        url: '/garage',
        params: { _page: page, _limit: limit },
      }),
      transformResponse: (response: Car[], meta) => {
        const total = Number(
          meta?.response?.headers?.get('X-Total-Count') ?? 0,
        );
        return { data: response, total };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Cars' as const, id })),
              { type: 'Cars', id: 'PARTIAL-LIST' },
            ]
          : [{ type: 'Cars', id: 'PARTIAL-LIST' }],
    }),

    /* --------------------------- CREATE ----------------------------- */
    createCar: builder.mutation<Car, Omit<Car, 'id'>>({
      query: (body) => ({ url: '/garage', method: 'POST', body }),
      invalidatesTags: [{ type: 'Cars', id: 'PARTIAL-LIST' }],
    }),

    /* --------------------------- UPDATE ----------------------------- */
    updateCar: builder.mutation<
      Car,
      Partial<Car> & Pick<Car, 'id'>
    >({
      query: ({ id, ...patch }) => ({
        url: `/garage/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Cars', id },
        { type: 'Cars', id: 'PARTIAL-LIST' },
      ],
    }),

    /* --------------------------- DELETE ----------------------------- */
    deleteCar: builder.mutation<{ id: number }, number>({
      query: (id) => ({ url: `/garage/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Cars', id },
        { type: 'Cars', id: 'PARTIAL-LIST' },
      ],
    }),

    /* ----------------------- ENGINE CONTROLS ----------------------- */
    startEngine: builder.mutation<
      { velocity: number; distance: number; id: number },
      number
    >({
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
  }),
});

/* ------------------------------------------------------------------ */
/*  React hooks                                                        */
/* ------------------------------------------------------------------ */
export const {
  useGetCarsQuery,
  useLazyGetCarsQuery,
  useCreateCarMutation,
  useUpdateCarMutation,
  useDeleteCarMutation,
  useStartEngineMutation,
  useStopEngineMutation,
  useDriveEngineMutation,
} = garageApi;



