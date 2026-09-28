# Account spaces (schema 3)

`accounts.id` is the permanent identity. `space` and `slot` are only the current two-world projection; never use slot as a global user identifier. `UNIQUE(space, slot)` bounds a space to two users, and each account has one space. The authenticated account is resolved from `account_sessions` on every request.

`backend/accounts.mjs` uses one SQLite connection/file. Existing life/media validation runs against isolated table namespaces (`s<ID>_*`); space 0 retains the original tables for migration. Table rewriting only affects a fixed identifier allowlist and skips quoted literals. All creation, movement, invitation consumption and membership changes use one synchronous `BEGIN IMMEDIATE` transaction. Failed migrations roll back and invalidate the in-memory namespace cache.

Pairing requires an authenticated preview and the confirmed partner ID. The authoritative transaction checks both memberships and the single-use invitation again. Invitations are hashed, expire after 24 hours and are revoked for both members on success. New invitations replace only their creator's prior code.

Pairing and unlinking allocate new spaces rather than reassigning the previous partner's slot in place. World theme, avatar, food, plants, bookshelf, WeRead binding, weather and music hearts move with their owner. Avatar and world theme are distinct from local slot, including when both users choose the same bear.

Before moving, each account receives a visibility-filtered, credential-free history snapshot. Solo records continue in the current save; past relationship records remain in the owner's read-only history, never automatically visible to a future partner. Old namespaces remain retired in the database for data retention, not routable by client input. The history API derives the owner from the session; it accepts no account ID parameter.

Mutation requests carry `X-Planet-Space`. An old page cannot save to a new relationship just because its numeric revision happens to match. Periodic state reads trigger a reload when the space changes; unsaved drafts retain the existing conflict/export flow. Asynchronous media commits check that the source space is still active.

Upgrade imports the original users and hashed sessions once. Paired legacy users keep their original space/state. Two unpaired legacy users are split without implicitly binding. Legacy credentials still log in; pre-upgrade pair codes are deliberately invalidated. Browser-local vocabulary state is copied once to account-specific keys for migrated users.

Back up before upgrading. Backup/restore and password reset support schema 3; restore revokes modern sessions and invites. Rollback to old application code requires restoring the old database too.

Coverage: HTTP multi-account registration/login/CSRF, invitation replacement/self/expiry/confirmation, competing acceptance, third-account isolation, unlink/re-pair, stale writes, legacy paired/unpaired migration/restart, same-avatar resource movement, rollback, SQLite backup and two independent mobile browser contexts.
