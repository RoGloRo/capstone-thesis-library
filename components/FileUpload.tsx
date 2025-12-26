"use client";

import config from "@/lib/config";
import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  type: "image" | "video";
  accept: string;
  placeholder: string;
  folder: string;
  variant: "dark" | "light";
  onFileChange: (filePath: string | null) => void;
  value?: string;
}

const FileUpload = ({
  type,
  accept,
  placeholder,
  folder,
  variant,
  onFileChange,
  value,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<{ filePath: string | null }>({
    filePath: value ?? null,
  });
  const [progress, setProgress] = useState(0);

  const styles = {
    button:
      variant === "dark"
        ? "bg-dark-300"
        : "bg-light-600 border-gray-100 border",
    placeholder: variant === "dark" ? "text-light-100" : "text-slate-500",
    text: variant === "dark" ? "text-light-100" : "text-dark-400",
  };

  const onError = (error: unknown) => {
    console.error("Image upload error:", error);

    toast(`${type} upload failed`, {
      description: `Your ${type} could not be uploaded. Please try again.`,
    });
  };

  const onSuccess = (res: { filePath: string | null }) => {
    setFile(res);
    onFileChange(res.filePath ?? null);

    toast(`${type} uploaded successfully`, {
      description: `${res.filePath} uploaded successfully!`,
    });
  };

  const onValidate = (file: File) => {
    if (type === "image") {
      if (file.size > 20 * 1024 * 1024) {
        toast("File size too large", {
          description: "Please upload a file that is less than 20MB in size",
        });

        return false;
      }
    } else if (type === "video") {
      if (file.size > 50 * 1024 * 1024) {
        toast("File size too large", {
          description: "Please upload a file that is less than 50MB in size",
        });
        return false;
      }
    }

    return true;
  };

  const startFileDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const uploadFile = async (fileObj: File) => {
    try {
      setProgress(0);

      // get signed params from server
      const tokenRes = await fetch(`${config.env.apiEndpoint}/api/auth/imagekit`);
      if (!tokenRes.ok) {
        onError(new Error(`Auth token request failed: ${tokenRes.status}`));
        return;
      }
      const { signature, expire, token } = await tokenRes.json();

      const form = new FormData();
      form.append("file", fileObj);
      form.append("fileName", fileObj.name);
      if (folder) form.append("folder", folder);
      // Include publicKey for client uploads and signed params
      form.append("publicKey", config.env.imagekit.publicKey);
      form.append("signature", signature);
      form.append("expire", String(expire));
      form.append("token", token);
      form.append("useUniqueFileName", "true");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const percent = Math.round((ev.loaded / ev.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            // prefer absolute url then filePath or name
            const filePath = res.url || res.filePath || res.name || null;
            if (!filePath) {
              onError(new Error("Upload succeeded but response contains no file URL"));
              return;
            }
            const payload = { filePath };
            setFile(payload);
            onFileChange(filePath);
            onSuccess(payload);
          } catch (err) {
            onError(err);
          }
        } else {
          // include server response text for easier debugging
          const respText = xhr.responseText;
          console.error("ImageKit upload failed:", xhr.status, respText);
          onError(new Error(`Upload failed with status ${xhr.status}: ${respText}`));
        }
      };

      xhr.onerror = () => {
        onError(new Error("Upload network error"));
      };

      xhr.send(form);
    } catch (err) {
      onError(err);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!onValidate(f)) return;
          uploadFile(f);
        }}
      />

      <button className={cn("upload-btn", styles.button)} onClick={startFileDialog}>
        {/* hide upload icon when a file has already been uploaded */}
        {!file.filePath && (
          <Image src="/icons/upload.svg" alt="upload-icon" width={20} height={20} className="object-contain" />
        )}

        <p className={cn("text-base", styles.placeholder)}>{placeholder}</p>

        {file.filePath && (
          <p
            className={cn("upload-filename", styles.text)}
            style={{ 
              maxWidth: "calc(100vw - 4rem)", 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap" 
            }}
            title={file.filePath ?? undefined}
          >
            {file.filePath}
          </p>
        )}
      </button>

      {progress > 0 && progress !== 100 && (
        <div className="w-full rounded-full bg-green-200">
          <div className="progress" style={{ width: `${progress}%` }}>
            <span className="sm:hidden">{progress}%</span>
            <span className="hidden sm:inline">{progress}%</span>
          </div>
        </div>
      )}
      {file.filePath && type === "image" && (
        <>
          {/* Mobile responsive version */}
          <div className="w-full mt-4 sm:hidden">
            <div className="relative w-full aspect-[4/3] border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <Image
                src={file.filePath && file.filePath.startsWith("http") ? file.filePath : `${config.env.imagekit.urlEndpoint}${file.filePath}`}
                alt={file.filePath || "uploaded image"}
                fill
                className="object-contain p-2"
                sizes="100vw"
              />
            </div>
            <p className="text-xs text-center mt-2 text-gray-500">University ID Card Preview</p>
          </div>
          
          {/* Desktop version - original behavior */}
          <div className="hidden sm:block mt-4">
            <Image
              src={file.filePath && file.filePath.startsWith("http") ? file.filePath : `${config.env.imagekit.urlEndpoint}${file.filePath}`}
              alt={file.filePath || "uploaded image"}
              width={500}
              height={300}
              className="mx-auto"
            />
          </div>
        </>
      )}

      {file.filePath && type === "video" && (
        <div className="w-full mt-4 sm:max-w-none">
          <video 
            src={file.filePath.startsWith("http") ? file.filePath : `${config.env.imagekit.urlEndpoint}${file.filePath}`} 
            controls 
            className="w-full h-auto max-h-64 sm:max-h-96 sm:h-96 rounded-xl border border-gray-200 sm:border-0"
          />
        </div>
      )}
    </>
  );
};

export default FileUpload;
