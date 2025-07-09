/* src/pages/WinnersPage.tsx */
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGetWinnersQuery } from '../api/winnersApi';
import { useGetCarsQuery } from '../api/garageApi';
import Pagination from '../components/garage/Pagination';
import { setWinnersPage, setSort, resetRace } from '../app/uiSlice';
import type { Car } from '../types/car';

const LIMIT = 10;

/** Shape of FetchBaseQueryError we care about */
interface ApiErrorShape {
  status: number;
  data?: unknown;
  message?: string;
}

export default function WinnersPage() {
  /* -------- Redux UI state -------- */
  const dispatch = useAppDispatch();
  const { winnersPage: page, sort, order } = useAppSelector((s) => s.ui);

  /* -------- Data fetches -------- */
  const {
    data: winnersData,
    isFetching: winnersFetching,
    error: winnersError,
  } = useGetWinnersQuery({ page, limit: LIMIT, sort, order });

  const { data: carsData } = useGetCarsQuery({ page: 1, limit: 1000 });

  /* Map carId → Car (typed) */
  const carById = useMemo<Record<number, Car>>(
    () =>
      Object.fromEntries(
        (carsData?.data ?? []).map((c) => [c.id, c]),
      ) as Record<number, Car>,
    [carsData],
  );

  /* -------- Reset race when URL is /winners -------- */
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === '/winners') dispatch(resetRace());
  }, [dispatch, location.pathname]);

  /* -------- Early error guard -------- */
  if (winnersError) {
    let msg = 'network';
    if (
      typeof winnersError === 'object' &&
      winnersError !== null &&
      'status' in winnersError
    ) {
      const e = winnersError as ApiErrorShape;
      msg = `${e.status} – ${JSON.stringify(e.data ?? e.message ?? '')}`;
    } else if (winnersError instanceof Error) {
      msg = winnersError.message;
    }
    return <p className="text-red-600">Failed to load winners: {msg}</p>;
  }

  /* -------- Render -------- */
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Winners&nbsp;({winnersData?.total ?? 0})
      </h1>

      {/* Sort buttons */}
      <div className="flex gap-4">
        {(['wins', 'time'] as const).map((col) => (
          <button
            key={col}
            type="button"
            className="btn btn-sm btn-outline cursor-pointer"
            onClick={() => {
              dispatch(setSort(col));      // toggles order if same col
              dispatch(setWinnersPage(1)); // reset to first page
            }}
          >
            Sort&nbsp;by&nbsp;{col}&nbsp;
            {sort === col && (order === 'asc' ? '🔼' : '🔽')}
          </button>
        ))}
      </div>

      {/* Loading */}
      {winnersFetching && <p>Loading…</p>}

      {/* Empty */}
      {winnersData?.total === 0 && !winnersFetching && (
        <p className="text-center italic text-gray-500">
          No winners yet—run a race!
        </p>
      )}

      {/* Winners table */}
      {winnersData?.total !== 0 && (
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-500">
            <tr>
              <th className="px-2 py-1">#</th>
              <th>Car</th>
              <th>Wins</th>
              <th>Best&nbsp;time&nbsp;(s)</th>
            </tr>
          </thead>
          <tbody>
            {winnersData?.data.map((w, idx) => (
              <tr key={w.id} className="border-t">
                <td className="px-2 text-center">
                  {(page - 1) * LIMIT + idx + 1}
                </td>
                <td className="flex items-center gap-2">
                  <div
                    className="h-4 w-6 rounded"
                    style={{
                      backgroundColor: carById[w.id]?.color ?? '#999',
                    }}
                  />
                  {carById[w.id]?.name ?? `Car ${w.id}`}
                </td>
                <td className="text-center">{w.wins}</td>
                <td className="text-center">
                  {(w.time / 1000).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {winnersData && (
        <Pagination
          total={winnersData.total}
          limit={LIMIT}
          source="winners"
        />
      )}
    </section>
  );
}


