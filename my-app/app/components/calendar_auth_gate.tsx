'use client'
import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Calendar,Check } from "lucide-react";

interface CalendarAuthGateProps {
  children: React.ReactNode | ((hasCalendarAccess: boolean, isChecking: boolean) => React.ReactNode);
  onAuthRequired: () => void;
  dialogType?: 'apply' | 'early_interest';
  company?: string;
  person?: string;
}

export default function CalendarAuthGate({ children, onAuthRequired, dialogType, company, person }: CalendarAuthGateProps) {
  const [hasCalendarAccess, setHasCalendarAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkCalendarAccess();
  }, []);

  const checkCalendarAccess = async () => {
    try {
      setIsChecking(true);
      setAuthError(null);
      
      const response = await fetch('/api/google/calendar/interviews?domains=theniche.tech', {
        credentials: 'include',
      });
      
      if (response.ok) {
        setHasCalendarAccess(true);
      } else if (response.status === 400) {
        // User needs Google Calendar permissions
        setHasCalendarAccess(false);
      } else {
        throw new Error(`Calendar API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Calendar access check failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Unknown error');
      setHasCalendarAccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleGrantCalendarAccess = async () => {
    try {
      onAuthRequired(); // Notify parent component
      
      localStorage.setItem('googleAuthFlowType', 'calendar_auth');
      // Store current URL so we can redirect back to the same page
      const returnUrl = window.location.href;
      console.log('Calendar auth: storing return URL:', returnUrl);
      localStorage.setItem('calendarAuthReturnUrl', returnUrl);
      // Store dialog info to reopen after auth
      if (dialogType && company) {
        localStorage.setItem('calendarAuthDialogInfo', JSON.stringify({
          dialogType,
          company,
          person
        }));
      }
      
      console.log('Calendar auth: attempting OAuth with redirectTo:', returnUrl);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: returnUrl,
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      setAuthError('Failed to initiate Google authentication');
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Checking calendar permissions...</p>
        </div>
      </div>
    );
  }

  // Always render children, but pass calendar status
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(hasCalendarAccess === true, isChecking);
    }
    return children;
  };

  return (
    <>
      <div className="mb-10">
        <Label className="text-base font-medium">Calendar Integration</Label>
        <div className="mt-2">
          <Alert className="border-gray-200 bg-gray-50">
            <Calendar className="h-4 w-4 text-gray-600" />
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <AlertTitle className="text-gray-800">
                  {hasCalendarAccess ? 'Google Calendar Integrated' : 'Integrate with Google Calendar'}
                </AlertTitle>
                <p className="text-sm text-gray-700 mt-1">
                  {hasCalendarAccess 
                    ? 'Your calendar is integrated and ready for scheduling meeting invites.' 
                    : 'To apply, integrate your calendar so every email introduction we facilitate with this partner company can seamlessly turn into a calendar meeting invite.'
                  }
                </p>
              </div>
              {hasCalendarAccess ? (
                <div className="flex items-center ml-4">
                  <Check className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-700 font-medium">Completed</span>
                </div>
              ) : (
                <Button 
                  onClick={handleGrantCalendarAccess}
                  className="bg-gray-600 hover:bg-gray-700 text-white ml-4"
                  size="sm"
                >
                  Integrate
                </Button>
              )}
            </div>
          </Alert>

          {authError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>{authError}</AlertTitle>
            </Alert>
          )}
        </div>
      </div>
      {renderChildren()}
    </>
  );
}