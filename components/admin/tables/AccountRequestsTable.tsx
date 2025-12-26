// components/admin/tables/AccountRequestsTable.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { getAccountRequests, rejectAccountRequest, approveAccountRequest, type AccountRequest } from "@/lib/admin/actions/account-requests";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Search, ChevronLeft, ChevronRight, Trash2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AccountRequestsTable() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AccountRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSort, setSelectedSort] = useState<string>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [viewingCard, setViewingCard] = useState<{ 
    name: string; 
    cardUrl: string 
  } | null>(null);

  const itemsPerPage = 10;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requests = await getAccountRequests();
      setRequests(requests);
      setFilteredRequests(requests);
      setError(null);
    } catch (err) {
      console.error('Error fetching account requests:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching account requests';
      setError(errorMessage);
      toast.error(errorMessage);
      setRequests([]);
      setFilteredRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle sort dropdown changes
  const handleSortChange = useCallback((value: string) => {
    setSelectedSort(value);
    
    // Sort the current filtered requests, not create new dependency
    setFilteredRequests(prevFiltered => {
      const sortedRequests = [...prevFiltered];
      
      switch (value) {
        case 'latest':
          sortedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          sortedRequests.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'name-asc':
          sortedRequests.sort((a, b) => a.fullName.localeCompare(b.fullName));
          break;
        case 'name-desc':
          sortedRequests.sort((a, b) => b.fullName.localeCompare(a.fullName));
          break;
        case 'status':
          sortedRequests.sort((a, b) => a.status.localeCompare(b.status));
          break;
        default:
          break;
      }
      
      return sortedRequests;
    });
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  // Search effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRequests(requests);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = requests.filter(request => {
        return (
          request.fullName.toLowerCase().includes(term) ||
          request.email.toLowerCase().includes(term) ||
          request.universityId.toString().includes(term)
        );
      });
      setFilteredRequests(filtered);
    }
    
    setCurrentPage(1); // Reset to first page when searching
    
    // Apply current sorting after filtering
    if (selectedSort !== 'latest') {
      setTimeout(() => handleSortChange(selectedSort), 0);
    }
  }, [searchTerm, requests, selectedSort]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) {
      return `https://ik.imagekit.io/jsmasterylemor${url}`;
    }
    return `https://ik.imagekit.io/jsmasterylemor/ids/${url}`;
  };

 
  const handleApprove = async (userId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(`approve-${userId}`);
    try {
      const result = await approveAccountRequest(userId);
      if (result.success) {
        toast.success("Account approved successfully");
        await fetchRequests();
      } else {
        toast.error(result.error || "Failed to approve account");
      }
    } catch (err) {
      console.error("Error approving account:", err);
      toast.error("An error occurred while approving the account");
    } finally {
      setIsProcessing(null);
    }
  };

 const handleReject = async (userId: string) => {
  if (isProcessing) return;
  
  setIsProcessing(`reject-${userId}`);
  try {
    const result = await rejectAccountRequest(userId);
    if (result.success) {
      toast.success("Account rejected successfully");
      // Update both the main requests and filtered requests to reflect the rejection
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === userId 
            ? { ...request, status: "REJECTED" as const } 
            : request
        )
      );
      setFilteredRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === userId 
            ? { ...request, status: "REJECTED" as const } 
            : request
        )
      );
    } else {
      toast.error(result.error || "Failed to reject account");
    }
  } catch (err) {
    console.error("Error rejecting account:", err);
    toast.error("An error occurred while rejecting the account");
  } finally {
    setIsProcessing(null);
  }
};

const handleUnreject = async (userId: string) => {
  if (isProcessing) return;
  
  setIsProcessing(`unreject-${userId}`);
  try {
    // Call the server action to change status back to PENDING
    const response = await fetch(`/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'PENDING' }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to unreject account');
    }

    toast.success("Account status changed to pending");
    // Update both the main requests and filtered requests
    setRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === userId 
          ? { ...request, status: "PENDING" as const } 
          : request
      )
    );
    setFilteredRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === userId 
          ? { ...request, status: "PENDING" as const } 
          : request
      )
    );
  } catch (err) {
    console.error("Error unrejecting account:", err);
    toast.error(err instanceof Error ? err.message : "An error occurred while changing account status");
  } finally {
    setIsProcessing(null);
  }
};

const handleDeleteUser = async (userId: string) => {
  if (isProcessing) return;
  
  // Show confirmation dialog
  if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
    return;
  }
  
  setIsProcessing(`delete-${userId}`);
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        toast.error(data.details || data.error || 'Cannot delete user with active records');
      } else {
        throw new Error(data.error || 'Failed to delete user');
      }
      return;
    }

    toast.success("User deleted successfully");
    // Remove the user from both arrays
    setRequests(prevRequests => prevRequests.filter(request => request.id !== userId));
    setFilteredRequests(prevRequests => prevRequests.filter(request => request.id !== userId));
  } catch (err) {
    console.error("Error deleting user:", err);
    toast.error(err instanceof Error ? err.message : "An error occurred while deleting the user");
  } finally {
    setIsProcessing(null);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-2">Loading account requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading account requests
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (filteredRequests.length === 0 && !loading && !error) {
    return (
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              No account requests
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>{searchTerm ? `No requests match "${searchTerm}"` : "There are no pending or rejected account requests."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, or university ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <Select value={selectedSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select sorting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Requests</SelectItem>
              <SelectItem value="oldest">Oldest Requests</SelectItem>
              <SelectItem value="name-asc">Name (A–Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z–A)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>University ID</TableHead>
              <TableHead>University Card</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested On</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.fullName}
                </TableCell>
                <TableCell>{request.email}</TableCell>
                <TableCell>{request.universityId}</TableCell>
                <TableCell>
                  <button
                    onClick={() => 
                      setViewingCard({
                        name: request.fullName,
                        cardUrl: request.universityCard
                      })
                    }
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View Card
                  </button>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={request.status === "PENDING" 
                      ? "bg-amber-100 text-amber-800 border-amber-200" 
                      : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(request.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {request.status === "PENDING" ? (
                      // Show Approve and Reject buttons for pending requests
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleApprove(request.id);
                          }}
                          disabled={isProcessing === `approve-${request.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {isProcessing === `approve-${request.id}` ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleReject(request.id);
                          }}
                          disabled={isProcessing === `reject-${request.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {isProcessing === `reject-${request.id}` ? "Rejecting..." : "Reject"}
                        </Button>
                      </>
                    ) : (
                      // Show Unreject and Delete buttons for rejected requests
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleUnreject(request.id);
                          }}
                          disabled={isProcessing === `unreject-${request.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          {isProcessing === `unreject-${request.id}` ? "Unrejecting..." : "Unreject"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteUser(request.id);
                          }}
                          disabled={isProcessing === `delete-${request.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {isProcessing === `delete-${request.id}` ? "Deleting..." : "Delete"}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredRequests.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">No requests found</p>
            <p className="text-gray-500 text-sm">
              {searchTerm 
                ? `No results match "${searchTerm}"` 
                : "No account requests available at the moment"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredRequests.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
            {searchTerm && (
              <span className="ml-2 text-blue-600 font-medium">
                (filtered from {requests.length} total)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePreviousPage();
              }}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm font-medium px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNextPage();
              }}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* University Card Modal */}
      <Dialog
        open={!!viewingCard}
        onOpenChange={(open) => !open && setViewingCard(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingCard?.name}&apos;s University Card</DialogTitle>
          </DialogHeader>
          <div className="relative h-64 w-full">
            {viewingCard?.cardUrl ? (
              <Image
                src={getImageUrl(viewingCard.cardUrl) || ''}
                alt={`${viewingCard.name}'s University Card`}
                fill
                className="rounded-md object-contain"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400';
                  fallback.textContent = 'Image not available';
                  target.parentNode?.appendChild(fallback);
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">
                No card image available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}