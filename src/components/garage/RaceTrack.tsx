/* src/components/garage/RaceTrack.tsx */
import { useEffect, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Car } from '../../types/car';

import {
  useStartEngineMutation,
  useStopEngineMutation,
  useDriveEngineMutation,
} from '../../api/garageApi';
import { useCreateWinnerMutation, useUpdateWinnerMutation } from '../../api/winnersApi';
import { markCarFailed, stopSingleCar } from '../../app/uiSlice';

import { useAppSelector, useAppDispatch } from '../../app/hooks';

/* ───────── Helpers ───────── */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DEV_SLOWDOWN = import.meta.env.DEV ? 1 : 4; // slower in prod

/* ───────── Types ───────── */
export interface RaceTrackHandles {
  stopAll(): void;
  resetAll(): void;
  stopLane(id: number): void;
}

interface Props {
  cars: Car[];
  onRaceEnd(msg: string): void;
  active: boolean;
}

/* ------------------------------------------------------------------ */
const RaceTrack = forwardRef<RaceTrackHandles, Props>(({ cars, active, onRaceEnd }, ref) => {
  /* ---- global UI slice ---- */

  const singleId = useAppSelector((s) => s.ui.singleCarId);
  const isAlive = useRef(true);

  /* lanes to animate for this run (memoised) */
  const carsToAnimate = useMemo(
    () => (singleId ? cars.filter((c) => c.id === singleId) : cars),
    [singleId, cars],
  );

  /* ---- RTK-Query hooks ---- */
  const [startEngine] = useStartEngineMutation();
  const [stopEngine] = useStopEngineMutation();
  const [drive] = useDriveEngineMutation();
  const [createWinner] = useCreateWinnerMutation();
  const [updateWinner] = useUpdateWinnerMutation();

  /* ---- DOM refs ---- */
  const lanes = useRef<Record<number, HTMLDivElement | null>>({});
  const finished = useRef(false);
  const dispatch = useAppDispatch();
  const hasRun = useRef(false);

  /* ---- public handles ---- */
  useImperativeHandle(
    ref,
    () => ({
      stopAll() {
        Object.values(lanes.current).forEach((lane) => {
          lane?.getAnimations().forEach((a) => a.cancel());
        });
        cars.forEach((c) => void stopEngine(c.id).unwrap());
      },
      resetAll() {
        Object.values(lanes.current).forEach((lane) => {
          if (!lane) return;
          lane.getAnimations().forEach((a) => a.cancel());
          lane.style.removeProperty('transform');
          lane.style.removeProperty('outline');
        });
        finished.current = false;
      },
      stopLane(id: number) {
        const lane = lanes.current[id];
        if (!lane) return;

        /* 1. Freeze the animation at its current frame */
        lane.getAnimations().forEach((a) => {
          if (a.playState === 'running') a.pause();
        });

        /* 2. Tag this lane so the cleanup logic skips it */
        lane.dataset.stopped = '1';

        /* 3. Tell the backend we stopped the engine */
        void stopEngine(id).unwrap();
      },
    }),
    [cars, stopEngine],
  );

  /* ---- animation / race logic ---- */
  /* ---- animation / race logic ---- */
  useEffect(() => {
    isAlive.current = true;
    if (!active || carsToAnimate.length === 0) return;

    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      // 1️⃣ Start, animate & drive each lane
      const settled = await Promise.allSettled(
        carsToAnimate.map(async (car) => {
          let velocity = 0;
          try {
            ({ velocity } = await startEngine(car.id).unwrap());
            velocity = Math.max(velocity / DEV_SLOWDOWN, 80);
          } catch {
            return { id: car.id, time: Infinity };
          }
          if (signal.aborted) return { id: car.id, time: Infinity };

          // compute remaining distance...
          const lane = lanes.current[car.id]!;
          const rowW = lane.parentElement!.getBoundingClientRect().width;
          const carW = lane.getBoundingClientRect().width;
          const free = Math.max(rowW - carW, 0);
          const prevTx = (() => {
            const m = getComputedStyle(lane).transform;
            const parts = m.startsWith('matrix') ? m.slice(7, -1).split(',') : [];
            return parts.length === 6 ? parseFloat(parts[4]) : 0;
          })();
          const remaining = Math.max(free - prevTx, 0);
          if (remaining === 0) return { id: car.id, time: Infinity };

          const durMs = (remaining / velocity) * 1000;
          const anim = lane.animate(
            [{ transform: `translateX(${prevTx}px)` }, { transform: `translateX(${free}px)` }],
            { duration: durMs, easing: 'linear', fill: 'forwards' },
          );

          // drive call (may 500)
          try {
            const res = (await drive(car.id).unwrap()) as { success?: boolean };
            if (!res.success) throw new Error('drive failed');
          } catch {
            anim.pause();
            lane.style.outline = '2px solid red';
            lane.dataset.stopped = '1';
            dispatch(markCarFailed(car.id));
            if (singleId) dispatch(stopSingleCar());
            return { id: car.id, time: Infinity };
          }

          await wait(durMs);
          return { id: car.id, time: durMs };
        }),
      );

      // 2️⃣ Normalize results & pick winner
      const results = settled.map((r) =>
        r.status === 'fulfilled' ? r.value : { id: -1, time: Infinity },
      );
      const winner = results.reduce((best, cur) => (cur.time < best.time ? cur : best), {
        id: -1,
        time: Infinity,
      });

      if (!isAlive.current) return;
      // 3️⃣ Notify parent & upsert
      if (winner.id === -1) {
        onRaceEnd('No car finished the race 🏳');
      } else {
        const w = cars.find((c) => c.id === winner.id)!;
        onRaceEnd(`🏆 ${w.name} wins in ${(winner.time / 1000).toFixed(2)} s`);

        // 1️⃣ Try to fetch existing winner
        const res = await fetch(`${import.meta.env.VITE_API}/winners/${winner.id}`);
        if (res.ok) {
          // 2️⃣ If exists, update via PUT
          const row = await res.json();
          await updateWinner({
            id: winner.id,
            wins: row.wins + 1,
            time: Math.min(row.time, winner.time),
          }).unwrap();
        } else if (res.status === 404) {
          // 3️⃣ If not found, create new via POST
          await createWinner({
            id: winner.id,
            wins: 1,
            time: winner.time,
          }).unwrap();
        } else {
          console.error('Unexpected response fetching winner:', res.status);
        }
      }

      // 4️⃣ Reset so track disappears
    })();

    return () => {
      controller.abort();
      isAlive.current = false;
      // rewind any unfinished lanes
      Object.values(lanes.current).forEach((lane) => {
        if (!lane || lane.dataset.stopped === '1') return;
        lane.getAnimations().forEach((a) => a.cancel());
      });
    };
  }, [
    active,
    carsToAnimate,
    drive,
    startEngine,
    stopEngine,
    updateWinner,
    createWinner,
    onRaceEnd,
    dispatch,
  ]);
  /* ---- render lanes ---- */
  return (
    <div className="space-y-3">
      {cars.map((car) => (
        <div key={car.id} className="relative h-10 border rounded bg-gray-100 w-full">
          <div
            ref={(el) => {
              if (el) lanes.current[car.id] = el;
            }}
            className="absolute left-0 top-0 h-full flex items-center gap-2 pl-2"
            style={{ overflow: 'visible' }}
          >
            <div className="h-6 w-10 rounded" style={{ backgroundColor: car.color }} />
            <span className="text-sm car-label text-gray-800">{car.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
});

RaceTrack.displayName = 'RaceTrack';
export default RaceTrack;
