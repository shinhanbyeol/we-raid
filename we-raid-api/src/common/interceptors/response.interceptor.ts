import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { data: T; message: string }> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<{ data: T; message: string }> {
    return next.handle().pipe(map((data) => ({ data, message: 'ok' })))
  }
}
