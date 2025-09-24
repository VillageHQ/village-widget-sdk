export interface AuthResult {
  ok: boolean;
  status: 'authorized' | 'unauthorized';
  domain?: string;
  reason?: string;
}

export interface PathCTA {
  label: string;
  callback: (payload?: any) => void;
  style?: Record<string, string>;
}

export interface VillageConfig {
  paths_cta?: PathCTA[];
}

export interface UserDetails {
  email?: string;
  name?: string;
  [key: string]: any;
}

export interface PathCheckResult {
  found: boolean;
  count: number;
  avatars: string[];
  relationship?: any;
  error?: string;
}

export interface OpenOptions {
  returnElement?: boolean;
}

export interface VillageSDK {
  init(partnerKey: string, config?: VillageConfig): VillageSDK;
  
  // Token-based authorization with domain
  authorize(token: string, domain: string, refreshCallback?: () => Promise<string>): Promise<AuthResult>;
  // User reference authorization (backward compatibility)
  authorize(userReference: string, details?: UserDetails, refreshCallback?: never): Promise<AuthResult>;
  // Domain-only authorization (fetches token from extension)
  authorize(tokenOrUserRef?: null, domain?: string, refreshCallback?: never): Promise<AuthResult>;
  
  identify(userReference: string, details?: UserDetails): Promise<void>;
  
  logout(): void;
  
  on(event: string, callback: (data?: any) => void): void;
  
  emit(event: string, data?: any): void;
  
  off(event: string, callback: (data?: any) => void): void;
  
  updatePathsCTA(ctaList: PathCTA[]): VillageSDK;
  
  addPathCTA(cta: PathCTA): VillageSDK;
  
  getPathsCTA(): PathCTA[];
  
  executeCallback(payload: any): boolean;
  
  sendStorageGetToken(): void;
  sendStorageSetToken(token: string): void;
  sendStorageDeleteToken(): void;
  
  dispatch(event: string, data?: any): void;
  broadcast(event: string, data?: any): void;

  /**
   * Opens the Village referral modal for the specified URL.
   * Works in Shadow DOM and all modern frameworks.
   * @param url - The URL of the job or page to get referrals for
   * @param options - Optional configuration
   * @returns void or iframe element if returnElement option is true
   */
  openPaths(url: string, options?: OpenOptions): void | HTMLIFrameElement;

  /**
   * Checks if the user has connections at the specified company.
   * Returns a promise with connection data.
   * @param url - The URL to check for connections
   * @returns Promise with found status, count, and avatars
   */
  checkPaths(url: string): Promise<PathCheckResult>;

  /**
   * Opens the Village authentication/onboarding modal.
   * Allows users to sign in or sync their account.
   * @param options - Optional configuration
   * @returns void or iframe element if returnElement option is true
   */
  openSync(options?: OpenOptions): void | HTMLIFrameElement;
}

export const VillageEvents: {
  widgetReady: 'village.widget.ready';
  pathCtaClicked: 'village.path.cta.clicked';
  pathsCtaUpdated: 'village.paths_cta.updated';
  userSynced: 'village.user.synced';
  oauthSuccess: 'village.oauth.success';
  oauthError: 'village.oauth.error';
  widgetError: 'village.widget.error';
  userLoggedOut: 'village.user.logged_out';
};

declare const Village: VillageSDK;

// Global declaration for window.Village when using script tag
declare global {
  interface Window {
    Village: VillageSDK;
  }
}

export default Village;