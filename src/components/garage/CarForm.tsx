import { useState, useEffect } from 'react';
import {
  useCreateCarMutation,
  useUpdateCarMutation,
  useGetCarsQuery,
} from '../../api/garageApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  selectCar as selectCarAction,
  //clearSelectedCar,       /* if you keep this helper */
  saveDraft,
} from '../../app/uiSlice';
import { Car } from '../../types/car';

export default function CarForm() {
  const dispatch    = useAppDispatch();
  const selectedId  = useAppSelector((s) => s.ui.selectedCarId);
  const draft       = useAppSelector((s) => s.ui.draftCar);

  /* fetch all cars so we can pre-fill when editing */
  const { data: resp } = useGetCarsQuery({ page: 1, limit: 1000 });
  const cars: Car[] = resp?.data ?? [];
  const selectedCar = cars.find((c) => c.id === selectedId);

  const [createCar, { isLoading: isCreating }] = useCreateCarMutation();
  const [updateCar, { isLoading: isUpdating }] = useUpdateCarMutation();

  /* local state initialised from the draft (if any) */
  const [name,  setName]  = useState(draft?.name  ?? '');
  const [color, setColor] = useState(draft?.color ?? '#ff0000');
  const [isGenerating, setIsGenerating] = useState(false);

  /* keep local state in sync with editor selection */
  useEffect(() => {
    if (selectedCar) {
      setName(selectedCar.name);
      setColor(selectedCar.color);
      dispatch(saveDraft({ name: selectedCar.name, color: selectedCar.color }));
    } else if (!draft) {         // brand-new form, no draft
      setName(''); setColor('#ff0000');
    }
  }, [selectedCar]);             // eslint-disable-line react-hooks/exhaustive-deps

  /* whenever user types → update draft in Redux */
  useEffect(() => {
    dispatch(saveDraft({ name, color }));
  }, [name, color]);             // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setName(''); setColor('#ff0000');
    dispatch(saveDraft(undefined));
    /* clearSelectedCar helper if you kept it */
    dispatch(selectCarAction(null));
  };

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      if (selectedId)
        await updateCar({ id: selectedId, name: trimmed, color }).unwrap();
      else
        await createCar({ name: trimmed, color }).unwrap();

      resetForm();
    } catch (err) {
      alert('Failed to save car. Please try again.');
      console.error(err);
    }
  };

  /* -------- bulk generator (unchanged) -------- */
  // … (keep your brands/models/randomColor/handleGenerate exactly as before)

  return (
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
          ? 'Saving…'
          : selectedId
          ? 'Update'
          : 'Create'}
      </button>

      {/* bulk-generate button unchanged */}
    </form>
  );
}








