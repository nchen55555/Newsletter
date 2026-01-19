"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type VisibilityLevel = 'public' | 'connections' | 'partners' | 'private';
export type VisibilityResults = {
  showBio: boolean;
  showInterests: boolean;
  showProjects: boolean;
  showLinks: boolean;
  showDocuments: boolean;
  showNetwork: boolean;
  showCompanies: boolean;
  showPriorities: boolean;
}

export const DEFAULT_VISIBILITY_SETTINGS = {
  bio: 'public' as VisibilityLevel,
  interests: 'public' as VisibilityLevel,
  projects: 'public' as VisibilityLevel,
  links: 'public' as VisibilityLevel,
  documents: 'connections' as VisibilityLevel,
  network: 'partners' as VisibilityLevel,
  companies: 'public' as VisibilityLevel,
  priorities: 'partners' as VisibilityLevel,
};


interface VisibilityOption {
  value: VisibilityLevel;
  label: string;
  description: string;
}

const visibilityOptions: VisibilityOption[] = [
  {
    value: 'public',
    label: 'Visible to Everyone',
    description: 'Everyone can see'
  },
  {
    value: 'connections',
    label: 'Visible to Network and Companies',
    description: 'Only your connections'  
  },
  {
    value: 'partners',
    label: 'Visible to Companies',
    description: 'Only partners'
  },
  {
    value: 'private',
    label: 'Visible to You Only',
    description: 'Only you'
  }
];

interface VisibilitySelectorProps {
  currentVisibility: VisibilityLevel;
  onVisibilityChange: (visibility: VisibilityLevel) => void;
  disabled?: boolean;
  allowedLevels?: VisibilityLevel[];
}

export function VisibilitySelector({
  currentVisibility,
  onVisibilityChange,
  disabled = false,
  allowedLevels
}: VisibilitySelectorProps) {
  const filteredOptions = allowedLevels
    ? visibilityOptions.filter(option => allowedLevels.includes(option.value))
    : visibilityOptions;

  return (
    <Select
      value={currentVisibility}
      onValueChange={onVisibilityChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-48 h-6 px-2 text-xs bg-transparent">
        <SelectValue placeholder="Select visibility" />
      </SelectTrigger>
      <SelectContent align="start" className="w-64">
        {filteredOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="cursor-pointer"
          >
            <div className="flex items-center">
              <div className="flex flex-col">
                <span className="font-small">{option.label}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}