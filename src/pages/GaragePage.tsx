import { useRef, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import { useGetCarsQuery } from '../api/garageApi';
import CarForm from '../components/garage/CarForm';
import CarCard from '../components/garage/CarCard';
import Pagination from '../components/garage/Pagination';
import RaceTrack, { RaceTrackHandles } from '../components/garage/RaceTrack';

const PAGE_LIMIT = 7;

export default function GaragePage() {
  const page = useAppSelector((s) => s.ui.page);

  const [isRacing, setRacing] = useState(false);
  const [banner,  setBanner]  = useState<string | null>(null);   // ← keeps winner text

  const { data, isFetching, error } = useGetCarsQuery({ page, limit: PAGE_LIMIT });
  const trackRef = useRef<RaceTrackHandles>(null);

  /* ---------- early error state ---------- */
  if (error) {
    const msg =
      'status' in error
        ? `${error.status} – ${JSON.stringify(error.data)}`
        : error.message ?? 'network';
    return <p className="text-red-600">Error: {msg}</p>;
  }

  return (
    <section className="space-y-6">

      {/* ⚠️ 1. banner restored */}
      {banner && (
        <div className="rounded bg-green-100 text-green-800 px-3 py-2">
          {banner}
        </div>
      )}

      <h1 className="text-2xl font-semibold text-gray-900">
        Garage ({data?.total ?? 0})
      </h1>

      <CarForm />

      {isFetching && <p>Loading…</p>}

      <div className="space-y-2">
        {data?.data?.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>

      {/* ---- Race controls ---- */}
      <div className="flex gap-4">
        <button
          className="btn btn-success"
          disabled={isRacing || (data?.data?.length ?? 0) === 0}
          onClick={() => {
            setBanner(null);            // ⚠️ 2. clear banner on new race
            setRacing(true);
          }}
        >
          Race
        </button>

        <button
          className="btn btn-outline"
          disabled={!isRacing}
          onClick={() => {
            trackRef.current?.stopAll();   // pause + stopEngine
            trackRef.current?.resetAll();  // rewind cars
            setBanner(null);               // clear message
            setRacing(false);
          }}
        >
          Reset
        </button>
      </div>

      {isRacing && data?.data && (
        <RaceTrack
          ref={trackRef}
          cars={data.data}
          onRaceEnd={(msg) => {
            setBanner(msg);                // show winner text
            setRacing(false);
          }}
        />
      )}

      {data && <Pagination total={data.total} limit={PAGE_LIMIT} />}
    </section>
  );
}

  