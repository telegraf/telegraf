import * as tt from './telegram.h'


export const updateTypes: Array<string> = [
  'callback_query',
  'channel_post',
  'chosen_inline_result',
  'edited_channel_post',
  'edited_message',
  'inline_query',
  'shipping_query',
  'pre_checkout_query',
  'message',
]

export const messageSubTypes = [
  'voice',
  'video_note',
  'video',
  'venue',
  'text',
  'supergroup_chat_created',
  'successful_payment',
  'sticker',
  'pinned_message',
  'photo',
  'new_chat_title',
  'new_chat_photo',
  'new_chat_members',
  'migrate_to_chat_id',
  'migrate_from_chat_id',
  'location',
  'left_chat_member',
  'invoice',
  'group_chat_created',
  'game',
  'document',
  'delete_chat_photo',
  'contact',
  'channel_chat_created',
  'audio',
]

export interface TelegrafOptions {
  username?: string
}

export class Telegram {
}

export class TelegrafContext {
  options: TelegrafOptions
  tg: Telegram
  update: tt.Update
  updateType: string = 'message' // TODO: review map value to type
  updateSubTypes: Array<string> = []
  contextState: {[key: string]: any} = {}

  constructor(update: tt.Update, telegram: Telegram, options: $Shape<TelegrafOptions>) {
    this.tg = telegram
    this.update = update
    this.options = options

    if ('message' in this.update) {
      this.updateType = 'message'
    }
    else {
      this.updateType = updateTypes.find(key => key in this.update) || 'message'
    }
  }

  me = (): ?string => this.options.username
  telegram = () => this.tg
  message = () => this.update.message
  editedMessage = () => this.update.edited_message
  inlineQuery = () => this.update.inline_query
  // @see https://github.com/telegraf/telegraf/blob/a5ef9c536ffa816090adeb00c610b477e3c089f1/core/context.js#L78

  getState = () => this.contextState

  setState = (value: {[key: string]: any}) => {
    this.contextState = Object.assign({}, value)
  }
}

