import {
  Update as U,
  Message as Msg,
  CommonMessageBundle as CommonMsg,
} from './core/types/typegram'

/**
 * Update types to narrow Context.
 * The exact structure of this export may change in the future, or be removed entirely.
 *
 * Usage:
 *
 * ```TS
 * interface MyCtx<U extends Update = Update> extends Context<U> {
 *   session: { count: number }
 * }
 *
 * const actionHandler = (ctx: MyCtx<Update.CallbackQuery>) => {...};
 * bot.action("forward", actionHandler);
 *
 * const textHandler = (ctx: MyCtx<Update.Message<Message.Text>>) => {...};
 * bot.on("text", textHandler);
 *
 * const editedMessageHandler = (ctx: MyCtx<Update.EditedMessage>) => {...};
 * bot.on("edited_message", editedMessageHandler);
 * ```
 * @experimental
 */
export namespace Update {
  /**
   * Represents a Message update. This can be further narrowed down:
   *
   * ```TS
   * type AnyMsg = Update.Message;
   * type TextMsg = Update.Message<Message.TextMessage>;
   * type AudioMsg = Update.Message<Message.AudioMessage>;
   * ```
   */
  export type Message<Type extends Msg = Msg> =
    // Choose specific Message sub-type
    U.MessageUpdate & { message: Type }

  /**
   * Represents an Edited Message update. This can be further narrowed down:
   *
   * ```TS
   * type AnyMsg = Update.EditedMessage;
   * type TextMsg = Update.EditedMessage<Message.TextMessage>;
   * type AudioMsg = Update.EditedMessage<Message.AudioMessage>;
   * ```
   */
  export type EditedMessage<Type extends CommonMsg = CommonMsg> =
    // Can only be a Common Message sub-type, no Service Messages
    U.EditedMessageUpdate & { edited_message: Type }

  /**
   * Represents a Channel Post update. This can be further narrowed down:
   *
   * ```TS
   * type AnyPost = Update.ChannelPost;
   * type TextPost = Update.ChannelPost<Message.TextMessage>;
   * type AudioPost = Update.ChannelPost<Message.AudioMessage>;
   * ```
   */
  export type ChannelPost<Type extends Msg = Msg> =
    // Choose specific Message sub-type
    U.ChannelPostUpdate & { channel_post: Type }

  /**
   * Represents an Edited ChannelPost update. This can be further narrowed down:
   *
   * ```TS
   * type AnyPost = Update.EditedChannelPost;
   * type TextPost = Update.EditedChannelPost<Message.TextMessage>;
   * type AudioPost = Update.EditedChannelPost<Message.AudioMessage>;
   * ```
   */
  export type EditedChannelPost<Type extends CommonMsg = CommonMsg> =
    // Can only be a Common Message sub-type, no Service Messages
    U.EditedChannelPostUpdate & { edited_channel_post: Type }

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
}

export type Update =
  | Update.Message
  | Update.EditedMessage
  | Update.ChannelPost
  | Update.EditedChannelPost
  | Update.InlineQuery
  | Update.ChosenInlineResult
  | Update.CallbackQuery
  | Update.ShippingQuery
  | Update.PreCheckoutQuery
  | Update.Poll
  | Update.PollAnswer
  | Update.MyChatMember
  | Update.ChatMember
  | Update.ChatJoinRequest
