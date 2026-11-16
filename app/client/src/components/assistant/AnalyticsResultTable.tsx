import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AnalyticsColumn } from '@/types/analytics.types';
import { cn } from '@/lib/utils';
import { formatCount, toDisplayText } from '@/utils/format';

const MAX_ROWS = 50;
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

const formatCell = (value: unknown, column: AnalyticsColumn) => {
  const text = toDisplayText(value);
  if (column.category !== 'numeric') {
    return text;
  }
  const number = typeof value === 'number' ? value : Number(text);
  return Number.isFinite(number) ? numberFormatter.format(number) : text;
};

interface AnalyticsResultTableProps {
  rows: Record<string, unknown>[];
  columns: AnalyticsColumn[];
}

export function AnalyticsResultTable({ rows, columns }: AnalyticsResultTableProps) {
  const visible = rows.slice(0, MAX_ROWS);

  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-96 overflow-auto rounded-md border border-hairline">
        <Table>
          <TableHeader className="sticky top-0 bg-raised">
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead key={column.name} className={cn(column.category === 'numeric' && 'text-right')}>
                  {column.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell
                    key={column.name}
                    className={cn(column.category === 'numeric' ? 'text-right' : 'text-ink-2')}
                  >
                    {formatCell(row[column.name], column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-ink-3">
        {rows.length > MAX_ROWS
          ? `Showing the first ${MAX_ROWS} of ${formatCount(rows.length)} rows`
          : `${formatCount(rows.length)} ${rows.length === 1 ? 'row' : 'rows'}`}
      </p>
    </div>
  );
}
