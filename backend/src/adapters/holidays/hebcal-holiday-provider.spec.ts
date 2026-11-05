import { HebcalHolidayProvider } from './hebcal-holiday-provider'

function mockHebcal(items: object[]) {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify({ items }), { status: 200 }))
}

describe('HebcalHolidayProvider', () => {
  afterEach(() => jest.restoreAllMocks())

  it('returns the dates of the work-free holidays in the range', async () => {
    mockHebcal([
      { title: 'Erev Rosh Hashana', date: '2026-09-11', category: 'holiday', subcat: 'major' },
      { title: 'Rosh Hashana 5787', date: '2026-09-12', category: 'holiday', subcat: 'major', yomtov: true },
      { title: 'Sukkot II (CH’’M)', date: '2026-09-27', category: 'holiday', subcat: 'major' },
      { title: 'Yom Kippur', date: '2026-09-21', category: 'holiday', subcat: 'major', yomtov: true },
    ])

    const dates = await new HebcalHolidayProvider().getHolidayDates('2026-09-01', '2026-10-01')

    expect(dates).toEqual(['2026-09-12', '2026-09-21'])
  })

  it('throws when Hebcal answers with an error', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 503 }))

    await expect(new HebcalHolidayProvider().getHolidayDates('2026-09-01', '2026-10-01')).rejects.toThrow(/503/)
  })

  it('asks Hebcal for the Israeli schedule, main holidays, over the given range', async () => {
    const fetchMock = mockHebcal([])

    await new HebcalHolidayProvider().getHolidayDates('2026-09-01', '2026-10-01')

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe('https://www.hebcal.com/hebcal')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      v: '1',
      cfg: 'json',
      maj: 'on',
      i: 'on',
      start: '2026-09-01',
      end: '2026-10-01',
    })
  })
})
