import * as tt from '../telegram-types'
import Markup from '../markup'
const { formatHTML } = Markup

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
} as const

export function text(
  message: tt.Message.TextMessage
): tt.MakeExtra<'sendMessage'> {
  return {
    reply_markup: message.reply_markup,
    parse_mode: 'HTML',
    text: formatHTML(message.text, message.entities),
  }
}
export function contact(
  message: tt.Message.ContactMessage
): tt.MakeExtra<'sendContact'> {
  return {
    reply_markup: message.reply_markup,
    phone_number: message.contact.phone_number,
    first_name: message.contact.first_name,
    last_name: message.contact.last_name,
  }
}
export function location(
  message: tt.Message.LocationMessage
): tt.MakeExtra<'sendLocation'> {
  return {
    reply_markup: message.reply_markup,
    latitude: message.location.latitude,
    longitude: message.location.longitude,
  }
}
export function venue(
  message: tt.Message.VenueMessage
): tt.MakeExtra<'sendVenue'> {
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
  message: tt.Message.VoiceMessage
): tt.MakeExtra<'sendVoice'> {
  return {
    reply_markup: message.reply_markup,
    voice: message.voice.file_id,
    duration: message.voice.duration,
    caption: formatHTML(message.caption, message.caption_entities),
    parse_mode: 'HTML',
  }
}
export function audio(
  message: tt.Message.AudioMessage
): tt.MakeExtra<'sendAudio'> {
  return {
    reply_markup: message.reply_markup,
    audio: message.audio.file_id,
    thumb: message.audio.thumb?.file_id,
    duration: message.audio.duration,
    performer: message.audio.performer,
    title: message.audio.title,
    caption: formatHTML(message.caption, message.caption_entities),
    parse_mode: 'HTML',
  }
}
export function video(
  message: tt.Message.VideoMessage
): tt.MakeExtra<'sendVideo'> {
  return {
    reply_markup: message.reply_markup,
    video: message.video.file_id,
    thumb: message.video.thumb?.file_id,
    caption: formatHTML(message.caption, message.caption_entities),
    parse_mode: 'HTML',
    duration: message.video.duration,
    width: message.video.width,
    height: message.video.height,
  }
}
export function document(
  message: tt.Message.DocumentMessage
): tt.MakeExtra<'sendDocument'> {
  return {
    reply_markup: message.reply_markup,
    document: message.document.file_id,
    caption: formatHTML(message.caption, message.caption_entities),
    parse_mode: 'HTML',
  }
}
export function sticker(
  message: tt.Message.StickerMessage
): tt.MakeExtra<'sendSticker'> {
  return {
    reply_markup: message.reply_markup,
    sticker: message.sticker.file_id,
  }
}
export function photo(
  message: tt.Message.PhotoMessage
): tt.MakeExtra<'sendPhoto'> {
  return {
    reply_markup: message.reply_markup,
    photo: message.photo[message.photo.length - 1].file_id,
    parse_mode: 'HTML',
    caption: formatHTML(message.caption, message.caption_entities),
  }
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export function video_note(
  message: tt.Message.VideoNoteMessage
): tt.MakeExtra<'sendVideoNote'> {
  return {
    reply_markup: message.reply_markup,
    video_note: message.video_note.file_id,
    thumb: message.video_note.thumb?.file_id,
    length: message.video_note.length,
    duration: message.video_note.duration,
  }
}
export function animation(
  message: tt.Message.AnimationMessage
): tt.MakeExtra<'sendAnimation'> {
  return {
    reply_markup: message.reply_markup,
    animation: message.animation.file_id,
    thumb: message.animation.thumb?.file_id,
    duration: message.animation.duration,
  }
}
export function poll(
  message: tt.Message.PollMessage
): tt.MakeExtra<'sendPoll'> {
  return {
    question: message.poll.question,
    type: message.poll.type,
    is_anonymous: message.poll.is_anonymous,
    allows_multiple_answers: message.poll.allows_multiple_answers,
    correct_option_id: message.poll.correct_option_id,
    options: message.poll.options.map(({ text }) => text),
  }
}
