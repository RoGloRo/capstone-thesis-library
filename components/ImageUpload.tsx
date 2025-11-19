"use client";

import React, { useRef, useState } from "react";
import { ImageKitProvider } from "@imagekit/next";
import config from "@/lib/config";
import { toast } from "sonner";

const {
  env: {
    imagekit: { publicKey, urlEndpoint },
    apiEndpoint,
  },
} = config;

const authenticator = async () => {
  try {
    const response = await fetch(`${apiEndpoint}/api/auth/imagekit`);

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(`Authentication error: ${error.message}`);
  }
};

const ImageUpload = ({
  onFileChange,
}: {
  onFileChange: (filePath: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    try {
      const auth = await authenticator();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("token", auth.token);
      formData.append("signature", auth.signature);
      formData.append("expire", auth.expire.toString());
      formData.append("publicKey", publicKey);

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const data = await uploadRes.json();

      setUploadedUrl(data.url);
      onFileChange(data.filePath);

      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
      console.error(err);
    }
  };

  return (
    <ImageKitProvider publicKey={publicKey} urlEndpoint={urlEndpoint}>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={inputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />

      <button
        className="upload-btn"
        onClick={(e) => {
          e.preventDefault();
          inputRef.current?.click();
        }}
      >
        <img
          src="/icons/upload.svg"
          alt="upload-icon"
          width={20}
          height={20}
          className="object-contain"
        />
        <p className="text-base text-light-100">Upload a file</p>
      </button>

      {uploadedUrl && (
        <img
          src={uploadedUrl}
          alt="Uploaded Image"
          className="mt-4 w-500 h-500 object-cover rounded-md"
        />
      )}
    </ImageKitProvider>
  );
};

export default ImageUpload;
