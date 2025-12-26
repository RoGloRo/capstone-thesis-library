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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2, Trash2, Link as LinkIcon, FileImage, Search } from "lucide-react";
import config from "@/lib/config";
import Image from "next/image";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UsersTableProps {
  data: User[];
}

export function UsersTable({ data }: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedSort, setSelectedSort] = useState<string>("latest");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingUserIdCard, setViewingUserIdCard] = useState<string | null>(null);
  const [currentUserCard, setCurrentUserCard] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          // Conflict - user has borrow records
          toast.error(data.details || data.error || 'Cannot delete user with active records');
        } else {
          throw new Error(data.error || 'Failed to delete user');
        }
        return;
      }

      toast.success('User deleted successfully');
      // Refresh the page to show the updated user list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      setUpdatingRole(userId);
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      toast.success('Role updated successfully');
      // Refresh the page to show the updated role
      window.location.reload();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
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
      case 'name-asc':
        setSorting([{ id: 'fullName', desc: false }]);
        break;
      case 'name-desc':
        setSorting([{ id: 'fullName', desc: true }]);
        break;
      default:
        setSorting([]);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "fullName",
      header: "Full Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("fullName")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      id: "idCard",
      header: "User's ID Card",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100"
          onClick={() => {
            setCurrentUserCard(row.original.universityCard);
            setViewingUserIdCard(row.original.id);
            setImageError(false);
          }}
        >
          <LinkIcon className="h-4 w-4" />
          <span className="sr-only">View ID Card</span>
        </Button>
      ),
    },
    {
      accessorKey: "universityId",
      header: "University ID",
    },
    {
      accessorKey: "lastActivityDate",
      header: "Last Active",
      cell: ({ row }) => {
        const dateValue = row.getValue("lastActivityDate");
        if (!dateValue) return 'N/A';
        const date = new Date(dateValue as string);
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string | null;
        const userId = row.original.id;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 px-2 text-left font-normal hover:bg-gray-100"
                disabled={updatingRole === userId}
              >
                <div className="flex items-center gap-2">
                  <span className="capitalize">{(role || 'USER').toLowerCase()}</span>
                  {updatingRole === userId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem 
                onClick={() => handleRoleChange(userId, 'USER')}
                className={role === 'USER' ? 'bg-gray-100' : ''}
              >
                User
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleRoleChange(userId, 'ADMIN')}
                className={role === 'ADMIN' ? 'bg-gray-100' : ''}
              >
                Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined On",
      cell: ({ row }) => {
        const dateValue = row.getValue("createdAt");
        if (!dateValue) return 'N/A';
        const date = new Date(dateValue as string | Date);
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
            className="h-8 w-8 p-0 hover:bg-red-100"
            onClick={() => {
              setUserToDelete(row.original.id);
              setIsDeleteDialogOpen(true);
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
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      
      // Search in fullName, email, and universityId
      return (
        String(row.original.fullName).toLowerCase().includes(search) ||
        String(row.original.email).toLowerCase().includes(search) ||
        String(row.original.universityId).toLowerCase().includes(search)
      );
    },
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or university ID..."
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => {
              table.setGlobalFilter(event.target.value);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <Select value={selectedSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select sorting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest to Oldest</SelectItem>
              <SelectItem value="oldest">Oldest to Latest</SelectItem>
              <SelectItem value="name-asc">Name (A–Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z–A)</SelectItem>
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
                    <Search className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No users found</p>
                    <p className="text-gray-500 text-sm">
                      {globalFilter 
                        ? `No results match "${globalFilter}"` 
                        : "No approved users available at the moment"}
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
          Showing {table.getRowModel().rows.length} of {data.length} users
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
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This action cannot be undone. This will permanently delete the user and remove their data from our servers.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Users with active borrow records or history cannot be deleted. 
                  Please ensure all books are returned and records are cleared first.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Checking & Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingUserIdCard} onOpenChange={(open) => {
        if (!open) {
          setViewingUserIdCard(null);
          setImageError(false);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>User&apos;s ID Card</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {!currentUserCard || imageError ? (
              <div className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-center text-gray-500">
                <FileImage className="h-10 w-10 text-gray-300" />
                <p>ID card not available</p>
                <p className="text-sm text-gray-400">
                  {imageError ? 'Failed to load image' : 'No ID card uploaded'}
                </p>
              </div>
            ) : (
              <div className="relative h-[500px] w-full">
                <Image
                  src={
                    currentUserCard.startsWith('http') 
                      ? currentUserCard 
                      : `${config.env.imagekit.urlEndpoint}${currentUserCard}`
                  }
                  alt="University ID Card"
                  fill
                  className="rounded-md border object-contain"
                  unoptimized={currentUserCard.startsWith('data:')}
                  onError={() => setImageError(true)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
