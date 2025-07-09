export default function shouldRewindPage(total: number, page: number, limit: number): boolean {
  return total > 0 && total % limit === 0 && page > 1;
}
