"use client";

import { ProjectCard } from "./project-card";
import { Plus } from "lucide-react";

interface ProjectsGridProps {
  projectUrls: string[];
  className?: string;
  onProjectDeleted?: (projectUrl: string) => void;
  showDelete?: boolean;
  onAddProject?: () => void;
  showAddSkeleton?: boolean;
}

export function ProjectsGrid({ projectUrls, className = "", onProjectDeleted, showDelete = false, onAddProject, showAddSkeleton = false }: ProjectsGridProps) {
  // If no projects and no add skeleton, show empty state
  if ((!projectUrls || projectUrls.length === 0) && !showAddSkeleton) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No projects linked yet.
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Existing projects */}
      {projectUrls?.map((projectUrl, index) => (
        <ProjectCard
          key={`${projectUrl}-${index}`}
          projectUrl={projectUrl}
          onDelete={onProjectDeleted}
          showDelete={showDelete}
        />
      ))}
      
      {/* Add project skeleton - same size as project cards */}
      {showAddSkeleton && onAddProject && (
        <div 
          onClick={onAddProject}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors aspect-[4/3] flex flex-col items-center justify-center"
        >
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <Plus className="w-8 h-8 text-gray-400" />
            <div className="text-sm font-medium text-gray-600">Add Projects</div>
            <div className="text-xs text-gray-500">Click to add projects</div>
          </div>
        </div>
      )}
    </div>
  );
}