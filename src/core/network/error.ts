interface ErrorPayload {
  error_code: number
  description: string
  parameters?: {}
}
class TelegramError extends Error {
  code: number
  response: ErrorPayload
  description: string
  constructor(readonly payload: ErrorPayload, readonly on?: unknown) {
    super(`${payload.error_code}: ${payload.description}`)
    this.code = payload.error_code
    this.response = payload
    this.description = payload.description
  }
}

export = TelegramError
