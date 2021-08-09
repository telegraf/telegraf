const test = require('ava')
const Telegraf = require('../')
const { Markup } = Telegraf

test('should generate removeKeyboard markup', (t) => {
  const markup = { ...Markup.removeKeyboard() }
  t.deepEqual(markup, { remove_keyboard: true })
})

test('should generate forceReply markup', (t) => {
  const markup = { ...Markup.forceReply() }
  t.deepEqual(markup, { force_reply: true })
})

test('should generate resizeKeyboard markup', (t) => {
  const markup = { ...Markup.keyboard([]).resize() }
  t.deepEqual(markup, { resize_keyboard: true })
})

test('should generate oneTimeKeyboard markup', (t) => {
  const markup = { ...Markup.keyboard([]).oneTime() }
  t.deepEqual(markup, { one_time_keyboard: true })
})

test('should generate selective hide markup', (t) => {
  const markup = { ...Markup.removeKeyboard().selective() }
  t.deepEqual(markup, { remove_keyboard: true, selective: true })
})

test('should generate selective one time keyboard markup', (t) => {
  const markup = { ...Markup.keyboard().selective().oneTime() }
  t.deepEqual(markup, { selective: true, one_time_keyboard: true })
})

test('should generate keyboard markup', (t) => {
  const markup = { ...Markup.keyboard([['one'], ['two', 'three']]) }
  t.deepEqual(markup, {
    keyboard: [
      ['one'],
      ['two', 'three']
    ]
  })
})

test('should generate keyboard markup with default setting', (t) => {
  const markup = { ...Markup.keyboard(['one', 'two', 'three']) }
  t.deepEqual(markup, {
    keyboard: [
      ['one'],
      ['two'],
      ['three']
    ]
  })
})

test('should generate keyboard markup with options', (t) => {
  const markup = { ...Markup.keyboard(['one', 'two', 'three'], { columns: 3 }) }
  t.deepEqual(markup, {
    keyboard: [
      ['one', 'two', 'three']
    ]
  })
})

test('should generate keyboard markup with custom columns', (t) => {
  const markup = { ...Markup.keyboard(['one', 'two', 'three', 'four'], { columns: 3 }) }
  t.deepEqual(markup, {
    keyboard: [
      ['one', 'two', 'three'],
      ['four']
    ]
  })
})

test('should generate keyboard markup with custom wrap fn', (t) => {
  const markup = {
    ...Markup.keyboard(['one', 'two', 'three', 'four'], {
      wrap: (btn, index, currentRow) => index % 2 !== 0
    })
  }
  t.deepEqual(markup, {
    keyboard: [
      ['one'],
      ['two', 'three'],
      ['four']
    ]
  })
})

test('should generate inline keyboard markup with default setting', (t) => {
  const markup = { ...Markup.inlineKeyboard(['one', 'two', 'three', 'four']) }
  t.deepEqual(markup, {
    inline_keyboard: [[
      'one',
      'two',
      'three',
      'four'
    ]]
  })
})

test('should generate extra from keyboard markup', (t) => {
  const markup = { ...Markup.inlineKeyboard(['one', 'two', 'three', 'four']).extra() }
  t.deepEqual(markup, {
    reply_markup: {
      inline_keyboard: [[
        'one',
        'two',
        'three',
        'four'
      ]]
    }
  })
})

test('should generate standart button markup', (t) => {
  const markup = { ...Markup.button('foo') }
  t.deepEqual(markup, { text: 'foo', hide: false })
})

test('should generate cb button markup', (t) => {
  const markup = { ...Markup.callbackButton('foo', 'bar') }
  t.deepEqual(markup, { text: 'foo', callback_data: 'bar', hide: false })
})

test('should generate url button markup', (t) => {
  const markup = { ...Markup.urlButton('foo', 'https://bar.tld') }
  t.deepEqual(markup, { text: 'foo', url: 'https://bar.tld', hide: false })
})

test('should generate location request button markup', (t) => {
  const markup = { ...Markup.locationRequestButton('send location') }
  t.deepEqual(markup, { text: 'send location', request_location: true, hide: false })
})

test('should generate contact request button markup', (t) => {
  const markup = { ...Markup.contactRequestButton('send contact') }
  t.deepEqual(markup, { text: 'send contact', request_contact: true, hide: false })
})

test('should generate switch inline query button markup', (t) => {
  const markup = { ...Markup.switchToChatButton('play now', 'foo') }
  t.deepEqual(markup, { text: 'play now', switch_inline_query: 'foo', hide: false })
})

test('should generate switch inline query button markup for chat', (t) => {
  const markup = { ...Markup.switchToCurrentChatButton('play now', 'foo') }
  t.deepEqual(markup, { text: 'play now', switch_inline_query_current_chat: 'foo', hide: false })
})

test('should generate game button markup', (t) => {
  const markup = { ...Markup.gameButton('play') }
  t.deepEqual(markup, { text: 'play', callback_game: {}, hide: false })
})

test('should generate hidden game button markup', (t) => {
  const markup = { ...Markup.gameButton('play again', true) }
  t.deepEqual(markup, { text: 'play again', callback_game: {}, hide: true })
})

test('should generate markup', (t) => {
  const markup = Markup.formatHTML('strike', [
    {
      offset: 0,
      length: 6,
      type: 'strikethrough'
    }
  ])
  t.deepEqual(markup, '<s>strike</s>')
})

test('should generate multi markup', (t) => {
  const markup = Markup.formatHTML('strike bold', [
    {
      offset: 0,
      length: 6,
      type: 'strikethrough'
    },
    {
      offset: 7,
      length: 4,
      type: 'bold'
    }
  ])
  t.deepEqual(markup, '<s>strike</s> <b>bold</b>')
})

test('should generate nested markup', (t) => {
  const markup = Markup.formatHTML('test', [
    {
      offset: 0,
      length: 4,
      type: 'bold'
    },
    {
      offset: 0,
      length: 4,
      type: 'strikethrough'
    }
  ])
  t.deepEqual(markup, '<b><s>test</s></b>')
})

test('should generate nested multi markup', (t) => {
  const markup = Markup.formatHTML('strikeboldunder', [
    {
      offset: 0,
      length: 15,
      type: 'strikethrough'
    },
    {
      offset: 6,
      length: 9,
      type: 'bold'
    },
    {
      offset: 10,
      length: 5,
      type: 'underline'
    }
  ])
  t.deepEqual(markup, '<s>strike<b>bold<u>under</u></b></s>')
})

test('should generate nested multi markup 2', (t) => {
  const markup = Markup.formatHTML('×11 22 333×      ×С123456×                   ×1 22 333×', [
    {
      offset: 1,
      length: 9,
      type: 'bold'
    },
    {
      offset: 1,
      length: 9,
      type: 'italic'
    },
    {
      offset: 12,
      length: 7,
      type: 'italic'
    },
    {
      offset: 19,
      length: 36,
      type: 'italic'
    },
    {
      offset: 19,
      length: 8,
      type: 'bold'
    }
  ])
  t.deepEqual(markup, '×<b><i>11 22 333</i></b>× <i>     ×С</i><i><b>123456× </b>                  ×1 22 333×</i>')
})

test('should generate correct markup with emojis', (t) => {
  const markup = Markup.formatHTML('bold🙂👨‍👩‍👧‍👧 italic', [
    {
      offset: 0,
      length: 6,
      type: 'bold'
    },
    {
      offset: 18,
      length: 6,
      type: 'italic'
    }
  ])
  t.deepEqual(markup, '<b>bold🙂</b>👨‍👩‍👧‍👧 <i>italic</i>')
})

test('should generate correct markup with HTML tags', (t) => {
  const markup = Markup.formatHTML('<b>bold</b> <i>italic</i>', [
    {
      offset: 3,
      length: 4,
      type: 'bold'
    },
    {
      offset: 15,
      length: 6,
      type: 'italic'
    }
  ])
  t.deepEqual(markup, '&lt;b&gt;<b>bold</b>&lt;/b&gt; &lt;i&gt;<i>italic</i>&lt;/i&gt;')
})
