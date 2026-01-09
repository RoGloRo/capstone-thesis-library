import { auth } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

const Layout = async ({ children }: { children: ReactNode }) => {

  const session =  await auth();

  if(session) redirect("/");

  return (
    <main className="auth-container">
      <section className="auth-form">
        <div className="auth-box">
          <div className="flex flex-row gap-3">
            <Image src="/icons/logo.svg" alt="logo" width={37} height={37} />
            <h1 className="text-2xl font-semibold text-white">Smart Library</h1>
          </div>
          <div>{children}</div>
          {/* Footer directly below the auth form */}
          <div className="mt-6 text-center">
            <div className="text-sm text-slate-400">
              <span>© Smart Library</span>
              <span className="mx-2">|</span>
              <Link href="/about-us" className="text-slate-300 hover:text-slate-100 hover:underline transition-colors duration-150">About</Link>
              <span className="mx-2">|</span>
              <Link href="/about-us" className="text-slate-300 hover:text-slate-100 hover:underline transition-colors duration-150">Contact</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-illustration">
        <Image
          src="/images/auth-illustration.png"
          alt="auth illustration"
          height={1000}
          width={1000}
          className="size-full object-cover"
        />
      </section>
    </main>
  )
}
export default Layout