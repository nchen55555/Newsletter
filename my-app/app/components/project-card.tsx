"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, GitBranch, Globe, FileCode, Trash2 } from "lucide-react";

interface ProjectCardProps {
  projectUrl: string;
  onDelete?: (projectUrl: string) => void;
  showDelete?: boolean;
}

export function ProjectCard({ projectUrl, onDelete, showDelete = false }: ProjectCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract domain for fallback display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Invalid URL';
    }
  };

  // Get domain-specific icon
  const getDomainIcon = (url: string) => {
    const domain = getDomain(url).toLowerCase();
    
    if (domain.includes('github')) {
      return <GitBranch className="mx-auto h-8 w-8 text-neutral-400" />;
    } else if (domain.includes('gitlab') || domain.includes('bitbucket')) {
      return <FileCode className="mx-auto h-8 w-8 text-neutral-400" />;
    } else {
      return <Globe className="mx-auto h-8 w-8 text-neutral-400" />;
    }
  };

  // Fetch thumbnail URL from our API
  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        setIsLoadingThumbnail(true);
        const response = await fetch(`/api/screenshot?url=${encodeURIComponent(projectUrl)}`);
        const data = await response.json();
        
        if (response.ok && data.imageUrl) {
          setThumbnailUrl(data.imageUrl);
        } else {
          setImageError(true);
        }
      } catch (error) {
        console.error('Error fetching thumbnail:', error);
        setImageError(true);
      } finally {
        setIsLoadingThumbnail(false);
      }
    };

    fetchThumbnail();
  }, [projectUrl]);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          project_url: projectUrl,
          action: "remove"
        }),
      });

      if (response.ok) {
        onDelete(projectUrl);
      } else {
        console.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Delete Button */}
      {showDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
          title="Delete project"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
      
      {/* Screenshot/Preview */}
      <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
        {!imageError && thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={`Preview of ${getDomain(projectUrl)}`}
            width={400}
            height={300}
            className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          // Fallback when image fails to load - show domain-specific icons
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <div className="text-center">
              {getDomainIcon(projectUrl)}
              <p className="text-sm font-medium text-neutral-600 mt-2">{getDomain(projectUrl)}</p>
            </div>
          </div>
        )}
        
        {/* Loading skeleton */}
        {(isLoadingThumbnail || (!imageLoaded && !imageError && thumbnailUrl)) && (
          <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
        )}
      </div>

      {/* Project Info */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {getDomain(projectUrl)}
            </p>
            <p className="text-xs text-neutral-500 truncate mt-1">
              {projectUrl}
            </p>
          </div>
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 flex-shrink-0 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4 text-neutral-600" />
          </a>
        </div>
      </div>
    </div>
  );
}