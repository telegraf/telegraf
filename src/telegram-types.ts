/** @format */

import { Message, Opts, Telegram, Update } from './core/types/typegram'
import { UnionKeys } from './deunionize'

export { Markup } from './markup'

// tiny helper types
export type ChatAction = Opts<'sendChatAction'>['action']

// extra types
/**
 * Create an `Extra*` type from the arguments of a given method `M extends keyof Telegram` but `Omit`ting fields with key `K` from it.
 *
 * Note that `chat_id` may not be specified in `K` because it is `Omit`ted by default.
 */
type MakeExtra<
  M extends keyof Telegram,
  K extends keyof Omit<Opts<M>, 'chat_id'> = never
> = Omit<Opts<M>, 'chat_id' | K>

export type ExtraAddStickerToSet = MakeExtra<
  'addStickerToSet',
  'name' | 'user_id'
>
export type ExtraAnimation = MakeExtra<'sendAnimation', 'animation'>
export type ExtraAnswerCbQuery = MakeExtra<
  'answerCallbackQuery',
  'text' | 'callback_query_id'
>
export type ExtraAnswerInlineQuery = MakeExtra<
  'answerInlineQuery',
  'inline_query_id' | 'results'
>
export type ExtraAudio = MakeExtra<'sendAudio', 'audio'>
export type ExtraContact = MakeExtra<
  'sendContact',
  'phone_number' | 'first_name'
>
export type ExtraCopyMessage = MakeExtra<
  'copyMessage',
  'from_chat_id' | 'message_id'
>
export type ExtraCreateChatInviteLink = MakeExtra<'createChatInviteLink'>
export type ExtraCreateNewStickerSet = MakeExtra<
  'createNewStickerSet',
  'name' | 'title' | 'user_id'
>
export type ExtraDice = MakeExtra<'sendDice'>
export type ExtraDocument = MakeExtra<'sendDocument', 'document'>
export type ExtraEditChatInviteLink = MakeExtra<
  'editChatInviteLink',
  'invite_link'
>
export type ExtraEditMessageCaption = MakeExtra<
  'editMessageCaption',
  'message_id' | 'inline_message_id' | 'caption'
>
export type ExtraEditMessageLiveLocation = MakeExtra<
  'editMessageLiveLocation',
  'message_id' | 'inline_message_id' | 'latitude' | 'longitude'
>
export type ExtraEditMessageMedia = MakeExtra<
  'editMessageMedia',
  'message_id' | 'inline_message_id' | 'media'
>
export type ExtraEditMessageText = MakeExtra<
  'editMessageText',
  'message_id' | 'inline_message_id' | 'text'
>
export type ExtraGame = MakeExtra<'sendGame', 'game_short_name'>
export type NewInvoiceParameters = MakeExtra<
  'sendInvoice',
  | 'disable_notification'
  | 'reply_to_message_id'
  | 'allow_sending_without_reply'
  | 'reply_markup'
>
export type ExtraInvoice = MakeExtra<'sendInvoice', keyof NewInvoiceParameters>
export type ExtraKickChatMember = MakeExtra<
  'kickChatMember',
  'user_id' | 'until_date'
>
export type ExtraLocation = MakeExtra<'sendLocation', 'latitude' | 'longitude'>
export type ExtraMediaGroup = MakeExtra<'sendMediaGroup', 'media'>
export type ExtraPhoto = MakeExtra<'sendPhoto', 'photo'>
export type ExtraPoll = MakeExtra<'sendPoll', 'question' | 'options' | 'type'>
export type ExtraPromoteChatMember = MakeExtra<'promoteChatMember', 'user_id'>
export type ExtraReplyMessage = MakeExtra<'sendMessage', 'text'>
export type ExtraRestrictChatMember = MakeExtra<'restrictChatMember', 'user_id'>
export type ExtraSetMyCommands = MakeExtra<'setMyCommands', 'commands'>
export type ExtraSetWebhook = MakeExtra<'setWebhook', 'url'>
export type ExtraSticker = MakeExtra<'sendSticker', 'sticker'>
export type ExtraStopPoll = MakeExtra<'stopPoll', 'message_id'>
export type ExtraVenue = MakeExtra<
  'sendVenue',
  'latitude' | 'longitude' | 'title' | 'address'
>
export type ExtraVideo = MakeExtra<'sendVideo', 'video'>
export type ExtraVideoNote = MakeExtra<'sendVideoNote', 'video_note'>
export type ExtraVoice = MakeExtra<'sendVoice', 'voice'>

// types used for inference of ctx object

/** Possible update types */
export type UpdateType = Exclude<UnionKeys<Update>, keyof Update>

/** Possible message subtypes. Same as the properties on a message object */
export type MessageSubType =
  | 'forward_date'
  | Exclude<
      UnionKeys<Message>,
      keyof Message.CaptionableMessage | 'entities' | 'media_group_id'
    >

type ExtractPartial<T extends object, U extends object> = T extends unknown
  ? Required<T> extends U
    ? T
    : never
  : never

/**
 * Maps [[`Composer.on`]]'s `updateType` or `messageSubType` to a `tt.Update` subtype.
 */
export type MountMap = {
  [T in UpdateType]: Extract<Update, Record<T, object>>
} &
  {
    [T in MessageSubType]: {
      message: ExtractPartial<
        Update.MessageUpdate['message'],
        Record<T, unknown>
      >
      update_id: number
    }
  }
