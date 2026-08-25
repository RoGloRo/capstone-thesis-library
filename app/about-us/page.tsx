import { auth } from "@/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingChat from "@/components/FloatingChat";
import AboutFaq from "@/components/AboutFaq";
import AboutFeedbackForm from "@/components/AboutFeedbackForm";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Facebook,
  Flag,
  GraduationCap,
  HeartHandshake,
  Leaf,
  Library,
  Mail,
  Phone,
  Target,
  Users,
} from "lucide-react";

// Public page — intentionally outside the authenticated (root) route group.
// It renders the main-app chrome (Header/Footer/FloatingChat) using the
// existing .root-container, theme system, and nullable session support.
const AboutPage = async () => {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);
  const browseHref = isAuthenticated ? "/library" : "/sign-in";

  return (
    <main className="root-container">
      <Header session={session} />

      <div className="mx-auto max-w-5xl flex-1 pb-20">
        {/* Hero */}
        <section className="px-4 pt-14 pb-10 text-center sm:pt-20 sm:pb-14">
          <div className="relative mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-lg shadow-emerald-600/25">
            <Library className="h-8 w-8" />
            <GraduationCap className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-white p-1 text-emerald-600 shadow-sm dark:bg-slate-900" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-ink dark:text-white sm:text-5xl">
            About Smart Library
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-muted dark:text-slate-300">
            A lightweight, accessible platform for managing school and
            community library resources.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted dark:text-slate-400 sm:text-base">
            Muntinlupa National High School Smart Library is a digital library
            management system designed to support students and staff in
            accessing educational resources more efficiently. It enhances
            traditional library services by providing an organized,
            user-friendly platform for browsing books, managing borrow
            records, and receiving important library updates.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href={browseHref}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-700 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:from-emerald-700 hover:to-green-800 hover:shadow-xl hover:shadow-emerald-600/30 active:scale-95"
            >
              Browse Books
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* About Us */}
        <section className="px-4 pt-8">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              About Us
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink-muted dark:text-slate-300">
              Muntinlupa National High School or simply MNHS is one of the
              public schools in Muntinlupa, Philippines. Located in NBP
              Reservation, Brgy. Poblacion, Muntinlupa. The school,
              established in 1945, is now headed by Mr. Rosendo A. Sangalang. This
              high school is the biggest amongst the public high schools in
              the city.
            </p>
          </div>
        </section>
      {/* Mission & Vision */}
        <section className="px-4 pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              What Drives Us
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink dark:text-white sm:text-3xl">
              Mission & Vision
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="group rounded-2xl border border-line bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-600/10 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-ink dark:text-white">
                Mission
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted dark:text-slate-300">
                All DepEd libraries aim to empower and bestow leadership to learners, teachers, librarians, and school stakeholders in choosing, gaining, storing, accessing, and making supplementary learning resources available to create a place for reading, discovery, and collaboration. DepEd libraries are committed to make an impact in building  a learning community  where school stakeholders engage one another to participate in and contribute to their learning and growth and achieve the objectives of the K to 12 program.
              </p>
            </div>

            <div className="group rounded-2xl border border-line bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-600/10 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-ink dark:text-white">
                Vision
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted dark:text-slate-300">
                All DepEd libraries shall be transformed as fully functional places for reading discovery, and collaboration to contribute significantly in attaining the objectives of the K to 12 Program and reaching greater level of learning achievements through stakeholders shared engagement in school library establishment, improvement, and operations.
              </p>
            </div>
          </div>
        </section>

      {/* Core Values */}
        <section className="px-4 pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Our Principles
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink dark:text-white sm:text-3xl">
              Core Values
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-600/10 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-ink dark:text-white">
                Maka-Diyos
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                The concept of being &ldquo;Maka-Diyos&rdquo; refers to the act of the
                quality or state of being spiritually pure or virtuous.
              </p>
            </div>

            <div className="group rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-600/10 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
                <Leaf className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-ink dark:text-white">
                Makakalikasan
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                It refers to the ability of man to value our nature or
                environment.
              </p>
            </div>

            <div className="group rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-600/10 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
                <Flag className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-ink dark:text-white">
                Makabansa
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                The act of having full respect for the country.
              </p>
            </div>

            <div className="group rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-600/10 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-ink dark:text-white">
                Makatao
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                The concept of being &ldquo;Makatao&rdquo; refers to the act of being
                human or having a sense of humanity.
              </p>
            </div>
          </div>
        </section>

      {/* Frequently Asked Questions */}
        <section className="px-4 pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Need Help?
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink dark:text-white sm:text-3xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <AboutFaq />
          </div>
        </section>

      {/* Contact */}
        <section id="contact-us" className="px-4 pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Get In Touch
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink dark:text-white sm:text-3xl">
              Contact Us
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Contact information */}
            <div className="rounded-2xl border border-line bg-surface p-7 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-semibold text-ink dark:text-white">
                Contact Information
              </h3>
              <p className="mt-2 text-sm text-ink-muted dark:text-slate-400">
                Reach out to the library team through any of these channels.
              </p>

              <ul className="mt-6 space-y-4">
                <li>
                  <a
                    href="mailto:mnhsmainiris@gmail.com"
                    className="group flex items-start gap-4"
                  >
                    <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
                      <Mail className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">
                        Email
                      </span>
                      <span className="mt-0.5 block break-all text-sm font-medium text-ink hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300">
                        mnhsmainiris@gmail.com
                      </span>
                    </span>
                  </a>
                </li>

                <li>
                  <a
                    href="https://www.facebook.com/mnhsmainiris"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-4"
                  >
                    <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
                      <Facebook className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">
                        Facebook
                      </span>
                      <span className="mt-0.5 block text-sm font-medium text-ink hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300">
                        Muntinlupa National High
                        School- Learning Resource Center
                      </span>
                    </span>
                  </a>
                </li>

                <li>
                  <a
                    href="tel:+025505211"
                    className="group flex items-start gap-4"
                  >
                    <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:group-hover:bg-emerald-500/20">
                      <Phone className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">
                        Phone
                      </span>
                      <span className="mt-0.5 block text-sm font-medium text-ink hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300">
                        (02) 550 5211
                      </span>
                    </span>
                  </a>
                </li>
              </ul>
            </div>
            {/* Frontend-only feedback form */}
            <div className="rounded-2xl border border-line bg-surface p-7 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-semibold text-ink dark:text-white">
                Send Us a Message
              </h3>
              <p className="mt-2 text-sm text-ink-muted dark:text-slate-400">
                We&rsquo;d love to hear from you. Fill out the form and
                we&rsquo;ll get back to you.
              </p>

              <div className="mt-6">
                <AboutFeedbackForm />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />

      {/* Floating Chat Widget */}
      <FloatingChat />
    </main>
  );
};

export default AboutPage;