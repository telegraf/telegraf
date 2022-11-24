import type { ResponseParameters } from '../../deps/typegram.ts'
import type { Response } from '../../vendor/fetch.ts'

interface ErrorPayload {
  error_code: number
  description: string
  parameters?: ResponseParameters
}
export class TelegramError extends Error {
  constructor(readonly response: ErrorPayload, readonly on = {}) {
    super(`${response.error_code}: ${response.description}`)
  }

  get code() {
    return this.response.error_code
  }

  get description() {
    return this.response.description
  }

  get parameters() {
    return this.response.parameters
  }
}

export class URLStreamError extends Error {
  constructor(readonly res: Response, msg?: string) {
    super(
      msg || `Error ${res.status} while streaming file from URL: ${res.url}`
    )
  }
}

export class TimeoutError extends Error {
  name: string = 'TimeoutError'
  constructor(millis: number) {
    super(
      // TODO: write documentation for why it's bad to have long-running handlers and provide solutions
      `A handler took too long. Promise timed out after ${millis} milliseconds.\n\n` +
        '> This may be a bug in your code.\n' +
        "> If you know what you're doing, pass `new Telegraf(token, { handlerTimeout: 600000 })` (5 minutes in milliseconds) or longer.\n" +
        '> This can cause your bot to slow down!\n'
    )
  }
}

throw new TimeoutError(500)
