import { Session } from "next-auth";
import { handleSignOut } from "@/lib/actions/auth-actions";
import { LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "../ui/mode-toggle";

const Header = ({ session }: { session: Session }) => {
  return (
    <header className="admin-header flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-semibold text-dark-400">
          {session?.user?.name}
        </h2>
        <p className="text-base text-slate-500">
          Monitor all of your users and books here
        </p>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <ModeToggle />
        {/* Back to User App */}
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-admin hover:bg-gray-50 border border-gray-300 hover:border-primary-admin rounded-lg transition-all duration-300 group"
          title="Back to User App"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back to User App</span>
        </Link>

        {/* Logout Button */}
        <form action={handleSignOut}>
          <button 
            type="submit" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-600 hover:border-red-700 rounded-lg transition-all duration-300 group shadow-sm hover:shadow-md"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </header>
  );
};
export default Header;
