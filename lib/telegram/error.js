/**
 * Represents a Telegram error.
 */
class TelegramError extends Error {
  constructor (payload) {
    payload = payload || {}
    super(`${payload.error_code}: ${payload.description}`)
    this.code = payload.error_code
    this.description = payload.description
  }
}

module.exports = TelegramError
