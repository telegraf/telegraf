require('should')
var Telegraf = require('../lib/telegraf')

var baseMessage = {
  chat: {
    id: 1
  }
}

describe('Telegraf', function () {
  describe('core', function () {
    var updateTypes = [
      { type: 'message', prop: 'message', update: { message: baseMessage } },
      { type: 'edited_message', prop: 'editedMessage', update: { edited_message: baseMessage } },
      { type: 'callback_query', prop: 'callbackQuery', update: { callback_query: { message: baseMessage } } },
      { type: 'inline_query', prop: 'inlineQuery', update: { inline_query: {} } },
      { type: 'chosen_inline_result', prop: 'chosenInlineResult', update: { chosen_inline_result: {} } }
    ]

    updateTypes.forEach(function (test) {
      it('should provide update payload for ' + test.type, function (done) {
        var app = new Telegraf()
        app.on(test.type, (ctx) => {
          ctx.should.have.property(test.prop)
          ctx.should.have.property('updateType')
          ctx.should.have.property('updateSubType')
          ctx.should.have.property('chat')
          ctx.should.have.property('from')
          ctx.should.have.property('state')
          ctx.updateType.should.be.equal(test.type)
          done()
        })
        app.handleUpdate(test.update)
      })
    })

    it('should provide shortcuts for `message` event', function (done) {
      var app = new Telegraf()
      app.on('message', (ctx) => {
        ctx.should.have.property('reply')
        ctx.should.have.property('replyWithPhoto')
        ctx.should.have.property('replyWithMarkdown')
        ctx.should.have.property('replyWithHTML')
        ctx.should.have.property('replyWithAudio')
        ctx.should.have.property('replyWithDocument')
        ctx.should.have.property('replyWithSticker')
        ctx.should.have.property('replyWithVideo')
        ctx.should.have.property('replyWithVoice')
        ctx.should.have.property('replyWithChatAction')
        ctx.should.have.property('replyWithLocation')
        ctx.should.have.property('replyWithVenue')
        ctx.should.have.property('replyWithContact')
        ctx.should.have.property('getChat')
        ctx.should.have.property('leaveChat')
        ctx.should.have.property('getChatAdministrators')
        ctx.should.have.property('getChatMember')
        ctx.should.have.property('getChatMembersCount')
        done()
      })
      app.handleUpdate({message: baseMessage})
    })

    it('should provide shortcuts for `callback_query` event', function (done) {
      var app = new Telegraf()
      app.on('callback_query', (ctx) => {
        ctx.should.have.property('answerCallbackQuery')
        ctx.should.have.property('reply')
        ctx.should.have.property('replyWithMarkdown')
        ctx.should.have.property('replyWithHTML')
        ctx.should.have.property('replyWithPhoto')
        ctx.should.have.property('replyWithAudio')
        ctx.should.have.property('replyWithDocument')
        ctx.should.have.property('replyWithSticker')
        ctx.should.have.property('replyWithVideo')
        ctx.should.have.property('replyWithVoice')
        ctx.should.have.property('replyWithChatAction')
        ctx.should.have.property('replyWithLocation')
        ctx.should.have.property('replyWithVenue')
        ctx.should.have.property('replyWithContact')
        ctx.should.have.property('getChat')
        ctx.should.have.property('leaveChat')
        ctx.should.have.property('getChatAdministrators')
        ctx.should.have.property('getChatMember')
        ctx.should.have.property('getChatMembersCount')
        done()
      })
      app.handleUpdate({callback_query: baseMessage})
    })

    it('should provide shortcuts for `inline_query` event', function (done) {
      var app = new Telegraf()
      app.on('inline_query', (ctx) => {
        ctx.should.have.property('answerInlineQuery')
        done()
      })
      app.handleUpdate({inline_query: baseMessage})
    })

    it('should share state', function (done) {
      var app = new Telegraf()
      app.on('message', (ctx, next) => {
        ctx.state.answer = 41
        return next()
      }, (ctx, next) => {
        ctx.state.answer++
        return next()
      }, (ctx) => {
        ctx.state.answer.should.be.equal(42)
        done()
      })
      app.handleUpdate({message: baseMessage})
    })

    it('should use context extensions', function (done) {
      var app = new Telegraf()
      app.context.db = {
        getUser: () => undefined
      }
      app.on('message', (ctx) => {
        ctx.should.have.property('db')
        ctx.db.should.have.property('getUser')
        done()
      })
      app.handleUpdate({message: baseMessage})
    })

    it('should handle webhook response', function (done) {
      var app = new Telegraf()
      app.on('message', (ctx) => {
        ctx.reply(':)')
      })
      const res = {
        setHeader: () => done(),
        end: () => undefined
      }
      app.handleUpdate({message: baseMessage}, res)
    })
  })

  describe('routing', function () {
    var updateTypes = [
      { type: 'message', update: { message: baseMessage } },
      { type: 'callback_query', update: { callback_query: { message: baseMessage } } },
      { type: 'inline_query', update: { inline_query: {} } },
      { type: 'chosen_inline_result', update: { chosen_inline_result: {} } }
    ]

    updateTypes.forEach(function (test) {
      it('should route ' + test.type, function (done) {
        var app = new Telegraf()
        app.on(test.type, (ctx) => {
          done()
        })
        app.handleUpdate(test.update)
      })
    })

    it('should route many types', function (done) {
      var app = new Telegraf()
      app.on(['chosen_inline_result', 'message'], (ctx) => {
        done()
      })
      app.handleUpdate({inline_query: baseMessage})
      app.handleUpdate({message: baseMessage})
    })

    it('should provide chat and sender info', function (done) {
      var app = new Telegraf()
      app.on(['text', 'message'], (ctx) => {
        ctx.from.id.should.be.equal(42)
        ctx.chat.id.should.be.equal(1)
        done()
      })
      app.handleUpdate({message: Object.assign({from: {id: 42}}, baseMessage)})
    })

    it('should route sub types', function (done) {
      var app = new Telegraf()
      app.on('text', (ctx) => {
        done()
      })
      app.handleUpdate({message: Object.assign({voice: {}}, baseMessage)})
      app.handleUpdate({message: Object.assign({text: 'hello'}, baseMessage)})
    })

    describe('subtypes', function () {
      var tests = [
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
      ]

      tests.forEach(function (test) {
        it('should route ' + test, function (done) {
          var app = new Telegraf()
          app.on(test, (ctx) => {
            done()
          })
          var message = Object.assign({}, baseMessage)
          message[test] = {}
          app.handleUpdate({message: message})
        })
      })
    })
  })

  describe('text handling', function () {
    it('should handle text triggers', function (done) {
      var app = new Telegraf()
      app.hears('hello world', (ctx) => {
        done()
      })
      app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
    })

    it('should handle regex triggers', function (done) {
      var app = new Telegraf()
      app.hears('hi', (ctx) => {
      })
      app.hears(/hello (.+)/, (ctx) => {
        ctx.match[1].should.be.equal('world')
        done()
      })
      app.handleUpdate({message: Object.assign({text: 'Ola!'}, baseMessage)})
      app.handleUpdate({message: Object.assign({text: 'hello world'}, baseMessage)})
    })
  })
})
