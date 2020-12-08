interface ErrorPayload {
  error_code: number
  description: string
  parameters?: {}
}
class TelegramError extends Error {
  code: number
  response: ErrorPayload
  description: string
  parameters?: {}
  constructor(payload: ErrorPayload, readonly on = {}) {
    super(`${payload.error_code}: ${payload.description}`)
    this.code = payload.error_code
    this.response = payload
    this.description = payload.description
    this.parameters = payload.parameters
  }
}

export default TelegramError
