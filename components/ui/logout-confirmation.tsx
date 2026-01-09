"use client"

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function LogoutConfirmation({ open, onOpenChange, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription>Are you sure you want to log out?</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-transparent text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
              }}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              Log out
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
