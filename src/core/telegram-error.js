
export interface TelegramErrorPayload {
  error_code?: number,
  description?: string,
  response?: TelegramErrorPayload,
  parameters?: {},
  on?: {},
}

const DEFAULT_ERROR_CODE = 9999

export class TelegramError extends Error {
  code: number
  response: TelegramErrorPayload
  parameters: {}
  on: {}

  constructor(payload: TelegramErrorPayload = {}, on: {} = {}) {
    super(`${payload.error_code || DEFAULT_ERROR_CODE}: ${payload.description || ''}`)
    this.name = 'TelegramError'

    this.code = payload.error_code || DEFAULT_ERROR_CODE
    this.response = payload
    this.description = payload.description
    this.parameters = payload.parameters || {}
    this.on = on || {}
  }
}
