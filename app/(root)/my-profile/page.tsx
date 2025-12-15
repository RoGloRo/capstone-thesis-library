import { signOut, auth } from "@/auth";
import BookList from "@/components/BookList";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import React from "react";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { User, Calendar, BookOpen, Clock, CreditCard, Mail, Hash, Shield } from "lucide-react";
import Image from "next/image";

// Simple card components since shadcn/ui might not be installed
const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
);

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

const Badge = ({ 
  variant = 'default', 
  className = '', 
  children 
}: { 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline', 
  className?: string, 
  children: React.ReactNode 
}) => {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  const variantStyles = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground'
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Page = async () => {
  const session = await auth();

  // If no session, show nothing (or redirect to sign-in as desired)
  if (!session?.user?.id) {
    return (
      <>
        <form action={async () => {
          "use server";
          await signOut();
        }} className="mb-10">
          <Button>Logout</Button>
        </form>

        <p className="text-light-100">Please sign in to view your profile.</p>
      </>
    );
  }

  // Fetch borrowed books for the current user where status = 'BORROWED'
  const rows = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      rating: books.rating,
      totalCopies: books.totalCopies,
      availableCopies: books.availableCopies,
      description: books.description,
      coverUrl: books.coverUrl,
      coverColor: books.coverColor,
      videoUrl: books.videoUrl,
      summary: books.summary,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      borrowStatus: borrowRecords.status,
    })
    .from(borrowRecords)
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .where(
      and(
        eq(borrowRecords.userId, session.user.id as string),
        eq(borrowRecords.status, "BORROWED")
      )
    );

  const borrowedBooks = rows.map((r) => ({
    id: (r.id ?? "") as string,
    title: (r.title ?? "") as string,
    author: (r.author ?? "") as string,
    genre: (r.genre ?? "") as string,
    rating: Number(r.rating ?? 0),
    totalCopies: Number(r.totalCopies ?? 1),
    availableCopies: Number(r.availableCopies ?? 0),
    description: (r.description ?? "") as string,
    coverUrl: (r.coverUrl ?? "") as string,
    coverColor: (r.coverColor ?? "#ffffff") as string,
    videoUrl: (r.videoUrl ?? "") as string,
    summary: (r.summary ?? "") as string,
    borrowDate: r.borrowDate ? new Date(r.borrowDate).toISOString() : undefined,
    dueDate: r.dueDate ? new Date(r.dueDate).toISOString() : undefined,
    returnDate: r.returnDate ? new Date(r.returnDate).toISOString() : null,
    isLoanedBook: true,
  }));

  const returnedRows = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      rating: books.rating,
      totalCopies: books.totalCopies,
      availableCopies: books.availableCopies,
      description: books.description,
      coverUrl: books.coverUrl,
      coverColor: books.coverColor,
      videoUrl: books.videoUrl,
      summary: books.summary,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
      borrowStatus: borrowRecords.status,
    })
    .from(borrowRecords)
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .where(
      and(
        eq(borrowRecords.userId, session.user.id as string),
        eq(borrowRecords.status, "STATUS") // Changed from "BORROWED" to "RETURNED"
      )
    );

  const returnedBooks = returnedRows.map((r) => ({
    id: (r.id ?? "") as string,
    title: (r.title ?? "") as string,
    author: (r.author ?? "") as string,
    genre: (r.genre ?? "") as string,
    rating: Number(r.rating ?? 0),
    totalCopies: Number(r.totalCopies ?? 1),
    availableCopies: Number(r.availableCopies ?? 0),
    description: (r.description ?? "") as string,
    coverUrl: (r.coverUrl ?? "") as string,
    coverColor: (r.coverColor ?? "#ffffff") as string,
    videoUrl: (r.videoUrl ?? "") as string,
    summary: (r.summary ?? "") as string,
    borrowDate: r.borrowDate ? new Date(r.borrowDate).toISOString() : undefined,
    dueDate: r.dueDate ? new Date(r.dueDate).toISOString() : undefined,
    returnDate: r.returnDate ? new Date(r.returnDate).toISOString() : null,
    isLoanedBook: false, // Set to false since these are returned books
  }));

  // Fetch complete user data
  const [userData] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id as string))
    .limit(1);

  if (!userData) {
    return <p className="text-light-100">User not found.</p>;
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const userStatus = userData.status || 'PENDING';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 rounded-2xl">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-blue-200">Manage your account and library activity</p>
          </div>
          <form action={async () => {
            "use server";
            await signOut();
          }}>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Sign Out
            </Button>
          </form>
        </div>

        {/* Profile Overview Card */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-blue-400/50">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-bold">
                  {getInitials(userData.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-3xl text-white mb-2">{userData.fullName}</CardTitle>
                <div className="flex items-center gap-2 text-blue-200 mb-2">
                  <Mail className="h-4 w-4" />
                  <span>{userData.email}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={userStatus === 'APPROVED' ? 'default' : userStatus === 'PENDING' ? 'secondary' : 'destructive'}
                    className="capitalize"
                  >
                    {userStatus.toLowerCase()}
                  </Badge>
                  <Badge variant={userData.role === 'ADMIN' ? 'default' : 'outline'} className="capitalize">
                    <Shield className="h-3 w-3 mr-1" />
                    {userData.role}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-blue-200 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </p>
                <p className="font-medium text-white">{userData.fullName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-blue-200 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="font-medium text-white">{userData.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-blue-200 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  University ID
                </p>
                <p className="font-medium text-white">{userData.universityId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-blue-200 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </p>
                <p className="font-medium text-white">{formatDate(userData.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-blue-200 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last Active
                </p>
                <p className="font-medium text-white">{formatDate(userData.lastActivityDate)}</p>
              </div>
            </CardContent>
          </Card>

          {/* University Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                University Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userData.universityCard ? (
                <div className="space-y-4">
                  <div className="relative aspect-[1.586/1] bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-4 text-white shadow-lg">
                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <p className="text-xs opacity-75 mb-1">STUDENT ID</p>
                        <p className="text-lg font-bold">{userData.universityId}</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-75 mb-1">STUDENT NAME</p>
                        <p className="font-medium text-sm">{userData.fullName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Image 
                      src={userData.universityCard} 
                      alt="University ID Card" 
                      width={300}
                      height={200}
                      className="w-full rounded-lg border border-white/20 shadow-md object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No university card uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Library Statistics */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Library Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-400 mb-1">{borrowedBooks.length}</div>
                <div className="text-sm text-blue-200">Currently Borrowed</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-2xl font-bold text-green-400 mb-1">{returnedBooks.length}</div>
                <div className="text-sm text-green-200">Books Returned</div>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-400 mb-1">{borrowedBooks.length + returnedBooks.length}</div>
                <div className="text-sm text-purple-200">Total Books Read</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Books Section */}
        <div className="space-y-8">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <BookList 
              title="Currently Borrowed Books" 
              books={borrowedBooks} 
              containerClassName=""
              userData={{
                fullName: userData.fullName,
                email: userData.email,
                universityId: userData.universityId
              }}
            />
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <BookList 
              title="Reading History" 
              books={returnedBooks} 
              containerClassName=""
              userData={{
                fullName: userData.fullName,
                email: userData.email,
                universityId: userData.universityId
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;