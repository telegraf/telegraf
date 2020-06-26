import { Context, Stage, WizardScene, Composer } from '.';

const wizardScene = new WizardScene('wizard-scene', {}, (ctx: Context): void => {
	ctx.reply('wizard!');
});

const stage = new Stage([ wizardScene ], { default: 'wizard-scene' });

const composer = new Composer();
composer.use(stage.middleware());
