"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { bookSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/FileUpload";
import ColorPicker from "@/components/admin/ColorPicker";
import { createBook, updateBook } from "@/lib/admin/actions/book";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface BookFormProps extends Partial<Book> {
  type?: "create" | "update";
}

const BookForm = ({ 
  type = "create",
  id = "",
  title = "",
  author = "",
  genre = "",
  rating = 1,
  description = "",
  totalCopies = 1,
  coverUrl = "",
  coverColor = "#012B48",
  videoUrl = "",
  summary = ""
}: BookFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title,
      description,
      author,
      genre,
      rating,
      totalCopies,
      coverUrl,
      coverColor,
      videoUrl,
      summary,
    },
  });

  const onSubmit = async (values: z.infer<typeof bookSchema>) => {
    try {
      setIsSubmitting(true);
      let result;

      if (type === "update" && id) {
        result = await updateBook(id, values);
      } else {
        result = await createBook(values);
      }

      if (result.success) {
        toast.success(`Book ${type === 'update' ? 'updated' : 'added'} successfully!`);
        router.push('/admin/books');
        router.refresh();
      } else {
        toast.error(result.message || `Failed to ${type} book`);
      }
    } catch (error) {
      console.error(`Error ${type}ing book:`, error);
      toast.error(`An error occurred while ${type}ing the book`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Book title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Author */}
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <FormControl>
                  <Input placeholder="Author name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Genre */}
          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <FormControl>
                  <Input placeholder="Genre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rating */}
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    placeholder="Rating (1-5)"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Total Copies */}
          <FormField
            control={form.control}
            name="totalCopies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Copies</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Total copies"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cover URL */}
          <FormField
            control={form.control}
            name="coverUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image URL</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input placeholder="Cover image URL" {...field} />
                    <FileUpload
                      onUploadComplete={(url) => {
                        field.onChange(url);
                        form.trigger("coverUrl");
                      }}
                      type="image"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cover Color */}
          <FormField
            control={form.control}
            name="coverColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Color</FormLabel>
                <FormControl>
                  <ColorPicker
                    color={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Video URL */}
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video URL (Optional)</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input placeholder="Video URL" {...field} />
                    <FileUpload
                      onUploadComplete={(url) => {
                        field.onChange(url);
                        form.trigger("videoUrl");
                      }}
                      type="video"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Book description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Summary */}
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Book summary"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            className="book-form_btn text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {type === 'update' ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              type === 'update' ? 'Update Book in the Library' : 'Add Book to Library'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BookForm;