import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--color-border-light)] text-xs flex-wrap bg-[rgba(255,255,255,0.32)]">
      <div className="text-[var(--color-text-secondary)]">共 {total} 条记录</div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>上一页</Button>
        <span className="text-[var(--color-text-secondary)]">第 {page} / {totalPages} 页</span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>下一页</Button>
      </div>
    </div>
  );
}
