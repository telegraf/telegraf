import { Deunionize } from './core/helpers/deunionize'
import { indexed } from './core/helpers/util'
import * as tg from './core/types/typegram'

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export const Digit = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
export type Reaction =
  | tg.TelegramEmoji
  | `${Digit}${string}`
  | Deunionize<tg.ReactionType>

export class MessageReactions {
  // this is a lie, proxy will be used to access the properties
  [index: number]: tg.ReactionType

  private constructor(
    public ctx: {
      messageReaction?: tg.Update.MessageReactionUpdate['message_reaction']
    }
  ) {}

  static from(ctx: {
    messageReaction?: tg.Update.MessageReactionUpdate['message_reaction']
  }) {
    return indexed(
      new MessageReactions(ctx),
      function (this: MessageReactions, index) {
        return this.new[index]
      }
    )
  }

  get new() {
    return this.ctx.messageReaction?.new_reaction ?? []
  }

  get old() {
    return this.ctx.messageReaction?.old_reaction ?? []
  }

  static includes(reactions: tg.ReactionType[], reaction: Reaction): boolean {
    if (typeof reaction === 'string')
      if (Digit.has(reaction[0] as string))
          // prettier-ignore
          return reactions.some((r: Deunionize<tg.ReactionType>) => r.custom_emoji_id === reaction)
        else
          // prettier-ignore
          return reactions.some((r: Deunionize<tg.ReactionType>) => r.emoji === reaction)

    return reactions.some((r: Deunionize<tg.ReactionType>) => {
      if (r.type === 'custom_emoji')
        // prettier-ignore
        // assertion is a performance optimisation to skip an unnecessary check
        return (r.custom_emoji_id === reaction.custom_emoji_id)
      else if (r.type === 'emoji')
        // assertion is a performance optimisation to skip an unnecessary check
        return r.emoji === reaction.emoji
    })
  }

  includes(reaction: Reaction): boolean {
    return MessageReactions.includes(this.new, reaction)
  }

  get length(): number {
    return this.new.length
  }

  get added(): tg.ReactionType[] {
    return this.new.filter(
      (reaction) => !MessageReactions.includes(this.old, reaction)
    )
  }

  get removed(): tg.ReactionType[] {
    return this.old.filter(
      (reaction) => !MessageReactions.includes(this.new, reaction)
    )
  }

  get kept(): tg.ReactionType[] {
    return this.new.filter((reaction) =>
      MessageReactions.includes(this.old, reaction)
    )
  }
}
