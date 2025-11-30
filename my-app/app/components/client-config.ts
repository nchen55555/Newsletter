export function getClientConfig(clientId?: number, isCompany?: boolean) {
  if (isCompany) {
    return {
      title: "Candidate Profile",
      showTranscript: true,
      showResume: true,
      showSkillScores: true,
      showConnections: false,
      showReferrals: false,
      showBookmarks: true,
      showThreads: false,
      showProjects: true,
      showTimeline: true,
      highlightSections: ["bio", "projects", "bookmarks"],
    };
  }

  return {
    title: "Profile",
    showTranscript: true,
    showResume: true,
    showSkillScores: false,
    showConnections: true,
    showReferrals: true,
    showBookmarks: true,
    showThreads: true,
    showProjects: true,
    showTimeline: true,
    highlightSections: [],
  };
}

