"use client";

import { ProjectCard } from "./project-card";

interface ProjectsGridProps {
  projectUrls: string[];
  className?: string;
  onProjectDeleted?: (projectUrl: string) => void;
  showDelete?: boolean;
}

export function ProjectsGrid({ projectUrls, className = "", onProjectDeleted, showDelete = false }: ProjectsGridProps) {
  if (!projectUrls || projectUrls.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No projects linked yet.
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {projectUrls.map((projectUrl, index) => (
        <ProjectCard
          key={`${projectUrl}-${index}`}
          projectUrl={projectUrl}
          onDelete={onProjectDeleted}
          showDelete={showDelete}
        />
      ))}
    </div>
  );
}