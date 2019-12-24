function applyEntities (text, entities) {
  const chars = [...text]
  const available = [...entities]
  const opened = []
  const result = []
  for (let offset = 0; offset < chars.length; offset++) {
    while (true) {
      const index = available.findIndex((entity) => entity.offset === offset)
      if (index === -1) {
        break
      }
      const entity = available[index]
      switch (entity.type) {
        case 'bold':
          result.push('<b>')
          break
        case 'italic':
          result.push('<i>')
          break
        case 'code':
          result.push('<code>')
          break
        case 'pre':
          result.push('<pre>')
          break
        case 'strikethrough':
          result.push('<s>')
          break
        case 'underline':
          result.push('<u>')
          break
        case 'text_link':
          result.push(`<a href="${entity.url}">`)
          break
      }
      opened.unshift(entity)
      available.splice(index, 1)
    }

    result.push(chars[offset])

    while (true) {
      const index = opened.findIndex((entity) => entity.offset + entity.length - 1 === offset)
      if (index === -1) {
        break
      }
      const entity = opened[index]
      switch (entity.type) {
        case 'bold':
          result.push('</b>')
          break
        case 'italic':
          result.push('</i>')
          break
        case 'code':
          result.push('</code>')
          break
        case 'pre':
          result.push('</pre>')
          break
        case 'strikethrough':
          result.push('</s>')
          break
        case 'underline':
          result.push('</u>')
          break
        case 'text_link':
          result.push('</a>')
          break
      }
      opened.splice(index, 1)
    }
  }
  return result.join('')
}

module.exports = {
  applyEntities,
  copyMethods: {
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
    poll: 'sendPoll'
  },
  text: (message) => {
    const entities = message.entities || []
    return {
      reply_markup: message.reply_markup,
      parse_mode: entities.length > 0 ? 'HTML' : '',
      text: applyEntities(message.text, entities)
    }
  },
  contact: (message) => {
    return {
      reply_markup: message.reply_markup,
      phone_number: message.contact.phone_number,
      first_name: message.contact.first_name,
      last_name: message.contact.last_name
    }
  },
  location: (message) => {
    return {
      reply_markup: message.reply_markup,
      latitude: message.location.latitude,
      longitude: message.location.longitude
    }
  },
  venue: (message) => {
    return {
      reply_markup: message.reply_markup,
      latitude: message.venue.location.latitude,
      longitude: message.venue.location.longitude,
      title: message.venue.title,
      address: message.venue.address,
      foursquare_id: message.venue.foursquare_id
    }
  },
  voice: (message) => {
    const entities = message.caption_entities || []
    return {
      reply_markup: message.reply_markup,
      voice: message.voice.file_id,
      duration: message.voice.duration,
      caption: applyEntities(message.caption, entities),
      parse_mode: entities.length > 0 ? 'HTML' : ''
    }
  },
  audio: (message) => {
    const entities = message.caption_entities || []
    return {
      reply_markup: message.reply_markup,
      audio: message.audio.file_id,
      thumb: message.audio.thumb,
      duration: message.audio.duration,
      performer: message.audio.performer,
      title: message.audio.title,
      caption: applyEntities(message.caption, entities),
      parse_mode: entities.length > 0 ? 'HTML' : ''
    }
  },
  video: (message) => {
    const entities = message.caption_entities || []
    return {
      reply_markup: message.reply_markup,
      video: message.video.file_id,
      thumb: message.video.thumb,
      caption: applyEntities(message.caption, entities),
      parse_mode: entities.length > 0 ? 'HTML' : '',
      duration: message.video.duration,
      width: message.video.width,
      height: message.video.height,
      supports_streaming: !!message.video.supports_streaming
    }
  },
  document: (message) => {
    const entities = message.caption_entities || []
    return {
      reply_markup: message.reply_markup,
      document: message.document.file_id,
      caption: applyEntities(message.caption, entities),
      parse_mode: entities.length > 0 ? 'HTML' : ''
    }
  },
  sticker: (message) => {
    return {
      reply_markup: message.reply_markup,
      sticker: message.sticker.file_id
    }
  },
  photo: (message) => {
    const entities = message.caption_entities || []
    return {
      reply_markup: message.reply_markup,
      photo: message.photo[message.photo.length - 1].file_id,
      parse_mode: entities.length > 0 ? 'HTML' : '',
      caption: applyEntities(message.caption, entities)
    }
  },
  video_note: (message) => {
    return {
      reply_markup: message.reply_markup,
      video_note: message.video_note.file_id,
      thumb: message.video_note.thumb,
      length: message.video_note.length,
      duration: message.video_note.duration
    }
  },
  animation: (message) => {
    return {
      reply_markup: message.reply_markup,
      animation: message.animation.file_id,
      thumb: message.animation.thumb,
      duration: message.animation.duration
    }
  },
  poll: (message) => {
    return {
      question: message.poll.question,
      options: message.poll.options.map(({ text }) => text)
    }
  }
}
