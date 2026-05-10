import React from 'react';

/**
 * Parses double asterisks (**) in activity messages and converts them to bold HTML elements,
 * while ensuring standard text spacing and word boundaries are fully preserved.
 *
 * @param {string} text - The raw activity message
 * @returns {React.ReactNode[]|null} - Array of React elements or null
 */
export const renderFormattedMessage = (text) => {
    if (!text) return null;

    // Remove random emojis and leading spaces/punctuation sometimes left by emoji removal
    const cleanText = text
        .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
        .replace(/^[:\s\-]+/, '')
        .trim();

    // Split on ** markers to isolate segments that should be bolded
    const parts = cleanText.split(/\*\*(.*?)\*\*/g);

    return parts.map((part, i) => {
        // Odd indices are between asterisks: format as bold text
        if (i % 2 === 1) {
            return (
                <strong key={i} className="font-bold text-slate-900">
                    {part}
                </strong>
            );
        }
        // Even indices are normal message text: preserve fully with correct spacing
        return (
            <span key={i} className="text-slate-600 font-medium">
                {part}
            </span>
        );
    });
};
