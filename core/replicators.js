function wrapEntity (content, entity) {
  switch (entity.type) {
    case 'bold':
      return `<b>${content}</b>`
    case 'italic':
      return `<i>${content}</i>`
    case 'code':
      return `<code>${content}</code>`
    case 'pre':
      return `<pre>${content}</pre>`
    case 'text_link':
      return `<a href="${entity.url}">${content}</a>`
    default:
      return content
  }
}

function applyEntity (text, entity) {
  const head = text.substring(0, entity.offset)
  const tail = text.substring(entity.offset + entity.length)
  const content = wrapEntity(text.substring(entity.offset, entity.offset + entity.length), entity)
  return `${head}${content}${tail}`
}

module.exports = {
  copyMethods: {
    'audio': 'sendAudio',
    'contact': 'sendContact',
    'document': 'sendDocument',
    'location': 'sendLocation',
    'photo': 'sendPhoto',
    'sticker': 'sendSticker',
    'text': 'sendMessage',
    'venue': 'sendVenue',
    'video': 'sendVideo',
    'video_note': 'sendVideoNote',
    'voice': 'sendVoice'
  },
  text: (message) => {
    const entities = message.entities || []
    return {
      parse_mode: 'HTML',
      text: entities.reduceRight(applyEntity, message.text)
    }
  },
  contact: (message) => {
    return {
      phone_number: message.contact.phone_number,
      first_name: message.contact.first_name,
      last_name: message.contact.last_name
    }
  },
  location: (message) => {
    return {
      latitude: message.location.latitude,
      longitude: message.location.longitude
    }
  },
  venue: (message) => {
    return {
      latitude: message.venue.location.latitude,
      longitude: message.venue.location.longitude,
      title: message.venue.title,
      address: message.venue.address,
      foursquare_id: message.venue.foursquare_id
    }
  },
  voice: (message) => {
    return {
      voice: message.voice.file_id,
      duration: message.voice.duration,
      caption: message.caption
    }
  },
  audio: (message) => {
    return {
      audio: message.audio.file_id,
      duration: message.audio.duration,
      performer: message.audio.performer,
      title: message.audio.title,
      caption: message.caption
    }
  },
  video: (message) => {
    return {
      video: message.video.file_id,
      caption: message.caption,
      duration: message.video.duration,
      width: message.video.width,
      height: message.video.height
    }
  },
  document: (message) => {
    return {
      document: message.document.file_id,
      caption: message.caption
    }
  },
  sticker: (message) => {
    return {
      sticker: message.sticker.file_id
    }
  },
  photo: (message) => {
    return {
      photo: message.photo[message.photo.length - 1].file_id,
      caption: message.caption
    }
  },
  video_note: (message) => {
    return {
      video_note: message.video_note.file_id,
      length: message.video_note.length,
      duration: message.video_note.duration
    }
  }
}
