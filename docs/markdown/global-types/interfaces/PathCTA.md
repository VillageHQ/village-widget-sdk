[**Village Widget SDK v1.0.47**](../../README.md)

***

[Village Widget SDK](../../modules.md) / [global-types](../README.md) / PathCTA

# Interface: PathCTA

Defined in: [global-types.ts:6](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/global-types.ts#L6)

Represents a Call-To-Action (CTA) button rendered in the widget UI.

## Properties

### callback()

> **callback**: (...`args`) => `void`

Defined in: [global-types.ts:14](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/global-types.ts#L14)

Function to execute when the button is clicked.
Can receive any arguments passed from the widget runtime.

#### Parameters

##### args

...`any`[]

#### Returns

`void`

***

### label

> **label**: `string`

Defined in: [global-types.ts:8](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/global-types.ts#L8)

Visible label for the button (e.g. "Save to CRM")

***

### style?

> `optional` **style**: `CSSProperties`

Defined in: [global-types.ts:20](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/global-types.ts#L20)

Optional inline style to apply to the CTA.
Compatible with React-style CSSProperties.
