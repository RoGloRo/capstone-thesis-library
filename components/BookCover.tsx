//import { Props } from "next/script";
"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";
import BookCoverSvg from "./BookCoverSvg";
import config from "@/lib/config";

type BookCoverVariant = "extraSmall" | "small" | "medium" | "regular" | "wide";

const variantStyles: Record<BookCoverVariant, string > = {
  extraSmall: "book-cover_extra_small",
  small: "book-cover_small",
  medium: "book-cover_medium",
  regular: "book-cover_regular",
  wide: "book-cover_wide",
}

interface Props {
  className: string
  variant?: BookCoverVariant;
  coverColor: string 
  coverImage: string
}

const BookCover = ({ 
  className, 
  variant = "regular",
  coverColor = "#012B48",
  coverImage = "https://placehold.co/400x600.png",
}: Props) => {
  return <div className={cn("relative transition-all duration-300", variantStyles[variant], className,)}>

   <BookCoverSvg coverColor={coverColor} />

    <div className="absolute z-10" style={{left: "12%", width: "87.5%", height: "88%"}}>
      {/** Build a full URL when the stored coverImage is a relative ImageKit filePath */}
      {(() => {
        const src =
          coverImage && (coverImage.startsWith("http://") || coverImage.startsWith("https://"))
            ? coverImage
            : `${config.env.imagekit.urlEndpoint}${coverImage}`;

        return (
          <Image src={src} alt="Book cover" fill className="rounded-sm object-fill" loading="lazy" />
        );
      })()}
    </div>
  </div>
}
export default BookCover;