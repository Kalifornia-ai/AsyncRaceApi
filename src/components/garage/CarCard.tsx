import { useState } from 'react';
import { Car } from '../../types/car';
import {
  useDeleteCarMutation,
} from '../../api/garageApi';
import { useDriveEngineMutation, useStartEngineMutation, useStopEngineMutation } from '../../api/engineApi';
import { useDeleteWinnerMutation } from '../../api/winnersApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectCar, setGaragePage } from '../../app/uiSlice';
import { shouldRewindPage } from '../../utils/garage';

interface Props {
  car: Car;
  onStart?: (id: number) => void; // parent animation hook (optional)
  onStop?:  (id: number) => void;
}

export default function CarCard({ car, onStart, onStop }: Props) {
  const dispatch = useAppDispatch();
  const page     = useAppSelector((s) => s.ui.garagePage);
  const total    = useAppSelector((s) => s.ui.totalCars);

  /* RTK-Query hooks */
  const [deleteCar,   { isLoading: isDeleting }] = useDeleteCarMutation();
  const [deleteWinner]                           = useDeleteWinnerMutation();
  const [startEngine]                            = useStartEngineMutation();
  const [drive]                                  = useDriveEngineMutation();
  const [stopEngine]                             = useStopEngineMutation();

  /* local running state (for button disables) */
  const [isRunning, setRunning] = useState(false);

  /* ───────── handlers ───────── */

  const handleStart = async () => {
    setRunning(true);
    try {
      await startEngine({ id: car.id, status: 'started' }).unwrap();
      onStart?.(car.id);

      /* drive endpoint – if 500 cancel run */
      await drive({ id: car.id, status: 'drive' }).unwrap();
    
    } catch (err) {
      console.error(`Start/drive failed for car ${car.id}:`, err);
      onStop?.(car.id);               // parent can cancel animation
    } finally {
      setRunning(false);
    }
  };

  const handleStop = async () => {
    setRunning(true);
    try {
      await stopEngine({ id: car.id, status: 'stopped' }).unwrap();
      onStop?.(car.id);
    } catch (err) {
      console.error(`Failed to stop engine for ${car.id}:`, err);
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${car.name}?`)) return;
    try {
      await deleteCar(car.id).unwrap();
      await deleteWinner(car.id).unwrap().catch(() => {}); // ignore 404

      const nextTotal = Math.max(0, total - 1);
      if (shouldRewindPage(nextTotal, page, 7)) {
        dispatch(setGaragePage(page - 1));
      }
    } catch (err) {
      console.error(`Failed to delete car ${car.id}:`, err);
      alert('Delete failed – see console.');
    }
  };

  /* ───────── UI ───────── */
  return (
    <div className="flex items-center justify-between p-2 border rounded shadow-sm">
      <div className="flex items-center gap-3">
        <svg width="48" height="24">
          <rect width="48" height="24" rx="3" fill={car.color} />
        </svg>
        <span className="ml-2 font-medium text-gray-800">{car.name}</span>
      </div>

      <div className="flex gap-2">
        <button
          className="btn btn-xs btn-success"
          onClick={handleStart}
          disabled={isRunning || isDeleting}
        >
          Start
        </button>
        <button
          className="btn btn-xs btn-warning"
          onClick={handleStop}
          disabled={!isRunning || isDeleting}
        >
          Stop
        </button>
        <button
          className="btn btn-xs btn-outline"
          onClick={() => dispatch(selectCar(car.id))}
          disabled={isRunning || isDeleting}
          title="Edit"
        >
          ✏️
        </button>
        <button
          className="btn btn-xs btn-error"
          onClick={handleDelete}
          disabled={isRunning || isDeleting}
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  );
}



