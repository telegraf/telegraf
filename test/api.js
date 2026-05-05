const http = require('http')
const fs = require('fs')
const path = require('path')
const test = require('ava')
const { Input, Telegram } = require('../')

function readTypeFile(name) {
  const typesRoot = path.dirname(require.resolve('@telegraf/types/package.json'))
  return fs.readFileSync(path.join(typesRoot, `${name}.d.ts`), 'utf8')
}

function readMethodsFromTypes() {
  const methods = readTypeFile('methods')
  return [
    ...new Set(
      [...methods.matchAll(/^ {4}([a-z][A-Za-z0-9]+)\(/gm)].map(
        (match) => match[1]
      )
    ),
  ]
}

test('Telegram wraps every typed Bot API method', (t) => {
  const methods = readMethodsFromTypes()
  const missing = methods.filter(
    (method) => typeof Telegram.prototype[method] !== 'function'
  )
  t.deepEqual(missing, [])
})

test('Telegram wrappers call through to matching Bot API methods', (t) => {
  const source = fs.readFileSync(path.join(__dirname, '../src/telegram.ts'), {
    encoding: 'utf8',
  })
  const wrapped = new Set(
    [...source.matchAll(/callApi\('([a-zA-Z0-9]+)'/g)].map(
      (match) => match[1]
    )
  )
  const missing = readMethodsFromTypes().filter((method) => !wrapped.has(method))
  t.deepEqual(missing, [])
})

test('Bot API 9.4-9.6 changelog fields are typed', (t) => {
  const files = {
    manage: readTypeFile('manage'),
    markup: readTypeFile('markup'),
    message: readTypeFile('message'),
    methods: readTypeFile('methods'),
    update: readTypeFile('update'),
  }
  const checks = {
    'User.can_manage_bots': /can_manage_bots\?: true/.test(files.manage),
    'UserFromGetMe.allows_users_to_create_topics':
      /allows_users_to_create_topics\?: boolean/.test(files.manage),
    KeyboardButtonRequestManagedBot:
      /interface KeyboardButtonRequestManagedBot/.test(files.markup),
    'KeyboardButton.request_managed_bot':
      /request_managed_bot: KeyboardButtonRequestManagedBot/.test(files.markup),
    ManagedBotCreated: /interface ManagedBotCreated/.test(files.manage),
    'Message.managed_bot_created':
      /managed_bot_created: ManagedBotCreated/.test(files.message),
    ManagedBotUpdated: /interface ManagedBotUpdated/.test(files.manage),
    'Update.managed_bot': /managed_bot: ManagedBotUpdated/.test(files.update),
    PreparedKeyboardButton: /interface PreparedKeyboardButton/.test(
      files.markup
    ),
    'Poll.correct_option_ids': /correct_option_ids\?: number\[\]/.test(
      files.message
    ),
    'sendPoll.correct_option_ids': /correct_option_ids\?: number\[\]/.test(
      files.methods
    ),
    'sendPoll.allows_revoting': /allows_revoting\?: boolean/.test(
      files.methods
    ),
    'sendPoll.shuffle_options': /shuffle_options\?: boolean/.test(
      files.methods
    ),
    'sendPoll.allow_adding_options': /allow_adding_options\?: boolean/.test(
      files.methods
    ),
    'sendPoll.hide_results_until_closes':
      /hide_results_until_closes\?: boolean/.test(files.methods),
    'PollOption.persistent_id': /persistent_id: string/.test(files.message),
    'PollAnswer.option_persistent_ids':
      /option_persistent_ids: string\[\]/.test(files.message),
    'PollOption.added_by_user': /added_by_user\?: User/.test(files.message),
    'PollOption.added_by_chat': /added_by_chat\?: Chat/.test(files.message),
    'PollOption.addition_date': /addition_date\?: number/.test(files.message),
    PollOptionAdded: /interface PollOptionAdded/.test(files.message),
    'Message.poll_option_added': /poll_option_added: PollOptionAdded/.test(
      files.message
    ),
    PollOptionDeleted: /interface PollOptionDeleted/.test(files.message),
    'Message.poll_option_deleted': /poll_option_deleted: PollOptionDeleted/.test(
      files.message
    ),
    'ReplyParameters.poll_option_id': /poll_option_id\?: string/.test(
      files.message
    ),
    'Message.reply_to_poll_option_id':
      /reply_to_poll_option_id\?: string/.test(files.message),
    'MessageEntity.date_time': /type: "date_time"/.test(files.message),
    'Checklist date_time entities':
      /InputChecklistTask[\s\S]*MessageEntity\.DateTime/.test(files.message) &&
      /InputChecklist[\s\S]*MessageEntity\.DateTime/.test(files.message),
    'ChatMemberMember.tag':
      /interface ChatMemberMember[\s\S]*tag\?: string/.test(files.manage),
    'ChatMemberRestricted.tag':
      /interface ChatMemberRestricted[\s\S]*tag\?: string/.test(files.manage),
    'ChatMemberRestricted.can_edit_tag':
      /interface ChatMemberRestricted[\s\S]*can_edit_tag\?: boolean/.test(
        files.manage
      ),
    'ChatPermissions.can_edit_tag':
      /interface ChatPermissions[\s\S]*can_edit_tag\?: boolean/.test(
        files.manage
      ),
    'ChatAdministratorRights.can_manage_tags':
      /interface ChatAdministratorRights[\s\S]*can_manage_tags\?: boolean/.test(
        files.manage
      ),
    'ChatMemberAdministrator.can_manage_tags':
      /interface ChatMemberAdministrator[\s\S]*can_manage_tags\?: boolean/.test(
        files.manage
      ),
    'promoteChatMember.can_manage_tags':
      /promoteChatMember\(args: {[\s\S]*can_manage_tags\?: boolean/.test(
        files.methods
      ),
    'Message.sender_tag': /sender_tag\?: string/.test(files.message),
    'KeyboardButton icon and style':
      /icon_custom_emoji_id\?: string/.test(files.markup) &&
      /style\?: "danger" \| "success" \| "primary"/.test(files.markup),
    'ChatOwnerLeft/Changed':
      /interface ChatOwnerLeft/.test(files.manage) &&
      /interface ChatOwnerChanged/.test(files.manage),
    VideoQuality: /interface VideoQuality/.test(files.message),
    'ChatFullInfo.first_profile_audio':
      /first_profile_audio\?: Audio/.test(files.manage),
    UserProfileAudios: /interface UserProfileAudios/.test(files.manage),
    'UniqueGiftModel.rarity': /rarity\?: "uncommon"/.test(files.manage),
    'UniqueGift.is_burned': /is_burned\?: true/.test(files.manage),
  }
  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name)
  t.deepEqual(missing, [])
})

test('multipart form data serializes nested input files', async (t) => {
  let resolveRequest
  const request = new Promise((resolve) => {
    resolveRequest = resolve
  })
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      resolveRequest({
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      })
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ ok: true, result: true }))
      server.close()
    })
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const telegram = new Telegram('123:abc', {
    apiRoot: `http://127.0.0.1:${port}`,
  })

  await telegram.setMyProfilePhoto({
    photo: {
      type: 'static',
      photo: Input.fromBuffer(Buffer.from('avatar-bytes'), 'avatar.png'),
    },
  })

  const captured = await request
  t.is(captured.url, '/bot123:abc/setMyProfilePhoto')
  t.regex(captured.headers['content-type'], /^multipart\/form-data/)
  const attachment = captured.body.match(/"photo":"attach:\/\/([0-9a-f]+)"/)
  t.truthy(attachment)
  t.true(captured.body.includes(`name="${attachment[1]}"`))
  t.true(captured.body.includes('filename="avatar.png"'))
  t.true(captured.body.includes('avatar-bytes'))
})
