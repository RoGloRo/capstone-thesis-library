"use client";

import { Search, Filter, X, User, Tag, SortAsc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchBarProps {
  currentSearch?: string;
  currentAuthor?: string;
  currentGenre?: string;
  currentSort?: string;
  availableAuthors: string[];
  availableGenres: string[];
}

export default function SearchBar({
  currentSearch,
  currentAuthor,
  currentGenre,
  currentSort,
  availableAuthors,
  availableGenres
}: SearchBarProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
      {/* Main Search Bar */}
      <form method="GET" className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            name="search"
            type="text"
            placeholder="Search for books, authors, or genres..."
            defaultValue={currentSearch}
            className="pl-10 pr-4 py-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15 focus:border-blue-400"
          />
        </div>
        
        {/* Filter Row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Author Filter */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <Select name="author" defaultValue={currentAuthor || "all"}>
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {availableAuthors.map((author) => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Genre Filter */}
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <Select name="genre" defaultValue={currentGenre || "all"}>
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {availableGenres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Sort Filter */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-gray-400" />
            <Select name="sort" defaultValue={currentSort || "title"}>
              <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="author">Author A-Z</SelectItem>
                <SelectItem value="rating">Rating ↓</SelectItem>
                <SelectItem value="genre">Genre A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Search Button */}
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          
          {/* Clear Filters */}
          {(currentSearch || currentAuthor || currentGenre) && (
            <Button 
              type="button" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => window.location.href = '/library'}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}