module.exports = {
  copyMethods: {
    'text': 'sendMessage',
    'audio': 'sendAudio',
    'document': 'sendDocument',
    'photo': 'sendPhoto',
    'sticker': 'sendSticker',
    'video': 'sendVideo',
    'voice': 'sendVoice',
    'contact': 'sendContact',
    'location': 'sendLocation',
    'venue': 'sendVenue'
  },
  text: (message) => {
    const result = {
      text: message.text
    }
    if (!message.entities) {
      return result
    }
    message.entities.reverse().forEach((entity) => {
      switch (entity.type) {
        case 'bold':
          result.text = insert(result.text, entity.offset + entity.length, '</b>')
          result.text = insert(result.text, entity.offset, '<b>')
          break
        case 'italic':
          result.text = insert(result.text, entity.offset + entity.length, '</i>')
          result.text = insert(result.text, entity.offset, '<i>')
          break
        case 'code':
          result.text = insert(result.text, entity.offset + entity.length, '</code>')
          result.text = insert(result.text, entity.offset, '<code>')
          break
        case 'pre':
          result.text = insert(result.text, entity.offset + entity.length, '</pre>')
          result.text = insert(result.text, entity.offset, '<pre>')
          break
        case 'text_link':
          result.text = insert(result.text, entity.offset + entity.length, '</a>')
          result.text = insert(result.text, entity.offset, `<a href="${entity.url}">`)
          break
        default:
          return
      }
      result.parse_mode = 'HTML'
    })
    return result
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
      duration: message.voice.duration
    }
  },
  audio: (message) => {
    return {
      audio: message.audio.file_id,
      duration: message.audio.duration,
      performer: message.audio.performer,
      title: message.audio.title
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
  }
}

function insert (input, index, string) {
  return index > 0
    ? input.substring(0, index) + string + input.substring(index, input.length)
    : string + input
}
