import { Update } from '../../deps/typegram.ts'
import { MaybePromise } from '../../util.ts'

export namespace WebhookContract {
  export type WebhookContext<R = undefined> = {
    /** Parse the update object */
    update: () => Promise<Update>
    /** Respond with the given JSON body or null and code */
    reply: (json?: string | null, code?: number) => Promise<void>
    /** Whether this request has been responded to */
    done: boolean
    /** Return from the handler */
    returns?: R
  }

  export type Filter = (
    /** Request method. Usually 'POST' */
    method: string,
    /** Request path */
    path: string,
    /** Value of the header x-telegram-bot-api-secret-token if present */
    secret?: string | null
  ) => MaybePromise<boolean>

  export type Contract<Params extends any[] = any[], R = any> = (
    filter: Filter
  ) => (...params: Params) => MaybePromise<WebhookContext<R> | void>
}
