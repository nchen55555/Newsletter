import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">Your Projects</h3>
        {!isExternalView && (
          <Button
            size="sm"
            className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
            onClick={onOpenProjectsDialog}
          >
            <Plus className="w-4 h-4" />
            Add Projects and Media
          </Button>
        )}
      </div>
      {loadingProjects ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : userProjects.length > 0 ? (
        <ProjectsGrid
          projectUrls={userProjects}
          onProjectDeleted={onProjectDeleted}
          showDelete={!isExternalView}
        />
      ) : (
        <div className="text-center py-8 text-neutral-500">
          {isExternalView
            ? "This user hasn't linked any projects yet."
            : "You haven't linked any projects yet."}
        </div>
      )}
    </div>
  );
}
