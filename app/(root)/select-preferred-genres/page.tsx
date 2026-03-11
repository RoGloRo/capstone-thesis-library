import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/database/drizzle";
import { books, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import GenreSelector from "./GenreSelector";

export default async function SelectPreferredGenresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Guard: if onboarding already done, send to home
  const [userData] = await db
    .select({ onboardingCompleted: users.onboardingCompleted })
    .from(users)
    .where(eq(users.id, session.user.id as string))
    .limit(1);

  if (userData?.onboardingCompleted) redirect("/");

  // Fetch all distinct genres from the books table
  const genreRows = await db
    .selectDistinct({ genre: books.genre })
    .from(books)
    .orderBy(books.genre);

  const genres = genreRows.map((r) => r.genre).filter(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <GenreSelector genres={genres} userId={session.user.id as string} />
    </div>
  );
}
