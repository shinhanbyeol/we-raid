import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const body = exception.getResponse() as Record<string, unknown>

      response.status(status).json({
        code: (body.code as string) ?? `WR-COMMON-${status}`,
        message: (body.message as string) ?? exception.message,
        path: request.url,
      })
    } else {
      this.logger.error(exception)
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: 'WR-COMMON-500',
        message: 'Internal server error',
        path: request.url,
      })
    }
  }
}
