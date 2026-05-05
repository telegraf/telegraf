import type {
  CallbackQuery,
  CommonMessageBundle,
  Message,
  Update,
} from '@telegraf/types'
import { DistinctKeys, KeyedDistinct, Guarded } from './core/helpers/util'

export type Filter<U extends Update> = (update: Update) => update is U

export { Guarded }

export type AllGuarded<Fs extends Filter<Update>[]> = Fs extends [
  infer A,
  ...infer B,
]
  ? B extends []
    ? Guarded<A>
    : // TS doesn't know otherwise that B is Filter[]
      B extends Filter<Update>[]
      ? Guarded<A> & AllGuarded<B>
      : never
  : never

export const message =
  <Ks extends DistinctKeys<Message>[]>(...keys: Ks) =>
  (
    update: Update
  ): update is Update.MessageUpdate<KeyedDistinct<Message, Ks[number]>> => {
    if (!('message' in update)) return false
    for (const key of keys) {
      if (!(key in update.message)) return false
    }
    return true
  }

export const editedMessage =
  <Ks extends DistinctKeys<CommonMessageBundle>[]>(...keys: Ks) =>
  (
    update: Update
  ): update is Update.EditedMessageUpdate<
    KeyedDistinct<CommonMessageBundle, Ks[number]>
  > => {
    if (!('edited_message' in update)) return false
    for (const key of keys) {
      if (!(key in update.edited_message)) return false
    }
    return true
  }

export const channelPost =
  <Ks extends DistinctKeys<Message>[]>(...keys: Ks) =>
  (
    update: Update
  ): update is Update.ChannelPostUpdate<KeyedDistinct<Message, Ks[number]>> => {
    if (!('channel_post' in update)) return false
    for (const key of keys) {
      if (!(key in update.channel_post)) return false
    }
    return true
  }

export const editedChannelPost =
  <Ks extends DistinctKeys<CommonMessageBundle>[]>(...keys: Ks) =>
  (
    update: Update
  ): update is Update.EditedChannelPostUpdate<
    KeyedDistinct<CommonMessageBundle, Ks[number]>
  > => {
    if (!('edited_channel_post' in update)) return false
    for (const key of keys) {
      if (!(key in update.edited_channel_post)) return false
    }
    return true
  }

export const callbackQuery =
  <Ks extends DistinctKeys<CallbackQuery>[]>(...keys: Ks) =>
  (
    update: Update
  ): update is Update.CallbackQueryUpdate<
    KeyedDistinct<CallbackQuery, Ks[number]>
  > => {
    if (!('callback_query' in update)) return false
    for (const key of keys) {
      if (!(key in update.callback_query)) return false
    }
    return true
  }

/** Any of the provided filters must match */
export const anyOf =
  <Us extends Update[]>(
    ...filters: {
      [UIdx in keyof Us]: Filter<Us[UIdx]>
    }
  ) =>
  (update: Update): update is Us[number] => {
    for (const filter of filters) if (filter(update)) return true
    return false
  }

/** All of the provided filters must match */
export const allOf =
  <U extends Update, Fs extends Filter<U>[]>(...filters: Fs) =>
  (update: Update): update is AllGuarded<Fs> => {
    for (const filter of filters) if (!filter(update)) return false
    return true
  }
