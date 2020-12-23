import SceneContextScene, {
  SceneContext,
  SceneSession,
  SceneSessionData,
} from '../context'
import { Middleware } from '../../middleware'
import { SessionContext } from '../../session'

// use type aliases to permit circular defaults
type Z0 = WizardContextWizard<WizardContext>
type S0 = WizardSessionData

export interface WizardSessionData extends SceneSessionData {
  cursor: number
}

export interface WizardSession<S extends WizardSessionData = S0>
  extends SceneSession<S> {}

export type WizardContext<
  Z extends WizardContextWizard<WizardContext> = Z0,
  S extends S0 = S0
> = SceneContext<SceneContextScene<SceneContext>, S> &
  SessionContext<WizardSession> & {
    scene: SceneContextScene<WizardContext<Z, S>>
    wizard: Z
  }

class WizardContextWizard<C extends WizardContext> {
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

export default WizardContextWizard
