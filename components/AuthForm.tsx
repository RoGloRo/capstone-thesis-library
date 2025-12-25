"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ZodSchema } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FIELD_TYPES } from "@/constants";
import FileUpload from "./FileUpload";

interface Props {
  schema: ZodSchema<any>;
  defaultValues: Record<string, any>;
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
  type: "SIGN_IN" | "SIGN_UP";
}

function AuthForm({
  type,
  schema,
  defaultValues,
  onSubmit,
}: Props) {
  const router = useRouter();
  const isSignIn = type === "SIGN_IN";

  const form = useForm({
    defaultValues,
  });

  const fields = Object.keys(defaultValues);

  const handleSubmit = async (data: any) => {
    const result = await onSubmit(data);

    if (result.success) {
      toast("Success", {
        description: isSignIn
          ? "You have successfully signed in."
          : "Your account has been created successfully. Please check your email to verify your account.",
      });

      router.push("/");
    } else {
      toast("Error", {
        description: result.error ?? "An error occurred.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-white">
        {isSignIn
          ? "Welcome back to Smart Library"
          : "Create your library account"}
      </h1>

      <p className="text-light-100">
        {isSignIn
          ? "Access the vast collections of resources, and stay updated"
          : "Please complete all fields and upload a valid university ID to gain access to the library"}
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {fields.map((fieldName) => (
            <FormField
              key={fieldName}
              control={form.control}
              name={fieldName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">{fieldName}</FormLabel>

                  <FormControl>
                    {fieldName === "universityCard" ? (
                      <FileUpload type="image"
                        accept="image/*"
                        placeholder="Upload your ID"
                        folder="ids"
                        variant="dark" onFileChange={field.onChange} />
                    ) : (
                      <Input
                        {...field}
                        required
                        type={FIELD_TYPES[fieldName as keyof typeof FIELD_TYPES]}
                        className="form-input"
                      />
                    )}
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" className="form-btn">
            {isSignIn ? "Sign In" : "Sign Up"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-base font-medium">
        {isSignIn
          ? "New to Our Library? "
          : "Already have an account? "}
        <Link
          href={isSignIn ? "/sign-up" : "/sign-in"}
          className="font-bold text-primary"
        >
          {isSignIn ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}

export default AuthForm;
