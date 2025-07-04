/* src/components/garage/CarForm.tsx */
import { useState, useEffect } from 'react';
import {
  useCreateCarMutation,
  useUpdateCarMutation,
  useGetCarsQuery,
  useLazyGetCarsQuery,
  useDeleteCarMutation,
} from '../../api/garageApi';
import { useDeleteWinnerMutation } from '../../api/winnersApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectCar as selectCarAction, saveDraft } from '../../app/uiSlice';
import { Car } from '../../types/car';

export default function CarForm() {
  const dispatch          = useAppDispatch();
  const selectedId        = useAppSelector((s) => s.ui.selectedCarId);
  const draft             = useAppSelector((s) => s.ui.draftCar);
  const { isRacing, singleCarId} = useAppSelector((s) => s.ui);
  const anyRunning = isRacing || singleCarId !== null; 

  /* current car list (to pre-fill form) */
  const { data: resp, refetch: refetchCars } =
    useGetCarsQuery({ page: 1, limit: 1000 });
  const cars: Car[]    = resp?.data ?? [];
  const selectedCar    = cars.find((c) => c.id === selectedId);

  /* RTK-Query mutations / lazy query */
  const [createCar,  { isLoading: isCreating }]   = useCreateCarMutation();
  const [updateCar,  { isLoading: isUpdating }]   = useUpdateCarMutation();
  const [deleteCar]                                = useDeleteCarMutation();
  const [deleteWinner]                             = useDeleteWinnerMutation();
  const [fetchCars]                                = useLazyGetCarsQuery();

  /* form fields */
  const [name,  setName]  = useState(draft?.name  ?? '');
  const [color, setColor] = useState(draft?.color ?? '#ff0000');

  /* spinners */
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [isDeletingMany, setDeletingMany]   = useState(false);

  /* ───── sync selection → form ─────────────────────────────────── */
  useEffect(() => {
    if (selectedCar) {
      setName(selectedCar.name);
      setColor(selectedCar.color);
      dispatch(saveDraft({ name: selectedCar.name, color: selectedCar.color }));
    } else if (!draft) {
      setName('');
      setColor('#ff0000');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCar]);

  /* ───── persist draft on every keystroke ───────────────────────── */
  useEffect(() => {
    dispatch(saveDraft({ name, color }));
  }, [name, color, dispatch]);

  /* ───── helpers ───────────────────────────────────────────────── */
  const resetForm = () => {
    setName('');
    setColor('#ff0000');
    dispatch(saveDraft(undefined));
    dispatch(selectCarAction(null));
  };

  const randomColor = () =>
    `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;

  /* ───── submit (create / update) ──────────────────────────────── */
  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20) return;   // length guard

    try {
      if (selectedId)
        await updateCar({ id: selectedId, name: trimmed, color }).unwrap();
      else
        await createCar({ name: trimmed, color }).unwrap();

      resetForm();
      refetchCars();
    } catch (err) {
      console.error('Failed to save car:', err);
      alert('Failed to save car. Please try again.');
    }
  };

  /* ───── bulk generate 100 cars ────────────────────────────────── */
  const BRANDS = ['Toyota','Ford','Honda','Tesla','BMW',
                  'Audi','Nissan','Kia','Hyundai','Volvo'];
  const MODELS = ['Supra','Mustang','Civic','Model S','X5',
                  'A4','Leaf','Sportage','Ioniq','XC90'];

  const handleGenerate = async () => {
    if (!window.confirm('Generate 100 random cars?')) return;
    setIsGenerating(true);
    let success = 0, fail = 0;

    for (let i = 0; i < 100; i++) {
      const name =
        `${BRANDS[Math.floor(Math.random() * BRANDS.length)]} ` +
        `${MODELS[Math.floor(Math.random() * MODELS.length)]}`;
      try {
        await createCar({ name, color: randomColor() }).unwrap();
        success++;
      } catch (err) {
        console.error(`Generation ${i + 1} failed:`, err);
        fail++;
      }
      await new Promise((r) => setTimeout(r, 100));   // throttle
    }

    alert(`Generation complete: ${success} succeeded, ${fail} failed out of 100.`);
    refetchCars();
    setIsGenerating(false);
  };

  /* ───── bulk delete first 100 cars ────────────────────────────── */
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete first ${Math.min(100, resp?.total ?? 0)} cars?`)) return;
    setDeletingMany(true);

    try {
      const { data } = await fetchCars({ page: 1, limit: 1000 }).unwrap();
      const ids = data.slice(0, 100).map((c) => c.id);

      for (const id of ids) {
        await deleteCar(id).unwrap();
        await deleteWinner(id).unwrap().catch((e) => {
          if (e?.status !== 404) throw e;             // ignore “not a winner”
        });
        await new Promise((r) => setTimeout(r, 50));  // throttle
      }

      alert(`Deleted ${ids.length} cars`);
      refetchCars();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Something went wrong – see console for details.');
    } finally {
      setDeletingMany(false);
    }
  };

  /* ───── UI ─────────────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4 flex-wrap">
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
        className="input w-12 h-12 p-0"
        title={color}
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

      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleGenerate}
        disabled={isCreating || isGenerating || anyRunning }
      >
        {isGenerating ? 'Generating…' : 'Generate 100 Random Cars'}
      </button>

      <button
        type="button"
        className="btn btn-error"
        onClick={handleBulkDelete}
        disabled={isDeletingMany || isCreating || isUpdating || anyRunning}
      >
        {isDeletingMany ? 'Deleting…' : 'Delete 100 Cars'}
      </button>
    </form>
  );
}










