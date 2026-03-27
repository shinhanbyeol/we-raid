import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
  UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage, type StorageEngine } from 'multer'
import type { Request } from 'express'
import { extname } from 'path'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CharactersService } from './characters.service'
import { CreateCharacterDto } from './dto/create-character.dto'
import { UpdateCharacterDto } from './dto/update-character.dto'
import { QueryCharacterDto } from './dto/query-character.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

interface AuthUser { id: string }

const imageStorage: StorageEngine = diskStorage({
  destination: './uploads',
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    cb(null, `${unique}${extname(file.originalname)}`)
  },
})

@ApiTags('characters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @ApiOperation({ summary: '내 캐릭터 목록 (gameId·isMain 필터)' })
  getMyCharacters(@CurrentUser() user: AuthUser, @Query() query: QueryCharacterDto) {
    return this.charactersService.getMyCharacters(user.id, query)
  }

  @Post()
  @ApiOperation({ summary: '캐릭터 생성' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCharacterDto) {
    return this.charactersService.create(user.id, dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '캐릭터 수정 (본캐/부캐 변경, 본캐 연결 포함)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCharacterDto) {
    return this.charactersService.update(user.id, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '캐릭터 소프트 삭제 (연결 부캐 mainCharId null 처리)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.charactersService.remove(user.id, id)
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: '아바타 이미지 업로드 (최대 5MB, image/*)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage }))
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\// }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const avatarUrl = `/uploads/${file.filename}`
    return this.charactersService.updateAvatar(user.id, id, avatarUrl)
  }

  @Post(':id/spec-image')
  @ApiOperation({ summary: '스펙 인증 이미지 업로드 (최대 5MB, image/*)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage }))
  uploadSpecImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\// }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const specImageUrl = `/uploads/${file.filename}`
    return this.charactersService.updateSpecImage(user.id, id, specImageUrl)
  }
}
