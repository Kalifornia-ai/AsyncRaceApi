import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGetCarsQuery } from '../api/garageApi';
import { startRace, resetRace, finishRace, setTotalCars, setGaragePage } from '../app/uiSlice';
import type { Car } from '../types/car';

import CarForm from '../components/garage/CarForm';
import CarCard from '../components/garage/CarCard';
import Pagination from '../components/garage/Pagination';
import RaceTrack, { RaceTrackHandles } from '../components/garage/RaceTrack';

const PAGE_LIMIT = 10;

export default function GaragePage() {
  const dispatch = useAppDispatch();
  const page = useAppSelector((s) => s.ui.garagePage);
  const { isRacing, singleCarId, banner, trackVisible } = useAppSelector((s) => s.ui);
  const anyRunning = isRacing || singleCarId !== null;

  /* --- backend data -------------------------------------------------- */
  const { data, isFetching, error } = useGetCarsQuery({
    page,
    limit: PAGE_LIMIT,
  });

  /* --- refs ---------------------------------------------------------- */
  const raceCarsRef = useRef<Car[] | null>(null);
  const trackRef = useRef<RaceTrackHandles>(null);
  const prevPage = useRef(page);

  /* --- memoised values ---------------------------------------------- */
  const carsData = useMemo<Car[]>(() => data?.data ?? ([] as Car[]), [data]);

  const rows = useMemo<JSX.Element[]>(
    () =>
      carsData.map((c) => (
        <CarCard key={c.id} car={c} pauseAnim={(id) => trackRef.current?.stopLane(id)} />
      )),
    [carsData],
  );

  /* --- handlers ------------------------------------------------------ */
  const handleRaceEnd = useCallback((msg: string) => dispatch(finishRace(msg)), [dispatch]);

  const handleReset = useCallback(() => {
    trackRef.current?.stopAll();
    trackRef.current?.resetAll();
    raceCarsRef.current = null;
    dispatch(resetRace());
  }, [dispatch]);

  /* --- effects ------------------------------------------------------- */
  useEffect(() => {
    if (isRacing) raceCarsRef.current = carsData;
  }, [isRacing, carsData]);

  useEffect(() => {
    if (prevPage.current !== page && !isRacing && singleCarId === null) {
      raceCarsRef.current = null;
      dispatch(resetRace());
    }
    prevPage.current = page;
  }, [page, isRacing, singleCarId, dispatch]);

  useEffect(() => {
    dispatch(resetRace());
    const handle = trackRef.current;
    return () => {
      handle?.stopAll();
      dispatch(resetRace());
    };
  }, [dispatch]);

  useEffect(() => {
    if (typeof data?.total === 'number') dispatch(setTotalCars(data.total));
  }, [data?.total, dispatch]);

  useEffect(() => {
    if (data?.total) {
      const last = Math.max(1, Math.ceil(data.total / PAGE_LIMIT));
      if (page > last) dispatch(setGaragePage(last));
    }
  }, [data?.total, page, dispatch]);

  /* --- error state --------------------------------------------------- */
  if (error) {
    let msg = 'Unknown error';
    if (typeof error === 'object' && error !== null && 'status' in error && 'data' in error) {
      const errObj = error as { status: number; data?: unknown };
      msg = `${errObj.status} – ${JSON.stringify(errObj.data)}`;
    } else if (error instanceof Error) {
      msg = error.message;
    }
    return <p className="text-red-600">Error: {msg}</p>;
  }

  /* --- render -------------------------------------------------------- */
  return (
    <section className="space-y-6">
      {banner && <div className="rounded bg-green-100 text-green-800 px-3 py-2">{banner}</div>}

      <h1 className="text-2xl font-semibold text-gray-900">Garage ({data?.total ?? 0})</h1>

      <CarForm />

      {!isFetching && carsData.length === 0 && (
        <p className="text-center italic text-gray-500">
          No cars in the garage yet—create one above!
        </p>
      )}

      {isFetching && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: PAGE_LIMIT }, (_, i) => i).map((n) => (
            <div key={n} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      )}

      {!isFetching && <div className="space-y-2">{rows}</div>}

      <div id="car-lanes" className="space-y-2 mt-4" />

      <div className="flex gap-4">
        <button
          type="button"
          className="btn btn-success"
          disabled={anyRunning || trackVisible || carsData.length === 0}
          onClick={() => dispatch(startRace())}
        >
          Race
        </button>

        <button
          type="button"
          className="btn btn-outline"
          disabled={!(!isRacing && singleCarId === null && trackVisible)}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      {(trackVisible || singleCarId !== null) && (
        <RaceTrack
          ref={trackRef}
          cars={
            trackVisible
              ? raceCarsRef.current ?? carsData
              : carsData.filter((c) => c.id === singleCarId)
          }
          active={isRacing || singleCarId !== null}
          onRaceEnd={handleRaceEnd}
        />
      )}

      {data && (
        <Pagination total={data.total} limit={PAGE_LIMIT} source="garage" disabled={anyRunning} />
      )}
    </section>
  );
}
