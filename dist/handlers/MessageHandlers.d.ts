export class MessageHandlers {
    constructor(app: any);
    app: any;
    handlers: {
        VILLAGE_OAUTH_REQUEST: (data: any) => void;
        VILLAGE_OAUTH_SUCCESS: (data: any) => void;
        VILLAGE_OAUTH_ERROR: (data: any) => void;
        VILLAGE_REMOVE_IFRAME: () => void;
        VILLAGE_IFRAME_LOADED: () => void;
        VILLAGE_COPY_TO_CLIPBOARD: (data: any) => void;
    };
    handle(event: any): void;
    handleOAuthRequest(data: any): void;
    handleOAuthSuccess(data: any): void;
    handleOAuthError(data: any): void;
    handleRemoveIframe(): void;
    handleIframeLoaded(): void;
    handleCopyToClipboard(data: any): void;
}
