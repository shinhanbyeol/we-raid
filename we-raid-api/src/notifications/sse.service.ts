import { Injectable } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'

export interface SseEvent {
  type: string
  data: unknown
}

@Injectable()
export class SseService {
  /** userId → Subject 맵 (연결된 클라이언트 관리) */
  private readonly clients = new Map<string, Subject<MessageEvent>>()

  /** SSE 스트림 구독 — 동일 userId 재연결 시 기존 Subject 교체 */
  subscribe(userId: string): Observable<MessageEvent> {
    this.clients.get(userId)?.complete()

    const subject = new Subject<MessageEvent>()
    this.clients.set(userId, subject)
    return subject.asObservable()
  }

  /** 클라이언트 연결 해제 (close 이벤트 시 호출) */
  disconnect(userId: string) {
    this.clients.get(userId)?.complete()
    this.clients.delete(userId)
  }

  /** 특정 유저에게 이벤트 전송 (연결 중일 때만) */
  push(userId: string, event: SseEvent) {
    const subject = this.clients.get(userId)
    if (subject && !subject.closed) {
      subject.next({ data: event } as unknown as MessageEvent)
    }
  }

  isConnected(userId: string): boolean {
    return this.clients.has(userId)
  }
}
