import { useState } from 'react';
import { Car } from '../../types/car';

import { useStartEngineMutation,
    useStopEngineMutation,
    useDriveEngineMutation,
  useDeleteCarMutation
} from '../../api/garageApi';

import { useDeleteWinnerMutation } from '../../api/winnersApi';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  startSingleCar,
  stopSingleCar,
  selectCar,
  setGaragePage,
} from '../../app/uiSlice';
import { shouldRewindPage } from '../../utils/garage';

const PAGE_LIMIT = 7;

export default function CarCard({ car }: { car: Car }) {
  const dispatch = useAppDispatch();
  const page   = useAppSelector((s) => s.ui.garagePage);
  const total  = useAppSelector((s) => s.ui.totalCars);

  const [deleteCar,   { isLoading: isDeleting }] = useDeleteCarMutation();
  const [deleteWinner]                           = useDeleteWinnerMutation();
  const [startEngine]                            = useStartEngineMutation();
  const [drive]                                  = useDriveEngineMutation();
  const [stopEngine]                             = useStopEngineMutation();

  const [isRunning, setRunning] = useState(false);

  /* --- handlers -------------------------------------------------- */
  const handleStart = async () => {
    setRunning(true);
    try {
      await startEngine(car.id).unwrap(); // we ignore v/d
      dispatch(startSingleCar(car.id));
      await drive(car.id).unwrap();
    } catch (e) {
      console.error(e);
      dispatch(stopSingleCar());
    } finally {
      setRunning(false);
    }
  };

  const handleStop = async () => {
    setRunning(true);
    try {
      await stopEngine(car.id).unwrap();
    } finally {
      dispatch(stopSingleCar());
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${car.name}?`)) return;
    try {
      await deleteCar(car.id).unwrap();
      await deleteWinner(car.id).unwrap().catch(() => {});
      const nextTotal = Math.max(0, total - 1);
      if (shouldRewindPage(nextTotal, page, PAGE_LIMIT))
        dispatch(setGaragePage(page - 1));
    } catch {
      alert('Delete failed – see console');
    }
  };

  /* --- row ------------------------------------------------------- */
  return (
    <div className="flex items-center gap-3 h-10 bg-gray-100 rounded px-2">
      <div
        className="h-6 w-10 rounded"
        style={{ backgroundColor: car.color }}
      />
      <span className="flex-1 text-sm font-medium truncate text-gray-800">
        {car.name}
      </span>

      <button
        className="btn btn-xs btn-success"
        disabled={isRunning || isDeleting}
        onClick={handleStart}
      >
        Start
      </button>

      <button
        className="btn btn-xs btn-warning"
        disabled={!isRunning || isDeleting}
        onClick={handleStop}
      >
        Stop
      </button>

      <button
        className="btn btn-xs btn-outline"
        title="Edit"
        disabled={isRunning || isDeleting}
        onClick={() => dispatch(selectCar(car.id))}
      >
        ✏️
      </button>

      <button
        className="btn btn-xs btn-error"
        title="Delete"
        disabled={isRunning || isDeleting}
        onClick={handleDelete}
      >
        🗑
      </button>
    </div>
  );
}







