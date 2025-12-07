// lib/admin/actions/account-requests.ts
"use server";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const getAccountRequests = async (): Promise<AccountRequest[]> => {
  try {
    const pendingUsers = await db
      .select()
      .from(users)
      .where(eq(users.status, "PENDING"));

    return pendingUsers.map(user => ({
      id: user.id,
      fullName: user.fullName || "",
      email: user.email || "",
      universityId: user.universityId || 0,
      universityCard: user.universityCard || "",
      status: user.status as "PENDING" | "REJECTED",
      createdAt: user.createdAt || new Date()
    }));
  } catch (error) {
    console.error("Error fetching account requests:", error);
    throw new Error("Failed to fetch account requests");
  }
};

export interface AccountRequest {
  id: string;
  fullName: string;
  email: string;
  universityId: number;
  universityCard: string;
  status: "PENDING" | "REJECTED";
  createdAt: Date;
}

export const approveAccountRequest = async (userId: string) => {
  try {
    await db
      .update(users)
      .set({ status: "APPROVED" })
      .where(eq(users.id, userId));
    
    revalidatePath("/admin/account-requests");
    return { success: true };
  } catch (error) {
    console.error("Error approving account request:", error);
    return { 
      success: false, 
      error: "Failed to approve account request" 
    };
  }
};

export const rejectAccountRequest = async (userId: string) => {
  try {
    await db
      .update(users)
      .set({ status: "REJECTED" })
      .where(eq(users.id, userId));
    
    revalidatePath("/admin/account-requests");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting account request:", error);
    return { 
      success: false, 
      error: "Failed to reject account request" 
    };
  }
};