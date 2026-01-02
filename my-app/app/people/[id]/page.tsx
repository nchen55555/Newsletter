
"use client";
import { useEffect, useState } from "react";
import { ProfileData } from "@/app/types";
import { decodeSimple } from "../../utils/simple-hash";
import { DEFAULT_VISIBILITY_SETTINGS, VisibilityLevel } from '../../components/visibility';
import { ExternalProfile } from "@/app/components/external_profile";
import { useMemo } from 'react';

export default function PeopleProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'connected' | 'pending_sent' | 'requested'>('none');

  const shouldShowSection = (
    visibilityLevel: VisibilityLevel,
    connectionStatus: 'connected' | 'none' | 'pending_sent' | 'requested'
  ): boolean => {
    switch (visibilityLevel) {
      case 'public':
        return true; // Always visible
      case 'connections':
        return connectionStatus === 'connected'; // Only if connected
      case 'partners':
        return false; // Not shown on people page (only for company views)
      case 'private':
        return false; // Never shown to others
      default:
        return false;
    }
  }

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/get_profile', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Calculate connection status when data and currentUserId are available
  useEffect(() => {
    if (!data || !currentUserId) {
      setConnectionStatus('none');
      return;
    }

    // Check if current user is in connections_new (they are connected)
    if (data.connections_new?.some(conn => conn.connect_id === currentUserId)) {
      setConnectionStatus('connected');
      return;
    }

    // Check if current user is in pending_connections_new (requested - profile sent request to current user)
    if (data.pending_connections_new?.some(conn => conn.connect_id === currentUserId)) {
      setConnectionStatus('requested');
      return;
    }

    // Check if current user is in requested_connections_new (pending_sent - current user sent request to profile)
    if (data.requested_connections_new?.some(conn => conn.connect_id === currentUserId)) {
      setConnectionStatus('pending_sent');
      return;
    }

    setConnectionStatus('none');
  }, [data, currentUserId]);

  useEffect(() => {
    fetchProfileData();
  }, [params]);

  const visibilitySettings = useMemo(() => ({
    bio: data?.visibility_profile_settings?.bio || DEFAULT_VISIBILITY_SETTINGS.bio,
    interests: data?.visibility_profile_settings?.interests || DEFAULT_VISIBILITY_SETTINGS.interests,
    projects: data?.visibility_profile_settings?.projects || DEFAULT_VISIBILITY_SETTINGS.projects,
    links: data?.visibility_profile_settings?.links || DEFAULT_VISIBILITY_SETTINGS.links,
    network: data?.visibility_profile_settings?.network || DEFAULT_VISIBILITY_SETTINGS.network,
    documents: data?.visibility_profile_settings?.documents || DEFAULT_VISIBILITY_SETTINGS.documents,
    companies: data?.visibility_profile_settings?.companies || DEFAULT_VISIBILITY_SETTINGS.companies,
    priorities: data?.visibility_profile_settings?.priorities || DEFAULT_VISIBILITY_SETTINGS.priorities,
  }), [data]);

  const visibilityResults = useMemo(() => ({
    showBio: shouldShowSection(visibilitySettings.bio as VisibilityLevel, connectionStatus),
    showInterests: shouldShowSection(visibilitySettings.interests as VisibilityLevel, connectionStatus),
    showProjects: shouldShowSection(visibilitySettings.projects as VisibilityLevel, connectionStatus),
    showLinks: shouldShowSection(visibilitySettings.links as VisibilityLevel, connectionStatus),
    showNetwork: shouldShowSection(visibilitySettings.network as VisibilityLevel, connectionStatus),
    showDocuments: shouldShowSection(visibilitySettings.documents as VisibilityLevel, connectionStatus),
    showCompanies: shouldShowSection(visibilitySettings.companies as VisibilityLevel, connectionStatus),
    showPriorities: shouldShowSection(visibilitySettings.priorities as VisibilityLevel, connectionStatus),
  }), [visibilitySettings, connectionStatus]);

  const fetchProfileData = async () => {
    const { id } = await params;
    
    // Decode the hashed ID to get the actual profile ID
    const actualId = decodeSimple(id);
    if (!actualId) {
      console.error('Invalid profile ID hash:', id);
      setData(null);
      return;
    }
    
    // Fetch profile data using the external profile API
    const apiUrl = `/api/get_external_profile?id=${actualId}`;
      
    try {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const profileData = await res.json();
          setData(profileData);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setData(null);
      }
    };
  

  return (
    <>
   {data && <ExternalProfile {...data} visibilityResults={visibilityResults} isExternalView={true} onRefresh={fetchProfileData} />}
   </>
  );
}
