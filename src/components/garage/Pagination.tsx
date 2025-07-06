import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setGaragePage, setWinnersPage } from '../../app/uiSlice';

interface Props {
  total: number;
  limit: number;
  source: 'garage' | 'winners';
  disabled?: boolean;
}

export default function Pagination({ total, limit, source, disabled = false }: Props) {
  /* current page from Redux */
  const page = useAppSelector((s) => (source === 'garage' ? s.ui.garagePage : s.ui.winnersPage));

  const dispatch = useAppDispatch();

  /* how many pages exist (at least 1) */
  const pages = Math.max(1, Math.ceil(total / limit));

  /* early-return if no items at all */
  if (total === 0) return null;

  /* helper that clamps target page 1…pages */
  const go = (p: number) => {
    const target = Math.min(Math.max(p, 1), pages);
    if (source === 'garage') dispatch(setGaragePage(target));
    else dispatch(setWinnersPage(target));
  };

  return (
    <div className="join mt-4 ">
      <button
        type="button"
        className="btn join-item"
        disabled={disabled || page === 1}
        onClick={() => go(page - 1)}
      >
        «
      </button>

      <span className="btn join-item pointer-events-none text-gray-800">
        {page} / {pages}
      </span>

      <button
        type="button"
        className="btn join-item"
        disabled={disabled || page === pages}
        onClick={() => go(page + 1)}
      >
        »
      </button>
    </div>
  );
}
