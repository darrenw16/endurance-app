import { formatTime, formatDurationToHMS, parseTimeToMinutes, formatRaceTime } from '../../utils/timeFormatting';

describe('Time Formatting Utils', () => {
  test('formatTime handles null input', () => {
    expect(formatTime(null)).toBe('--:--:--');
  });

  test('formatDurationToHMS converts minutes to HH:MM:SS format', () => {
    expect(formatDurationToHMS(0)).toBe('00:00:00');
    expect(formatDurationToHMS(61.5)).toBe('01:01:30'); // 61.5 minutes = 1 hour 1 minute 30 seconds
    expect(formatDurationToHMS(1440)).toBe('24:00:00'); // 24 hours
  });

  test('formatDurationToHMS handles invalid input gracefully', () => {
    expect(formatDurationToHMS(null)).toBe('00:00:00');
    expect(formatDurationToHMS(undefined)).toBe('00:00:00');
    expect(formatDurationToHMS(-5)).toBe('00:00:00');
  });

  test('parseTimeToMinutes converts time string to minutes', () => {
    expect(parseTimeToMinutes('00:00:00')).toBe(0);
    expect(parseTimeToMinutes('01:01:01')).toBe(61 + (1/60)); // 61 minutes + 1 second
    expect(parseTimeToMinutes('24:00:00')).toBe(1440); // 24 hours in minutes
  });

  test('parseTimeToMinutes handles MM:SS format', () => {
    expect(parseTimeToMinutes('05:30')).toBe(5.5); // 5 minutes 30 seconds
  });

  test('formatRaceTime formats race duration correctly', () => {
    expect(formatRaceTime(0)).toBe('00:00:00');
    expect(formatRaceTime(61)).toBe('01:01:00');
    expect(formatRaceTime(1440)).toBe('24:00:00');
  });
});
