var _ = require('lodash')

module.exports = {
  defaultExtensions: {
    photo: 'jpg',
    audio: 'mp3',
    voice: 'ogg',
    sticker: 'webp',
    video: 'mp4'
  },
  updateTypes: [
    'message',
    'edited_message',
    'callback_query',
    'inline_query',
    'chosen_inline_result'
  ],
  messageSubTypes: [
    'text',
    'audio',
    'document',
    'photo',
    'sticker',
    'video',
    'voice',
    'contact',
    'location',
    'venue',
    'new_chat_member',
    'left_chat_member',
    'new_chat_title',
    'new_chat_photo',
    'delete_chat_photo',
    'group_chat_created',
    'supergroup_chat_created',
    'channel_chat_created',
    'migrate_to_chat_id',
    'migrate_from_chat_id',
    'pinned_message'
  ],
  chatShortcuts: [
    { name: 'reply', target: 'sendMessage' },
    { name: 'getChat', target: 'getChat' },
    { name: 'leaveChat', target: 'leaveChat' },
    { name: 'getChatAdministrators', target: 'getChatAdministrators' },
    { name: 'getChatMember', target: 'getChatMember' },
    { name: 'getChatMembersCount', target: 'getChatMembersCount' },
    { name: 'replyWithPhoto', target: 'sendPhoto' },
    { name: 'replyWithAudio', target: 'sendAudio' },
    { name: 'replyWithDocument', target: 'sendDocument' },
    { name: 'replyWithSticker', target: 'sendSticker' },
    { name: 'replyWithVideo', target: 'sendVideo' },
    { name: 'replyWithVoice', target: 'sendVoice' },
    { name: 'replyWithChatAction', target: 'sendChatAction' },
    { name: 'replyWithLocation', target: 'sendLocation' },
    { name: 'replyWithVenue', target: 'sendVenue' },
    { name: 'replyWithContact', target: 'sendContact' }
  ],
  webHookAnswerBlacklist: [
    'getChat',
    'getChatAdministrators',
    'getChatMember',
    'getChatMembersCount',
    'getFile',
    'getFileLink',
    'getMe',
    'getUserProfilePhotos'
  ],
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
  messageExtractors: {
    text: (message) => message.text,
    contact: (message) => message.contact,
    location: (message) => message.location,
    venue: (message) => message.venue,
    voice: (message) => message.voice.file_id,
    audio: (message) => message.audio.file_id,
    video: (message) => message.video.file_id,
    document: (message) => message.document.file_id,
    sticker: (message) => message.sticker.file_id,
    photo: (message) => _.max(message.photo, 'file_size').file_id
  }
}
