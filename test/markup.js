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

test('should generate nested multi markup 3', (t) => {
  const markup = Markup.formatHTML('bold-italic:\nbold-italic\nbold-italic\n\nbold-underline:\nbold-underline\nbold-underline\n\nbold, bold\nitalic, italic\nunderline, underline\nstrikethrough, strikethrough, strikethrough\nbolditalic bolditalic bold strikethroughunderline italic boldbold\ninline URL\ninline mention of a user\ninline fixed-width code\npre-formatted fixed-width code block\npre-formatted fixed-width code block written in the Python programming language', [
    {
      offset: 13,
      length: 11,
      type: 'bold'
    },
    {
      offset: 13,
      length: 11,
      type: 'italic'
    },
    {
      offset: 25,
      length: 11,
      type: 'bold'
    },
    {
      offset: 25,
      length: 11,
      type: 'italic'
    },
    {
      offset: 54,
      length: 14,
      type: 'bold'
    },
    {
      offset: 54,
      length: 14,
      type: 'underline'
    },
    {
      offset: 69,
      length: 14,
      type: 'bold'
    },
    {
      offset: 69,
      length: 14,
      type: 'underline'
    },
    {
      offset: 85,
      length: 4,
      type: 'bold'
    },
    {
      offset: 91,
      length: 4,
      type: 'bold'
    },
    {
      offset: 96,
      length: 6,
      type: 'italic'
    },
    {
      offset: 104,
      length: 6,
      type: 'italic'
    },
    {
      offset: 111,
      length: 9,
      type: 'underline'
    },
    {
      offset: 122,
      length: 9,
      type: 'underline'
    },
    {
      offset: 132,
      length: 13,
      type: 'strikethrough'
    },
    {
      offset: 147,
      length: 13,
      type: 'strikethrough'
    },
    {
      offset: 162,
      length: 13,
      type: 'strikethrough'
    },
    {
      offset: 176,
      length: 4,
      type: 'bold'
    },
    {
      offset: 180,
      length: 11,
      type: 'bold'
    },
    {
      offset: 180,
      length: 11,
      type: 'italic'
    },
    {
      offset: 191,
      length: 25,
      type: 'bold'
    },
    {
      offset: 191,
      length: 25,
      type: 'italic'
    },
    {
      offset: 191,
      length: 25,
      type: 'strikethrough'
    },
    {
      offset: 216,
      length: 25,
      type: 'bold'
    },
    {
      offset: 216,
      length: 21,
      type: 'italic'
    },
    {
      offset: 216,
      length: 21,
      type: 'underline'
    },
    {
      offset: 242,
      length: 10,
      type: 'text_link',
      url: 'http://www.example.com/'
    },
    {
      offset: 278,
      length: 23,
      type: 'code'
    },
    {
      offset: 302,
      length: 36,
      type: 'pre'
    },
    {
      offset: 339,
      length: 79,
      type: 'pre',
      language: 'python'
    }
  ])
  t.deepEqual(markup, 'bold-italic:\n<b><i>bold-italic</i></b>\n<b><i>bold-italic</i></b>\n\nbold-underline:\n<b><u>bold-underline</u></b>\n<b><u>bold-underline</u></b>\n\n<b>bold</b>, <b>bold</b>\n<i>italic</i>, <i>italic</i>\n<u>underline</u>, <u>underline</u>\n<s>strikethrough</s>, <s>strikethrough</s>, <s>strikethrough</s>\n<b>bold</b><b><i>italic bold</i></b><b><i><s>italic bold strikethrough</s></i></b><b><i><u>underline italic bold</u></i>bold</b>\n<a href="http://www.example.com/">inline URL</a>\ninline mention of a user\n<code>inline fixed-width code</code>\n<pre>pre-formatted fixed-width code block</pre>\n<pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>')
})

test('should generate correct HTML with emojis', (t) => {
  const markup = Markup.formatHTML('👨‍👩‍👧‍👦underline 👩‍👩‍👦‍👦bold 👨‍👨‍👦‍👦italic', [
    {
      offset: 0,
      length: 20,
      type: 'underline'
    },
    {
      offset: 21,
      length: 15,
      type: 'bold'
    },
    {
      offset: 37,
      length: 17,
      type: 'italic'
    }
  ])
  t.deepEqual(markup, '<u>👨‍👩‍👧‍👦underline</u> <b>👩‍👩‍👦‍👦bold</b> <i>👨‍👨‍👦‍👦italic</i>')
})
