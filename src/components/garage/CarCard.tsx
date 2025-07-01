import { Car } from '../../types/car';
import {
  useDeleteCarMutation,
  useStartEngineMutation,
  useStopEngineMutation,
} from '../../api/garageApi';
import { useAppDispatch } from '../../app/hooks';
import { selectCar } from '../../app/uiSlice';

export default function CarCard({ car }: { car: Car }) {
  const dispatch = useAppDispatch();
  const [deleteCar, { isLoading: isDeleting }] = useDeleteCarMutation();
  const [startEngine, { isLoading: isStarting }] = useStartEngineMutation();
  const [stopEngine, { isLoading: isStopping }] = useStopEngineMutation();

  const handleStart = async () => {
    try {
      const result = await startEngine(car.id);
      if ('error' in result) throw result.error;
      // TODO: trigger lane animation via RaceTrack ref
    } catch (err) {
      console.error(`Failed to start engine for ${car.id}:`, err);
    }
  };

  const handleStop = async () => {
    try {
      const result = await stopEngine(car.id);
      if ('error' in result) throw result.error;
      // TODO: pause animation via RaceTrack ref
    } catch (err) {
      console.error(`Failed to stop engine for ${car.id}:`, err);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 border rounded shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-12 rounded"
          style={{ backgroundColor: car.color }}
          title={car.color}
        />
        <span className="ml-2 text-gray-800 font-medium">{car.name}</span>
      </div>

      <div className="flex gap-2">
        <button
          className="btn btn-xs btn-success"
          onClick={handleStart}
          disabled={isStarting}
        >
          Start
        </button>
        <button
          className="btn btn-xs btn-warning"
          onClick={handleStop}
          disabled={isStopping}
        >
          Stop
        </button>
        <button
          className="btn btn-xs btn-outline"
          onClick={() => dispatch(selectCar(car.id))}
          disabled={isDeleting}
        >
          Edit
        </button>
        <button
          className="btn btn-xs btn-error"
          onClick={() => deleteCar(car.id)}
          disabled={isDeleting}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

