import {
    useEffect,
    forwardRef,
    useImperativeHandle,
    useMemo,
    useRef,
  } from 'react';
  import { Car } from '../../types/car';
  
  import {
    useStartEngineMutation,
    useStopEngineMutation,
    useDriveEngineMutation,
  } from '../../api/garageApi';
  import {
    useCreateWinnerMutation,
    useUpdateWinnerMutation,
  } from '../../api/winnersApi';
  import { markCarFailed, stopSingleCar } from '../../app/uiSlice';
  import { useAppSelector, useAppDispatch } from '../../app/hooks';
  
  /* ───────── Helpers ───────── */
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }); // executor returns void → no‐promise-executor-return satisfied
  
  const DEV_SLOWDOWN = import.meta.env.DEV ? 1 : 4;
  
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
  
  interface WinnerRow {
    wins: number;
    time: number;
  }
  
  interface StartEngineRes {
    velocity: number;
    distance: number;
    id: number;
  }
  const isStartRes = (v: unknown): v is StartEngineRes =>
    typeof v === 'object' &&
    v !== null &&
    'velocity' in v &&
    typeof (v as Record<string, unknown>).velocity === 'number';
  
  interface DriveRes {
    success: boolean;
  }
  const isDriveRes = (v: unknown): v is DriveRes =>
    typeof v === 'object' && v !== null && 'success' in v;
  
  interface Result {
    id: number;
    time: number;
  }
  
  /* eslint-disable max-lines-per-function */ // long but focused logic
  const RaceTrack = forwardRef<RaceTrackHandles, Props>(
    ({ cars, active, onRaceEnd }, ref) => {
      const singleId = useAppSelector((s) => s.ui.singleCarId);
      const dispatch = useAppDispatch();
  
      const isAlive = useRef(true);
      const lanesRef = useRef<Record<number, HTMLDivElement | null>>({});
  
      const carsToAnimate = useMemo(
        () => (singleId != null ? cars.filter((c) => c.id === singleId) : cars),
        [cars, singleId],
      );
  
      /* ----- RTK-Query hooks ----- */
      const [startEngine] = useStartEngineMutation();
      const [stopEngine] = useStopEngineMutation();
      const [drive] = useDriveEngineMutation();
      const [createWinner] = useCreateWinnerMutation();
      const [updateWinner] = useUpdateWinnerMutation();
  
      /* ----- Imperative handle ----- */
      useImperativeHandle(
        ref,
        () => ({
          stopAll() {
            Object.values(lanesRef.current).forEach((el) =>
              el?.getAnimations().forEach((anim) => anim.cancel()),
            );
            cars.forEach((c) => void stopEngine(c.id).unwrap());
          },
          resetAll() {
            Object.values(lanesRef.current).forEach((el) => {
              if (!el) return;
              el.getAnimations().forEach((anim) => anim.cancel());
              el.style.removeProperty('transform');
              el.style.removeProperty('outline');
            });
            isAlive.current = true;
          },
          stopLane(id) {
            const el = lanesRef.current[id];
            if (!el) return;
            el.getAnimations().forEach(
              (anim) => anim.playState === 'running' && anim.pause(),
            );
            el.dataset.stopped = '1';
            void stopEngine(id).unwrap();
          },
        }),
        [cars, stopEngine],
      );
  
      /* ───────── Race effect ───────── */
      useEffect(() => {
        if (!active || carsToAnimate.length === 0) return;
        isAlive.current = true;
  
        const controller = new AbortController();
        const { signal } = controller;
        const snapshot = { ...lanesRef.current };
  
        (async () => {
          const settled = await Promise.allSettled(
            carsToAnimate.map(async (car) => {
              /* ---------- 1. Start engine ---------- */
              let velocity = 0;
              try {
                const resUnknown = await startEngine(car.id).unwrap();
                if (!isStartRes(resUnknown))
                  throw new Error('Invalid start-engine payload');
                velocity = Math.max(resUnknown.velocity / DEV_SLOWDOWN, 80);
              } catch {
                return { id: car.id, time: Infinity };
              }
  
              if (signal.aborted) return { id: car.id, time: Infinity };
  
              /* ---------- 2. Prepare lane ---------- */
              const laneEl = snapshot[car.id];
              if (!laneEl) return { id: car.id, time: Infinity };
  
              const parentW =
                laneEl.parentElement!.getBoundingClientRect().width;
              const carW = laneEl.getBoundingClientRect().width;
              const free = Math.max(parentW - carW, 0);
  
              const { transform } = getComputedStyle(laneEl);
              const parts = transform.startsWith('matrix')
                ? transform.slice(7, -1).split(',')
                : [];
              const prevTx =
                parts.length === 6 ? parseFloat(parts[4]) : 0;
  
              const remaining = Math.max(free - prevTx, 0);
              if (remaining === 0) return { id: car.id, time: Infinity };
  
              const durMs = (remaining / velocity) * 1000;
              const anim = laneEl.animate(
                [
                  { transform: `translateX(${prevTx}px)` },
                  { transform: `translateX(${free}px)` },
                ],
                { duration: durMs, easing: 'linear', fill: 'forwards' },
              );
  
              /* ---------- 3. Drive check ---------- */
              try {
                const driveUnknown = await drive(car.id).unwrap();
                if (!isDriveRes(driveUnknown) || !driveUnknown.success)
                  throw new Error();
              } catch {
                anim.pause();
                laneEl.style.outline = '2px solid red';
                laneEl.dataset.stopped = '1';
                dispatch(markCarFailed(car.id));
                if (singleId != null) dispatch(stopSingleCar());
                return { id: car.id, time: Infinity };
              }
  
              await wait(durMs);
              return { id: car.id, time: durMs };
            }),
          );
  
          /* ---------- 4. Determine winner ---------- */
          const results = settled.map<Result>((r) =>
            r.status === 'fulfilled' && r.value
              ? r.value
              : { id: -1, time: Infinity },
          );
          const winner = results.reduce(
            (best, cur) => (cur.time < best.time ? cur : best),
            { id: -1, time: Infinity },
          );
  
          if (!isAlive.current) return;
  
          /* ---------- 5. No finisher ---------- */
          if (winner.id === -1) {
            onRaceEnd('No car finished the race 🏳');
            return;
          }
  
          /* ---------- 6. Announce winner ---------- */
          const winCar = cars.find((c) => c.id === winner.id)!;
          onRaceEnd(
            `🏆 ${winCar.name} wins in ${(winner.time / 1000).toFixed(2)} s`,
          );
  
          /* ---------- 7. Update / create winner ---------- */
          try {
            const resp = await fetch(
              `${import.meta.env.VITE_API}/winners/${winner.id}`,
            );
            if (resp.ok) {
              const raw: unknown = await resp.json();
              if (
                typeof raw === 'object' &&
                raw !== null &&
                'wins' in raw &&
                'time' in raw
              ) {
                const row = raw as WinnerRow;
                await updateWinner({
                  id: winner.id,
                  wins: row.wins + 1,
                  time: Math.min(row.time, winner.time),
                }).unwrap();
              } else {
                throw new Error('Winner row schema mismatch');
              }
            } else if (resp.status === 404) {
              await createWinner({
                id: winner.id,
                wins: 1,
                time: winner.time,
              }).unwrap();
            }
          } catch (e: unknown) {
            console.error(
              'Failed to update/create winner',
              e instanceof Error ? e : String(e),
            );
          }
        })();
  
        /* ---------- cleanup ---------- */
        return () => {
          controller.abort();
          isAlive.current = false;
          Object.values(snapshot).forEach((el) => {
            if (!el || el.dataset.stopped === '1') return;
            el.getAnimations().forEach((anim) => anim.cancel());
          });
        };
      }, [
        active,
        carsToAnimate,
        startEngine,
        stopEngine,
        drive,
        updateWinner,
        createWinner,
        onRaceEnd,
        dispatch,
        singleId,
        cars,
      ]);
  
      /* ───────── JSX ───────── */
      return (
        <div className="space-y-3">
          {cars.map((car) => (
            <div
              key={car.id}
              className="relative h-10 border rounded bg-gray-100 w-full"
            >
              <div
                ref={(el) => {
                  if (el) lanesRef.current[car.id] = el;
                }}
                className="absolute left-0 top-0 h-full flex items-center gap-2 pl-2"
                style={{ overflow: 'visible' }}
              >
                <div
                  className="h-6 w-10 rounded"
                  style={{ backgroundColor: car.color }}
                />
                <span className="text-sm car-label text-gray-800">
                  {car.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    },
  );
  
  RaceTrack.displayName = 'RaceTrack';
  export default RaceTrack;
  
  

