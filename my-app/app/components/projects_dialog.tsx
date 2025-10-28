"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, Terminal } from "lucide-react";

interface ProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerElement?: React.ReactNode;
  title?: string;
  description?: string;
  onProjectAdded?: () => void;
}

export function ProjectsDialog({ 
  open, 
  onOpenChange, 
  triggerElement,
  title="Add Projects and Media",
  description="Showcase your work and achievements to your network.",
  onProjectAdded
}: ProjectsDialogProps) {
  const [projectUrl, setProjectUrl] = useState("");
  const [projectsFormError, setProjectsFormError] = useState<string | null>(null);
  const [projectsFormSuccess, setProjectsFormSuccess] = useState(false);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleProjectFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectsFormError(null);
    setProjectsFormSuccess(false);

    if (!projectUrl.trim()) {
      setProjectsFormError("Please enter a project URL.");
      return;
    }

    if (!validateUrl(projectUrl)) {
      setProjectsFormError("Please enter a valid URL.");
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          project_url: projectUrl.trim(),
          action: "add"
        }),
      });

      if (res.ok) {
        setProjectsFormSuccess(true);
        setProjectUrl("");
        // Notify parent to refresh projects list
        onProjectAdded?.();
        // Optionally close dialog after successful submission
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        const errorData = await res.json();
        setProjectsFormError(errorData.error || "Failed to add project. Please try again.");
      }
    } catch (error) {
      setProjectsFormError(`An error occurred. Please try again. ${error}`);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form state when closing
      setProjectsFormError(null);
      setProjectsFormSuccess(false);
      if (projectsFormSuccess) {
        // Only clear form if it was successfully submitted
        setProjectUrl("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerElement && (
        <DialogTrigger asChild>
          {triggerElement}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] p-8" showCloseButton={false}>
        <DialogHeader className="mb-8">
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-neutral-600 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleProjectFormSubmit}>
          <div className="grid gap-8">
            <div className="grid gap-2">
              <Label htmlFor="projectUrl" className="text-base font-medium">Project URL *</Label>
              <Input 
                id="projectUrl" 
                name="projectUrl"
                type="url"
                value={projectUrl} 
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://github.com/username/project or https://myproject.com"
                className="h-12 text-lg px-4" 
                required
              />
              <p className="text-sm text-neutral-500 mt-1">
                Add a link to your project, portfolio, GitHub repository, or any work you&apos;d like to showcase.
              </p>
            </div>
            {projectsFormSuccess && (
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle className="break-words whitespace-normal">
                  Project added successfully! It will appear in your profile.
                </AlertTitle>
              </Alert>
            )}
            {projectsFormError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>{projectsFormError}</AlertTitle>
              </Alert>
            )}
          </div>
          <DialogFooter className="mt-8 gap-4">
            <Button 
              type="submit" 
              className="h-12 px-8 text-lg"
              disabled={!projectUrl.trim()}
            >
              Add Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}