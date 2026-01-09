import React from 'react';
import { cn } from '../../lib/utils';

/**
 * MainContent - Accessibility wrapper for main page content
 * Provides the target for skip navigation links
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.tabIndex - Whether to make the element focusable (default: -1 for programmatic focus)
 */
export function MainContent({ children, className, tabIndex = -1, ...props }) {
    return (
        <main
            id="main-content"
            className={cn('outline-none', className)}
            tabIndex={tabIndex}
            role="main"
            aria-label="Main content"
            {...props}
        >
            {children}
        </main>
    );
}

export default MainContent;
