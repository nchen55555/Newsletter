import { StatusCheckinTriggerButton } from "../status-checkin-context";

export function TimelineTab({
    check_in_status,
    timeline_of_search,
    outreach_frequency,
    isExternalView,
  }: {
    check_in_status?: string | null;
    timeline_of_search?: string | null;
    outreach_frequency?: number | null;
    isExternalView?: boolean;
  }) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-neutral-900">Status Timeline</h3>
          {!isExternalView && <StatusCheckinTriggerButton />}
        </div>
  
        <div className="space-y-4">
          {/* Check-in Status */}
          {check_in_status && (
            <div className="bg-white rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Current Status</span>
              </div>
              <div className="mt-2">
                <span className="text-base text-neutral-900">
                  {(() => {
                    switch (check_in_status) {
                      case 'perusing':
                        return 'Just Perusing';
                      case 'open_to_outreach':
                        return 'Open to Founder Outreaches';
                      case 'request_intros':
                        return 'Curious about Intros';
                      case 'recommend_opportunities':
                        return 'Will Request Intros';
                      case 'actively_searching':
                        return 'Actively Searching for New Opportunities';
                      default:
                        return check_in_status;
                    }
                  })()}
                </span>
              </div>
            </div>
          )}
  
          {/* Timeline of Search */}
          {timeline_of_search && (
            <div className="bg-white rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Interview Timeline</span>
              </div>
              <div className="mt-2">
                <span className="text-base text-neutral-900">
                  {(() => {
                    switch (timeline_of_search) {
                      case 'immediate':
                        return 'Immediate - Ready to hop on an intro call and interview now';
                      case 'short_term':
                        return 'Short term - Ready to hop on an intro call but interview in about a month';
                      case 'medium_term':
                        return 'Medium term - Ready to hop on an intro call but actually interview in about 3-6 months';
                      case 'long_term':
                        return 'Long term - Ready to hop on an intro call but maybe hold off on an actual interview';
                      case 'flexible':
                        return 'Flexible - No timeline';
                      default:
                        return timeline_of_search;
                    }
                  })()}
                </span>
              </div>
            </div>
          )}
  
          {/* Outreach Frequency */}
          {typeof outreach_frequency === 'number' && (
            <div className="bg-white rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Outreach Preference</span>
              </div>
              <div className="mt-2">
                <span className="text-base text-neutral-900">
                  {outreach_frequency < 5 &&
                    'Prefers fewer than 5 outreaches per month'}
                  {outreach_frequency >= 5 &&
                    outreach_frequency <= 10 &&
                    'Can handle 5-10 outreaches per month'}
                  {outreach_frequency > 10 &&
                    outreach_frequency <= 20 &&
                    'Comfortable with 10-20 outreaches per month'}
                  {outreach_frequency > 20 &&
                    'Can actively respond to 20+ outreaches per month'}
                </span>
              </div>
            </div>
          )}
  
          {/* Show message if no timeline data available */}
          {!check_in_status &&
            !timeline_of_search &&
            (outreach_frequency === null || outreach_frequency === undefined) && (
              <div className="bg-neutral-50 rounded-lg p-6 text-center">
                <div className="text-sm text-neutral-500">
                  No status information available yet.
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }
  