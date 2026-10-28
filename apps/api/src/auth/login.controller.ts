import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { idSchema } from '@cro-sport-hub/shared-types'
import { z } from 'zod'
import { CREDENTIAL_STORE, type CredentialOpener } from './auth.module.js'
import { InvalidCredentials, login as signIn, readJwtSecret } from './auth.js'

const tokenSchema = z.object({ token: z.string() })
const loginBody = z.strictObject({
  id: idSchema,
  password: z.string().min(1).max(72),
})

@ApiTags('auth')
@Controller('api')
export class LoginController {
  constructor(@Inject(CREDENTIAL_STORE) private readonly openStore: CredentialOpener) {}

  @Post('login')
  @HttpCode(200) // Nest's default for POST is 201.
  @ApiOperation({ summary: 'Log in as a seeded studio user' })
  @ApiOkResponse({ description: 'Signed JWT.', standardSchema: tokenSchema })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() body: unknown): Promise<{ token: string }> {
    const parsed = loginBody.safeParse(body)
    if (!parsed.success) throw new BadRequestException('Expected id and password')
    const secret = readJwtSecret(process.env)
    const store = await this.openStore()
    try {
      return await signIn(store, secret, parsed.data)
    } catch (error) {
      if (error instanceof InvalidCredentials) {
        throw new UnauthorizedException('Invalid credentials')
      }
      throw error
    } finally {
      await store.close()
    }
  }
}
