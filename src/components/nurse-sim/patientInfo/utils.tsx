import React from 'react';

// Helper function to highlight text (same as ChatInterface)
export const highlightText = (text: string, highlights: string[]): React.ReactNode => {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the highlight terms (case insensitive)
  const pattern = highlights
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special regex characters
    .join('|');
  
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isHighlighted = highlights.some(
      term => part.toLowerCase() === term.toLowerCase()
    );
    
    if (isHighlighted) {
      return (
        <mark
          key={index}
          className="bg-orange-100 text-neutral-900 px-0.5 rounded font-medium"
        >
          {part}
        </mark>
      );
    }
    return <span key={index}>{part}</span>;
  });
};
