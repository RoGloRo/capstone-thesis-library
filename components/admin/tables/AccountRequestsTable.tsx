// components/admin/tables/AccountRequestsTable.tsx
"use client";

import { useState, useEffect } from "react";
import { getAccountRequests, rejectAccountRequest, approveAccountRequest } from "@/lib/admin/actions/account-requests";
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
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AccountRequestsTable() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [viewingCard, setViewingCard] = useState<{ 
    name: string; 
    cardUrl: string 
  } | null>(null);

   const fetchRequests = async () => {
    try {
      const requests = await getAccountRequests();
      setRequests(requests);
      setError(null);
    } catch (err) {
      console.error("Error fetching account requests:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching account requests";
      setError(errorMessage);
      toast.error(errorMessage);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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
      // Update the local state to reflect the rejection
      setRequests(prevRequests => 
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

  if (requests.length === 0) {
    return (
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              No account requests
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>There are no pending or rejected account requests.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
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
            {requests.map((request) => (
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => handleApprove(request.id)}
                      disabled={request.status === "REJECTED"}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => handleReject(request.id)}
                      disabled={request.status === "REJECTED"}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* University Card Modal */}
      <Dialog
        open={!!viewingCard}
        onOpenChange={(open) => !open && setViewingCard(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingCard?.name}'s University Card</DialogTitle>
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