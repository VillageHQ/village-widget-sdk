import Cookies from "js-cookie";

export class MessageHandlers {
  constructor(app) {
    this.app = app;
    this.handlers = {
      VILLAGE_OAUTH_REQUEST: this.handleOAuthRequest.bind(this),
      VILLAGE_OAUTH_SUCCESS: this.handleOAuthSuccess.bind(this),
      VILLAGE_OAUTH_ERROR: this.handleOAuthError.bind(this),
      VILLAGE_REMOVE_IFRAME: this.handleRemoveIframe.bind(this),
      VILLAGE_IFRAME_LOADED: this.handleIframeLoaded.bind(this),
      VILLAGE_COPY_TO_CLIPBOARD: this.handleCopyToClipboard.bind(this),
    };
    this.app.oauthPopupRef = null;
  }

  handle(event) {
    if (!event.data.type || !event.data.type.startsWith("VILLAGE_")) return;

    const handler = this.handlers[event.data.type];
    if (handler) {
      const isPopupMessage =
        event.data.type === "VILLAGE_OAUTH_SUCCESS" ||
        event.data.type === "VILLAGE_OAUTH_ERROR";
      if (isPopupMessage && event.source !== this.app.oauthPopupRef) {
        if (this.app.oauthPopupRef && this.app.oauthPopupRef.closed) {
          this.app.oauthPopupRef = null;
        }
        return;
      }

      handler(event.data, event.source);
    }
  }

  handleOAuthRequest(data) {
    const { isAuthorizationFlow } = data;

    const baseUrl = `${import.meta.env.VITE_APP_FRONTEND_URL}/widget/${isAuthorizationFlow ? "resolve-auth" : "oauth"}`;
    const params = new URLSearchParams();

    if (this.app.partnerKey) params.append("partnerKey", this.app.partnerKey);
    if (this.app.userReference)
      params.append("userReference", this.app.userReference);

    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    this.app.oauthPopupRef = window.open(
      url,
      "paas-oauth",
      "popup=true,width=500,height=600"
    );

    const checkPopupClosed = setInterval(() => {
      if (this.app.oauthPopupRef && this.app.oauthPopupRef.closed) {
        clearInterval(checkPopupClosed);
        this.app.oauthPopupRef = null;
      } else if (!this.app.oauthPopupRef) {
        clearInterval(checkPopupClosed);
      }
    }, 1000);
  }

  handleOAuthSuccess(data) {
    Cookies.set("village.token", data.token, { secure: true, expires: 60 });
    
    this.app.handleOAuthSuccess(data);

    const villageOrigin = import.meta.env.VITE_APP_FRONTEND_URL;
    if (this.app.oauthPopupRef && !this.app.oauthPopupRef.closed) {
      this.app.oauthPopupRef.postMessage(
        { type: "VILLAGE_OAUTH_ACKNOWLEDGED" },
        villageOrigin
      );

      this.app.oauthPopupRef = null;
    } else {
      this.app.oauthPopupRef = null;
    }
  }

  handleOAuthError(data) {
    alert(
      `Sorry, something went wrong during authentication: ${data?.error || "Unknown error"}`
    );
    if (this.app.oauthPopupRef) {
      this.app.oauthPopupRef = null;
    }
  }

  handleRemoveIframe() {
    this.app.url = null;
    this.app.module = null;
    this.app.renderIframe();
  }

  handleIframeLoaded() {
    if (this.app.iframe) {
      this.app.iframe.hideSpinner();
    }
  }

  handleCopyToClipboard(data) {
    navigator.clipboard.writeText(data.text);
  }
}
