import { useState, useEffect } from 'react';
import { Car } from '../../types/car';
import {
  useCreateCarMutation,
  useUpdateCarMutation,
  useGetCarsQuery,
} from '../../api/garageApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectCar as selectCarAction, clearSelectedCar } from '../../app/uiSlice';

export default function CarForm() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.ui.selectedCarId);

  // Fetch cars for pre-fill and auto-refresh
  const {
    data: response,
    refetch: refetchCars,
  } = useGetCarsQuery({ limit: 1000, page: 1 });
  const cars: Car[] = response?.data ?? [];
  const selectedCar = cars.find((c) => c.id === selectedId);

  const [createCar, { isLoading: isCreating }] = useCreateCarMutation();
  const [updateCar, { isLoading: isUpdating }] = useUpdateCarMutation();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#ff0000');
  const [isGenerating, setIsGenerating] = useState(false);

  // Prefill form when editing
  useEffect(() => {
    if (selectedCar) {
      setName(selectedCar.name);
      setColor(selectedCar.color);
    } else {
      setName('');
      setColor('#ff0000');
    }
  }, [selectedCar]);

  const resetForm = () => {
    setName('');
    setColor('#ff0000');
    dispatch(clearSelectedCar());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      if (selectedId) {
        await updateCar({ id: selectedId, name: trimmed, color }).unwrap();
      } else {
        await createCar({ name: trimmed, color }).unwrap();
      }
      resetForm();
      refetchCars();
    } catch (err) {
      alert('Failed to save car. Please try again.');
      console.error('Failed to save car:', err);
    }
  };

  // Bulk generate 100 random cars sequentially to avoid connection issues
  const brands = ['Toyota', 'Ford', 'Honda', 'Tesla', 'BMW'];
  const models = ['X', 'S', '3', '5', 'A'];
  const randomColor = () =>
    `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')}`;

  const handleGenerate = async () => {
    if (!window.confirm('Generate 100 random cars? This may take a moment.')) return;
    setIsGenerating(true);
    let successCount = 0;
    let failureCount = 0;
    const total = 100;

    for (let i = 0; i < total; i++) {
      const randomName =
        brands[Math.floor(Math.random() * brands.length)] +
        ' ' +
        models[Math.floor(Math.random() * models.length)];
      try {
        await createCar({ name: randomName, color: randomColor() }).unwrap();
        successCount++;
      } catch (err) {
        failureCount++;
        console.error(`Generation ${i + 1} failed:`, err);
      }
      // throttle requests: small delay
      // adjust delay as needed
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    refetchCars();
    alert(
      `Generation complete: ${successCount} succeeded, ${failureCount} failed out of ${total}.`
    );
    setIsGenerating(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Car Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input input-bordered"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="input"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isCreating || isUpdating || !name.trim()}
        >
          {isCreating || isUpdating
            ? 'Saving...'
            : selectedId
            ? 'Update'
            : 'Create'}
        </button>
        <button
          type="button"
          className="btn btn-secondary ml-2"
          onClick={handleGenerate}
          disabled={isCreating || isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate 100 Random Cars'}
        </button>
      </form>
    </div>
  );
}







