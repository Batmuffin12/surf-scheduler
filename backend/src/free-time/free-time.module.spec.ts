import { Test } from '@nestjs/testing'
import { FreeTimeModule } from './free-time.module'
import { FreeTimeService } from './free-time.service'

describe('FreeTimeModule', () => {
  it('provides the free-time service wired to the holiday and forecast providers', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [FreeTimeModule] }).compile()

    expect(moduleRef.get(FreeTimeService)).toBeInstanceOf(FreeTimeService)
  })
})
