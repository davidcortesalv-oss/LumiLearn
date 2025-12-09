
import { SavedMap, LivingMapData, FlashcardDeck, StoredFile, ChatMessage } from "../types";

const STORAGE_KEY_MAPS = 'lumi_saved_maps';
const STORAGE_KEY_DECKS = 'lumi_flashcard_decks';
const STORAGE_KEY_FILES = 'lumi_stored_files';
const STORAGE_KEY_CHATS = 'lumi_chat_history';

// --- MAPS STORAGE ---

export const saveMapToStorage = (title: string, data: LivingMapData): SavedMap => {
  const newMap: SavedMap = {
    id: Date.now().toString(),
    title: title || `Mapa sin título ${new Date().toLocaleDateString()}`,
    timestamp: Date.now(),
    data: data,
    previewNodeCount: data.nodes.length
  };

  const existing = getSavedMaps();
  const updated = [newMap, ...existing];
  localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(updated));
  return newMap;
};

export const getSavedMaps = (): SavedMap[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAPS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading maps", e);
    return [];
  }
};

export const deleteSavedMap = (id: string): SavedMap[] => {
  const existing = getSavedMaps();
  const updated = existing.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(updated));
  return updated;
};

// --- FLASHCARDS STORAGE ---

export const saveDeckToStorage = (deck: FlashcardDeck): void => {
    const decks = getDecksFromStorage();
    const existingIndex = decks.findIndex(d => d.id === deck.id);
    
    if (existingIndex >= 0) {
        decks[existingIndex] = deck;
    } else {
        decks.unshift(deck);
    }
    
    localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
};

export const getDecksFromStorage = (): FlashcardDeck[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_DECKS);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
};

export const deleteDeckFromStorage = (id: string): FlashcardDeck[] => {
    const decks = getDecksFromStorage();
    const updated = decks.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(updated));
    return updated;
};

// --- FILE / MATERIALS STORAGE ---

export const saveFileToStorage = (file: StoredFile): boolean => {
    try {
        const files = getFilesFromStorage();
        // Check for duplicates (by name and subject for simplicity)
        if (files.some(f => f.name === file.name && f.subjectId === file.subjectId)) {
            return true; // Already exists, consider success
        }
        
        const updated = [file, ...files];
        localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(updated));
        return true;
    } catch (e) {
        console.error("Storage Quota Exceeded for Files", e);
        return false;
    }
};

export const getFilesFromStorage = (): StoredFile[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_FILES);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
};

export const deleteFileFromStorage = (id: string): StoredFile[] => {
    const files = getFilesFromStorage();
    const updated = files.filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(updated));
    return updated;
};

// --- CHAT PERSISTENCE ---

export const saveChatHistory = (subjectId: string, messages: ChatMessage[]) => {
    try {
        const history = getChatHistory();
        history[subjectId] = messages;
        localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save chat history", e);
    }
}

export const getChatHistory = (): Record<string, ChatMessage[]> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_CHATS);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

// --- GOOGLE DRIVE INTEGRATION (SIMULATION) ---
// Note: Real integration requires a Google Cloud Project Client ID and OAuth flow.
// This function simulates the API latency and success response.

export const uploadToGoogleDrive = async (blob: Blob, filename: string): Promise<boolean> => {
    return new Promise((resolve) => {
        console.log(`[Drive API] Starting upload for ${filename} (${blob.size} bytes)...`);
        
        // Simulate network delay and progress
        setTimeout(() => {
            console.log(`[Drive API] Upload complete: ${filename}`);
            resolve(true);
        }, 2000);
    });
};
