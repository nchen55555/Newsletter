import { Skeleton } from "@/components/ui/skeleton";
import { ProjectsGrid } from "../projects-grid";

export function ProjectsTab({
  isExternalView,
  userProjects,
  loadingProjects,
  onOpenProjectsDialog,
  onProjectDeleted,
}: {
  isExternalView?: boolean;
  userProjects: string[];
  loadingProjects: boolean;
  onOpenProjectsDialog: () => void;
  onProjectDeleted: (url: string) => void;
}) {
  return (
    <>
        
    <div className="space-y-6 rounded-lg p-4">
      {!isExternalView && (
        <div className="text-sm text-neutral-400">
          Showcase the work you are most proud of. 
        </div>
      )}
        {loadingProjects ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : (
          <ProjectsGrid
            projectUrls={userProjects}
            onProjectDeleted={onProjectDeleted}
            showDelete={!isExternalView}
            onAddProject={onOpenProjectsDialog}
            showAddSkeleton={!isExternalView}
          />
        )}
      </div>
      </>
  );
}
