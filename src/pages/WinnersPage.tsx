/* src/pages/WinnersPage.tsx */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGetWinnersQuery } from '../api/winnersApi';
import { useGetCarsQuery } from '../api/garageApi';
import Pagination from '../components/garage/Pagination';
import { setWinnersPage, setSort, resetRace } from '../app/uiSlice';


const LIMIT = 10;

export default function WinnersPage() {
  /* --- UI state from Redux --- */
  const dispatch = useAppDispatch();
  const { winnersPage: page, sort, order } = useAppSelector((s) => s.ui);

  /* --- Data fetches --- */
  const winnersQ = useGetWinnersQuery({ page, limit: LIMIT, sort, order });
  const carsQ = useGetCarsQuery({ page: 1, limit: 1000 }); // names & colours

  const carById = Object.fromEntries((carsQ.data?.data ?? []).map((c) => [c.id, c]));

  const location = useLocation();

  useEffect(() => {
    // whenever the URL becomes /winners, clear any running race
    if (location.pathname === '/winners') {
      dispatch(resetRace());
    }
  }, [dispatch, location.pathname]);

  /* --- Early error guard --- */
  if (winnersQ.error) {
    const msg =
      'status' in winnersQ.error
        ? `${winnersQ.error.status} – ${JSON.stringify(winnersQ.error.data)}`
        : winnersQ.error.message ?? 'network';
    return <p className="text-red-600">Failed to load winners: {msg}</p>;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Winners&nbsp;({winnersQ.data?.total ?? 0})
      </h1>

      {/* Sort buttons */}
      <div className="flex gap-4">
        {(['wins', 'time'] as const).map((col) => (
          <button type="button"
            key={col}
            className="btn btn-sm btn-outline cursor-pointer"
            onClick={() => {
              dispatch(setSort(col)); // toggles order if same col
              dispatch(setWinnersPage(1)); // reset to first page
            }}
          >
            Sort by&nbsp;{col}&nbsp;
            {sort === col && (order === 'asc' ? '🔼' : '🔽')}
          </button>
        ))}
      </div>

      {/* Loading indicator */}
      {winnersQ.isFetching && <p>Loading…</p>}

      {/* Empty state */}
      {winnersQ.data?.total === 0 && !winnersQ.isFetching && (
        <p className="text-center italic text-gray-500">No winners yet—run a race!</p>
      )}

      {/* Winners table */}
      {winnersQ.data?.total !== 0 && (
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1">#</th>
              <th>Car</th>
              <th>Wins</th>
              <th>Best time&nbsp;(s)</th>
            </tr>
          </thead>
          <tbody>
            {winnersQ.data?.data.map((w, idx) => (
              <tr key={w.id} className="border-t">
                <td className="px-2 text-center">{(page - 1) * LIMIT + idx + 1}</td>
                <td className="flex items-center gap-2">
                  <div
                    className="h-4 w-6 rounded"
                    style={{ backgroundColor: carById[w.id]?.color ?? '#999' }}
                  />
                  {carById[w.id]?.name ?? `Car ${w.id}`}
                </td>
                <td className="text-center">{w.wins}</td>
                <td className="text-center">{(w.time / 1000).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {winnersQ.data && <Pagination total={winnersQ.data.total} limit={LIMIT} source="winners" />}
    </section>
  );
}
