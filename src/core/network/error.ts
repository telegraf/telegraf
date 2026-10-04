import { ResponseParameters } from '../types/typegram'

interface ErrorPayload {
  error_code: number
  description: string
  parameters?: ResponseParameters
}

export class TelegrafError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = new.target.name
  }
}

export interface NetworkErrorRequest {
  method: string
  apiRoot: string
  apiMode: string
  testEnv: boolean
}

export interface NetworkErrorOptions {
  cause?: unknown
  code?: string | number
  errorName?: string
  transient?: boolean
}

export class TelegrafNetworkError extends TelegrafError {
  readonly code?: string | number
  readonly errorName?: string
  readonly transient: boolean

  constructor(
    message: string,
    readonly request: NetworkErrorRequest,
    options: NetworkErrorOptions = {}
  ) {
    super(message, { cause: options.cause })
    this.code = options.code
    this.errorName = options.errorName
    this.transient = options.transient ?? false
  }

  get method() {
    return this.request.method
  }
}

export class TelegramError extends TelegrafError {
  constructor(
    readonly response: ErrorPayload,
    readonly on = {}
  ) {
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

export default TelegramError
