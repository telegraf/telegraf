
export interface Message {
  message_id: number,
}
export interface EditedMessage {
  message_id: number,
}

export interface InlineQuery {
}

export interface Update {
  message?: Message,
  edited_message?: EditedMessage,
  inline_query?: InlineQuery,
  // @see https://github.com/telegraf/telegraf/blob/a5ef9c536ffa816090adeb00c610b477e3c089f1/core/context.js#L78
}
