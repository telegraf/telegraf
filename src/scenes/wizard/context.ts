import SceneContextScene, { SceneSession, SceneSessionData } from '../context'
import Context from '../../context'
import { Middleware } from '../../middleware'
import { SessionContext } from '../../session'

export interface WizardContext<D extends WizardSessionData = WizardSessionData>
  extends Context {
  session: WizardSession<D>
  scene: SceneContextScene<WizardContext<D>, D>
  wizard: WizardContextWizard<WizardContext<D>>
}

export interface WizardSessionData extends SceneSessionData {
  cursor: number
}

export interface WizardSession<S extends WizardSessionData = WizardSessionData>
  extends SceneSession<S> {}

export default class WizardContextWizard<
  C extends SessionContext<WizardSession> & {
    scene: SceneContextScene<C, WizardSessionData>
  },
> {
  readonly state: object
  constructor(
    private readonly ctx: C,
    private readonly steps: ReadonlyArray<Middleware<C>>
  ) {
    this.state = ctx.scene.state
    this.cursor = ctx.scene.session.cursor ?? 0
  }

  get step() {
    return this.steps[this.cursor]
  }

  get cursor() {
    return this.ctx.scene.session.cursor
  }

  set cursor(cursor: number) {
    this.ctx.scene.session.cursor = cursor
  }

  selectStep(index: number) {
    this.cursor = index
    return this
  }

  next() {
    return this.selectStep(this.cursor + 1)
  }

  back() {
    return this.selectStep(this.cursor - 1)
  }
}
