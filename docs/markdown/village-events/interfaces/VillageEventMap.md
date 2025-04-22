[**Village Widget SDK v0.0.47**](../../README.md)

***

[Village Widget SDK](../../modules.md) / [village-events](../README.md) / VillageEventMap

# Interface: VillageEventMap

Defined in: [config/village-events.ts:82](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L82)

Defines the payloads for each Village event.
Used to ensure `Village.broadcast()` and `Village.on()` are strongly typed.

## Events

### village.oauth.error

> **error**: `object`

Defined in: [config/village-events.ts:154](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L154)

village.oauth.error
Fired when the OAuth flow fails or is canceled.

#### error

> **error**: `string`

***

### village.oauth.started

> **started**: `void`

Defined in: [config/village-events.ts:140](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L140)

village.oauth.started
Fired when the OAuth popup window is opened.

***

### village.oauth.success

> **success**: `object`

Defined in: [config/village-events.ts:146](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L146)

village.oauth.success
Fired when the OAuth flow completes successfully.

#### token

> **token**: `string`

***

### village.path.cta.clicked

> **clicked**: `object`

Defined in: [config/village-events.ts:94](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L94)

village.path.cta.clicked
Fired when a CTA (e.g., "Send Intro", "Save to CRM") is clicked.

#### context

> **context**: `object`

##### context.from

> **from**: `string`

##### context.partnerDomain

> **partnerDomain**: `string`

##### context.path

> **path**: `object`

##### context.path.connector\_end\_warmth\_score?

> `optional` **connector\_end\_warmth\_score**: `number`

##### context.path.connector\_person?

> `optional` **connector\_person**: [`VillagePerson`](VillagePerson.md)

##### context.path.end\_person

> **end\_person**: [`VillagePerson`](VillagePerson.md)

##### context.path.group\_type?

> `optional` **group\_type**: `any`

##### context.path.paid\_intro?

> `optional` **paid\_intro**: `any`

##### context.path.start\_connector\_warmth\_score?

> `optional` **start\_connector\_warmth\_score**: `number`

##### context.path.start\_end\_warmth\_score?

> `optional` **start\_end\_warmth\_score**: `number`

##### context.path.start\_person

> **start\_person**: [`VillagePerson`](VillagePerson.md)

##### context.path.type

> **type**: `string`

#### cta

> **cta**: `object`

##### cta.label

> **label**: `string`

##### cta.style?

> `optional` **style**: `Record`\<`string`, `any`\>

#### index

> **index**: `number`

#### source

> **source**: `string`

#### type

> **type**: `"village.path.cta.clicked"`

#### Example

```ts
Village.on(VillageEvents.pathCtaClicked, ({ cta }) => {
  console.log("CTA clicked:", cta.label);
});
```

***

### village.paths\_cta.updated

> **updated**: [`PathCTA`](../../global/interfaces/PathCTA.md)[]

Defined in: [config/village-events.ts:178](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L178)

village.paths_cta.updated
Fired when the list of available CTAs changes.

***

### village.user.sync.failed

> **failed**: `object`

Defined in: [config/village-events.ts:132](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L132)

village.user.sync.failed
Fired when user sync fails (e.g., expired token, server error).

#### reason

> **reason**: `string`

***

### village.user.synced

> **synced**: `object`

Defined in: [config/village-events.ts:123](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L123)

village.user.synced
Fired when a user's network has been successfully flattened.

#### syncedAt

> **syncedAt**: `string`

#### userId

> **userId**: `string`

***

### village.widget.error

> **error**: `object`

Defined in: [config/village-events.ts:162](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L162)

village.widget.error
Fired when an internal error occurs in the widget.

#### details?

> `optional` **details**: `any`

#### message

> **message**: `string`

#### source

> **source**: `string`

***

### village.widget.ready

> **ready**: `void`

Defined in: [config/village-events.ts:172](https://github.com/VillageHQ/village-widget-sdk/blob/78c5c62f1e747897e4c96cd85e80875c22bbd40b/config/village-events.ts#L172)

village.widget.ready
Fired when the widget finishes initializing.
