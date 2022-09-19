import { Update as U, Message as M } from './core/types/typegram'

/**
 * Update types to use with `Context<Update>`.
 * The exact structure of this export may change in the future, or be removed entirely.
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Update {
  export interface Message extends U.MessageUpdate {}
  export interface EditedMessage extends U.EditedMessageUpdate {}
  export interface ChannelPost extends U.ChannelPostUpdate {}
  export interface EditedChannelPost extends U.EditedChannelPostUpdate {}
  export interface InlineQuery extends U.InlineQueryUpdate {}
  export interface ChosenInlineResult extends U.ChosenInlineResultUpdate {}
  export interface CallbackQuery extends U.CallbackQueryUpdate {}
  export interface ShippingQuery extends U.ShippingQueryUpdate {}
  export interface PreCheckoutQuery extends U.PreCheckoutQueryUpdate {}
  export interface Poll extends U.PollUpdate {}
  export interface PollAnswer extends U.PollAnswerUpdate {}
  export interface MyChatMember extends U.MyChatMemberUpdate {}
  export interface ChatMember extends U.ChatMemberUpdate {}
  export interface ChatJoinRequest extends U.ChatJoinRequestUpdate {}

  export type All =
    | Message
    | EditedMessage
    | ChannelPost
    | EditedChannelPost
    | InlineQuery
    | ChosenInlineResult
    | CallbackQuery
    | ShippingQuery
    | PreCheckoutQuery
    | Poll
    | PollAnswer
    | MyChatMember
    | ChatMember
    | ChatJoinRequest

  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Message {
    export type Text = Message & {
      message: M.TextMessage
    }
    export type Captionable = Message & {
      message: M.CaptionableMessage
    }
    export type Media = Message & {
      message: M.MediaMessage
    }
    export type Audio = Message & {
      message: M.AudioMessage
    }
    export type Document = Message & {
      message: M.DocumentMessage
    }
    export type Animation = Message & {
      message: M.AnimationMessage
    }
    export type Photo = Message & {
      message: M.PhotoMessage
    }
    export type Sticker = Message & {
      message: M.StickerMessage
    }
    export type Video = Message & {
      message: M.VideoMessage
    }
    export type VideoNote = Message & {
      message: M.VideoNoteMessage
    }
    export type Voice = Message & {
      message: M.VoiceMessage
    }
    export type Contact = Message & {
      message: M.ContactMessage
    }
    export type Dice = Message & {
      message: M.DiceMessage
    }
    export type Game = Message & {
      message: M.GameMessage
    }
    export type Poll = Message & {
      message: M.PollMessage
    }
    export type Location = Message & {
      message: M.LocationMessage
    }
    export type Venue = Message & {
      message: M.VenueMessage
    }
    export type NewChatMembers = Message & {
      message: M.NewChatMembersMessage
    }
    export type LeftChatMember = Message & {
      message: M.LeftChatMemberMessage
    }
    export type NewChatTitle = Message & {
      message: M.NewChatTitleMessage
    }
    export type NewChatPhoto = Message & {
      message: M.NewChatPhotoMessage
    }
    export type DeleteChatPhoto = Message & {
      message: M.DeleteChatPhotoMessage
    }
    export type GroupChatCreated = Message & {
      message: M.GroupChatCreatedMessage
    }
    export type SupergroupChat = Message & {
      message: M.SupergroupChatCreated
    }
    export type ChannelChatCreated = Message & {
      message: M.ChannelChatCreatedMessage
    }
    export type MessageAutoDeleteTimerChanged = Message & {
      message: M.MessageAutoDeleteTimerChangedMessage
    }
    export type MigrateToChatId = Message & {
      message: M.MigrateToChatIdMessage
    }
    export type MigrateFromChatId = Message & {
      message: M.MigrateFromChatIdMessage
    }
    export type PinnedMessage = Message & {
      message: M.PinnedMessageMessage
    }
    export type Invoice = Message & {
      message: M.InvoiceMessage
    }
    export type SuccessfulPayment = Message & {
      message: M.SuccessfulPaymentMessage
    }
    export type ConnectedWebsite = Message & {
      message: M.ConnectedWebsiteMessage
    }
    export type PassportData = Message & {
      message: M.PassportDataMessage
    }
    export type ProximityAlertTriggered = Message & {
      message: M.ProximityAlertTriggeredMessage
    }
    export type VideoChatScheduled = Message & {
      message: M.VideoChatScheduledMessage
    }
    export type VideoChatStarted = Message & {
      message: M.VideoChatStartedMessage
    }
    export type VideoChatEnded = Message & {
      message: M.VideoChatEndedMessage
    }
    export type VideoChatParticipantsInvited = Message & {
      message: M.VideoChatParticipantsInvitedMessage
    }
    export type WebAppData = Message & {
      message: M.WebAppDataMessage
    }
  }
}

export type Update = Update.All
