"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { submitContactMessage } from "@/lib/actions/contact-messages";
import {
  contactMessageSchema,
  type ContactMessageInput,
} from "@/lib/validations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type FeedbackFormData = ContactMessageInput;

export default function AboutFeedbackForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = async (values: FeedbackFormData) => {
    setIsSubmitting(true);
    try {
      // Real backend: server action validates again, resolves the session
      // userId server-side, and persists to contact_messages.
      const result = await submitContactMessage(values);

      if (!result.success) {
        const description =
          "error" in result && result.error ? result.error : undefined;
        toast.error("Message not sent", {
          description: description ?? "Please try again in a moment.",
        });
        return;
      }

      toast.success("Message sent!", {
        description: `Thank you for reaching out, ${values.name.trim()}. We'll get back to you soon.`,
      });

      form.reset();
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your full name"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us how we can help or share your suggestion..."
                  rows={5}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-green-800"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Message
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}