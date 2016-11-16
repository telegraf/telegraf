class TelegramError extends Error {
  constructor (payload = {}) {
    super(`${payload.error_code}: ${payload.description}`)
    this.code = payload.error_code
    this.description = payload.description
    this.retryAfter = payload.retry_after
    this.migrateToChaId = payload.migrate_to_chat_id
  }
}

module.exports = TelegramError
