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
}
export function text(message) {
  const entities = message.entities || []
  return {
    reply_markup: message.reply_markup,
    parse_mode: entities.length > 0 ? 'HTML' : '',
    text: formatHTML(message.text, entities),
  }
}
export function contact(message) {
  return {
    reply_markup: message.reply_markup,
    phone_number: message.contact.phone_number,
    first_name: message.contact.first_name,
    last_name: message.contact.last_name,
  }
}
export function location(message) {
  return {
    reply_markup: message.reply_markup,
    latitude: message.location.latitude,
    longitude: message.location.longitude,
  }
}
export function venue(message) {
  return {
    reply_markup: message.reply_markup,
    latitude: message.venue.location.latitude,
    longitude: message.venue.location.longitude,
    title: message.venue.title,
    address: message.venue.address,
    foursquare_id: message.venue.foursquare_id,
  }
}
export function voice(message) {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    voice: message.voice.file_id,
    duration: message.voice.duration,
    caption: formatHTML(message.caption, entities),
    parse_mode: entities.length > 0 ? 'HTML' : '',
  }
}
export function audio(message) {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    audio: message.audio.file_id,
    thumb: message.audio.thumb,
    duration: message.audio.duration,
    performer: message.audio.performer,
    title: message.audio.title,
    caption: formatHTML(message.caption, entities),
    parse_mode: entities.length > 0 ? 'HTML' : '',
  }
}
export function video(message) {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    video: message.video.file_id,
    thumb: message.video.thumb,
    caption: formatHTML(message.caption, entities),
    parse_mode: entities.length > 0 ? 'HTML' : '',
    duration: message.video.duration,
    width: message.video.width,
    height: message.video.height,
    supports_streaming: !!message.video.supports_streaming,
  }
}
export function document(message) {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    document: message.document.file_id,
    caption: formatHTML(message.caption, entities),
    parse_mode: entities.length > 0 ? 'HTML' : '',
  }
}
export function sticker(message) {
  return {
    reply_markup: message.reply_markup,
    sticker: message.sticker.file_id,
  }
}
export function photo(message) {
  const entities = message.caption_entities || []
  return {
    reply_markup: message.reply_markup,
    photo: message.photo[message.photo.length - 1].file_id,
    parse_mode: entities.length > 0 ? 'HTML' : '',
    caption: formatHTML(message.caption, entities),
  }
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export function video_note(message) {
  return {
    reply_markup: message.reply_markup,
    video_note: message.video_note.file_id,
    thumb: message.video_note.thumb,
    length: message.video_note.length,
    duration: message.video_note.duration,
  }
}
export function animation(message) {
  return {
    reply_markup: message.reply_markup,
    animation: message.animation.file_id,
    thumb: message.animation.thumb,
    duration: message.animation.duration,
  }
}
export function poll(message) {
  return {
    question: message.poll.question,
    type: message.poll.type,
    is_anonymous: message.poll.is_anonymous,
    allows_multiple_answers: message.poll.allows_multiple_answers,
    correct_option_id: message.poll.correct_option_id,
    options: message.poll.options.map(({ text }) => text),
  }
}
