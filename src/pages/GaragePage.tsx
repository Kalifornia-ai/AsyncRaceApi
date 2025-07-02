/* src/pages/GaragePage.tsx */
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGetCarsQuery } from '../api/garageApi';
import CarForm from '../components/garage/CarForm';
import CarCard from '../components/garage/CarCard';
import Pagination from '../components/garage/Pagination';
import RaceTrack, { RaceTrackHandles } from '../components/garage/RaceTrack';
import {
  startRace,
  resetRace,
  finishRace,
} from '../app/uiSlice';          // ← actions from the patched slice

const PAGE_LIMIT = 7;

export default function GaragePage() {
  const dispatch  = useAppDispatch();
  const page      = useAppSelector((s) => s.ui.garagePage);
  const { isRacing, banner } = useAppSelector((s) => s.ui);

  const { data, isFetching, error } = useGetCarsQuery({ page, limit: PAGE_LIMIT });
  const trackRef = useRef<RaceTrackHandles>(null);

  /* ── cleanup in case user leaves mid-race ─────────────────────────── */
  useEffect(() => () => {
    trackRef.current?.stopAll();
  }, []);

  /* ── early error state ────────────────────────────────────────────── */
  if (error) {
    const msg =
      'status' in error
        ? `${error.status} – ${JSON.stringify(error.data)}`
        : error.message ?? 'network';
    return <p className="text-red-600">Error: {msg}</p>;
  }

  return (
    <section className="space-y-6">
      {/* Winner banner (persists through navigation) */}
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

      {/* ── Race controls ─────────────────────────────────────────────── */}
      <div className="flex gap-4">
        <button
          className="btn btn-success"
          disabled={isRacing || (data?.data?.length ?? 0) === 0}
          onClick={() => dispatch(startRace())}
        >
          Race
        </button>

        <button
          className="btn btn-outline"
          disabled={!isRacing}
          onClick={() => {
            trackRef.current?.stopAll();
            trackRef.current?.resetAll();
            dispatch(resetRace());
          }}
        >
          Reset
        </button>
      </div>

      {isRacing && data?.data && (
        <RaceTrack
          ref={trackRef}
          cars={data.data}
          onRaceEnd={(msg) => dispatch(finishRace(msg))}
        />
      )}

      {data && (
        <Pagination
          total={data.total}
          limit={PAGE_LIMIT}
          source="garage"            /* ← keeps this tab’s page counter */
        />
      )}
    </section>
  );
}


  