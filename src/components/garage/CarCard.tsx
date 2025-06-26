import { Car } from '../../types/car';
import {
  useDeleteCarMutation,
} from '../../api/garageApi';
import { useAppDispatch } from '../../app/hooks';
import { selectCar } from '../../app/uiSlice';

export default function CarCard({ car }: { car: Car }) {
  const dispatch = useAppDispatch();
  const [deleteCar] = useDeleteCarMutation();

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
          className="btn btn-xs btn-outline"
          onClick={() => dispatch(selectCar(car.id))}
        >
          Edit
        </button>
        <button
          className="btn btn-xs btn-error"
          onClick={() => deleteCar(car.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
