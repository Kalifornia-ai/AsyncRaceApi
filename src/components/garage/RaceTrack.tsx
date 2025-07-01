import {
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
  } from 'react';
  import { Car } from '../../types/car';
  import {
    useStartEngineMutation,
    useStopEngineMutation,
    useDriveEngineMutation,
  } from '../../api/engineApi';
  import {
    useCreateWinnerMutation,
    useUpdateWinnerMutation,
  } from '../../api/winnersApi';
  
  /* ───────── Types ───────── */
  export interface RaceTrackHandles {
    stopAll(): void;
    resetAll(): void;
  }
  
  interface Props {
    cars: Car[];
    onRaceEnd(msg: string): void;
  }
  
  /* ───────── Constants ───────── */
  const API_URL = import.meta.env.VITE_API ?? 'http://localhost:3000';
  const DEV_SLOWDOWN = import.meta.env.DEV ? 1 : 4; // show motion clearly in prod
  
  /* ───────── Helpers ───────── */
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  
  /* ------------------------------------------------------------------ */
  const RaceTrack = forwardRef<RaceTrackHandles, Props>(({ cars, onRaceEnd }, ref) => {
    /* ------- RTK Query hooks ---------------------------------------- */
    const [startEngine]  = useStartEngineMutation();
    const [stopEngine]   = useStopEngineMutation();
    const [drive]        = useDriveEngineMutation();
    const [createWinner] = useCreateWinnerMutation();
    const [updateWinner] = useUpdateWinnerMutation();
  
    /* ------- DOM refs ------------------------------------------------ */
    const lanes    = useRef<Record<number, HTMLDivElement | null>>({});
    const finished = useRef(false);
  
    /* ------- Handles exposed to parent ------------------------------ */
    useImperativeHandle(ref, () => ({
      stopAll() {
        Object.values(lanes.current).forEach((lane) => {
          lane?.getAnimations().forEach((a) => a.pause());
        });
        cars.forEach((c) =>  void stopEngine({ id: c.id, status: 'stopped' }).unwrap());
      },
      resetAll() {
        Object.values(lanes.current).forEach((lane) => {
          if (!lane) return;
          lane.getAnimations().forEach((a) => a.cancel());
          lane.style.removeProperty('transform');
          lane.removeAttribute('data-started');
        });
        finished.current = false;
      },
    }), [cars, stopEngine]);
  
    /* ------- Run race once per `cars` prop -------------------------- */
    useLayoutEffect(() => {
      const controller = new AbortController();
      const { signal } = controller;
  
      (async () => {
        const results = await Promise.all(
          cars.map(async (car) => {
            /* 1. start engine */
            let velocity = 0;
            let distance = 0;
            try {
              ({ velocity, distance } = await startEngine({
                   id: car.id,
                   status: 'started',
                 }).unwrap());
              velocity = Math.max(velocity / DEV_SLOWDOWN, 80); // px/s safeguard
            } catch {
              return { id: car.id, time: Infinity };
            }
            if (signal.aborted) return { id: car.id, time: Infinity };
  
            /* 2. measure lane + travel */
            const lane = lanes.current[car.id]!;
            const rowW = lane.parentElement!.getBoundingClientRect().width;
            const carW = lane.getBoundingClientRect().width;
            
            // clamp travel so you never animate off‐screen
            const free = Math.max(rowW - carW - 8, 0);
            const travel = Math.max(20, Math.min(distance, free));
            
            // duration in ms
            const durMs = (travel / velocity) * 1000;
            
            lane.animate(
              [
                { transform: 'translateX(0)' },
                { transform: `translateX(${travel}px)` },
              ],
              { duration: durMs, easing: 'linear', fill: 'forwards' },
            );
  
            /* 5. drive endpoint – resolve after durMs so motion stays visible */
            let success = false;
            try {
              ({ success } = await drive({
                   id: car.id,
                   status: 'drive',
                 }).unwrap());
            } catch {
              success = false;
            }
            // wait full duration so component stays mounted long enough
            await wait(durMs);
            return { id: car.id, time: success ? durMs : Infinity };
          }),
        );
  
        /* 6. decide winner */
        const winner = results.reduce((best, cur) => cur.time < best.time ? cur : best, { id: -1, time: Infinity });
        finished.current = true;
  
        onRaceEnd(
          winner.id === -1
            ? 'No car finished the race 🏳'
            : `🏆 Car #${winner.id} wins in ${(winner.time / 1000).toFixed(2)} s`,
        );
  
        if (winner.id === -1) return;
  
        /* 7. upsert winner */
        try {
          const list = await fetch(`${API_URL}/winners?id=${winner.id}`).then((r) => r.json() as Promise<any[]>);
          const row  = list[0];
          if (!row) {
            await createWinner({ id: winner.id, wins: 1, time: winner.time }).unwrap();
          } else {
            await updateWinner({ id: winner.id, wins: row.wins + 1, time: Math.min(row.time, winner.time) }).unwrap();
          }
        } catch (e) {
          console.error('winner save failed', e);
        }
      })();
  
      return () => {
        controller.abort();
        if (!finished.current) cars.forEach((c) => void stopEngine({ id: c.id, status: 'stopped' }).unwrap());
      };
    }, [cars, startEngine, drive, stopEngine, createWinner, updateWinner, onRaceEnd]);
  
    /* ------- UI ---------------------------------------------------- */
    return (
      <div className="space-y-3">
        {cars.map((car) => (
          <div key={car.id} className="relative h-10 border rounded bg-gray-100 w-full min-w-[600px]">
            <div
              ref={(el) => { if (el) lanes.current[car.id] = el; }}
              className="absolute left-0 top-0 h-full flex items-center gap-2 pl-2"
              style={{ overflow: 'visible' }}
            >
              <div className="h-6 w-10 rounded" style={{ backgroundColor: car.color }} />
              <span className="text-sm">{car.name}</span>
            </div>
          </div>
        ))}
      </div>
    );
  });
  
  RaceTrack.displayName = 'RaceTrack';
  export default RaceTrack;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

