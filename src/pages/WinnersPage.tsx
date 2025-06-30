import { useState } from 'react';
import {
  useGetWinnersQuery,
  Winner,
} from '../api/winnersApi';
import { useAppSelector } from '../app/hooks';
import Pagination from '../components/garage/Pagination';
import { useGetCarsQuery } from '../api/garageApi';

const LIMIT = 10;

export default function WinnersPage() {
  const [page, setPage]   = useState(1);
  const [sort, setSort]   = useState<'wins' | 'time'>('wins');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const winnersQ = useGetWinnersQuery({ page, limit: LIMIT, sort, order });
  // Need car names / colours for display
  const carsQ    = useGetCarsQuery({ page: 1, limit: 1000 });

  const carById = Object.fromEntries((carsQ.data?.data ?? []).map((c) => [c.id, c]));

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Winners ({winnersQ.data?.total ?? 0})
      </h1>

      {/* Sort buttons */}
      <div className="flex gap-4">
        {(['wins', 'time'] as const).map((col) => (
          <button
            key={col}
            className="btn btn-sm btn-outline"
            onClick={() => {
              setSort(col);
              setOrder(order === 'asc' ? 'desc' : 'asc');
            }}
          >
            Sort by {col} {sort === col && (order === 'asc' ? '🔼' : '🔽')}
          </button>
        ))}
      </div>

      {/* Table */}
      <table className="min-w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1">#</th>
            <th>Car</th>
            <th>Wins</th>
            <th>Best time, s</th>
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
              <td className="text-center text-gray-900">{w.wins}</td>
              <td className="text-center text-gray-900">{(w.time / 1000).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {winnersQ.data && (
        <Pagination
          total={winnersQ.data.total}
          limit={LIMIT}
          /* reuse same Pagination, but with local state */
          {...{ page, setPage }}
        />
      )}
    </section>
  );
}

  