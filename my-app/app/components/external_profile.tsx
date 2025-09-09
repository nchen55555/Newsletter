import { ProfileData } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, X, Save, ExternalLink, FileText } from "lucide-react";
import { useEffect, useCallback } from 'react';
import {ExperienceJob, ParsedResumeData} from "@/app/types";
import { useState } from 'react';
import { useSubscriptionContext } from "@/app/components/subscription_context";

// components/Editable.tsx 
export function EditableInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      className={`border rounded px-2 py-1 w-full ${className || ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function EditableBullets({
  items,
  onChange,
}: {
  items: string[] | undefined;
  onChange: (next: string[]) => void;
}) {
  const nonEmpty = (s: string) => s.trim().length > 0;
  const list = items ?? [];
  const update = (i: number, v: string) => {
    const next = [...list];
    next[i] = v;
    onChange(next.filter(nonEmpty));
  };
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, ""]);

  return (
    <div className="space-y-2">
      {list.map((b, i) => (
        <div key={i} className="flex gap-2">
          <span className="mt-2">•</span>
          <EditableInput value={b} onChange={(v) => update(i, v)} className="flex-1" />
          <button onClick={() => remove(i)} className="text-sm text-red-600">Remove</button>
        </div>
      ))}
      <button onClick={add} className="text-sm text-blue-600">+ Add bullet</button>
    </div>
  );
}

export function EditableJobCard({
  job,
  onChange,
  onRemove,
  editable,
}: {
  job: ExperienceJob;
  onChange: (next: ExperienceJob) => void;
  onRemove?: () => void;
  editable: boolean;
}) {
  const dynamicKeys = Object.keys(job).filter((k) => k.endsWith("_bullets"));
  const dynamicBullets = dynamicKeys.flatMap((k) => (Array.isArray(job[k]) ? (job[k] as string[]) : []));
  const bullets = dynamicBullets.length ? dynamicBullets : job.summary_bullets || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (k: keyof ExperienceJob, v: any) => onChange({ ...job, [k]: v });

  if (editable) {
    return (
      <article className="py-4 border-b last:border-b-0">
        <div className="flex gap-2 justify-between">
          <EditableInput value={job.company} onChange={(v) => set("company", v)} placeholder="Company" className="font-semibold" />
          <button onClick={onRemove} className="text-sm text-red-600">Remove</button>
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <EditableInput value={job.role} onChange={(v) => set("role", v)} placeholder="Role / Title" />
          <EditableInput
            value={job.dates}
            onChange={(v) => set("dates", cleanDateRange(v))}
            placeholder="Dates (e.g., Jan 2024 – May 2024)"
          />
        </div>
        <div className="mt-3">
          <EditableBullets
            items={bullets}
            onChange={(next) => {
              if (dynamicKeys.length) onChange({ ...job, [dynamicKeys[0]]: next });
              else set("summary_bullets", next);
            }}
          />
        </div>
      </article>
    );
  }

  // read mode (your original look)
  return (
    <article className="py-4 border-b last:border-b-0">
      <header className="flex flex-col">
        <h3 className="text-base font-semibold">{job.company || "—"}</h3>
        <p className="text-sm text-gray-700">
          {job.role}
          {job.dates && <span className="text-gray-500 whitespace-nowrap"> · {cleanDateRange(job.dates)}</span>}
        </p>
      </header>
      {bullets?.length > 0 && (
        <ul className="list-disc pl-5 space-y-1 mt-2">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
    </article>
  );
}

 // components/EditableResume.tsx

function EditableResume({ data, onSave }: { data: ParsedResumeData; onSave?: (data: ParsedResumeData) => Promise<void> }) {
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isSubscribed } = useSubscriptionContext();
  const [localData, setLocalData] = useState(data);

  const apply = (next: ParsedResumeData) => {
    setLocalData(next);
  };

  const addJob = () => {
    const blank: ExperienceJob = { company: "", role: "", dates: "", summary_bullets: [] };
    apply({ ...localData, experience: [...localData.experience, blank] });
  };
  const removeJob = (idx: number) => {
    const next = localData.experience.filter((_, i) => i !== idx);
    apply({ ...localData, experience: next });
  };
  const updateJob = (idx: number, job: ExperienceJob) => {
    const next = localData.experience.map((j, i) => (i === idx ? job : j));
    apply({ ...localData, experience: next });
  };

  const addEdu = () => apply({ ...localData, education: [...(localData.education || []), ""] });
  const updateEdu = (idx: number, v: string) => {
    const next = [...localData.education];
    next[idx] = v;
    apply({ ...localData, education: next });
  };
  const removeEdu = (idx: number) =>
    apply({ ...localData, education: localData.education.filter((_, i) => i !== idx) });

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try { await onSave(localData); } finally { setSaving(false); setEdit(false); }
  };

  return (
    <div className="w-full">
      {/* Resume Header with Edit Controls */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-neutral-800">Resume</h3>
        <div className="flex gap-2">
          {isSubscribed && (
            <Button variant="outline" size="sm" onClick={() => setEdit((e) => !e)}>
              {edit ? (
                <>  
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          )}
          {edit && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      </div>
      
      {/* Education */}
      <section className="mb-8">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold tracking-tight">Education</h4>
          {edit && <button onClick={addEdu} className="text-sm text-blue-600">+ Add line</button>}
        </div>

        {!edit ? (
          <ul className="mt-3 space-y-2">
            {localData.education.map((line, i) => (
              <li key={i} className="flex"><span className="mr-2">•</span><span>{line}</span></li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 space-y-2">
            {localData.education.map((line, i) => (
              <div key={i} className="flex gap-2 items-center">
                <EditableInput value={line} onChange={(v) => updateEdu(i, v)} />
                <button onClick={() => removeEdu(i)} className="text-sm text-red-600">Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Experience */}
      <section>
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold tracking-tight mb-2">Experience</h4>
          {edit && <button onClick={addJob} className="text-sm text-blue-600">+ Add job</button>}
        </div>

        {localData.experience.map((job, i) => (
          <EditableJobCard
            key={i}
            job={job}
            editable={edit}
            onChange={(next) => updateJob(i, next)}
            onRemove={edit ? () => removeJob(i) : undefined}
          />
        ))}
      </section>
    </div>
  );
}

function cleanDateRange(s?: string) {
  if (!s) return "";
  return s
    .replace(/\s*-\s*/g, " – ") // hyphen → en dash
    .replace(/\s*–\s*/g, " – ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function ExternalProfile(props: ProfileData) {
    const [resumeData, setResumeData] = useState<ParsedResumeData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };


    const getResumeParsedData = useCallback(async () => {
        if (!props.resume_url) return;
        if(props.parsed_resume_json || props.parsed_resume_json != "") {
            function asParsedResume(value: unknown): ParsedResumeData | null {
                if (!value) return null;
              
                // value is a string → parse it
                if (typeof value === "string") {
                  try {
                    return JSON.parse(value) as ParsedResumeData;
                  } catch (e) {
                    console.error("Invalid resume JSON", e);
                    return null;
                  }
                }
                // value is already an object → assert type
                return value as ParsedResumeData;
            }
            
            // usage
            const parsed = asParsedResume(props.parsed_resume_json);
            if (parsed) setResumeData(parsed);
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await fetch(`/api/gemini_format`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  resume_url: props.resume_url,
                })
              }
            );
            if (response.ok) {
                const data = await response.json();
                await fetch('/api/post_parsed_resume', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    parsed_resume_json: data.data,
                  })
                })
                setResumeData(data.data);
            } else {
                console.error('Failed to fetch parsed resume data');
            }
        } catch (error) {
            console.error('Error fetching parsed resume data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [props.resume_url, props.parsed_resume_json]);

    useEffect(() => {
        getResumeParsedData();
    }, [getResumeParsedData]);

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Page Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    External Profile for Partner Companies
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
              Click below to view the external profile we send to our partner companies based on the information you submitted! Feel free to edit any part you see fit. 
                </p>
            </div>

            {/* Single unified card with all content */}
            <Card className="overflow-hidden p-0">
                {/* Header with rainbow gradient */}
                <div className="bg-gradient-to-r from-pink-100 via-purple-100 via-blue-100 via-green-100 via-yellow-100 to-orange-100 p-6 rounded-t-lg">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg">
                            <AvatarImage 
                                src={props.profile_image_url} 
                                alt={`${props.first_name} ${props.last_name}`}
                                className="object-cover"
                            />
                            <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                {getInitials(props.first_name, props.last_name)}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {props.first_name} {props.last_name}
                            </h1>
                            {/* {props.email && (
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">{props.email}</span>
                                </div>
                            )} */}
                            <div className="flex gap-2 mt-2">
                                <span className="px-2 py-1 text-xs font-medium bg-white/70 text-gray-800 rounded-full backdrop-blur-sm">
                                    {props.status}
                                </span>
                                {props.is_public_profile && (
                                    <span className="px-2 py-1 text-xs font-medium bg-white/70 text-gray-800 rounded-full backdrop-blur-sm">
                                        Public
                                    </span>
                                )}
                                {props.newsletter_opt_in && (
                                    <span className="px-2 py-1 text-xs font-medium bg-white/70 text-gray-800 rounded-full backdrop-blur-sm">
                                        Newsletter Opt-in
                                    </span>
                                )}
                            </div>
                        </div>

                        
                    </div>

                    {/* Bio - styled as a featured quote */}
                    {props.bio && props.bio.length > 20 && (
                        <div className="mt-6 pt-4 border-t border-white/30">
                            <div className="relative">
                                <div className="text-4xl text-white/40 font-serif absolute -top-2 -left-1">&quot;</div>
                                <blockquote className="pl-6 pr-2">
                                    <p className="text-gray-800 text-base italic leading-relaxed font-medium">
                                        {props.bio}
                                    </p>
                                </blockquote>
                                <div className="text-4xl text-white/40 font-serif absolute -bottom-6 right-0">&quot;</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Documents */}
              {(props.transcript_url || props.resume_url) && (
                <div className="border-t border-gray-100 p-6">
                  <h3 className="text-2xl font-semibold text-neutral-800 mb-4">Additional Documents</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {props.transcript_url && (
                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Academic Transcript</h4>
                            <p className="text-sm text-gray-600">Official academic record</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={props.transcript_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {props.resume_url && (
                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Resume</h4>
                            <p className="text-sm text-gray-600">Original PDF resume</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={props.resume_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

                {/* Resume Content - seamlessly connected */}
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            <span className="ml-3 text-gray-600">Parsing resume...</span>
                        </div>
                    ) : resumeData ? (
                        <div className="p-6">
                                            

                       <EditableResume
                          data={resumeData}
                          onSave={async (next) => {
                            const res = await fetch("/api/post_parsed_resume", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ parsed_resume_json: next }) // send object directly
                            });
                            const json = await res.json();
                            if (!res.ok) throw new Error(json.error || "Save failed");
                          }}
                        />
                        </div>
                    ) : props.resume_url ? (
                        <div className="text-center py-8 px-6">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">Unable to parse resume content</p>
                            <Button variant="outline" size="sm" className="mt-3" asChild>
                                <a href={props.resume_url} target="_blank" rel="noopener noreferrer">
                                    View Original PDF
                                </a>
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-8 px-6">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No resume uploaded</p>
                        </div>
                    )}

                    
                </CardContent>
            </Card>
        </div>
    );
}