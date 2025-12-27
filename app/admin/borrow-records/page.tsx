import React from "react";
import { Suspense } from "react";
import BorrowRecordsTable from "@/components/admin/tables/BorrowRecordsTable";

export default function Page() {
    return (
        <section className="w-full rounded-2xl bg-white dark:bg-gray-800 p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold dark:text-white">Borrow Records</h2>
            </div>

            <div className="mt-7 w-full overflow-hidden">
                <Suspense fallback={
                    <div className="flex items-center justify-center p-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <span className="ml-2">Loading records...</span>
                    </div>
                }>
                    <BorrowRecordsTable />
                </Suspense>
            </div>
        </section>
    );
}