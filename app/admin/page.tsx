import {
  Book,
  Users,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { KPICard } from "@/components/admin/KPICard";
import { BorrowingTrendsChart } from "@/components/admin/BorrowingTrendsChart";
import { TopBooksChart } from "@/components/admin/TopBooksChart";
import { TopGenresChart } from "@/components/admin/TopGenresChart";
import { ActiveBooksChart } from "@/components/admin/ActiveBooksChart";
import { RecentlyBorrowedTable } from "@/components/admin/RecentlyBorrowedTable";
import { RecentlyReturnedTable } from "@/components/admin/RecentlyReturnedTable";
import { OverdueBooksTable } from "@/components/admin/OverdueBooksTable";
import { TopBorrowersList } from "@/components/admin/TopBorrowersList";
import AiLibraryInsights from "@/components/admin/AiLibraryInsights";
import {
  getAdminDashboardStats,
  getBorrowingTrends,
  getTopGenres,
  getTopBooks,
  getRecentlyBorrowedBooks,
  getRecentlyReturnedBooks,
  getOverdueBooks,
  getTopBorrowers,
} from "./utils";

export default async function AdminDashboard() {
  const [
    dashboardStats,
    borrowingTrends,
    topGenres,
    topBooks,
    recentlyBorrowedBooks,
    recentlyReturnedBooks,
    overdueBooksData,
    topBorrowers,
  ] = await Promise.all([
    getAdminDashboardStats(),
    getBorrowingTrends(),
    getTopGenres(),
    getTopBooks(),
    getRecentlyBorrowedBooks(),
    getRecentlyReturnedBooks(),
    getOverdueBooks(),
    getTopBorrowers(),
  ]);

  const {
    totalBooks,
    availableBooks,
    titleCount,
    totalUsers,
    totalAccounts,
    pendingUsers,
    rejectedUsers,
    borrowedToday,
    currentlyBorrowed,
    overdueBooks,
    returnedBooks,
  } = dashboardStats;

  const nonApprovedAccounts = Math.max(totalAccounts - totalUsers, 0);

  const stats = [
    {
      title: "Total Books",
      value: totalBooks,
      icon: <Book className="h-4 w-4" />,
      className: "border-blue-500",
      subtitle: `${titleCount.toLocaleString()} titles`,
    },
    {
      title: "Registered Users",
      value: totalUsers,
      icon: <Users className="h-4 w-4" />,
      className: "border-green-500",
      subtitle: `${nonApprovedAccounts.toLocaleString()} account(s) pending/rejected`,
    },
    {
      title: "Borrowed Today",
      value: borrowedToday,
      icon: <Clock className="h-4 w-4" />,
      className: "border-yellow-500",
      subtitle: "borrow transactions today",
    },
    {
      title: "Currently Borrowed",
      value: currentlyBorrowed,
      icon: <BookOpen className="h-4 w-4" />,
      className: "border-purple-500",
      subtitle: "books on loan right now",
    },
    {
      title: "Overdue Books",
      value: overdueBooks,
      icon: <AlertCircle className="h-4 w-4" />,
      className: "border-red-500",
      subtitle: "past their due date",
    },
    {
      title: "Total Returned Books",
      value: returnedBooks,
      icon: <CheckCircle2 className="h-4 w-4" />,
      className: "border-emerald-500",
      subtitle: "all-time return transactions",
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Admin Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <KPICard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            className={stat.className}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      {/* AI Analytics Section */}
      <AiLibraryInsights />

      {/* Primary analytics: trends + most-borrowed books */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BorrowingTrendsChart
            data={borrowingTrends.data}
            granularity={borrowingTrends.granularity}
            hasData={borrowingTrends.hasData}
          />
        </div>
        <div>
          <TopBooksChart data={topBooks} />
        </div>
      </div>

      {/* Secondary analytics: genres, availability, borrowers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TopGenresChart genres={topGenres.genres} total={topGenres.total} />
        <ActiveBooksChart
          totalBooks={totalBooks}
          availableBooks={availableBooks}
        />
        <div className="md:col-span-2 lg:col-span-1">
          <TopBorrowersList data={topBorrowers} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentlyBorrowedTable data={recentlyBorrowedBooks} />
        <RecentlyReturnedTable data={recentlyReturnedBooks} />
      </div>

      {/* Overdue (always visible, includes all-clear state) */}
      <OverdueBooksTable data={overdueBooksData} />
    </div>
  );
}