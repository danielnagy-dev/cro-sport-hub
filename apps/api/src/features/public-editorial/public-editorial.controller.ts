import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common'
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { z } from 'zod'
import { catalogDb, CatalogError, type Catalog } from '../../catalog/catalog.js'
import { CATALOG_OPENER, type CatalogOpener } from '../../catalog/catalog.module.js'
import {
  dayAppearancesQuerySchema,
  listPublicAthleteIndex,
  listPublicDayAppearances,
  nationalTeamScheduleSchema,
  publicAppearanceSchema,
  publicAthleteIndexItemSchema,
  publicAthleteProfileSchema,
  readNationalTeamSchedule,
  readPublicAthleteProfile,
  unknownAthleteMessage,
  unknownNationalTeamMessage,
  unknownSportMessage,
} from './public-editorial.js'

const dayListSchema = z.array(publicAppearanceSchema)
const athleteIndexSchema = z.array(publicAthleteIndexItemSchema)
const SPORT_ENUM = { type: 'string', enum: ['tennis', 'football', 'basketball'] }

function pick(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function toHttp(error: unknown): unknown {
  if (!(error instanceof CatalogError)) return error
  if (error.code === 'unknown-ref') return new NotFoundException(error.message)
  if (error.code === 'invalid') {
    return new BadRequestException(error.issues?.[0]?.message ?? error.message)
  }
  return error
}

@ApiTags('public-editorial')
@Controller('api/public')
export class PublicEditorialController {
  constructor(@Inject(CATALOG_OPENER) private readonly openCatalog: CatalogOpener) {}

  @Get('appearances')
  @ApiOperation({ summary: 'Public appearances for one calendar day.' })
  @ApiQuery({ name: 'day', required: true })
  @ApiQuery({ name: 'sportSlug', required: false, schema: SPORT_ENUM })
  @ApiOkResponse({
    description: 'Day appearances; empty when none.',
    standardSchema: dayListSchema,
  })
  dayList(@Query('day') day: unknown, @Query('sportSlug') sportSlug: unknown) {
    const sport = pick(sportSlug)
    const parsed = dayAppearancesQuerySchema.safeParse({
      day: pick(day),
      ...(sport === undefined ? {} : { sportSlug: sport }),
    })
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Invalid day query')
    }
    return this.run((catalog) => listPublicDayAppearances(catalogDb(catalog), parsed.data))
  }

  @Get('athletes')
  @ApiOperation({ summary: 'Public athlete index for one sport.' })
  @ApiQuery({ name: 'sport', required: true, schema: SPORT_ENUM })
  @ApiOkResponse({ description: 'Slug and name.', standardSchema: athleteIndexSchema })
  @ApiNotFoundResponse({ description: unknownSportMessage })
  athleteIndex(@Query('sport') sport: unknown) {
    if (typeof sport !== 'string' || sport.length === 0) {
      throw new NotFoundException(unknownSportMessage)
    }
    return this.run((catalog) => listPublicAthleteIndex(catalogDb(catalog), sport))
  }

  @Get('athletes/:slug')
  @ApiOperation({ summary: 'Public athlete profile with editorial appearances.' })
  @ApiParam({ name: 'slug' })
  @ApiOkResponse({
    description: 'History and upcoming; no posts.',
    standardSchema: publicAthleteProfileSchema,
  })
  @ApiNotFoundResponse({ description: unknownAthleteMessage })
  athleteProfile(@Param('slug') slug: string) {
    return this.run((catalog) => readPublicAthleteProfile(catalogDb(catalog), slug))
  }

  @Get('national-teams/:slug/schedule')
  @ApiOperation({ summary: 'National-team schedule: past, current, upcoming.' })
  @ApiParam({ name: 'slug' })
  @ApiQuery({ name: 'sport', required: false, schema: SPORT_ENUM })
  @ApiOkResponse({ description: 'Schedule buckets.', standardSchema: nationalTeamScheduleSchema })
  @ApiNotFoundResponse({ description: unknownNationalTeamMessage })
  nationalTeamSchedule(@Param('slug') slug: string, @Query('sport') sport: unknown) {
    return this.run((catalog) => readNationalTeamSchedule(catalogDb(catalog), slug, pick(sport)))
  }

  private async run<T>(work: (catalog: Catalog) => Promise<T>): Promise<T> {
    const catalog = await this.openCatalog()
    try {
      return await work(catalog)
    } catch (error) {
      throw toHttp(error)
    } finally {
      await catalog.close()
    }
  }
}
