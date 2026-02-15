"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Re-export SortingState for consumers
export type { SortingState } from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  // Server-side sorting support
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  manualSorting?: boolean;
  // Server-side pagination support
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Нет данных",
  sorting: controlledSorting,
  onSortingChange,
  manualSorting = false,
  pagination,
  onPageChange,
  onPerPageChange,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);

  // Use controlled sorting if provided, otherwise internal state
  const sorting = controlledSorting ?? internalSorting;
  const setSorting = React.useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    if (onSortingChange) {
      onSortingChange(newSorting);
    } else {
      setInternalSorting(newSorting);
    }
  }, [sorting, onSortingChange]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    onSortingChange: setSorting,
    manualSorting,
    manualPagination: !!pagination,
    pageCount: pagination?.lastPage ?? -1,
    state: {
      sorting,
    },
  });

  const hasPagination = pagination && pagination.total > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-zinc-800">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-zinc-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {hasPagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Показано</span>
            <Select
              value={String(pagination.perPage)}
              onValueChange={(value) => onPerPageChange?.(Number(value))}
            >
              <SelectTrigger className="w-[70px] h-8 bg-zinc-800/50 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-zinc-100">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>из {pagination.total}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">
              Страница {pagination.currentPage} из {pagination.lastPage}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                onClick={() => onPageChange?.(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                onClick={() => onPageChange?.(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.lastPage || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
