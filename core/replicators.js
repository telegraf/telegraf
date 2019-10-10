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
      text: entities.reduceRight(applyEntity, message.text)
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
      caption: entities.reduceRight(applyEntity, message.caption),
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
      caption: entities.reduceRight(applyEntity, message.caption),
      parse_mode: entities.length > 0 ? 'HTML' : ''
    }
  },
  video: (message) => {
    const entities = message.caption_entities || []
    return {
      reply_markup: message.reply_markup,
      video: message.video.file_id,
      thumb: message.video.thumb,
      caption: entities.reduceRight(applyEntity, message.caption),
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
      caption: entities.reduceRight(applyEntity, message.caption),
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
      caption: entities.reduceRight(applyEntity, message.caption)
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
