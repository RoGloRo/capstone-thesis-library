"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, BookOpen, User, Tag, Star, Palette, Video } from "lucide-react";
import { bookSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type BookFormData = z.infer<typeof bookSchema>;

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

  const form = useForm<BookFormData>({
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

  const onSubmit = async (values: BookFormData) => {
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
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter book title" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Author
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter author name" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Genre
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Fiction, Science, History" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Rating
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min={1}
                            max={5}
                            placeholder="1-5"
                            className="w-20"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                          <span className="text-sm text-muted-foreground">out of 5 stars</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Total Copies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="totalCopies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Copies Available</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Number of copies"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visual Elements Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Visual Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cover URL */}
                <FormField
                  control={form.control}
                  name="coverUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Cover Image
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {/* URL Input */}
                          <div>
                            <Input placeholder="Cover image URL" {...field} />
                          </div>
                          
                          {/* Upload Section */}
                          <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                            <div className="flex-shrink-0">
                              <FileUpload
                                type="image"
                                accept="image/*"
                                placeholder="Upload Image"
                                folder="book-covers"
                                variant="light"
                                onFileChange={(filePath) => {
                                  if (filePath) {
                                    field.onChange(filePath);
                                    form.trigger("coverUrl");
                                  }
                                }}
                                value={field.value}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">
                                Upload a book cover image or paste URL above
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Supported: JPG, PNG, WebP • Max size: 20MB
                              </p>
                            </div>
                          </div>
                          
                          {/* Image Preview */}
                          {field.value && (
                            <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                              <div
                                className="w-16 h-20 bg-cover bg-center rounded border flex-shrink-0"
                                style={{ backgroundImage: `url(${field.value})` }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Cover Image Preview</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {field.value}
                                </p>
                              </div>
                            </div>
                          )}
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
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Cover Color Theme
                      </FormLabel>
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
              </div>

              {/* Video URL */}
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video Preview (Optional)
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* URL Input */}
                        <div>
                          <Input placeholder="Video URL for book preview" {...field} />
                        </div>
                        
                        {/* Upload Section */}
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                          <div className="flex-shrink-0">
                            <FileUpload
                              type="video"
                              accept="video/*"
                              placeholder="Upload Video"
                              folder="book-videos"
                              variant="light"
                              onFileChange={(filePath) => {
                                if (filePath) {
                                  field.onChange(filePath);
                                  form.trigger("videoUrl");
                                }
                              }}
                              value={field.value}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">
                              Upload a video preview or paste URL above
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Supported: MP4, WebM, MOV • Max size: 50MB
                            </p>
                          </div>
                        </div>
                        
                        {/* Video Preview */}
                        {field.value && (
                          <div className="p-3 border rounded-lg bg-white">
                            <p className="text-sm font-medium mb-3">Video Preview</p>
                            <video 
                              src={field.value} 
                              controls 
                              className="w-full max-w-md h-48 rounded border bg-black"
                            />
                            <p className="text-xs text-muted-foreground mt-2 truncate">
                              {field.value}
                            </p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Content Section */}
          <Card>
            <CardHeader>
              <CardTitle>Book Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed description of the book..."
                        className="min-h-[120px] resize-none"
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
                    <FormLabel>Short Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write a brief summary or excerpt..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              size="lg"
              className="min-w-[200px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {type === 'update' ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {type === 'update' ? 'Update Book' : 'Add Book to Library'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default BookForm;