module.exports = {
  updateTypes: [
    'message',
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
  chatMethods: [
    { name: 'reply', target: 'sendMessage' },
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
  ]
}
