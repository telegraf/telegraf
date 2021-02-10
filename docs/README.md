![Telegraf](media/header.png)

# Introduction

Bots are special [Telegram](https://telegram.org) accounts designed to handle messages automatically. Users can interact with bots by sending them command messages in private or group chats. These accounts serve as an interface for code running somewhere on your server.

## Features

- Full [Telegram Bot API 5.0](https://core.telegram.org/bots/api) support
- [Telegram Payment Platform](https://telegram.org/blog/payments)
- [HTML5 Games](https://core.telegram.org/bots/api#games)
- [Inline mode](https://core.telegram.org/bots/api#inline-mode)
- Incredibly fast
- [now](https://now.sh)/[Firebase](https://firebase.google.com/products/functions/)/[Glitch](https://dashing-light.glitch.me)/[Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction)/[AWS **λ**](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)/Whatever ready
- `http/https/fastify/Connect.js/express.js` compatible webhooks
- Easy to extend
- `TypeScript` typings

## Installation

```bash
npm install telegraf --save
```

or using yarn

```bash
yarn add telegraf
```

## Example
  
```js
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()
```

```js
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('modern', ({ reply }) => reply('Yo'))
bot.command('hipster', Telegraf.reply('λ'))
bot.launch()
```

For additional bot examples see [`examples`](https://github.com/telegraf/telegraf/tree/master/docs/examples) folder.

**Community bots:**

| Name | Description |
| --- | --- |
| [ChatAdmin](https://github.com/Khuzha/chatAdmin) | Helps to administer the chats  |
| [BooksAndBot](https://github.com/dmtrbrl/BooksAndBot) | An inline bot that allows you to search for books and share them in a conversation. Powered by Goodreads  |
| [CaptchaOnlyBot](https://github.com/Piterden/captcha_only_bot) | Configurable question \w set of buttons on a new group user |
| [ChannelHashBot](https://github.com/YouTwitFace/ChannelHashBot) | Keep track of hashtags that are sent in your group by forwarding them to a channel |
| [ChatLinkerBot](https://github.com/jt3k/chat-linker) | The bridge between jabber and telegram |
| [ChessBot](https://github.com/Piterden/chessbot) | Inline chess game in a message |
| [CounterBot](https://github.com/leodj/telegram-counter-bot) | Keep track of multiple counters and increment, decrement, set and reset them to your hearts content  |
| [DefendTheCastle](https://github.com/TiagoDanin/Defend-The-Castle) | Telegram Bot Game - Defend The Castle |
| [EveMoviesBot](https://github.com/dmbaranov/evemovies-bot) | Track movie torrent releases and get notifications when it's there |
| [GNU/LinuxIndonesiaBot](https://github.com/bgli/bglibot-js) | BGLI Bot a.k.a Miranda Salma |
| [GoogleItBot](https://github.com/Edgar-P-yan/google-it-telegram-bot) | Instant inline search |
| [GroupsAdminBot](https://github.com/Azhant/AdminBot) | Telegram groups administrator bot |
| [KitchenTimerBot](https://github.com/DZamataev/kitchen-timer-bot) | Bot for setting up multiple timers for cooking |
| [LyricsGramBot](https://github.com/lioialessandro/LyricsGramBot) | Song Lyrics |
| [MangadexBot](https://github.com/ejnshtein/mangadex_bot) | Read manga from Mangadex |
| [Memcoin](https://github.com/backmeupplz/memcoin) | Memcoin for the Memconomy |
| [MetalArchivesBot](https://github.com/amiralies/metalarchives-telegram-bot) | Unofficial metal-archives.com bot |
| [MidnaBot](https://github.com/wsknorth/midnabot) | Midnabot for telegram |
| [Nyaa.si Bot](https://github.com/ejnshtein/nyaasi-bot) | Nyaa.si torrents |
| [OCRToolBot](https://github.com/Piterden/tesseract-bot) | Tesseract text from image recognition |
| [OneQRBot](https://github.com/Khuzha/oneqrbot) | Scan and generate QR |
| [OrdisPrime](https://github.com/MaxTgr/Ordis-Prime) | A telegram bot helper for warframe |
| [PodSearchBot](https://fazendaaa.github.io/podsearch_bot/) | TypeScript |
| [RandomPassBot](https://github.com/Khuzha/randompassbot) | Generate a password |
| [Randy](https://github.com/backmeupplz/randymbot) | Randy Marsh raffle Telegram bot |
| [ReferalSystem](https://github.com/Khuzha/refbot) | Channels promoter |
| [ScrobblerBot](https://github.com/drvirtuozov/scrobblerBot) | An unofficial Last.fm Scrobbler |
| [Shieldy](https://github.com/backmeupplz/shieldy) | Telegram bot repository |
| [SimpleRegBot](https://github.com/Khuzha/simpleRegBot) | Simple bot for registration users to any event |
| [SpyfallGameBot](https://github.com/verget/telegram-spy-game) | Simple telegram bot for an interesting board game |
| [StickersPlayBot](https://github.com/TiagoDanin/StickersPlayBot) | Search series covers stickers via inline |
| [StoreOfBot](https://github.com/TiagoDanin/StoreOfBot) | Search, explore & discover the bests bots, channel or groups |
| [SyntaxHighlighterBot](https://github.com/piterden/syntax-highlighter-bot) | A code highlighting tool for telegram chats |
| [TelegrafRutrackerTransmission](https://github.com/DZamataev/telegraf-rutracker-transmission) | Bot for searching torrents at Rutracker and add them to your Transmission web service |
| [TelegramTelegrafBot](https://github.com/Finalgalaxy/telegram-telegraf-bot) | Telegram bot example using Telegraf with easy configuration steps |
| [Temply](https://github.com/backmeupplz/temply) |   |
| [TereGramBot](https://github.com/juandjara/TereGramBot) | Simple telegram node bot with a few funny commands |
| [TheGuardBot](https://github.com/TheDevs-Network/the-guard-bot) | Manage a network of related groups |
| [ThemerBot](https://github.com/YouTwitFace/ThemerBot) | Create themes for Telegram based on colors chosen from a picture |
| [TTgram](https://github.com/TiagoDanin/TTgram) | Receive and send Twitters used a Telegram Bot |
| [Voicy](https://github.com/backmeupplz/voicy) |   |
| [Watchy](https://github.com/backmeupplz/watchy) |   |
| [YtSearchBot](https://github.com/Finalgalaxy/yt-search-bot) | Bot to share YouTube fetched videos from any channel |
| [YTubevideoBot](https://github.com/n1ghtw0lff/YTubevideoBot) | Bot created to help you find and share any video from youtube |
| [NodeRSSBot](https://github.com/fengkx/NodeRSSBot) | Bot to subscribe RSS feed which allows many configurations |
| [BibleBot](https://github.com/Kriv-Art/BibleBot) | Bot to get bible verses |
| [BitcoinDogBot](https://github.com/jibital/bitcoin-dog-bot) | Bitcoin prices, Technical analysis and Alerts! |
| Send PR to add link to your bot |   |
