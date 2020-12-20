import { ResponseParameters } from '../../telegram-types'

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

export default TelegramError
