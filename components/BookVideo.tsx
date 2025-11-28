"use client";
import React from "react";
import config from "@/lib/config";

const BookVideo = ({ videoUrl }: { videoUrl: string }) => {
  const src = videoUrl && videoUrl.startsWith("http") ? videoUrl : `${config.env.imagekit.urlEndpoint}${videoUrl}`;

  return (
    <video src={src} controls className="w-full rounded-xl" />
  );
};

export default BookVideo;