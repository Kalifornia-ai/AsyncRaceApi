import { useEffect, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGetCarsQuery } from '../api/garageApi';
import {
  startRace,
  resetRace,
  finishRace,
  setTotalCars,
  setGaragePage,
} from '../app/uiSlice';

import CarForm from '../components/garage/CarForm';
import CarCard from '../components/garage/CarCard';
import Pagination from '../components/garage/Pagination';
import RaceTrack, { RaceTrackHandles } from '../components/garage/RaceTrack';

const PAGE_LIMIT = 7;

export default function GaragePage() {
  const dispatch  = useAppDispatch();
  const page      = useAppSelector((s) => s.ui.garagePage);
  const singleId  = useAppSelector((s) => s.ui.singleCarId);
  const { isRacing, banner } = useAppSelector((s) => s.ui);

  const { data, isFetching, error } = useGetCarsQuery({
    page,
    limit: PAGE_LIMIT,
  });

  const trackRef = useRef<RaceTrackHandles>(null);

  /* ─── mount / unmount ─────────────────────────────────────────── */
  useEffect(() => {
    /* reset any stale race state once on mount */
    dispatch(resetRace());

    /* cancel CSS animations if we navigate away from Garage */
    return () => trackRef.current?.stopAll();
  }, [dispatch]);

  /* ─── keep totalCars in Redux ─────────────────────────────────── */
  useEffect(() => {
    if (data?.total !== undefined) dispatch(setTotalCars(data.total));
  }, [data?.total, dispatch]);

  /* ─── clamp page number after bulk deletes ────────────────────── */
  useEffect(() => {
    if (data?.total) {
      const last = Math.max(1, Math.ceil(data.total / PAGE_LIMIT));
      if (page > last) dispatch(setGaragePage(last));
    }
  }, [data?.total, page, dispatch]);

  /* ─── early error ─────────────────────────────────────────────── */
  if (error) {
    const msg =
      'status' in error
        ? `${error.status} – ${JSON.stringify(error.data)}`
        : error.message ?? 'network';
    return <p className="text-red-600">Error: {msg}</p>;
  }

  /* ─── memoised car rows ───────────────────────────────────────── */
  const rows = useMemo(
    () => data?.data.map((c) => <CarCard key={c.id} car={c} />) ?? [],
    [data?.data],
  );

  /* ─── render ──────────────────────────────────────────────────── */
  return (
    <section className="space-y-6">
      {banner && (
        <div className="rounded bg-green-100 text-green-800 px-3 py-2">
          {banner}
        </div>
      )}

      <h1 className="text-2xl font-semibold text-gray-900">
        Garage&nbsp;({data?.total ?? 0})
      </h1>

      <CarForm />

      {data?.total === 0 && !isFetching && (
        <p className="text-center italic text-gray-500">
          No cars in the garage yet—create one above!
        </p>
      )}

      {isFetching && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      )}

      {!isFetching && <div className="space-y-2">{rows}</div>}

      {/* lanes for individual “Start” runs are mounted here by CarCard */}
      <div id="car-lanes" className="space-y-2 mt-4" />

      {/* race controls */}
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

      {/* track is shown for full race OR while a single lane is running */}
      {(isRacing || singleId !== null) && data?.data && (
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
          source="garage"
        />
      )}
    </section>
  );
}



  