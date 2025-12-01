"use client";
import React from "react";
import config from "@/lib/config";

interface BookVideoProps {
  videoUrl: string;
  // Optional: allow setting width/height without triggering transformations
  width?: number;
  height?: number;
  className?: string;
}

const BookVideo: React.FC<BookVideoProps> = ({
  videoUrl,
  width = 720,
  height = 480,
  className = "w-full rounded-xl",
}) => {
  // Use the provided URL if it's absolute, otherwise prepend ImageKit URL endpoint
  const src =
    videoUrl.startsWith("http") ? videoUrl : `${config.env.imagekit.urlEndpoint}${videoUrl}`;

  return (
    <video
      src={src}
      controls
      width={width}
      height={height}
      className={className}
    />
  );
};

export default BookVideo;
