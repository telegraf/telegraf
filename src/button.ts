import { InlineKeyboardButton, KeyboardButton } from './core/types/typegram'

type Hideable<B> = B & { hide: boolean }

export function text(
  text: string,
  hide = false
): Hideable<KeyboardButton.CommonButton> {
  return { text, hide }
}

export function contactRequest(
  text: string,
  hide = false
): Hideable<KeyboardButton.RequestContactButton> {
  return { text, request_contact: true, hide }
}

export function locationRequest(
  text: string,
  hide = false
): Hideable<KeyboardButton.RequestLocationButton> {
  return { text, request_location: true, hide }
}

export function pollRequest(
  text: string,
  type?: 'quiz' | 'regular',
  hide = false
): Hideable<KeyboardButton.RequestPollButton> {
  return { text, request_poll: { type }, hide }
}

export function url(
  text: string,
  url: string,
  hide = false
): Hideable<InlineKeyboardButton.UrlButton> {
  return { text, url, hide }
}

export function callback(
  text: string,
  data: string,
  hide = false
): Hideable<InlineKeyboardButton.CallbackButton> {
  return { text, callback_data: data, hide }
}

export function switchToChat(
  text: string,
  value: string,
  hide = false
): Hideable<InlineKeyboardButton.SwitchInlineButton> {
  return { text, switch_inline_query: value, hide }
}

export function switchToCurrentChat(
  text: string,
  value: string,
  hide = false
): Hideable<InlineKeyboardButton.SwitchInlineCurrentChatButton> {
  return { text, switch_inline_query_current_chat: value, hide }
}

export function game(
  text: string,
  hide = false
): Hideable<InlineKeyboardButton.GameButton> {
  return { text, callback_game: {}, hide }
}

export function pay(
  text: string,
  hide = false
): Hideable<InlineKeyboardButton.PayButton> {
  return { text, pay: true, hide }
}

export function login(
  text: string,
  url: string,
  opts: {
    forward_text?: string
    bot_username?: string
    request_write_access?: boolean
  } = {},
  hide = false
): Hideable<InlineKeyboardButton.LoginButton> {
  return {
    text,
    login_url: { ...opts, url },
    hide,
  }
}

export function webApp(
  text: string,
  url: string,
  hide = false
): Hideable<InlineKeyboardButton.WebAppButton> {
  return {
    text,
    web_app: { url },
    hide,
  }
}
