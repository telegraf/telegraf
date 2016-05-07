var Telegraf = require('../lib/telegraf')
var should = require('should')

var baseMessage = {
  chat: {
    id: 1
  }
}

describe('Telegraf', function () {
  describe('core', function () {
    var updateTypes = [
      { type: 'message', prop: 'message', update: { message: baseMessage }},
      { type: 'callback_query', prop: 'callbackQuery', update: { callback_query: { message: baseMessage }}},
      { type: 'inline_query', prop: 'inlineQuery', update: { inline_query: {}}},
      { type: 'chosen_inline_result', prop: 'chosenInlineResult', update: { chosen_inline_result: {} }}
    ]

    updateTypes.forEach(function (test) {
      it('should provide update payload for ' + test.type, function (done) {
        var app = new Telegraf()
        app.on(test.type, function * () {
          this.should.have.property(test.prop)
          done()
        })
        app.handleUpdate(test.update)
      })
    })

    it('should have update payload for message', function (done) {
      var app = new Telegraf()
      app.on('message', function * () {
        this.should.have.property('message')
        done()
      })
      app.handleUpdate({message: baseMessage})
    })

    it('should have shortcuts', function (done) {
      var app = new Telegraf()
      app.on('message', function * () {
        this.should.have.property('reply')
        this.should.have.property('replyWithPhoto')
        this.should.have.property('replyWithAudio')
        this.should.have.property('replyWithDocument')
        this.should.have.property('replyWithSticker')
        this.should.have.property('replyWithVideo')
        this.should.have.property('replyWithVoice')
        this.should.have.property('replyWithChatAction')
        this.should.have.property('replyWithLocation')
        done()
      })
      app.handleUpdate({message: baseMessage})
    })

    it('should share state', function (done) {
      var app = new Telegraf()
      app.on('message', function * (next) {
        this.state.answer = 41
        yield next
      }, function * (next) {
        this.state.answer++
        yield next
      }, function * () {
        this.state.answer.should.be.equal(42)
        done()
      })
      app.handleUpdate({message: baseMessage})
    })

  })

  describe('routing', function () {
    var updateTypes = [
      { type: 'message', update: { message: baseMessage }},
      { type: 'callback_query', update: { callback_query: { message: baseMessage }}},
      { type: 'inline_query', update: { inline_query: {}}},
      { type: 'chosen_inline_result', update: { chosen_inline_result: {} }}
    ]

    updateTypes.forEach(function (test) {
      it('should route ' + test.type, function (done) {
        var app = new Telegraf()
        app.on(test.type, function * () {
          done()
        })
        app.handleUpdate(test.update)
      })
    })

    it('should route many types', function (done) {
      var app = new Telegraf()
      app.on(['chosen_inline_result', 'message'], function * () {
        done()
      })
      app.handleUpdate({message: baseMessage})
    })

    it('should route sub types', function (done) {
      var app = new Telegraf()
      app.on(['text'], function * () {
        done()
      })
      app.handleUpdate({message: Object.assign(baseMessage, {text: 'hello'})})
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
        'new_chat_participant',
        'left_chat_participant',
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
          app.on(test, function * () {
            done()
          })
          var message = baseMessage
          message[test] = {}
          app.handleUpdate({message: message})
        })
      })
    })
  })

  describe('text handling', function () {
    it('should handle text triggers', function (done) {
      var app = new Telegraf()
      app.hears('hello world', function * () {
        done()
      })
      app.handleUpdate({message: Object.assign(baseMessage, {text: 'hello world'})})
    })

    it('should handle regex triggers', function (done) {
      var app = new Telegraf()
      app.hears(/hello (.+)/, function * () {
        this.match[1].should.be.equal('world')
        done()
      })
      app.handleUpdate({message: Object.assign(baseMessage, {text: 'hello world'})})
    })
  })
})
