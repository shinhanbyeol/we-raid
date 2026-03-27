import { Throttle } from '@nestjs/throttler'

export const ThrottleLogin = () => Throttle({ default: { ttl: 60000, limit: 10 } })
