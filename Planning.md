# Telegraf Bot API 9.6 Sync Plan

## Baseline

- Fork: `Leask/telegraf`
- Base branch: `v4`
- Working branch: `bot-api-9.6-sync`
- Types fork: `Leask/types`, branch `bot-api-9.6-sync`
- Target upstream API: Telegram Bot API 9.6, released April 3, 2026

`v4` is the right base for this fork. It is the actively usable Telegraf line,
has the stable public API, and already contains the network/client/runtime shape
users depend on. The `v5` branch is stale and does not provide enough finished
runtime or migration value to justify using it as the base for an API sync.

## Branch And PR Intake

Merged or cherry-picked:

- `feat/api-7.2`: useful API 7.2 work and dependency updates.
- PR #2017, API 7.3-7.8: useful API coverage, without keeping unrelated version
  bump churn.
- PR #1992: JSON object payloads in multipart form data.
- PR #2020: thumbnail upload handling.
- PR #2088: safer token redaction while preserving stack traces.
- PR #2087: `Msg` type predicate return types, with conflict resolution against
  business-message support already present in `v4`.
- PR #2086: webhook status code behavior.
- PR #2054: `debug` 4.4.0 upgrade.
- `telegraf/types` PR #13: API 9.3 and 9.4 types.

Skipped:

- PR #2091 custom fetch: useful as a future transport option, but not required
  for Bot API conformance and would widen runtime behavior.
- PR #2028 `whatwg-url` override: maintenance-only and not API coverage.
- PR #1873 `bot.myStatus`: stale convenience feature, not part of API coverage.
- PR #1828 scenes context WIP: explicitly WIP and unrelated to Bot API 9.6.
- `feat-deno`, `feat/fmt-replace`, `feat/delink-context-from-session`, `v5`:
  branch-scale changes that are not necessary for a strict v4 API sync.

## Current Coverage

### Types

`@telegraf/types` is now aligned to Bot API 9.6:

- API 9.3 and 9.4 from upstream PR #13.
- API 9.5 additions:
  - `date_time` message entity.
  - `sendMessageDraft`.
  - member tags and `setChatMemberTag`.
  - `can_manage_tags`, `can_edit_tag`, and related chat/member permissions.
- API 9.6 additions:
  - managed bots types, update, messages, keyboard request, prepared keyboard
    button, token methods.
  - multiple-correct-answer poll fields and `sendPoll` parameters.
  - persistent poll option identifiers and poll option add/delete service
    messages.
  - `ReplyParameters.poll_option_id` and `Message.reply_to_poll_option_id`.

The types package has a method coverage check against the official API:

- Official methods: 169
- Typed methods: 169
- Missing: 0

### Runtime Wrappers

`Telegram` now exposes a callable wrapper for every typed Bot API method. Newer
methods use the direct object-style signature:

```ts
bot.telegram.sendChecklist({
  business_connection_id,
  chat_id,
  checklist,
})
```

This keeps the implementation small, follows the raw Telegram request shape, and
avoids adding a large number of fragile `Extra*` helper types before usage
patterns are clear.

The legacy `getChatMembersCount` wrapper remains for compatibility, while the
official `getChatMemberCount` wrapper is now present.

### Multipart Uploads

The network client now detects `InputFile` values recursively inside arrays and
objects. This is required for newer Telegram payloads such as:

- `InputProfilePhoto`
- story content
- paid media thumbnails
- nested media payloads introduced after the older v4 multipart code was
  written

Nested files are replaced with `attach://...` references and uploaded as separate
multipart parts.

## Verification Gates

Required local checks:

```bash
npm run build
npm test
npm run lint
```

Current status:

- `npm test`: 168 passing
- `npm run lint`: passing

New tests:

- `test/api.js` verifies that `Telegram.prototype` exposes every method declared
  by `@telegraf/types`.
- `test/api.js` verifies that each typed method has a matching `callApi(...)`
  call in `src/telegram.ts`.
- `test/api.js` verifies nested `InputFile` multipart packing through
  `setMyProfilePhoto`.

## Follow-Up Implementation Plan

### 1. Keep API Tracking Mechanical

- Treat `@telegraf/types` as the source of truth for Telegraf runtime method
  coverage.
- On each Telegram Bot API release:
  - update `Leask/types` first;
  - run the official-method diff against `https://core.telegram.org/bots/api`;
  - update type objects, methods, and docs;
  - update `telegraf` to the new types branch or release;
  - let `test/api.js` identify missing runtime wrappers.

### 2. Add Convenience APIs Only After Raw Coverage

- Raw object-style wrappers are mandatory for every official method.
- Positional convenience wrappers are optional and should be added only where
  Telegraf already has an established pattern or where usage is common:
  - send/copy/forward message families;
  - chat administration;
  - sticker methods;
  - callback and inline-query helpers.
- Context shortcuts should follow the same rule. The absence of a context
  shortcut must not block official Bot API support as long as
  `ctx.telegram.<officialMethod>` is available.

### 3. Expand Update And Message Smoke Tests

- Add route tests for update types introduced after Bot API 7.1:
  - `business_connection`
  - `business_message`
  - `edited_business_message`
  - `deleted_business_messages`
  - `purchased_paid_media`
  - `message_reaction`
  - `message_reaction_count`
  - `chat_boost`
  - `removed_chat_boost`
  - `managed_bot`
- Add message subtype route tests for service messages introduced in newer Bot
  API versions:
  - checklist service messages;
  - managed bot creation;
  - poll option added/deleted;
  - chat owner changes;
  - direct message price changes.

### 4. Keep Multipart Tests Growing With New Media Types

- Keep the existing nested `setMyProfilePhoto` test as the baseline.
- Add cases when adding positional convenience helpers for:
  - `postStory`;
  - `editStory`;
  - `setBusinessAccountProfilePhoto`;
  - `replaceStickerInSet`;
  - paid media with nested thumbnail.

### 5. Dependency Policy

- Upgrade dependencies only when required by API support, security, or test
  compatibility.
- Keep Node support aligned with the package `engines` field until a deliberate
  major-version decision is made.
- Do not pull in transport changes like custom fetch until they have a focused
  test plan, because they affect all API calls.

### 6. Secret Handling

- Local debug credentials belong only in ignored files:
  - `.env.local`
  - `telegram.local.json`
- These files are ignored by both Git and npm packaging rules.
- Never commit bot tokens, generated sessions, webhook secrets, or live debug
  payloads.

## Release Checklist

Before opening a PR or tagging a fork release:

1. Re-run the official API method diff for `@telegraf/types`.
2. Re-run `npm test` and `npm run lint`.
3. Confirm `README.md` Bot API badge and feature text match the target version.
4. Confirm `package-lock.json` points at the intended `@telegraf/types` commit.
5. Check `git diff --check`.
6. Check `npm pack --dry-run` and verify ignored local credentials are absent.
