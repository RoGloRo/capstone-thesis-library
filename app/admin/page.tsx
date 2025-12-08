import { Book, User, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { KPICard } from "@/components/admin/KPICard";
import { BorrowingTrendsChart } from "@/components/admin/BorrowingTrendsChart";
import { TopGenresChart } from "@/components/admin/TopGenresChart";
import { ActiveBooksChart } from "@/components/admin/ActiveBooksChart";
import { RecentlyBorrowedTable } from "@/components/admin/RecentlyBorrowedTable";
import { OverdueBooksTable } from "@/components/admin/OverdueBooksTable";
import { TopBorrowersList } from "@/components/admin/TopBorrowersList";
import { 
  getAdminDashboardStats, 
  getBorrowingTrends, 
  getTopGenres, 
  getRecentlyBorrowedBooks, 
  getOverdueBooks, 
  getTopBorrowers 
} from "./utils";

export default async function AdminDashboard() {
  const [
    dashboardStats,
    borrowingTrends,
    topGenres,
    recentlyBorrowedBooks,
    overdueBooksData,
    topBorrowers
  ] = await Promise.all([
    getAdminDashboardStats(),
    getBorrowingTrends(),
    getTopGenres(),
    getRecentlyBorrowedBooks(),
    getOverdueBooks(),
    getTopBorrowers()
  ]);

  const {
    totalBooks,
    totalUsers,
    borrowedToday,
    currentlyBorrowed,
    overdueBooks,
    returnedBooks,
  } = dashboardStats;

  const stats = [
    {
      title: "Total Books",
      value: totalBooks,
      icon: <Book className="h-4 w-4" />,
      className: "border-blue-500",
    },
    {
      title: "Total Users",
      value: totalUsers,
      icon: <User className="h-4 w-4" />,
      className: "border-green-500",
    },
    {
      title: "Borrowed Today",
      value: borrowedToday,
      icon: <Clock className="h-4 w-4" />,
      className: "border-yellow-500",
    },
    {
      title: "Currently Borrowed",
      value: currentlyBorrowed,
      icon: <Book className="h-4 w-4" />,
      className: "border-purple-500",
    },
    {
      title: "Overdue Books",
      value: overdueBooks,
      icon: <AlertCircle className="h-4 w-4" />,
      className: "border-red-500",
    },
    {
      title: "Returned Books",
      value: returnedBooks,
      icon: <CheckCircle className="h-4 w-4" />,
      className: "border-emerald-500",
    },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <KPICard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            className={stat.className}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BorrowingTrendsChart data={borrowingTrends} />
        </div>
        <div>
          <TopGenresChart data={topGenres} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveBooksChart 
          totalBooks={totalBooks} 
          borrowedBooks={currentlyBorrowed} 
        />
        <TopBorrowersList data={topBorrowers} />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-6">
        <RecentlyBorrowedTable data={recentlyBorrowedBooks} />
        {overdueBooksData.length > 0 && (
          <OverdueBooksTable data={overdueBooksData} />
        )}
      </div>
    </div>
  );
}