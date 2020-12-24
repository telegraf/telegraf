import ApiClient from './core/network/client'
import { TelegramP } from './telegram-types'

type BasicApiClient = Readonly<Pick<ApiClient, 'callApi'>>
export type Telegram2 = Readonly<BasicApiClient & TelegramP>

const proxyHandler: ProxyHandler<BasicApiClient> = {
  get(target, p: keyof Telegram2) {
    if (p === 'callApi') {
      return target.callApi.bind(target)
    }
    return target.callApi.bind(target, p)
  },
  set() {
    return false
  },
  defineProperty() {
    return false
  },
  deleteProperty() {
    return false
  },
  ownKeys() {
    return []
  },
}

export function telegram2(client: BasicApiClient) {
  return new Proxy(client, proxyHandler) as Telegram2
}
