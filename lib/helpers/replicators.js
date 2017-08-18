function insert (input, index, string) {
  return index > 0
    ? input.substring(0, index) + string + input.substring(index, input.length)
    : string + input
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
    if (!message.entities) {
      return { text: message.text }
    }
    const text = message.entities.reduceRight((entity, acc) => {
      switch (entity.type) {
        case 'bold':
          return insert(insert(acc, entity.offset + entity.length, '</b>'), entity.offset, '<b>')
        case 'italic':
          return insert(insert(acc, entity.offset + entity.length, '</i>'), entity.offset, '<i>')
        case 'code':
          return insert(insert(acc, entity.offset + entity.length, '</code>'), entity.offset, '<code>')
        case 'pre':
          return insert(insert(acc, entity.offset + entity.length, '</pre>'), entity.offset, '<pre>')
        case 'text_link':
          return insert(insert(acc, entity.offset + entity.length, '</a>'), entity.offset, `<a href="${entity.url}">`)
      }
      return acc
    }, message.text)
    return { text, parse_mode: 'HTML' }
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
