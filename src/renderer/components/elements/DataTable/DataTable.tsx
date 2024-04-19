import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../shadcn/ui/table';
import './DataTable.css';
import { DataTablePagination } from './DataTablePagination';
import { DataTableViewOptions } from './DataTableViewOptions';
import { useState } from 'react';
import { Input } from '../../shadcn/ui/input';
import { ContextMenu, ContextMenuTrigger } from '../../shadcn/ui/context-menu';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  onRowContextMenu?: (row: TData, event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => void;
  searchColumnID?: string;
  searchPlaceholder?: string;
  defaultSort?: {
    id: string;
    dir: 'asc' | 'desc';
  };
}

export function DataTable<TData, TValue>({ columns, data, onRowClick, onRowContextMenu, searchPlaceholder, searchColumnID, defaultSort }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSort ? [{ id: defaultSort.id, desc: defaultSort.dir === 'desc' }] : []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="w-full h-full flex flex-col justify-between gap-4 pb-4 overflow-auto p-1">
      <div className="w-full flex justify-between items-center gap-4">
        {searchColumnID ? (
          <Input
            className="max-w-sm"
            placeholder={searchPlaceholder ?? 'Search'}
            value={(table.getColumn(searchColumnID)?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn(searchColumnID)?.setFilterValue(event.target.value)}
          />
        ) : (
          <div />
        )}
        <DataTableViewOptions table={table} />
      </div>
      <div className="rounded-md border overflow-auto flex flex-col h-full">
        <Table>
          <TableHeader className="th sticky top-0 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      style={{
                        width: `${header.getSize()}px`,
                      }}
                      key={header.id}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className={onRowClick !== undefined ? 'cursor-pointer' : ''}
                  onContextMenu={(e) => onRowContextMenu?.(row.original, e)}
                  onClick={() => onRowClick?.(row.original)}
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
