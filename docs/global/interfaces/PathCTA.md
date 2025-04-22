[**Village Widget SDK v0.0.47**](../../README.md)

***

[Village Widget SDK](../../modules.md) / [global](../README.md) / PathCTA

# Interface: PathCTA

Defined in: [config/global.d.ts:13](https://github.com/VillageHQ/village-widget-sdk/blob/3216cd563b90dd616d242b1c1467581d440f1dc3/config/global.d.ts#L13)

Represents a Call-To-Action (CTA) button rendered in the widget UI.

## Properties

### callback()

> **callback**: () => `void`

Defined in: [config/global.d.ts:18](https://github.com/VillageHQ/village-widget-sdk/blob/3216cd563b90dd616d242b1c1467581d440f1dc3/config/global.d.ts#L18)

Function to execute when the button is clicked

#### Returns

`void`

***

### label

> **label**: `string`

Defined in: [config/global.d.ts:15](https://github.com/VillageHQ/village-widget-sdk/blob/3216cd563b90dd616d242b1c1467581d440f1dc3/config/global.d.ts#L15)

Visible label for the button (e.g. "Save to CRM")

***

### style?

> `optional` **style**: `CSSProperties`

Defined in: [config/global.d.ts:24](https://github.com/VillageHQ/village-widget-sdk/blob/3216cd563b90dd616d242b1c1467581d440f1dc3/config/global.d.ts#L24)

Optional inline style to apply to the CTA.
Compatible with React-style CSSProperties.
