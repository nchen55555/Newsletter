'use client';

import { useEffect, useState } from 'react';
import { type PortableTextBlock } from '@portabletext/react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: PortableTextBlock[];
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from PortableText content
    const extractedHeadings: Heading[] = [];
    
    content.forEach((block, index) => {
      if (block._type === 'block' && block.style && ['h1', 'h2', 'h3'].includes(block.style)) {
        const text = block.children?.map((child) => (child as { text?: string }).text || '').join('') || '';
        const id = `heading-${index}`;
        extractedHeadings.push({
          id,
          text,
          level: parseInt(block.style.charAt(1))
        });
      }
    });

    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -35% 0%' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sticky top-24 h-fit">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">Table of Contents</h3>
        <nav className="space-y-1">
          {headings.length > 0 ? (
            headings.map(({ id, text, level }) => (
              <button
                key={id}
                onClick={() => scrollToHeading(id)}
                className={`
                  block w-full text-left text-sm transition-colors
                  ${level === 1 ? 'font-medium' : level === 2 ? 'pl-3' : 'pl-6'}
                  ${activeId === id 
                    ? 'text-blue-600 font-medium' 
                    : 'text-neutral-600 hover:text-neutral-900'
                  }
                `}
              >
                {text}
              </button>
            ))
          ) : (
            <p className="text-sm text-neutral-400 italic">No headings found</p>
          )}
        </nav>
      </div>
    </div>
  );
}
