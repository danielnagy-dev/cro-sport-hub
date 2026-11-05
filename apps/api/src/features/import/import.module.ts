import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { readImportScheduleEnabled } from '../../api-config.js'
import { AuthModule } from '../../auth/auth.module.js'
import { CatalogModule } from '../../catalog/catalog.module.js'
import { ImportController } from '../../import.controller.js'
import { ImportScheduleService } from './import-schedule.service.js'

const importScheduleEnabled = readImportScheduleEnabled()

@Module({
  imports: [
    CatalogModule,
    AuthModule,
    ...(importScheduleEnabled ? [ScheduleModule.forRoot()] : []),
  ],
  controllers: [ImportController],
  providers: importScheduleEnabled ? [ImportScheduleService] : [],
})
export class ImportModule {}
