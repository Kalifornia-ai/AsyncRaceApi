/* src/components/garage/RaceTrack.tsx */
import {
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
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
  
  import { useAppSelector } from '../../app/hooks';
  
  /* ───────── Helpers ───────── */
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const DEV_SLOWDOWN = import.meta.env.DEV ? 1 : 4;          // slower in prod
  
  /* ───────── Types ───────── */
  export interface RaceTrackHandles {
    stopAll(): void;
    resetAll(): void;
  }
  
  interface Props {
    cars: Car[];
    onRaceEnd(msg: string): void;
  }
  
  /* ------------------------------------------------------------------ */
  const RaceTrack = forwardRef<RaceTrackHandles, Props>(
    ({ cars, onRaceEnd }, ref) => {
      /* ---- global UI slice ---- */
      const singleId = useAppSelector((s) => s.ui.singleCarId);
  
      /* lanes to animate for this run (memoised) */
      const carsToAnimate = useMemo(
        () => (singleId ? cars.filter((c) => c.id === singleId) : cars),
        [singleId, cars],
      );
  
      /* ---- RTK-Query hooks ---- */
      const [startEngine]  = useStartEngineMutation();
      const [stopEngine]   = useStopEngineMutation();
      const [drive]        = useDriveEngineMutation();
      const [createWinner] = useCreateWinnerMutation();
      const [updateWinner] = useUpdateWinnerMutation();
  
      /* ---- DOM refs ---- */
      const lanes    = useRef<Record<number, HTMLDivElement | null>>({});
      const finished = useRef(false);
  
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
            });
            finished.current = false;
          },
        }),
        [cars, stopEngine],
      );
  
      /* ---- animation / race logic ---- */
      useLayoutEffect(() => {
        if (carsToAnimate.length === 0) return;                // nothing to run
  
        const controller = new AbortController();
        const { signal } = controller;
  
        (async () => {
          const results = await Promise.all(
            carsToAnimate.map(async (car) => {
              /* 1️⃣  start engine */
              let velocity = 0;
              let distance = 0;
              try {
                ({ velocity, distance } = await startEngine(car.id).unwrap());
                velocity = Math.max(velocity / DEV_SLOWDOWN, 80);
              } catch {
                return { id: car.id, time: Infinity };
              }
              if (signal.aborted) return { id: car.id, time: Infinity };
  
              /* 2️⃣  animate lane */
              const lane   = lanes.current[car.id]!;
              const rowW   = lane.parentElement!.getBoundingClientRect().width;
              const carW   = lane.getBoundingClientRect().width;
              const free   = Math.max(rowW - carW - 8, 0);
              const travel = Math.max(20, Math.min(distance, free));
              const durMs  = (travel / velocity) * 1000;
  
              lane.animate(
                [
                  { transform: 'translateX(0)' },
                  { transform: `translateX(${travel}px)` },
                ],
                { duration: durMs, easing: 'linear', fill: 'forwards' },
              );
  
              /* 3️⃣  drive endpoint (may 500) */
              let success = false;
              try {
                const res = await drive(car.id).unwrap() as { success?: boolean };
                success   = !!res.success;
              } catch { success = false; }
  
              await wait(durMs);
              return { id: car.id, time: success ? durMs : Infinity };
            }),
          );
  
          /* 4️⃣  single-car run finishes here */
          if (singleId) return;
  
          /* 5️⃣  decide winner */
          const winner = results.reduce(
            (best, cur) => (cur.time < best.time ? cur : best),
            { id: -1 as number, time: Infinity },
          );
          finished.current = true;
  
          onRaceEnd(
            winner.id === -1
              ? 'No car finished the race 🏳'
              : `🏆 Car #${winner.id} wins in ${(winner.time / 1000).toFixed(2)} s`,
          );
          if (winner.id === -1) return;
  
          /* 6️⃣  upsert winner row */
          try {
            const res = await fetch(
              `${import.meta.env.VITE_API ?? 'http://localhost:3000'}/winners/${winner.id}`,
            );
  
            if (res.ok) {
              const row: { wins: number; time: number } = await res.json();
              await updateWinner({
                id:   winner.id,
                wins: row.wins + 1,
                time: Math.min(row.time, winner.time),
              }).unwrap();
            } else if (res.status === 404) {
              await createWinner({ id: winner.id, wins: 1, time: winner.time }).unwrap();
            } else {
              console.error(`GET /winners/${winner.id} → ${res.status}`);
            }
          } catch (e) {
            console.error('Winner upsert failed', e);
          }
        })();
  
        /* ---- cleanup ---- */
        return () => {
          controller.abort();                                 // cancel fetches
          Object.values(lanes.current).forEach((lane) =>       // cancel CSS anims
            lane?.getAnimations().forEach((a) => a.cancel()),
          );
        };
      }, [
        carsToAnimate,
        singleId,
        startEngine,
        drive,
        stopEngine,
        updateWinner,
        createWinner,
        onRaceEnd,
      ]);
  
      /* ---- render lanes ---- */
      return (
        <div className="space-y-3">
          {cars.map((car) => (
            <div
              key={car.id}
              className="relative h-10 border rounded bg-gray-100 w-full"
            >
              <div
                ref={(el) => { if (el) lanes.current[car.id] = el; }}
                className="absolute left-0 top-0 h-full flex items-center gap-2 pl-2"
                style={{ overflow: 'visible' }}
              >
                <div
                  className="h-6 w-10 rounded"
                  style={{ backgroundColor: car.color }}
                />
                <span className="text-sm">{car.name}</span>
              </div>
            </div>
          ))}
        </div>
      );
    },
  );
  
  RaceTrack.displayName = 'RaceTrack';
  export default RaceTrack;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

