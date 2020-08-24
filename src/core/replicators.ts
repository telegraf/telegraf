import * as tt from '../../typings/telegram-types'
import Markup from '../markup'
const { formatHTML } = Markup

type Replicate<X, K extends keyof (tt.Message & X)> = Required<
  Pick<tt.Message & X, K>
>
type Copy<M extends keyof tt.Telegram> = tt.MakeExtra<M>

export const copyMethods = {
  audio: 'sendAudio',
  contact: 'sendContact',
  document: 'sendDocument',
  location: 'sendLocation',
  photo: 'sendPhoto',
  sticker: 'sendSticker',
  text: 'sendMessage',
  venue: 'sendVenue',
  video: 'sendVideo',
  video_note: 'sendVideoNote',
  animation: 'sendAnimation',
  voice: 'sendVoice',
  poll: 'sendPoll',
}

export function text(
  message: Replicate<tt.ExtraEditMessage, 'entities' | 'reply_markup' | 'text'>
): Copy<'sendMessage'> {
  const entities = message.entities || []
  return {
    reply_markup: message.reply_markup,
    parse_mode: entities.length > 0 ? 'HTML' : undefined,
    text: formatHTML(message.text, entities),
  }
}
export function contact(
  message: Replicate<tt.ExtraContact, 'reply_markup' | 'contact'>
): Copy<'sendContact'> {
  return {
    reply_markup: message.reply_markup,
    phone_number: message.contact.phone_number,
    first_name: message.contact.first_name,
    last_name: message.contact.last_name,
  }
}
export function location(
  message: Replicate<tt.ExtraLocation, 'reply_markup' | 'location'>
): Copy<'sendLocation'> {
  return {
    reply_markup: message.reply_markup,
    latitude: message.location.latitude,
    longitude: message.location.longitude,
  }
}
export function venue(
  message: Replicate<tt.ExtraVenue, 'reply_markup' | 'venue'>
): Copy<'sendVenue'> {
  return {
    reply_markup: message.reply_markup,
    latitude: message.venue.location.latitude,
    longitude: message.venue.location.longitude,
    title: message.venue.title,
    address: message.venue.address,
    foursquare_id: message.venue.foursquare_id,
  }
}
export function voice(
  message: Replicate<
    tt.ExtraVoice,
    'caption_entities' | 'reply_markup' | 'voice' | 'caption'
  >
): Copy<'sendVoice'> {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    voice: message.voice.file_id,
    duration: message.voice.duration,
    caption: formatHTML(message.caption, entities),
    parse_mode: entities.length > 0 ? 'HTML' : undefined,
  }
}
export function audio(
  message: Replicate<
    tt.ExtraAudio,
    'caption_entities' | 'reply_markup' | 'audio' | 'caption'
  >
): Copy<'sendAudio'> {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    audio: message.audio.file_id,
    thumb: message.audio.thumb?.file_id,
    duration: message.audio.duration,
    performer: message.audio.performer,
    title: message.audio.title,
    caption: formatHTML(message.caption, entities),
    parse_mode: entities.length > 0 ? 'HTML' : undefined,
  }
}
export function video(
  message: Replicate<
    tt.ExtraVideo,
    'caption_entities' | 'reply_markup' | 'video' | 'caption'
  >
): Copy<'sendVideo'> {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    video: message.video.file_id,
    thumb: message.video.thumb?.file_id,
    caption: formatHTML(message.caption, entities),
    parse_mode: entities.length > 0 ? 'HTML' : undefined,
    duration: message.video.duration,
    width: message.video.width,
    height: message.video.height,
  }
}
export function document(
  message: Replicate<
    tt.ExtraDocument,
    'caption_entities' | 'reply_markup' | 'document' | 'caption'
  >
): Copy<'sendDocument'> {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    document: message.document.file_id,
    caption: formatHTML(message.caption, entities),
    parse_mode: entities.length > 0 ? 'HTML' : undefined,
  }
}
export function sticker(
  message: Replicate<tt.ExtraSticker, 'reply_markup' | 'sticker'>
): Copy<'sendSticker'> {
  return {
    reply_markup: message.reply_markup,
    sticker: message.sticker.file_id,
  }
}
export function photo(
  message: Replicate<
    tt.ExtraPhoto,
    'caption_entities' | 'reply_markup' | 'photo' | 'caption'
  >
): Copy<'sendPhoto'> {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    photo: message.photo[message.photo.length - 1].file_id,
    parse_mode: entities.length > 0 ? 'HTML' : undefined,
    caption: formatHTML(message.caption, entities),
  }
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export function video_note(
  message: Replicate<tt.ExtraVideoNote, 'reply_markup' | 'video_note'>
): Copy<'sendVideoNote'> {
  return {
    reply_markup: message.reply_markup,
    video_note: message.video_note.file_id,
    thumb: message.video_note.thumb?.file_id,
    length: message.video_note.length,
    duration: message.video_note.duration,
  }
}
export function animation(
  message: Replicate<tt.ExtraAnimation, 'reply_markup' | 'animation'>
): Copy<'sendAnimation'> {
  return {
    reply_markup: message.reply_markup,
    animation: message.animation.file_id,
    thumb: message.animation.thumb?.file_id,
    duration: message.animation.duration,
  }
}
export function poll(
  message: Replicate<tt.ExtraPoll, 'poll'>
): Copy<'sendPoll'> {
  return {
    question: message.poll.question,
    type: message.poll.type,
    is_anonymous: message.poll.is_anonymous,
    allows_multiple_answers: message.poll.allows_multiple_answers,
    correct_option_id: message.poll.correct_option_id,
    options: message.poll.options.map(({ text }) => text),
  }
}
