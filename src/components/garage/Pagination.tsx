import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setGaragePage, setWinnersPage } from '../../app/uiSlice';

interface Props {
  total: number;
  limit: number;
  source: 'garage' | 'winners';
}

export default function Pagination({ total, limit, source }: Props) {
  const page = useAppSelector((s) =>
    source === 'garage' ? s.ui.garagePage : s.ui.winnersPage
  );
  const dispatch = useAppDispatch();
  const pages = Math.max(1, Math.ceil(total / limit));

  const go = (p: number) =>
    source === 'garage'
      ? dispatch(setGaragePage(p))
      : dispatch(setWinnersPage(p));

  return (
    <div className="join mt-4">
      <button className="btn join-item" disabled={page === 1}     onClick={() => go(page - 1)}>«</button>
      <span   className="btn join-item pointer-events-none">{page} / {pages}</span>
      <button className="btn join-item" disabled={page === pages} onClick={() => go(page + 1)}>»</button>
    </div>
  );
}

