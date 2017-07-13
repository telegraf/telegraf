class TelegramError extends Error {
  constructor (payload = {}) {
    super(`${payload.error_code}: ${payload.description}`)

    this.code = payload.error_code
    this.response = payload
    this.description = payload.description
    this.retryAfter = payload.parameters.retry_after
    this.migrateToChatId = payload.parameters.migrate_to_chat_id
  }
}

module.exports = TelegramError
