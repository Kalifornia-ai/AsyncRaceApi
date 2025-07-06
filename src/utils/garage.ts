export const shouldRewindPage = (total: number, page: number, limit: number) =>
  total > 0 && total % limit === 0 && page > 1;
