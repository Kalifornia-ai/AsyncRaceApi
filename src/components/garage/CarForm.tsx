import { useState, useEffect, useCallback } from 'react';
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
import type { Car } from '../../types/car';

/* ───────────────────────────── Types & Guards ─────────────────────────── */
interface ApiError {
  status: number;
  data: { message?: string; [k: string]: unknown };
}

function isApiError(e: unknown): e is ApiError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    'data' in e &&
    typeof (e as Record<string, unknown>).status === 'number'
  );
}

/* ───────────────────────── Config / Constants ─────────────────────────── */
const PAGE_LIMIT = 1000;
const BRANDS = [
  'Toyota',
  'Ford',
  'Honda',
  'Tesla',
  'BMW',
  'Audi',
  'Nissan',
  'Kia',
  'Hyundai',
  'Volvo',
];
const MODELS = [
  'Supra',
  'Mustang',
  'Civic',
  'Model S',
  'X5',
  'A4',
  'Leaf',
  'Sportage',
  'Ioniq',
  'XC90',
];

/* ─────────────────────────── Component ──────────────────────────────── */
export default function CarForm() {
  const dispatch = useAppDispatch();

  /* -------- global slice state -------- */
  const selectedId = useAppSelector((s) => s.ui.selectedCarId);
  const draft = useAppSelector((s) => s.ui.draftCar);
  const { isRacing, singleCarId } = useAppSelector((s) => s.ui);
  const anyRunning = isRacing || singleCarId !== null;

  /* -------- backend data -------- */
  const getCarsQ = useGetCarsQuery({ page: 1, limit: PAGE_LIMIT });
  const cars: Car[] = getCarsQ.data?.data ?? [];
  const refetchCars = getCarsQ.refetch;
  const selectedCar = cars.find((c) => c.id === selectedId) ?? null;

  /* -------- RTK Query hooks -------- */
  const [createCar, createState] = useCreateCarMutation();
  const [updateCar, updateState] = useUpdateCarMutation();
  const [deleteCar] = useDeleteCarMutation();
  const [deleteWinner] = useDeleteWinnerMutation();
  const [fetchCars] = useLazyGetCarsQuery();

  const isCreating = createState.isLoading;
  const isUpdating = updateState.isLoading;

  /* -------- local form state -------- */
  const [name, setName] = useState(draft?.name ?? '');
  const [color, setColor] = useState(draft?.color ?? '#ff0000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeletingMany, setIsDeletingMany] = useState(false);

  /* -------- sync selection → form -------- */
  useEffect(() => {
    if (selectedCar) {
      setName(selectedCar.name);
      setColor(selectedCar.color);
      dispatch(saveDraft({ name: selectedCar.name, color: selectedCar.color }));
    } else if (!draft) {
      setName('');
      setColor('#ff0000');
    }
  }, [selectedCar, draft, dispatch]);

  /* -------- persist draft -------- */
  useEffect(() => {
    dispatch(saveDraft({ name, color }));
  }, [name, color, dispatch]);

  /* -------- helpers -------- */
  const resetForm = useCallback(() => {
    setName('');
    setColor('#ff0000');
    dispatch(saveDraft(undefined));
    dispatch(selectCarAction(null));
  }, [dispatch]);

  const randomColor = () =>
    `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')}`;

  /* ───────────────────── Handlers ───────────────────── */

  /** create / update single car */
  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20) return;

    try {
      if (selectedId) {
        await updateCar({ id: selectedId, name: trimmed, color }).unwrap();
      } else {
        await createCar({ name: trimmed, color }).unwrap();
      }
      resetForm();
      refetchCars();
    } catch (err: unknown) {
      if (isApiError(err)) {
        alert(err.data.message ?? 'Failed to save car. Please try again.');
      } else {
        alert(err instanceof Error ? err.message : 'Failed to save car. Please try again.');
      }
    }
  };

  /** bulk-generate 100 random cars */
  const handleGenerate = useCallback(async () => {
    if (!window.confirm('Generate 100 random cars?')) return;
    setIsGenerating(true);

    const genTasks = Array.from({ length: 100 }, () => {
      const generatedName =
        `${BRANDS[Math.floor(Math.random() * BRANDS.length)]} ` +
        `${MODELS[Math.floor(Math.random() * MODELS.length)]}`;
      return createCar({ name: generatedName, color: randomColor() })
        .unwrap()
        .then(() => true)
        .catch((e: unknown) => {
          console.error(e instanceof Error ? e : String(e));
          return false;
        });
    });

    const results = await Promise.allSettled(genTasks);
    const successCount = results.filter(
      (r): r is PromiseFulfilledResult<boolean> => r.status === 'fulfilled' && r.value,
    ).length;

    alert(`Generation complete: ${successCount} succeeded, ${100 - successCount} failed.`);
    refetchCars();
    setIsGenerating(false);
  }, [createCar, refetchCars]);

  /** delete first N cars (plus winners) */
  const handleBulkDelete = useCallback(async () => {
    const total = getCarsQ.data?.total ?? 0;
    const toDelete = Math.min(100, total);
    if (!window.confirm(`Delete first ${toDelete} cars?`)) return;
    setIsDeletingMany(true);

    try {
      const dataResp = await fetchCars({ page: 1, limit: PAGE_LIMIT }).unwrap();
      const ids = dataResp.data.slice(0, toDelete).map((c) => c.id);

      await Promise.all(
        ids.map(async (id) => {
          try {
            await deleteCar(id).unwrap();
            await deleteWinner(id).unwrap();
          } catch (e: unknown) {
            console.error(e instanceof Error ? e : String(e));
          }
        }),
      );

      alert(`Deleted ${ids.length} cars`);
      refetchCars();
    } catch (e: unknown) {
      console.error(e instanceof Error ? e : String(e));
      alert('Something went wrong – see console.');
    } finally {
      setIsDeletingMany(false);
    }
  }, [deleteCar, deleteWinner, fetchCars, refetchCars, getCarsQ.data?.total]);

  /* ───────────────────── JSX ───────────────────── */
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
        {isCreating || isUpdating ? 'Saving…' : selectedId ? 'Update' : 'Create'}
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleGenerate}
        disabled={isCreating || isGenerating || anyRunning}
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
