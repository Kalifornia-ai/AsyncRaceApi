import { Car } from '../../types/car';

import { 
    useStopEngineMutation,
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

const PAGE_LIMIT = 10;

export default function CarCard({ car }: { car: Car }) {
  const dispatch = useAppDispatch();
  const page   = useAppSelector((s) => s.ui.garagePage);
  const total  = useAppSelector((s) => s.ui.totalCars);
  const { isRacing, singleCarId } = useAppSelector((s) => s.ui);
  const anyRunning = isRacing || singleCarId !== null;       
  const isCurrent  = singleCarId === car.id;     

  const [deleteCar,   { isLoading: isDeleting }] = useDeleteCarMutation();
  const [deleteWinner]                           = useDeleteWinnerMutation();
  const [stopEngine]                             = useStopEngineMutation();



  /* --- handlers -------------------------------------------------- */
  const handleStart = () => dispatch(startSingleCar(car.id));

  const handleStop = async () => {
    await stopEngine(car.id).unwrap().catch(console.error); 
    dispatch(stopSingleCar());}

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
        disabled={anyRunning|| isDeleting}
        onClick={handleStart}
      >
        Start
      </button>

      <button
        className="btn btn-xs btn-warning"
        disabled={!isCurrent || isDeleting}
        onClick={handleStop}
      >
        Stop
      </button>

      <button
        className="btn btn-xs btn-outline"
        title="Edit"
        disabled={anyRunning || isDeleting}
        onClick={() => dispatch(selectCar(car.id))}
      >
        ✏️
      </button>

      <button
        className="btn btn-xs btn-error"
        title="Delete"
        disabled={anyRunning || isDeleting}
        onClick={handleDelete}
      >
        🗑
      </button>
    </div>
  );
}







