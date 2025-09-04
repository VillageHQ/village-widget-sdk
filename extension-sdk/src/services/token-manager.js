const STORAGE_KEY = "VILLAGE_TOKEN";

const TokenEventListener = {
    STORAGE_GET_TOKEN: 'STORAGE_GET_TOKEN',
    STORAGE_SET_TOKEN: 'STORAGE_SET_TOKEN',
    STORAGE_DELETE_TOKEN: 'STORAGE_DELETE_TOKEN',
}

const PostMessageTypes = {
    LOG: 'LOG',
    TOKEN_RESPONSE: 'TOKEN_RESPONSE'
}

async function deleteFromStorage() {
    try {
        await chrome.storage.sync.remove(STORAGE_KEY);
        extensionPostMessage({ text: `Token removed from chrome.storage` }, PostMessageTypes.LOG);
    } catch (error) {
        console.error('Failed to delete token from storage:', error);
        extensionPostMessage({ text: `Error removing token: ${error.message}` }, PostMessageTypes.LOG);
        throw error;
    }
}

async function saveInStorage(token) {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEY]: token });
        extensionPostMessage({ text: `Token saved in chrome.storage: ${token}` }, PostMessageTypes.LOG);
    } catch (error) {
        console.error('Failed to save token to storage:', error);
        extensionPostMessage({ text: `Error saving token: ${error.message}` }, PostMessageTypes.LOG);
        throw error;
    }
}

async function loadFromStorage() {
    try {
        const data = await chrome.storage.sync.get(STORAGE_KEY);
        const token = data[STORAGE_KEY] || null;
        extensionPostMessage({ text: `Loaded token from chrome.storage: ${token}` }, PostMessageTypes.LOG);
        return token;
    } catch (error) {
        console.error('Failed to load token from storage:', error);
        extensionPostMessage({ text: `Error loading token: ${error.message}` }, PostMessageTypes.LOG);
        throw error;
    }
}

async function extensionPostMessage(message, type = 'MESSAGE') {
    if (typeof window === 'undefined') {
        return false;
    }
    window.postMessage({ source: "VillageExtension", type, message }, "*");
}

// ------------------------
// Initialization logic
// ------------------------
export async function initTokenManager() {
    extensionPostMessage({ text: `Initializing...` }, PostMessageTypes.LOG);

    // 3. Read page cookie → save to storage
    if (typeof window !== "undefined") {
        window.addEventListener("message", async (event) => {
            if (event.source !== window) return;
            const { source, type, token } = event.data || {};
            if (source !== "VillageSDK") return;

            if (type === TokenEventListener.STORAGE_GET_TOKEN) {
                const token = await loadFromStorage();
                console.log('TOKEN_RESPONSE', token);
                extensionPostMessage({ token: token }, PostMessageTypes.TOKEN_RESPONSE);
            } else if (type === TokenEventListener.STORAGE_SET_TOKEN && typeof token === "string" && token.trim().length > 0) {
                await saveInStorage(token);
            } else if (type === TokenEventListener.STORAGE_DELETE_TOKEN) {
                await deleteFromStorage();
            }
        });
    }
}
