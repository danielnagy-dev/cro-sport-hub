import { expect } from 'vite-plus/test'
import { mapMatchFormValidationMessage } from './match-form-validation-message'

describe('mapMatchFormValidationMessage', () => {
  it('maps shared id and ISO messages for tennis fields', () => {
    const id = 'Expected an id of 1–64 letters, digits, underscores, or hyphens'
    expect(mapMatchFormValidationMessage(['competitionId'], id, 'tennis')).toBe(
      'Choose a competition.',
    )
    expect(mapMatchFormValidationMessage(['playerAId'], id, 'tennis')).toBe('Choose player A.')
    expect(mapMatchFormValidationMessage(['playerBId'], id, 'tennis')).toBe('Choose player B.')
    expect(mapMatchFormValidationMessage(['winnerId'], id, 'tennis')).toBe('Choose the winner.')
    expect(mapMatchFormValidationMessage(['date'], 'Invalid ISO date', 'tennis')).toBe(
      'Enter the match date.',
    )
    expect(
      mapMatchFormValidationMessage(
        ['round'],
        'Too small: expected string to have >=1 characters',
        'tennis',
      ),
    ).toBe('Enter the round.')
    expect(
      mapMatchFormValidationMessage(
        ['score'],
        'Too small: expected array to have >=1 items',
        'tennis',
      ),
    ).toBe('Enter at least one completed set score.')
    expect(
      mapMatchFormValidationMessage(
        ['playerBId'],
        'The two players must be different athletes',
        'tennis',
      ),
    ).toBe('Choose two different players.')
  })

  it('maps football goals NaN and appearance id issues', () => {
    expect(
      mapMatchFormValidationMessage(
        ['homeGoals'],
        'Invalid input: expected number, received NaN',
        'football',
      ),
    ).toBe('Enter the number of goals.')
    const id = 'Expected an id of 1–64 letters, digits, underscores, or hyphens'
    expect(mapMatchFormValidationMessage(['appearances', '0', 'athleteId'], id, 'football')).toBe(
      'Choose an athlete.',
    )
    expect(
      mapMatchFormValidationMessage(
        ['appearances', '0', 'teamId'],
        'The appearance club is one of the two sides',
        'football',
      ),
    ).toBe('Choose a club.')
  })
})
