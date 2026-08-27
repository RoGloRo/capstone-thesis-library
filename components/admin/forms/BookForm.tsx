"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, BookOpen, User, Tag, Star, Palette, Video, Calendar, BookMarked, Hash, Building2, Layers, Languages, BookText, LibraryBig, Package, MapPin, BookType, CalendarDays, Boxes } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ,controlNumber = ""
  ,publishedYear = undefined
  ,identifier = ""
  ,publisher = ""
  ,edition = ""
  ,language = ""
  ,pages = undefined
  ,availableCopies = 0
  ,shelfLocation = ""
  ,bookFormat = ""
  ,acquisitionDate = ""
}: BookFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: title || "",
      description: description || "",
      author: author || "",
      genre: genre || "",
      rating: rating || 1,
      totalCopies: totalCopies || 1,
      coverUrl: coverUrl || "",
      coverColor: coverColor || "#000000",
      videoUrl: videoUrl || "",
      summary: summary || "",
      controlNumber: controlNumber || "",
      publishedYear: publishedYear ?? undefined,
      identifier: identifier || "",
      publisher: publisher || "",
      edition: edition || "",
      language: language || "",
      pages: pages ?? undefined,
      shelfLocation: shelfLocation || "",
      bookFormat: bookFormat || "",
      acquisitionDate: acquisitionDate || "",
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
          {/* Basic Information + Bibliographic Information (stack on small screens) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            value={typeof field.value === 'number' ? field.value : ""}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            onBlur={field.onBlur}
                            name={field.name}
                            disabled={field.disabled}
                          />
                          <span className="text-sm text-muted-foreground">out of 5 stars</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Published Year */}
                <FormField
                  control={form.control}
                  name="publishedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Published Year
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1000}
                          max={new Date().getFullYear()}
                          placeholder="e.g., 2016 (optional)"
                          value={typeof field.value === "number" ? field.value : ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          disabled={field.disabled}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Optional.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

            {/* Bibliographic Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5" />
                  Bibliographic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        ISBN / ISSN
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="978-0-123456-47-2 or 1234-5678" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        ISBN-10, ISBN-13, or ISSN-8 (optional).
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publisher"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Publisher
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pearson" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="edition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Edition
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2nd Edition" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        Language
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., English" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BookText className="h-4 w-4" />
                        Pages
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="e.g., 350"
                          value={typeof field.value === "number" ? field.value : ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          disabled={field.disabled}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Optional.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Library Information + Inventory Information (stack on small screens) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Library Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LibraryBig className="h-5 w-5" />
                  Library Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Call Number */}
                <FormField
                  control={form.control}
                  name="controlNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Call Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="SL-YYYY-XXXXXX (optional)" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Shelf Location */}
                <FormField
                  control={form.control}
                  name="shelfLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shelf Location
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., A-12-03" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Optional.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Book Format */}
                <FormField
                  control={form.control}
                  name="bookFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BookType className="h-4 w-4" />
                        Book Format
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "Hardcover",
                            "Paperback",
                            "E-book",
                            "Audiobook",
                            "Reference",
                            "Magazine",
                            "Journal",
                            "Other",
                          ].map((format) => (
                            <SelectItem key={format} value={format}>
                              {format}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Optional.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Acquisition Date */}
                <FormField
                  control={form.control}
                  name="acquisitionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Acquisition Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Optional.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Inventory Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Book Copies */}
                <FormField
                  control={form.control}
                  name="totalCopies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Add Book Copies
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Number of copies"
                          value={typeof field.value === 'number' ? field.value : ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          disabled={field.disabled}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total copies owned. Changing this adjusts Available Copies automatically.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Available Copies (read-only; managed by borrowing logic) */}
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium leading-none">
                    <Boxes className="h-4 w-4" />
                    Available Copies
                  </p>
                  <Input value={String(availableCopies ?? 0)} readOnly disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated automatically when copies are added and when books are borrowed or returned.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

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