[**Village Widget SDK v0.0.47**](../../README.md)

***

[Village Widget SDK](../../modules.md) / [village-events](../README.md) / VillageEventName

# Type Alias: VillageEventName

> **VillageEventName** = *typeof* [`VillageEvents`](../variables/VillageEvents.md)\[keyof *typeof* [`VillageEvents`](../variables/VillageEvents.md)\]

Defined in: [config/village-events.ts:60](https://github.com/VillageHQ/village-widget-sdk/blob/878b7483cb7e9cc537ac6cb964092444b8732ec3/config/village-events.ts#L60)

A union type of all valid Village event names.
Derived directly from `VillageEvents`.

## Example

```ts
function broadcast<K extends VillageEventName>(
  event: K,
  payload: VillageEventMap[K]
) { ... }
```
