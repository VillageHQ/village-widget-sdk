[**Village Widget SDK v0.0.47**](../../README.md)

***

[Village Widget SDK](../../modules.md) / [village-events](../README.md) / VillageEvents

# Variable: VillageEvents

> `const` **VillageEvents**: `object`

Defined in: [config/village-events.ts:19](https://github.com/VillageHQ/village-widget-sdk/blob/77e460c6d471093e86a3a74e017cb6fbea19444c/config/village-events.ts#L19)

A registry of all supported Village SDK event constants.

Use these values when calling `Village.on(...)` or `Village.broadcast(...)`
to subscribe or broadcast custom widget-related events.

## Type declaration

### oauthError

> `readonly` **oauthError**: `"village.oauth.error"` = `"village.oauth.error"`

Fired when OAuth login fails or is canceled

### oauthStarted

> `readonly` **oauthStarted**: `"village.oauth.started"` = `"village.oauth.started"`

Fired when OAuth popup is opened

### oauthSuccess

> `readonly` **oauthSuccess**: `"village.oauth.success"` = `"village.oauth.success"`

Fired when OAuth login completes successfully

### pathCtaClicked

> `readonly` **pathCtaClicked**: `"village.path.cta.clicked"` = `"village.path.cta.clicked"`

Fired when a CTA (e.g. button) is clicked

### pathsCtaUpdated

> `readonly` **pathsCtaUpdated**: `"village.paths_cta.updated"` = `"village.paths_cta.updated"`

Fired when the list of CTAs is updated

### userSynced

> `readonly` **userSynced**: `"village.user.synced"` = `"village.user.synced"`

Fired after user graph is successfully synced

### userSyncFailed

> `readonly` **userSyncFailed**: `"village.user.sync.failed"` = `"village.user.sync.failed"`

Fired when user graph sync fails

### widgetError

> `readonly` **widgetError**: `"village.widget.error"` = `"village.widget.error"`

Fired when a general error occurs inside the widget

### widgetReady

> `readonly` **widgetReady**: `"village.widget.ready"` = `"village.widget.ready"`

Fired when the widget (App) is fully initialized and ready

## Example

```ts
Village.on(VillageEvents.pathCtaClicked, (payload) => {
  console.log("CTA clicked:", payload);
});

Village.broadcast(VillageEvents.userSynced, {
  userId: "abc123",
  syncedAt: new Date().toISOString(),
});
```
