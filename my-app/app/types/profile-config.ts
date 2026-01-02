export type ProfileSectionType = 
  | 'profile-picture'
  | 'bio' 
  | 'interests'
  | 'links'
  | 'timeline'
  | 'bookmarks'
  | 'projects'
  | 'referrals'
  | 'connections'
  | 'network';

export interface ProfileSectionPosition {
  column: number;     // Starting column (1-12)
  row: number;        // Starting row (1, 2, 3...)
  columnSpan: number; // How many columns to span (1-12)
  rowSpan: number;    // How many rows to span (usually 1)
}

export interface ProfileSection {
  type: ProfileSectionType;
  position: ProfileSectionPosition;
  visible: boolean;
  title?: string; // Optional custom title override
}

export interface ProfileLayout {
  gridColumns: number; // Always 12 for now
  sections: ProfileSection[];
}

export interface ProfileConfig {
  userId: number;
  layout: ProfileLayout;
  createdAt?: string;
  updatedAt?: string;
}

// Default configuration with core draggable sections only
// (network and referrals remain as tabs only)
export const DEFAULT_PROFILE_CONFIG: ProfileConfig = {
  userId: 0, // Will be set when creating config
  layout: {
    gridColumns: 12,
    sections: [
      // Row 1: Profile picture + Bio
      {
        type: 'profile-picture',
        position: { column: 1, row: 1, columnSpan: 3, rowSpan: 1 },
        visible: true
      },
      {
        type: 'bio', 
        position: { column: 4, row: 1, columnSpan: 9, rowSpan: 1 },
        visible: true
      },
      
      // Row 2: Interests full width
      {
        type: 'interests',
        position: { column: 1, row: 2, columnSpan: 12, rowSpan: 1 },
        visible: true
      },
      
      // Row 3: Links + Timeline
      {
        type: 'links',
        position: { column: 1, row: 3, columnSpan: 6, rowSpan: 1 },
        visible: true
      },
      {
        type: 'timeline',
        position: { column: 7, row: 3, columnSpan: 6, rowSpan: 1 },
        visible: true
      },
      
      // Row 4: Projects + Bookmarks  
      {
        type: 'projects',
        position: { column: 1, row: 4, columnSpan: 6, rowSpan: 1 },
        visible: true
      },
      {
        type: 'bookmarks', 
        position: { column: 7, row: 4, columnSpan: 6, rowSpan: 1 },
        visible: true
      },
      
      // Row 5: Connections full width
      {
        type: 'connections',
        position: { column: 1, row: 5, columnSpan: 12, rowSpan: 1 },
        visible: true
      }
    ]
  }
};

// Helper functions
export function createDefaultConfig(userId: number): ProfileConfig {
  return {
    ...DEFAULT_PROFILE_CONFIG,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getSectionByType(config: ProfileConfig, type: ProfileSectionType): ProfileSection | undefined {
  return config.layout.sections.find(section => section.type === type);
}

export function updateSectionPosition(
  config: ProfileConfig, 
  sectionType: ProfileSectionType, 
  newPosition: ProfileSectionPosition
): ProfileConfig {
  return {
    ...config,
    layout: {
      ...config.layout,
      sections: config.layout.sections.map(section => 
        section.type === sectionType 
          ? { ...section, position: newPosition }
          : section
      )
    },
    updatedAt: new Date().toISOString(),
  };
}

export function toggleSectionVisibility(
  config: ProfileConfig, 
  sectionType: ProfileSectionType
): ProfileConfig {
  return {
    ...config,
    layout: {
      ...config.layout,
      sections: config.layout.sections.map(section => 
        section.type === sectionType 
          ? { ...section, visible: !section.visible }
          : section
      )
    },
    updatedAt: new Date().toISOString(),
  };
}

// Validation helpers
export function isValidGridPosition(position: ProfileSectionPosition): boolean {
  const { column, row, columnSpan, rowSpan } = position;
  
  // Basic bounds checking
  if (column < 1 || column > 12) return false;
  if (row < 1) return false;
  if (columnSpan < 1 || columnSpan > 12) return false;
  if (rowSpan < 1) return false;
  
  // Check if section fits within grid
  if (column + columnSpan - 1 > 12) return false;
  
  return true;
}

export function detectCollisions(config: ProfileConfig): boolean {
  const { sections } = config.layout;
  
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const sectionA = sections[i];
      const sectionB = sections[j];
      
      // Skip invisible sections
      if (!sectionA.visible || !sectionB.visible) continue;
      
      // Check if sections overlap
      const aLeft = sectionA.position.column;
      const aRight = sectionA.position.column + sectionA.position.columnSpan - 1;
      const aTop = sectionA.position.row;
      const aBottom = sectionA.position.row + sectionA.position.rowSpan - 1;
      
      const bLeft = sectionB.position.column;
      const bRight = sectionB.position.column + sectionB.position.columnSpan - 1;
      const bTop = sectionB.position.row;
      const bBottom = sectionB.position.row + sectionB.position.rowSpan - 1;
      
      // Check for overlap
      const horizontalOverlap = aLeft <= bRight && aRight >= bLeft;
      const verticalOverlap = aTop <= bBottom && aBottom >= bTop;
      
      if (horizontalOverlap && verticalOverlap) {
        return true; // Collision detected
      }
    }
  }
  
  return false; // No collisions
}