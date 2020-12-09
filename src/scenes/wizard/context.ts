import SceneContextScene, {
  SceneContext,
  SceneSession,
  SceneSessionData,
} from '../context'
import { Middleware } from '../../types'
import { SessionContext } from '../../session'

export interface WizardSession extends SceneSession {
  __scenes: WizardSessionData
}

export interface WizardSessionData extends SceneSessionData {
  cursor: number
}

export type WizardContext = SceneContext &
  SessionContext<WizardSession> & {
    scene: SceneContextScene<WizardContext>
    wizard: WizardContextWizard<WizardContext>
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
