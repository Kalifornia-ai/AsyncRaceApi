import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setPage } from '../../app/uiSlice';

export default function Pagination({ total, limit }: { total: number; limit: number }) {
  const dispatch = useAppDispatch();
  const page = useAppSelector((s) => s.ui.page);
  const pages = Math.ceil(total / limit);

  return (
    <div className="join">
      <button
        className="join-item btn btn-sm"
        disabled={page === 1}
        onClick={() => dispatch(setPage(page - 1))}
      >
        «
      </button>
      <span className="join-item px-3 text-sm">
        {page} / {pages || 1}
      </span>
      <button
        className="join-item btn btn-sm"
        disabled={page >= pages}
        onClick={() => dispatch(setPage(page + 1))}
      >
        »
      </button>
    </div>
  );
}
