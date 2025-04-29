[**Village Widget SDK v1.0.47**](../../README.md)

***

[Village Widget SDK](../../modules.md) / [village-events](../README.md) / VillageEventName

# Type Alias: VillageEventName

> **VillageEventName** = *typeof* [`VillageEvents`](../variables/VillageEvents.md)\[keyof *typeof* [`VillageEvents`](../variables/VillageEvents.md)\]

Defined in: [village-events.ts:62](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L62)

A union type of all valid Village event names.
Derived directly from `VillageEvents`.

## Example

```ts
function broadcast<K extends VillageEventName>(
  event: K,
  payload: VillageEventMap[K]
) { ... }
```
