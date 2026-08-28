// components/admin/announcements/AnnouncementForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Megaphone,
  Loader2,
  Save,
  Send,
  Type,
  AlignLeft,
} from "lucide-react";
import {
  announcementSchema,
  type AnnouncementInput,
  type AnnouncementStatus,
} from "@/lib/validations";
import { announcementStatuses as statusBadgeConfig } from "@/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createAnnouncement,
  updateAnnouncement,
} from "@/lib/admin/actions/announcements";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AnnouncementFormProps {
  type?: "create" | "update";
  id?: string;
  title?: string;
  content?: string;
  status?: AnnouncementStatus;
  publishedAt?: string | null;
}

const AnnouncementForm = ({
  type = "create",
  id = "",
  title = "",
  content = "",
  status = "DRAFT",
  publishedAt = null,
}: AnnouncementFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const form = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: title || "",
      content: content || "",
    },
  });

  const submit = async (
    values: AnnouncementInput,
    action: "save" | "publish",
  ) => {
    if (action === "publish") {
      setIsPublishing(true);
    } else {
      setIsSubmitting(true);
    }
    try {
      const result =
        type === "update" && id
          ? await updateAnnouncement(id, values, action)
          : await createAnnouncement(values, action);

      if (!result.success) {
        throw new Error(
          result.error ??
            `Failed to ${action === "publish" ? "publish" : "save"} announcement`,
        );
      }

      toast.success(
        action === "publish"
          ? type === "update" && status === "ARCHIVED"
            ? "Announcement restored and published"
            : "Announcement published"
          : type === "update"
            ? "Announcement saved"
            : "Draft saved",
      );
      router.push("/admin/announcements");
      router.refresh();
    } catch (error) {
      console.error(`Error ${action}ing announcement:`, error);
      toast.error(
        error instanceof Error
          ? error.message
          : `An error occurred while ${action === "publish" ? "publishing" : "saving"} the announcement`,
      );
    } finally {
      setIsSubmitting(false);
      setIsPublishing(false);
    }
  };

  const statusConfig =
    statusBadgeConfig.find((s) => s.value === status) ?? statusBadgeConfig[0];

  return (
    <div className="mx-auto max-w-2xl">
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                {type === "update" ? "Edit Announcement" : "New Announcement"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current lifecycle state (edit mode only). Status is never an
                  editable field — it changes only through the action buttons
                  below, so librarians never have to understand DB states. */}
              {type === "update" && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
                  <span className="text-gray-500 dark:text-gray-400">
                    Status:
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      statusConfig.bgColor,
                      statusConfig.textColor,
                    )}
                  >
                    {statusConfig.label}
                  </Badge>
                  <span className="text-gray-500 dark:text-gray-400">
                    {publishedAt
                      ? `Published on ${format(new Date(publishedAt), "MMM d, yyyy h:mm a")}`
                      : "Not published yet"}
                  </span>
                </div>
              )}

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Library Schedule Update"
                        maxLength={200}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A short, clear headline (up to 200 characters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4" />
                      Content
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write the announcement for library users..."
                        rows={10}
                        maxLength={5000}
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Up to 5,000 characters. Plain text only for now.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Lifecycle actions — status is controlled here, not by a field. */}
          <div className="flex flex-wrap items-center gap-3">
            {!(type === "update" && status === "PUBLISHED") && (
              <Button
                type="button"
                onClick={form.handleSubmit((values) =>
                  submit(values, "publish"),
                )}
                disabled={isSubmitting || isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {type === "update" && status === "ARCHIVED"
                  ? "Publish (Restore)"
                  : "Publish"}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={form.handleSubmit((values) => submit(values, "save"))}
              disabled={isSubmitting || isPublishing}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {type === "update" ? "Save Changes" : "Save Draft"}
            </Button>

            <Button variant="ghost" asChild>
              <Link href="/admin/announcements">Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AnnouncementForm;
