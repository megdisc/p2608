import { Button } from './Button';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: PaginationProps) {
  return (
    <div className="pagination-controls" style={{ gap: '8px' }}>
      <div className="pagination-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button 
          style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          ＜
        </Button>
        
        <select 
          className="page-select-pill"
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          disabled={totalPages <= 1}
        >
          {Array.from({ length: Math.max(1, totalPages) }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>

        <Button 
          style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          ＞
        </Button>
      </div>
    </div>
  );
}
