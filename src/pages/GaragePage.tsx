import { useAppSelector } from '../app/hooks';
import { useGetCarsQuery } from '../api/garageApi';
import CarForm from '../components/garage/CarForm';
import CarCard from '../components/garage/CarCard';
import Pagination from '../components/garage/Pagination';

const PAGE_LIMIT = 7;

export default function GaragePage() {
  const page = useAppSelector((s) => s.ui.page);
  const { data, isFetching, isError } = useGetCarsQuery({ page, limit: PAGE_LIMIT });

  if (isError) {
    return (
      <p className="text-red-600">
        Error: {(isError as any)?.status || 'network'} –{' '}
        {JSON.stringify((isError as any)?.data || (isError as any)?.error)}
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Garage ({data?.total ?? 0})</h1>

      <CarForm />

      {isFetching && <p>Loading…</p>}

      <div className="space-y-2">
        {data?.data.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>

      {data && (
        <Pagination total={data.total} limit={PAGE_LIMIT} />
      )}
    </section>
  );
}
