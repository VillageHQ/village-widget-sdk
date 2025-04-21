// src/globals.d.ts

export { };

declare global {
    interface PathCTA {
        label: string;
        callback: () => void;
        style?: React.CSSProperties;
    }

    interface VillageInitOptions {
        paths_cta?: PathCTA[];
    }
    interface Window {
        Village?: {
            on?: (event: string, callback: (data: any) => void) => void;
            emit?: (event: string, data: any) => void;
            broadcast?: (event: string, data: any) => void;
            authorize?: (...args: any[]) => void;
            init?: (publicKey: string, options?: VillageInitOptions) => void;
            loaded?: boolean;
            q?: any[];
        };
    }
}
