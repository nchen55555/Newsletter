// app/components/accordion.tsx
import React from "react";

export function Accordion({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={className}>
      <button
        className="flex items-center w-full text-left text-2xl font-semibold text-neutral-800 focus:outline-none"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="accordion-content"
        type="button"
      >
        <span className="flex-1">{title}</span>
        <svg
          className={`w-6 h-6 ml-2 transform transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && (
        <div id="accordion-content" className="mt-2">
          {children}
        </div>
      )}
    </div>
  );
}