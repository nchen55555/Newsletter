import React from "react";

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export function ExternalLink({ href, children, className = "", ...props }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 underline text-neutral-800 hover:text-blue-700 transition-colors ${className}`}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 20"
        className="w-4 h-4 inline-block ml-0.5 align-text-bottom text-neutral-500"
        aria-hidden="true"
        focusable="false"
      >
        <path
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 13l6-6m0 0H8m5-0v5"
        />
      </svg>
    </a>
  );
}
