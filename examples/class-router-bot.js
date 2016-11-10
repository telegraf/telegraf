const Telegraf = require('../')
const bot = new Telegraf(process.env.BOT_TOKEN)

var BotController = class {

	static MainMenuHandler(ctx) {
		return ctx.reply('What can i do for you?', Extra.markup( 
			Markup.keyboard([
				['Search', 'Contact'],
				['Rate us', 'Ads', 'Share'],
			])
			.resize()
		))
	}

	static StartHandler(ctx) {

		const start_message = `Hey buddy, Welcome to our bot.`

		// Reply with markdown format
		ctx.reply(start_message, {parse_mode: 'Markdown'}).then(() => {
		
			// Calling main menu keyboard
			this.MainMenuHandler(ctx)
			
		})
	}

	static StopHandler(ctx) {
		ctx.reply('Stop operation')
	}

}

bot.command('/main', (ctx) => {BotController.MainMenuHandler(ctx)})
bot.command('/start', (ctx) => {BotController.StartHandler(ctx)})
bot.command('/stop', (ctx) => {BotController.StopHandler(ctx)})

bot.startPolling()
