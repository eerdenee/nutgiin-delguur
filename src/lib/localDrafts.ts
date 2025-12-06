/**
 * LOCAL DRAFTS - Offline Resilience
 * 
 * Problem: Rural user writes a listing, clicks "Post"... network drops.
 *          Everything lost. User never comes back.
 * Solution: Auto-save to localStorage. Recover when they return.
 */

// Draft structure
export interface ListingDraft {
    id: string;
    title: string;
    description: string;
    price: number | null;
    category: string | null;
    images: Array<{
        dataUrl: string;  // Base64 for offline storage
        fileName: string;
    }>;
    location: {
        aimag: string | null;
        soum: string | null;
    };
    lastSaved: string;
    formProgress: number; // 0-100
}

const STORAGE_KEY = 'nutgiin_delguur_drafts';
const MAX_DRAFTS = 5;
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

/**
 * Get all drafts from localStorage
 */
export function getDrafts(): ListingDraft[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save a draft
 */
export function saveDraft(draft: Partial<ListingDraft>): string {
    if (typeof window === 'undefined') return '';

    const drafts = getDrafts();
    const draftId = draft.id || `draft_${Date.now()}`;

    const newDraft: ListingDraft = {
        id: draftId,
        title: draft.title || '',
        description: draft.description || '',
        price: draft.price || null,
        category: draft.category || null,
        images: draft.images || [],
        location: draft.location || { aimag: null, soum: null },
        lastSaved: new Date().toISOString(),
        formProgress: calculateProgress(draft)
    };

    // Update existing or add new
    const existingIndex = drafts.findIndex(d => d.id === draftId);
    if (existingIndex >= 0) {
        drafts[existingIndex] = newDraft;
    } else {
        drafts.unshift(newDraft);
    }

    // Keep only MAX_DRAFTS
    const trimmed = drafts.slice(0, MAX_DRAFTS);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
        // Storage full - remove old drafts
        const reduced = trimmed.slice(0, 2);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
    }

    return draftId;
}

/**
 * Delete a draft
 */
export function deleteDraft(draftId: string): void {
    if (typeof window === 'undefined') return;

    const drafts = getDrafts().filter(d => d.id !== draftId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

/**
 * Get a specific draft
 */
export function getDraft(draftId: string): ListingDraft | null {
    return getDrafts().find(d => d.id === draftId) || null;
}

/**
 * Check if user has unsaved drafts
 */
export function hasUnsavedDrafts(): boolean {
    return getDrafts().length > 0;
}

/**
 * Get most recent draft
 */
export function getMostRecentDraft(): ListingDraft | null {
    const drafts = getDrafts();
    return drafts.length > 0 ? drafts[0] : null;
}

/**
 * Calculate form progress
 */
function calculateProgress(draft: Partial<ListingDraft>): number {
    let progress = 0;
    const weights = {
        title: 20,
        description: 20,
        price: 15,
        category: 15,
        images: 20,
        location: 10
    };

    if (draft.title && draft.title.length >= 5) progress += weights.title;
    if (draft.description && draft.description.length >= 20) progress += weights.description;
    if (draft.price && draft.price > 0) progress += weights.price;
    if (draft.category) progress += weights.category;
    if (draft.images && draft.images.length > 0) progress += weights.images;
    if (draft.location?.aimag) progress += weights.location;

    return progress;
}

/**
 * Convert File to base64 for offline storage
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Convert base64 back to File (for upload)
 */
export function base64ToFile(dataUrl: string, fileName: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
}

// ============================================
// AUTO-SAVE HOOK FOR REACT
// ============================================

/**
 * Create auto-save handler
 */
export function createAutoSaver(draftId: string) {
    let saveTimeout: NodeJS.Timeout | null = null;
    let lastData: string = '';

    return {
        /**
         * Trigger save (debounced)
         */
        save: (draft: Partial<ListingDraft>) => {
            const currentData = JSON.stringify(draft);

            // Skip if data hasn't changed
            if (currentData === lastData) return;
            lastData = currentData;

            // Debounce
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveDraft({ ...draft, id: draftId });
            }, AUTO_SAVE_INTERVAL);
        },

        /**
         * Force immediate save
         */
        saveNow: (draft: Partial<ListingDraft>) => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveDraft({ ...draft, id: draftId });
        },

        /**
         * Cleanup
         */
        cleanup: () => {
            if (saveTimeout) clearTimeout(saveTimeout);
        }
    };
}

// ============================================
// NETWORK STATUS DETECTION
// ============================================

/**
 * Check if device is online
 */
export function isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
}

/**
 * Add network status listener
 */
export function onNetworkChange(callback: (online: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => { };

    const onlineHandler = () => callback(true);
    const offlineHandler = () => callback(false);

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    return () => {
        window.removeEventListener('online', onlineHandler);
        window.removeEventListener('offline', offlineHandler);
    };
}

/**
 * Get draft recovery message for UI
 */
export function getDraftRecoveryMessage(): {
    show: boolean;
    title: string;
    message: string;
    draftId?: string;
} | null {
    const draft = getMostRecentDraft();

    if (!draft) return null;
    if (draft.formProgress < 20) return null; // Not worth recovering

    const age = Date.now() - new Date(draft.lastSaved).getTime();
    const ageHours = Math.floor(age / 3600000);

    let timeAgo = '';
    if (ageHours < 1) timeAgo = 'Саяхан';
    else if (ageHours < 24) timeAgo = `${ageHours} цагийн өмнө`;
    else timeAgo = `${Math.floor(ageHours / 24)} өдрийн өмнө`;

    return {
        show: true,
        title: 'Дуусгаагүй зар байна!',
        message: `"${draft.title || 'Нэргүй зар'}" - ${timeAgo}. Үргэлжлүүлэх үү?`,
        draftId: draft.id
    };
}
