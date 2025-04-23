import { VillageEventMap } from "./config/village-events.js";
type VillageEventName = keyof VillageEventMap;
type TypedListener<K extends keyof VillageEventMap> = (payload: VillageEventMap[K]) => void;
type AnyListener = (payload: any) => void;
/**
 * Overloads – preserves type-safety for official events,
 * but accepts arbitrary strings for legacy compatibility.
 */
export declare function on<K extends VillageEventName>(event: K, callback: TypedListener<K>): void;
export declare function on(event: string, callback: AnyListener): void;
export declare function emit<K extends keyof VillageEventMap>(event: K, payload: VillageEventMap[K]): void;
export declare function emit(event: string, payload?: any): void;
export {};
