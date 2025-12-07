// app/admin/account-requests/page.tsx
import { Suspense } from "react";
import AccountRequestsTable from "@/components/admin/tables/AccountRequestsTable";

export default function Page() {
  return (
    <section className="w-full rounded-2xl bg-white p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Account Requests</h2>
      </div>

      <div className="mt-7 w-full overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <span className="ml-2">Loading account requests...</span>
          </div>
        }>
          <AccountRequestsTable />
        </Suspense>
      </div>
    </section>
  );
}