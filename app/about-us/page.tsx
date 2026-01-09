"use client"

import React from "react";
import Link from "next/link";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Info, Mail, Phone } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-800 text-slate-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero / Intro */}
        <section className="text-center max-w-3xl mx-auto py-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">About Smart Library</h1>
          <p className="text-lg sm:text-xl text-slate-200 mb-6">A lightweight, accessible platform for managing school and community library resources.</p>
          <p className="text-sm sm:text-base text-slate-300">Muntinlupa National High School Smart Library is a digital library management system designed to support students and staff in accessing educational resources more efficiently. It enhances traditional library services by providing an organized, user-friendly platform for browsing books, managing borrow records, and receiving important library updates.</p>
        </section>

        {/* About Section */}
        <section className="mt-8 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold mb-4">About Us</h2>
          <p className="text-slate-300 leading-relaxed">Muntinlupa National High School or simply MNHS is one of the public schools in Muntinlupa, Philippines. Located in NBP Reservation, Brgy. Poblacion, Muntinlupa. The school, established in 1945, is now headed by Mr. Florante Marmeto. This high school is the biggest amongst the public high schools in the city.</p>
        </section>

         {/* Mission & Vision Section */}
        <section className="mt-14 max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-slate-100 mb-2">Mission</h3>
              <p className="text-slate-300 text-sm leading-relaxed">We, the stakeholders of Muntinlupa National High School shall relentlessly strive to provide equal and equitable access to quality education that respond to the cultural, environmental, financial, commercial, industrial, technical and technological demands of the progressively thriving City of Muntinlupa.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-slate-100 mb-2">Vision</h3>
              <p className="text-slate-300 text-sm leading-relaxed">Muntinlupa National High School is a caring and friendly institution of learning transforming Filipino youths into God-loving, productive and lifelong learners in a technologically driven society strongly supported by all stakeholders.</p>
            </div>
          </div>
        </section>

         {/* Core Values Section */}
        <section className="mt-12 max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-4 text-center">Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Maka-Diyos (Pious)</h3>
              <p className="text-slate-300 text-sm">the concept of being “Maka-Diyos ” refers to the act of the quality or state of being spiritually pure or virtuous.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Makakalikasan</h3>
              <p className="text-slate-300 text-sm">it refers to the ability of man to value our nature or environment.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Makabansa</h3>
              <p className="text-slate-300 text-sm">the act of having full respect for the country</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="font-semibold text-slate-100 mb-2">Makatao</h3>
              <p className="text-slate-300 text-sm">the concept of being “Makatao” refers to the act of being human or having a sense of humanity.</p>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="mt-12 max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-4 text-center">Frequently Asked Questions</h2>

          <div className="space-y-3">
            <Collapsible>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left flex items-center justify-between py-3 px-2 text-slate-100 font-medium">
                    <span>What is this library app?</span>
                    <span className="text-slate-400">+</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 text-slate-300">
                    <p>The library app allows users to browse and search for books, borrow and return them, and view their borrowing history.</p>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
            <Collapsible defaultOpen={false}>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left flex items-center justify-between py-3 px-2 text-slate-100 font-medium">
                    <span>How to borrow books</span>
                    <span className="text-slate-400">+</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 text-slate-300">
                    <p>You can borrow a book by browsing through the available books, click a book and clicking the "Borrow" button.</p>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <Collapsible>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left flex items-center justify-between py-3 px-2 text-slate-100 font-medium">
                    <span>Borrowing limits</span>
                    <span className="text-slate-400">+</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 text-slate-300">
                    <p>Users can only borrow a book if they have an account and if they are approved by the admin. And they can only borrow one book at a time.</p>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <Collapsible>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left flex items-center justify-between py-3 px-2 text-slate-100 font-medium">
                    <span>Due dates and penalties</span>
                    <span className="text-slate-400">+</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 text-slate-300">
                    <p> Return the books before the due date. Overdue books incur a penalty depending on the school policy.</p>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <Collapsible>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left flex items-center justify-between py-3 px-2 text-slate-100 font-medium">
                    <span>Operating Hours</span>
                    <span className="text-slate-400">+</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 text-slate-300">
                    <p>The library is open from 8:00 AM to 4:00 PM, Monday to Friday.</p>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </section>

        {/* Contact Information Section */}
        <section className="mt-12 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3 text-slate-300">
            <p className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-emerald-300" />
              <a href="mailto:OfficialMNHS@gmail.com" className="text-emerald-200 hover:underline">OfficialMNHS@gmail.com</a>
            </p>
            <p className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path fill="currentColor" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.876v-6.99H7.898v-2.886h2.54V9.797c0-2.506 1.492-3.89 3.776-3.89 1.094 0 2.238.195 2.238.195v2.462h-1.26c-1.243 0-1.63.772-1.63 1.562v1.875h2.773l-.444 2.886h-2.329v6.99C18.343 21.128 22 16.991 22 12z" />
              </svg>
              <a href="https://www.facebook.com/p/Muntinlupa-National-High-School-61557405626625/" target="_blank" rel="noreferrer" className="text-emerald-200 hover:underline">FB: Muntinlupa National High School</a>
            </p>
            <p className="flex items-center justify-center gap-2">
              <Phone className="w-4 h-4 text-amber-300" />
              <a href="tel:+1234567890" className="text-emerald-200 hover:underline">(02) 550 5211</a>
            </p>
          </div>
        </section>

        {/* Back Button */}
        <div className="mt-12 flex justify-center">
          <Link href="/" className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ring-2 ring-red-700/30">
            Back to Home
          </Link>
        </div>

      </div>
    </main>
  );
}
