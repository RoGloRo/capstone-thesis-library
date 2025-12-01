import { signOut, auth } from "@/auth";
import BookList from "@/components/BookList";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import React from "react";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { eq, and } from "drizzle-orm";

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
  const userInfo = [
    { label: 'Full Name', value: userData.fullName },
    { label: 'Email', value: userData.email },
    { label: 'University ID', value: userData.universityId },
    { 
      label: 'Status', 
      value: (
        <Badge 
          variant={userStatus === 'APPROVED' ? 'default' : userStatus === 'PENDING' ? 'secondary' : 'destructive'}
          className="capitalize text-black"
        >
          {userStatus.toLowerCase()}
        </Badge>
      ) 
    },
    { 
      label: 'Role', 
      value: (
        <Badge variant={userData.role === 'ADMIN' ? 'default' : 'outline'} className="capitalize text-black">
          {userData.role}
        </Badge>
      ) 
    },
    { label: 'Member Since', value: formatDate(userData.createdAt) },
    { label: 'Last Active', value: formatDate(userData.lastActivityDate) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <form action={async () => {
          "use server";
          await signOut();
        }}>
          <Button variant="outline">Sign Out</Button>
        </form>
      </div>

      <Card className="border-muted/50" style={{ backgroundColor: '#232839' }}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-amber-100">
              <AvatarFallback className="bg-amber-100 text-amber-800 text-xl font-medium">
                {getInitials(userData.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl text-white">{userData.fullName}</CardTitle>
              <p className="text-muted-foreground">{userData.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-0">
          {userInfo.map((info, index) => (
            <div key={index} className="space-y-1">
              <p className="text-sm text-muted-foreground">{info.label}</p>
              <p className="font-medium text-white">{info.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="pt-4">
        <BookList 
          title="Borrowed Books" 
          books={borrowedBooks} 
          containerClassName="mt-6"
        />
      </div>
    </div>
  );
};

export default Page;