import { ProfileData } from "@/app/types";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, Linkedin, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from 'react';
import { encodeSimple } from "@/app/utils/simple-hash";
import ProfileAvatar from "./profile_avatar";

// components/Editable.tsx 
// export function EditableInput({
//   value,
//   onChange,
//   placeholder,
//   className,
// }: {
//   value: string;
//   onChange: (v: string) => void;
//   placeholder?: string;
//   className?: string;
// }) {
//   return (
//     <input
//       className={`border rounded px-2 py-1 w-full ${className || ""}`}
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       placeholder={placeholder}
//     />
//   );
// }

// export function EditableBullets({
//   items,
//   onChange,
// }: {
//   items: string[] | undefined;
//   onChange: (next: string[]) => void;
// }) {
//   const nonEmpty = (s: string) => s.trim().length > 0;
//   const list = items ?? [];
//   const update = (i: number, v: string) => {
//     const next = [...list];
//     next[i] = v;
//     onChange(next.filter(nonEmpty));
//   };
//   const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
//   const add = () => onChange([...list, ""]);

//   return (
//     <div className="space-y-2">
//       {list.map((b, i) => (
//         <div key={i} className="flex gap-2">
//           <span className="mt-2">•</span>
//           <EditableInput value={b} onChange={(v) => update(i, v)} className="flex-1" />
//           <button onClick={() => remove(i)} className="text-sm text-red-600">Remove</button>
//         </div>
//       ))}
//       <button onClick={add} className="text-sm text-blue-600">+ Add bullet</button>
//     </div>
//   );
// }

// export function EditableJobCard({
//   job,
//   onChange,
//   onRemove,
//   editable,
// }: {
//   job: ExperienceJob;
//   onChange: (next: ExperienceJob) => void;
//   onRemove?: () => void;
//   editable: boolean;
// }) {
//   const dynamicKeys = Object.keys(job).filter((k) => k.endsWith("_bullets"));
//   const dynamicBullets = dynamicKeys.flatMap((k) => (Array.isArray(job[k]) ? (job[k] as string[]) : []));
//   const bullets = dynamicBullets.length ? dynamicBullets : job.summary_bullets || [];

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const set = (k: keyof ExperienceJob, v: any) => onChange({ ...job, [k]: v });

//   if (editable) {
//     return (
//       <article className="py-4 border-b last:border-b-0">
//         <div className="flex gap-2 justify-between">
//           <EditableInput value={job.company} onChange={(v) => set("company", v)} placeholder="Company" className="font-semibold" />
//           <button onClick={onRemove} className="text-sm text-red-600">Remove</button>
//         </div>
//         <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
//           <EditableInput value={job.role} onChange={(v) => set("role", v)} placeholder="Role / Title" />
//           <EditableInput
//             value={job.dates}
//             onChange={(v) => set("dates", cleanDateRange(v))}
//             placeholder="Dates (e.g., Jan 2024 – May 2024)"
//           />
//         </div>
//         <div className="mt-3">
//           <EditableBullets
//             items={bullets}
//             onChange={(next) => {
//               if (dynamicKeys.length) onChange({ ...job, [dynamicKeys[0]]: next });
//               else set("summary_bullets", next);
//             }}
//           />
//         </div>
//       </article>
//     );
//   }

//   // read mode (your original look)
//   return (
//     <article className="py-4 border-b last:border-b-0">
//       <header className="flex flex-col">
//         <h3 className="text-base font-semibold">{job.company || "—"}</h3>
//         <p className="text-sm text-gray-700">
//           {job.role}
//           {job.dates && <span className="text-gray-500 whitespace-nowrap"> · {cleanDateRange(job.dates)}</span>}
//         </p>
//       </header>
//       {bullets?.length > 0 && (
//         <ul className="list-disc pl-5 space-y-1 mt-2">
//           {bullets.map((b, i) => <li key={i}>{b}</li>)}
//         </ul>
//       )}
//     </article>
//   );
// }

// function EditableResume({ data, onSave }: { data: ParsedResumeData; onSave?: (data: ParsedResumeData) => Promise<void> }) {
//   const [edit, setEdit] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const { isSubscribed } = useSubscriptionContext();
//   const [localData, setLocalData] = useState(data);

//   const apply = (next: ParsedResumeData) => {
//     setLocalData(next);
//   };

//   const addJob = () => {
//     const blank: ExperienceJob = { company: "", role: "", dates: "", summary_bullets: [] };
//     apply({ ...localData, experience: [...localData.experience, blank] });
//   };
//   const removeJob = (idx: number) => {
//     const next = localData.experience.filter((_, i) => i !== idx);
//     apply({ ...localData, experience: next });
//   };
//   const updateJob = (idx: number, job: ExperienceJob) => {
//     const next = localData.experience.map((j, i) => (i === idx ? job : j));
//     apply({ ...localData, experience: next });
//   };

//   const addEdu = () => apply({ ...localData, education: [...(localData.education || []), ""] });
//   const updateEdu = (idx: number, v: string) => {
//     const next = [...localData.education];
//     next[idx] = v;
//     apply({ ...localData, education: next });
//   };
//   const removeEdu = (idx: number) =>
//     apply({ ...localData, education: localData.education.filter((_, i) => i !== idx) });

//   const handleSave = async () => {
//     if (!onSave) return;
//     setSaving(true);
//     try { await onSave(localData); } finally { setSaving(false); setEdit(false); }
//   };

//   return (
//     <div className="w-full">
//       {/* Resume Header with Edit Controls */}
//       <div className="flex justify-between items-center mb-6">
//         <h3 className="text-2xl font-semibold text-neutral-800">Resume</h3>
//         <div className="flex gap-2">
//           {isSubscribed && (
//             <Button variant="outline" size="sm" onClick={() => setEdit((e) => !e)}>
//               {edit ? (
//                 <>  
//                   <X className="w-4 h-4 mr-2" />
//                   Cancel
//                 </>
//               ) : (
//                 <>
//                   <Edit className="w-4 h-4 mr-2" />
//                   Edit
//                 </>
//               )}
//             </Button>
//           )}
//           {edit && (
//             <Button size="sm" onClick={handleSave} disabled={saving}>
//               <Save className="w-4 h-4 mr-2" />
//               {saving ? "Saving…" : "Save"}
//             </Button>
//           )}
//         </div>
//       </div>
      
//       {/* Education */}
//       <section className="mb-8">
//         <div className="flex items-center justify-between">
//           <h4 className="text-xl font-semibold tracking-tight">Education</h4>
//           {edit && <button onClick={addEdu} className="text-sm text-blue-600">+ Add line</button>}
//         </div>

//         {!edit ? (
//           <ul className="mt-3 space-y-2">
//             {localData.education.map((line, i) => (
//               <li key={i} className="flex"><span className="mr-2">•</span><span>{line}</span></li>
//             ))}
//           </ul>
//         ) : (
//           <div className="mt-3 space-y-2">
//             {localData.education.map((line, i) => (
//               <div key={i} className="flex gap-2 items-center">
//                 <EditableInput value={line} onChange={(v) => updateEdu(i, v)} />
//                 <button onClick={() => removeEdu(i)} className="text-sm text-red-600">Remove</button>
//               </div>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Experience */}
//       <section>
//         <div className="flex items-center justify-between">
//           <h4 className="text-xl font-semibold tracking-tight mb-2">Experience</h4>
//           {edit && <button onClick={addJob} className="text-sm text-blue-600">+ Add job</button>}
//         </div>

//         {localData.experience.map((job, i) => (
//           <EditableJobCard
//             key={i}
//             job={job}
//             editable={edit}
//             onChange={(next) => updateJob(i, next)}
//             onRemove={edit ? () => removeJob(i) : undefined}
//           />
//         ))}
//       </section>
//     </div>
//   );
// }

// function cleanDateRange(s?: string) {
//   if (!s) return "";
//   return s
//     .replace(/\s*-\s*/g, " – ") // hyphen → en dash
//     .replace(/\s*–\s*/g, " – ")
//     .replace(/\s{2,}/g, " ")
//     .trim();
// }

export function ExternalProfile(props: ProfileData) {
  const [activeTab, setActiveTab] = useState<"partner" | "niche">("partner");
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header (minimal) */}
      <div className="flex items-start justify-between mb-10">
        <div className="pt-4 flex-1">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900">
            Your Profile
          </h1>
          <p className="mt-2 text-sm md:text-base text-neutral-600">
            Customize how your profile appears to partner companies or your Niche network.
          </p>
        </div>
        <Button
          onClick={() => router.push(`/edit_profile/${encodeSimple(props.id)}`)}
          className="mt-2"
          variant="ghost"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="flex border-b border-neutral-200 mb-8">
          <button
              onClick={() => setActiveTab('partner')}
              className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
                  activeTab === 'partner'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
          >
              To Companies on The Niche
          </button>
          <button
              onClick={() => setActiveTab('niche')}
              className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
                  activeTab === 'niche'
                      ? 'border-black text-black'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
          >
              To Your Niche Network
          </button>
      </div>

      {/* Partner View */}
      {activeTab === "partner" && (
        <section className="space-y-8">
          {/* Header (no gradient, no outline) */}
          <div className="flex items-center gap-4">
            <ProfileAvatar
              name={`${props.first_name || ''} ${props.last_name || ''}`.trim() || 'User'}
              imageUrl={props.profile_image_url || undefined}
              size={96}
              editable={false}
              className="w-24 h-24 rounded-full"
            />

            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-neutral-900 truncate">
                {props.first_name} {props.last_name}
              </h2>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                {props.status && (
                  <span className="text-neutral-600">{props.status}</span>
                )}
                {props.is_public_profile && (
                  <span className="text-neutral-500">· Public</span>
                )}
                {props.newsletter_opt_in && (
                  <span className="text-neutral-500">· Newsletter Opt-in</span>
                )}
              </div>
            </div>
          </div>

          {props.bio && props.bio.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900">Bio</h3>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                {props.bio}
                </div>
              </div>
            </div>
          )}

          {/* Interests */}
          {props.interests && props.interests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900">Interests</h3>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                  {props.interests}
                </div>
              </div>
            </div>
          )}

          {/* Interests */}
          {/* {props.generated_interest_profile && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900">Analysis From The Niche</h3>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                  {props.generated_interest_profile}
                </div>
              </div>
            </div>
          )} */}

          {/* Links and Documents */}
          {(props.linkedin_url || props.personal_website || props.transcript_url || props.resume_url) && (
            <div className="flex flex-wrap gap-3">
              {props.linkedin_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {props.personal_website && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.personal_website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              {props.transcript_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.transcript_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Transcript
                  </a>
                </Button>
              )}
              {props.resume_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Resume
                  </a>
                </Button>
              )}
            </div>
          )}
          <div className="text-center text-sm text-neutral-600 py-8">
            Company Profile
            <div className="mt-2 text-neutral-500">
              A simplified view for partner companies on the Niche to review your profile with verified and additional information.
            </div>
          </div>
        </section>
      )}

      {/* Network View */}
      {activeTab === "niche" && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              name={`${props.first_name || ''} ${props.last_name || ''}`.trim() || 'User'}
              imageUrl={props.profile_image_url || undefined}
              size={96}
              editable={false}
              className="w-24 h-24 rounded-full"
            />

            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-neutral-900 truncate">
                {props.first_name} {props.last_name}
              </h2>
              <div className="mt-1 text-xs text-neutral-600">
                {props.status}
                {props.is_public_profile && " · Public Profile"}
              </div>
            </div>
          </div>
          {props.bio && props.bio.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900">Bio</h3>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                {props.bio}
                </div>
              </div>
            </div>
          )}

          {/* Links and Documents */}
          {(props.linkedin_url || props.personal_website || props.transcript_url || props.resume_url) && (
            <div className="flex flex-wrap gap-3">
              {props.linkedin_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {props.personal_website && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.personal_website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Interests */}
          {props.interests && props.interests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900">Interests</h3>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                  {props.interests}
                </div>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-neutral-600 py-8">
            Community Profile
            <div className="mt-2 text-neutral-500">
              A simplified view for Niche members highlighting your basics and interests.
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
