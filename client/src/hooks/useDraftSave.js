import { useEffect, useRef } from 'react';

const DRAFT_KEY = 'property_wizard_draft';
const DEBOUNCE_MS = 2000;
const MAX_DRAFT_AGE_HOURS = 72;

/**
 * Custom hook: auto-saves wizard form data to localStorage with debounce.
 * Excludes File objects from photos (not serializable).
 *
 * @param {object} formData - current wizard form data
 * @param {number} currentStep - current step number
 * @param {boolean} submitted - whether the form has been submitted
 */
export function useDraftSave(formData, currentStep, submitted) {
    const timerRef = useRef(null);

    useEffect(() => {
        // Don't save after submission
        if (submitted) {
            clearDraft();
            return;
        }

        // Debounced save
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            try {
                const saveable = {
                    formData: {
                        ...formData,
                        // Replace File objects with metadata (not serializable)
                        photos: (formData.photos || []).map((p) => ({
                            name: p.file?.name || 'photo',
                            size: p.file?.size || 0,
                            // Keep preview for display on restore (base64 data URLs)
                            preview: p.preview || null,
                        })),
                    },
                    currentStep,
                    savedAt: Date.now(),
                    version: 1,
                };

                localStorage.setItem(DRAFT_KEY, JSON.stringify(saveable));
            } catch (err) {
                console.warn('Failed to save wizard draft:', err);
            }
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [formData, currentStep, submitted]);
}

/**
 * Load a saved draft from localStorage.
 * Returns null if no valid draft exists or if it's expired.
 */
export function loadDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;

        const draft = JSON.parse(raw);
        const hoursAgo = (Date.now() - draft.savedAt) / (1000 * 60 * 60);

        if (hoursAgo > MAX_DRAFT_AGE_HOURS) {
            clearDraft();
            return null;
        }

        return draft;
    } catch {
        clearDraft();
        return null;
    }
}

/**
 * Clear the saved draft from localStorage.
 */
export function clearDraft() {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        // Ignore
    }
}

/**
 * Get a human-readable "time ago" string for the draft timestamp.
 */
export function getDraftAge(savedAt) {
    const diff = Date.now() - savedAt;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`;
}
