"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface FaqItemData {
  question: string;
  answer: string;
}

// Preserved from the original public About Us page.
const FAQ_ITEMS: FaqItemData[] = [
  {
    question: "What is this library app?",
    answer:
      "The library app allows users to browse and search for books, borrow and return them, and view their borrowing history.",
  },
  {
    question: "How to borrow books",
    answer:
      "You can borrow a book by browsing through the available books, click a book and clicking the \"Borrow\" button.",
  },
  {
    question: "Borrowing limits",
    answer:
      "Users can only borrow a book if they have an account and if they are approved by the admin. And they can only borrow one book at a time.",
  },
  {
    question: "Due dates and penalties",
    answer:
      "Return the books before the due date. Overdue books incur a penalty depending on the school policy.",
  },
  {
    question: "Operating Hours",
    answer:
      "The library is open from 8:00 AM to 5:00 PM, Monday to Friday. Closed on Weekends and Public Holidays.",
  },
];

function FaqItem({ question, answer }: FaqItemData) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-line bg-surface transition-colors duration-300 hover:border-emerald-300/70 hover:bg-surface-muted dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left"
            aria-expanded={open}
          >
            <span className="text-base font-medium text-ink dark:text-white">
              {question}
            </span>
            <span
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-line bg-white/60 text-ink-muted transition-all duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
                open &&
                  "rotate-180 border-emerald-600/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1">
          <div className="px-5 pb-5">
            <p className="text-sm leading-relaxed text-ink-muted dark:text-slate-300">
              {answer}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function AboutFaq() {
  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item) => (
        <FaqItem
          key={item.question}
          question={item.question}
          answer={item.answer}
        />
      ))}
    </div>
  );
}