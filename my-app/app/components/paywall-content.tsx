'use client';

import { useSubscriptionContext } from './subscription_context';
import { useState } from 'react';
import { VerificationProtectedContent } from './verification-protected-content';

// Types for PortableText blocks
interface PortableTextSpan {
  _type: 'span';
  text: string;
  marks?: string[];
}

interface PortableTextBlock {
  _type: 'block';
  _key: string;
  style?: string;
  children: PortableTextSpan[];
}

interface PortableTextImageBlock {
  _type: 'image';
  _key: string;
  asset: {
    _ref: string;
  };
  alt?: string;
  caption?: string;
}

type PortableTextContent = PortableTextBlock | PortableTextImageBlock | Record<string, unknown>;

interface PaywallContentProps {
  children: React.ReactNode;
  wordLimit?: number;
  showGradient?: boolean;
}

export function PaywallContent({ 
  children, 
  wordLimit = 200, 
  showGradient = true 
}: PaywallContentProps) {
  const { isSubscribed } = useSubscriptionContext();
  const [showFullContent] = useState(false);

  // If user is subscribed, show full content
  if (isSubscribed) {
    return <>{children}</>;
  }

  // Extract text content from PortableText blocks or React children
  const extractTextFromChildren = (children: React.ReactNode): string => {
    if (typeof children === 'string') {
      return children;
    }
    
    if (Array.isArray(children)) {
      return children.map(extractTextFromChildren).join(' ');
    }
    
    if (children && typeof children === 'object' && 'props' in children) {
      const element = children as React.ReactElement;
      const props = element.props as { value?: PortableTextContent[]; children?: React.ReactNode };
      
      // Handle PortableText component specifically
      if (props.value && Array.isArray(props.value)) {
        return extractTextFromPortableTextBlocks(props.value);
      }
      
      if (props?.children) {
        return extractTextFromChildren(props.children);
      }
    }
    
    return '';
  };

  // Extract text from PortableText blocks directly
  const extractTextFromPortableTextBlocks = (blocks: PortableTextContent[]): string => {
    return blocks
      .map(block => {
        if (block._type === 'block' && 'children' in block) {
          const textBlock = block as PortableTextBlock;
          return textBlock.children
            .map((child: PortableTextSpan) => child.text || '')
            .join('');
        }
        return '';
      })
      .join(' ');
  };

  // Function to truncate React elements while preserving structure
  const truncateReactContent = (children: React.ReactNode, wordCount: number): React.ReactNode => {
    let currentWordCount = 0;
    
    const processNode = (node: React.ReactNode): React.ReactNode => {
      if (currentWordCount >= wordCount) return null;
      
      if (typeof node === 'string') {
        const words = node.split(/\s+/).filter(word => word.length > 0);
        const remainingWords = wordCount - currentWordCount;
        
        if (words.length <= remainingWords) {
          currentWordCount += words.length;
          return node;
        } else {
          const truncatedWords = words.slice(0, remainingWords);
          currentWordCount = wordCount;
          return truncatedWords.join(' ') + '...';
        }
      }
      
      if (Array.isArray(node)) {
        return node.map(processNode).filter(Boolean);
      }
      
      if (node && typeof node === 'object' && 'props' in node) {
        const element = node as React.ReactElement;
        const props = element.props as { value?: PortableTextContent[]; children?: React.ReactNode; [key: string]: unknown };
        
        // Special handling for PortableText component - truncate the blocks directly
        if (props.value && Array.isArray(props.value)) {
          const truncatedBlocks = truncatePortableTextBlocks(props.value, wordCount);
          return {
            ...element,
            props: {
              ...props,
              value: truncatedBlocks
            }
          };
        }
        
        const processedChildren = processNode(props.children);
        
        if (processedChildren === null) return null;
        
        return {
          ...element,
          props: {
            ...props,
            children: processedChildren
          }
        };
      }
      
      return node;
    };
    
    return processNode(children);
  };

  // Truncate PortableText blocks at the block level
  const truncatePortableTextBlocks = (blocks: PortableTextContent[], wordCount: number): PortableTextContent[] => {
    let currentWordCount = 0;
    const truncatedBlocks: PortableTextContent[] = [];
    
    for (const block of blocks) {
      if (currentWordCount >= wordCount) break;
      
      if (block._type === 'block' && 'children' in block) {
        const textBlock = block as PortableTextBlock;
        const blockText = textBlock.children
          .map((child: PortableTextSpan) => child.text || '')
          .join('');
        const blockWords = blockText.split(/\s+/).filter((word: string) => word.length > 0);
        
        if (currentWordCount + blockWords.length <= wordCount) {
          // Include the whole block
          truncatedBlocks.push(block);
          currentWordCount += blockWords.length;
        } else {
          // Truncate within this block
          const remainingWords = wordCount - currentWordCount;
          const truncatedText = blockWords.slice(0, remainingWords).join(' ') + '...';
          
          // Create a truncated version of the block
          const truncatedBlock = {
            ...block,
            children: [{
              _type: 'span',
              text: truncatedText
            }]
          };
          truncatedBlocks.push(truncatedBlock);
          break;
        }
      } else {
        // Include non-text blocks (like images) as-is if we haven't exceeded the limit
        truncatedBlocks.push(block);
      }
    }
    
    return truncatedBlocks;
  };

  const fullText = extractTextFromChildren(children);
  const words = fullText.split(/\s+/).filter(word => word.length > 0);
  const shouldTruncate = words.length > wordLimit;
  
  if (!shouldTruncate || showFullContent) {
    return <>{children}</>;
  }

  const truncatedContent = truncateReactContent(children, wordLimit);

  return (
    <div className="relative">
      {/* Truncated content with preserved formatting */}
      {truncatedContent}
      
      {/* Gradient overlay */}
      {showGradient && (
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}
      
      {/* Verification protected content for remaining article */}
      <VerificationProtectedContent
        fallbackDescription="Request to join The Niche network to read the full article."
        className="mt-6"
        redirectUrl="/access"
      >
        <div className="hidden" />
      </VerificationProtectedContent>
    </div>
  );
}

// Re-export the existing VerificationProtectedContent component for convenience
export { VerificationProtectedContent } from './verification-protected-content';