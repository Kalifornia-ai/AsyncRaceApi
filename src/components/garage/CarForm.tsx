import { useState, useEffect } from 'react';
import { useCreateCarMutation, useUpdateCarMutation } from '../../api/garageApi';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectCar } from '../../app/uiSlice';

export default function CarForm() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.ui.selectedCarId);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#ff0000');

  const [createCar]  = useCreateCarMutation();
  const [updateCar]  = useUpdateCarMutation();

  useEffect(() => {
    if (!selectedId) return;
    // pre-fill if editing – you could fetch single car or lift data from list
  }, [selectedId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId) {
      await updateCar({ id: selectedId, name, color });
      dispatch(selectCar(null));
    } else {
      await createCar({ name, color });
    }
    setName('');
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap gap-2 items-center">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Car name"
        className="input input-bordered w-40"
        required
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-8 w-12 p-0 border-none"
      />
      <button type="submit" className="btn btn-primary">
        {selectedId ? 'Update' : 'Create'}
      </button>
      {selectedId && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => dispatch(selectCar(null))}
        >
          Cancel
        </button>
      )}
    </form>
  );
}
