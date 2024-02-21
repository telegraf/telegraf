import { Deunionize } from './core/helpers/deunionize'
import { indexed } from './core/helpers/util'
import * as tg from './core/types/typegram'

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export const Digit = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
export type Reaction =
  | tg.TelegramEmoji
  | `${Digit}${string}`
  | Deunionize<tg.ReactionType>

type ReactionCtx = { update: Partial<tg.Update.MessageReactionUpdate> }

const inspectReaction = (reaction: tg.ReactionType) => {
  if (reaction.type === 'custom_emoji')
    return `Custom(${reaction.custom_emoji_id})`
  else return reaction.emoji
}

export class ReactionList {
  // this is a lie, proxy will be used to access the properties
  [index: number]: Deunionize<tg.ReactionType>

  protected constructor(protected list: tg.ReactionType[]) {}

  static fromArray(list: tg.ReactionType[] = []): ReactionList {
    return indexed(
      new ReactionList(list),
      function (this: ReactionList, index) {
        return this.list[index]
      }
    )
  }

  static has(reactions: tg.ReactionType[], reaction: Reaction): boolean {
    if (typeof reaction === 'string')
      if (Digit.has(reaction[0] as string))
        return reactions.some(
          (r: Deunionize<tg.ReactionType>) => r.custom_emoji_id === reaction
        )
      else
        return reactions.some(
          (r: Deunionize<tg.ReactionType>) => r.emoji === reaction
        )

    return reactions.some((r: Deunionize<tg.ReactionType>) => {
      if (r.type === 'custom_emoji')
        return r.custom_emoji_id === reaction.custom_emoji_id
      else if (r.type === 'emoji') return r.emoji === reaction.emoji
    })
  }

  toArray(): tg.ReactionType[] {
    return [...this.list]
  }

  filter(
    filterFn: (value: tg.ReactionType, index: number) => boolean
  ): ReactionList {
    return ReactionList.fromArray(this.list.filter(filterFn))
  }

  has(reaction: Reaction): boolean {
    return ReactionList.has(this.list, reaction)
  }

  get count(): number {
    return this.list.length
  }

  [Symbol.iterator]() {
    return this.list[Symbol.iterator]()
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    const flattened = this.list.map(inspectReaction).join(', ')
    return ['ReactionList {', flattened, '}'].join(' ')
  }
}

export class MessageReactions extends ReactionList {
  private constructor(public ctx: ReactionCtx) {
    super(ctx.update.message_reaction?.new_reaction ?? [])
  }

  static from(ctx: ReactionCtx) {
    return indexed(
      new MessageReactions(ctx),
      function (this: MessageReactions, index) {
        return this.list[index]
      }
    )
  }

  get old() {
    return ReactionList.fromArray(
      this.ctx.update.message_reaction?.old_reaction
    )
  }

  get new() {
    return ReactionList.fromArray(
      this.ctx.update.message_reaction?.new_reaction
    )
  }

  get added(): ReactionList {
    return this.new.filter((reaction) => !this.old.has(reaction))
  }

  get removed(): ReactionList {
    return this.old.filter((reaction) => !this.new.has(reaction))
  }

  get kept(): ReactionList {
    return this.new.filter((reaction) => this.old.has(reaction))
  }
}
