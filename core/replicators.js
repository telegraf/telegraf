const entityStart = (entity) => {
  switch (entity.type) {
    case 'bold':
    case 'italic':
      return `<${entity.type.charAt(0)}>`
    case 'code':
    case 'pre':
      return `<${entity.type}>`
    case 'text_link':
      return `<a href="${entity.url}">`
  }
  return ''
}

const entityEnd = (entity) => {
  switch (entity.type) {
    case 'bold':
    case 'italic':
      return `</${entity.type.charAt(0)}>`
    case 'code':
    case 'pre':
      return `</${entity.type}>`
    case 'text_link':
      return '</a>'
  }
  return ''
}

const applyEntity = (text, entity) => text
  .splice(entity.offset + entity.length, 0, entityEnd(entity))
  .splice(entity.offset, 0, entityStart(entity))

module.exports = {
  copyMethods: new Proxy({}, {
    get (target, property, receiver) {
      return property === 'text'
        ? 'sendMessage'
        : `send_${property}`.replace(/_([a-z])/g, ($0, $1) => $1.toUpperCase())
    }
  }),
  text: (message) => ({
    parse_mode: 'HTML',
    text: message.entities && message.entities.reduceRight(
      applyEntity,
      message.text
    ) || []
  }),
  contact: (message) => ({
    phone_number: message.contact.phone_number,
    first_name: message.contact.first_name,
    last_name: message.contact.last_name
  }),
  location: (message) => ({
    latitude: message.location.latitude,
    longitude: message.location.longitude
  }),
  venue: (message) => ({
    latitude: message.venue.location.latitude,
    longitude: message.venue.location.longitude,
    title: message.venue.title,
    address: message.venue.address,
    foursquare_id: message.venue.foursquare_id
  }),
  voice: (message) => ({
    voice: message.voice.file_id,
    duration: message.voice.duration,
    caption: message.caption
  }),
  audio: (message) => ({
    audio: message.audio.file_id,
    duration: message.audio.duration,
    performer: message.audio.performer,
    title: message.audio.title,
    caption: message.caption
  }),
  video: (message) => ({
    video: message.video.file_id,
    caption: message.caption,
    duration: message.video.duration,
    width: message.video.width,
    height: message.video.height
  }),
  document: (message) => ({
    document: message.document.file_id,
    caption: message.caption
  }),
  sticker: (message) => ({
    sticker: message.sticker.file_id
  }),
  photo: (message) => ({
    photo: message.photo[message.photo.length - 1].file_id,
    caption: message.caption
  }),
  video_note: (message) => ({
    video_note: message.video_note.file_id,
    length: message.video_note.length,
    duration: message.video_note.duration
  })
}
