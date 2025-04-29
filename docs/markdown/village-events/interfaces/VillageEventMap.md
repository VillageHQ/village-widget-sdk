[**Village Widget SDK v1.0.47**](../../README.md)

***

[Village Widget SDK](../../modules.md) / [village-events](../README.md) / VillageEventMap

# Interface: VillageEventMap

Defined in: [village-events.ts:84](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L84)

Defines the payloads for each Village event.
Used to ensure `Village.broadcast()` and `Village.on()` are strongly typed.

## Events

### village.oauth.error

> **error**: `object`

Defined in: [village-events.ts:156](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L156)

village.oauth.error
Fired when the OAuth flow fails or is canceled.

#### error

> **error**: `string`

***

### village.oauth.started

> **started**: `void`

Defined in: [village-events.ts:142](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L142)

village.oauth.started
Fired when the OAuth popup window is opened.

***

### village.oauth.success

> **success**: `object`

Defined in: [village-events.ts:148](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L148)

village.oauth.success
Fired when the OAuth flow completes successfully.

#### token

> **token**: `string`

***

### village.path.cta.clicked

> **clicked**: `object`

Defined in: [village-events.ts:96](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L96)

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

> **updated**: [`PathCTA`](../../global-types/interfaces/PathCTA.md)[]

Defined in: [village-events.ts:180](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L180)

village.paths_cta.updated
Fired when the list of available CTAs changes.

***

### village.user.sync.failed

> **failed**: `object`

Defined in: [village-events.ts:134](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L134)

village.user.sync.failed
Fired when user sync fails (e.g., expired token, server error).

#### reason

> **reason**: `string`

***

### village.user.synced

> **synced**: `object`

Defined in: [village-events.ts:125](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L125)

village.user.synced
Fired when a user's network has been successfully flattened.

#### syncedAt

> **syncedAt**: `string`

#### userId

> **userId**: `string`

***

### village.widget.error

> **error**: `object`

Defined in: [village-events.ts:164](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L164)

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

Defined in: [village-events.ts:174](https://github.com/VillageHQ/village-widget-sdk/blob/fccf09a5551957cd04cf7b6132e6f7e80cf4a38f/src/config/village-events.ts#L174)

village.widget.ready
Fired when the widget finishes initializing.
