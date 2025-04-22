[**Village Widget SDK v0.0.47**](../../README.md)

***

[Village Widget SDK](../../modules.md) / [global](../README.md) / Window

# Interface: Window

Defined in: node\_modules/typescript/lib/lib.dom.d.ts:26913

A window containing a DOM document; the document property points to the DOM document loaded in that window.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window)

## Extends

- `EventTarget`.`AnimationFrameProvider`.`GlobalEventHandlers`.`WindowEventHandlers`.`WindowLocalStorage`.`WindowOrWorkerGlobalScope`.`WindowSessionStorage`

## Indexable

\[`index`: `number`\]: `Window`

## Properties

### Village?

> `optional` **Village**: `object`

Defined in: [config/global.d.ts:39](https://github.com/VillageHQ/village-widget-sdk/blob/878b7483cb7e9cc537ac6cb964092444b8732ec3/config/global.d.ts#L39)

#### authorize()?

> `optional` **authorize**: (...`args`) => `void`

Starts the authorization flow (typically OAuth).
Can accept dynamic arguments depending on auth implementation.

##### Parameters

###### args

...`any`[]

##### Returns

`void`

#### broadcast()?

> `optional` **broadcast**: (`event`, `data`) => `void`

Broadcasts an event to all widget instances (e.g., across iframes).

##### Parameters

###### event

`string`

Event name

###### data

`any`

Payload for the event

##### Returns

`void`

#### emit()?

> `optional` **emit**: (`event`, `data`) => `void`

Emits an event to the local Village widget instance.

##### Parameters

###### event

`string`

Event name

###### data

`any`

Payload for the event

##### Returns

`void`

#### init()?

> `optional` **init**: (`publicKey`, `options?`) => `void`

Initializes the widget with a public API key and optional configuration.

##### Parameters

###### publicKey

`string`

Your partner/public API key

###### options?

[`VillageInitOptions`](VillageInitOptions.md)

Widget configuration options

##### Returns

`void`

#### loaded?

> `optional` **loaded**: `boolean`

Indicates whether the widget has completed initialization.

#### on()?

> `optional` **on**: (`event`, `callback`) => `void`

Subscribes to an event emitted by the Village widget.

##### Parameters

###### event

`string`

Event name (e.g., `village.widget.ready`)

###### callback

(`data`) => `void`

Function to handle the event payload

##### Returns

`void`

#### q?

> `optional` **q**: `any`[]

Internal queue of deferred events emitted before initialization.
