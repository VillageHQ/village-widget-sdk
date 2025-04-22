[**Village Widget SDK v0.0.47**](../../README.md)

***

[Village Widget SDK](../../modules.md) / [village-events](../README.md) / VillageEventName

# Type Alias: VillageEventName

> **VillageEventName** = *typeof* [`VillageEvents`](../variables/VillageEvents.md)\[keyof *typeof* [`VillageEvents`](../variables/VillageEvents.md)\]

Defined in: [config/village-events.ts:60](https://github.com/VillageHQ/village-widget-sdk/blob/86cfd96e28460c83fceb46b43e5203c7ff1d1e74/config/village-events.ts#L60)

A union type of all valid Village event names.
Derived directly from `VillageEvents`.

## Example

```ts
function broadcast<K extends VillageEventName>(
  event: K,
  payload: VillageEventMap[K]
) { ... }
```
