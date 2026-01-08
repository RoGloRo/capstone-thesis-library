// app/admin/books/books-table.tsx
"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface BooksTableProps {
  data: Book[];
}

export function BooksTable({ data }: BooksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<string>("latest");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (bookId: string) => {
    setBookToDelete(bookId);
    setIsDeleteDialogOpen(true);
  };

  // Enhanced global filter function
  const globalFilterFn = (row: any, columnId: string, value: string) => {
    const searchValue = value.toLowerCase();
    const title = row.original.title?.toLowerCase() || '';
    const author = row.original.author?.toLowerCase() || '';
    const genre = row.original.genre?.toLowerCase() || '';
    
    return title.includes(searchValue) || 
           author.includes(searchValue) || 
           genre.includes(searchValue);
  };

  // Handle sort dropdown changes
  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    switch (value) {
      case 'latest':
        setSorting([{ id: 'createdAt', desc: true }]);
        break;
      case 'oldest':
        setSorting([{ id: 'createdAt', desc: false }]);
        break;
      case 'title-asc':
        setSorting([{ id: 'title', desc: false }]);
        break;
      case 'title-desc':
        setSorting([{ id: 'title', desc: true }]);
        break;
      default:
        setSorting([]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/books/${bookToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete book');
      }

      // Refresh the page to show updated book list
      window.location.reload();
      toast.success('Book deleted successfully');
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };

  const columns: ColumnDef<Book>[] = [
    {
      accessorKey: "controlNumber",
      header: "Control Number",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("controlNumber") || '—'}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "author",
      header: "Author",
    },
    {
      accessorKey: "genre",
      header: "Genre",
    },
    {
      accessorKey: "totalCopies",
      header: "Total Copies",
    },
    {
      accessorKey: "availableCopies",
      header: "Available",
    },
     {
    accessorKey: "createdAt",
    header: "Added On",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-8 w-8 p-0 hover:bg-blue-100"
        >
          <Link href={`/admin/books/edit/${row.original.id}`}>
            <Pencil className="h-4 w-4 text-blue-600" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="h-8 w-8 p-0 hover:bg-red-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteClick(row.original.id);
          }}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    ),
  },
];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search by title, author, or genre..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <Select value={selectedSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select sorting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest to Oldest</SelectItem>
              <SelectItem value="oldest">Oldest to Latest</SelectItem>
              <SelectItem value="title-asc">Title (A–Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z–A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-8">
                    <Search className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">No books found</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {globalFilter 
                        ? `No results match "${globalFilter}"` 
                        : "No books available at the moment"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-gray-700">
          Showing {table.getRowModel().rows.length} of {data.length} books
          {globalFilter && (
            <span className="ml-2 text-blue-600 font-medium">
              (filtered)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the book and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}