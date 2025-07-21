import { 
  formatTime, 
  formatDurationToHMS, 
  parseTimeToMinutes, 
  createTimeForToday, 
  getElapsedTime, 
  getRemainingTime, 
  getRemainingRaceTime,
  formatDuration,
  formatRaceTime
} from '../../utils/timeFormatting';

describe('Time Formatting Utilities', () => {
  
  describe('formatTime', () => {
    test('should format Date object to HH:MM:SS', () => {
      const date = new Date('2024-01-01T14:30:45');
      expect(formatTime(date)).toBe('14:30:45');
    });
    
    test('should return --:--:-- for null', () => {
      expect(formatTime(null)).toBe('--:--:--');
    });
    
    test('should handle different times correctly', () => {
      const morning = new Date('2024-01-01T09:05:30');
      const evening = new Date('2024-01-01T23:59:59');
      expect(formatTime(morning)).toBe('09:05:30');
      expect(formatTime(evening)).toBe('23:59:59');
    });
  });
  
  describe('formatDurationToHMS', () => {
    test('should format minutes to HH:MM:SS', () => {
      expect(formatDurationToHMS(108)).toBe('01:48:00');
      expect(formatDurationToHMS(0)).toBe('00:00:00');
      expect(formatDurationToHMS(150)).toBe('02:30:00');
      expect(formatDurationToHMS(1440)).toBe('24:00:00'); // 24 hours
    });
    
    test('should handle null/undefined values', () => {
      expect(formatDurationToHMS(null)).toBe('00:00:00');
      expect(formatDurationToHMS(undefined)).toBe('00:00:00');
      expect(formatDurationToHMS(NaN)).toBe('00:00:00');
    });
    
    test('should handle negative values', () => {
      expect(formatDurationToHMS(-30)).toBe('00:00:00');
      expect(formatDurationToHMS(-1)).toBe('00:00:00');
    });
    
    test('should handle fractional minutes', () => {
      expect(formatDurationToHMS(90.5)).toBe('01:30:30');
      expect(formatDurationToHMS(0.5)).toBe('00:00:30');
    });
  });
  
  describe('formatDuration', () => {
    test('should format duration in MM:SS format', () => {
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(5)).toBe('0:05');
    });
    
    test('should handle negative durations', () => {
      expect(formatDuration(-30)).toBe('-0:30');
      expect(formatDuration(-90)).toBe('-1:30');
    });
  });
  
  describe('formatRaceTime', () => {
    test('should format race time in HH:MM:SS', () => {
      expect(formatRaceTime(1440)).toBe('24:00:00'); // 24 hours
      expect(formatRaceTime(90)).toBe('01:30:00');
      expect(formatRaceTime(0)).toBe('00:00:00');
    });
    
    test('should handle negative or zero values', () => {
      expect(formatRaceTime(-30)).toBe('00:00:00');
      expect(formatRaceTime(0)).toBe('00:00:00');
    });
  });
  
  describe('parseTimeToMinutes', () => {
    test('should parse HH:MM:SS format to minutes', () => {
      expect(parseTimeToMinutes('01:48:00')).toBe(108);
      expect(parseTimeToMinutes('02:00:00')).toBe(120);
      expect(parseTimeToMinutes('00:30:30')).toBe(30.5);
      expect(parseTimeToMinutes('24:00:00')).toBe(1440);
    });
    
    test('should parse MM:SS format to minutes', () => {
      expect(parseTimeToMinutes('30:00')).toBe(30);
      expect(parseTimeToMinutes('45:30')).toBe(45.5);
      expect(parseTimeToMinutes('90:00')).toBe(90);
    });
    
    test('should handle invalid input', () => {
      expect(parseTimeToMinutes('')).toBe(0);
      expect(parseTimeToMinutes('invalid')).toBe(0);
      // Note: parseTimeToMinutes doesn't validate time ranges, it just parses numbers
      // '25:70:80' becomes 25*60 + 70 + (80/60) = 1500 + 70 + 1.33 = 1571.33
      expect(parseTimeToMinutes('25:70:80')).toBe(1571.3333333333333);
    });
    
    test('should handle edge cases', () => {
      expect(parseTimeToMinutes('0:0:0')).toBe(0);
      expect(parseTimeToMinutes('00:00')).toBe(0);
    });
  });
  
  describe('createTimeForToday', () => {
    test('should create Date with specified time', () => {
      const result = createTimeForToday('14:30:45');
      expect(result).toBeInstanceOf(Date);
      if (result) {
        expect(result.getHours()).toBe(14);
        expect(result.getMinutes()).toBe(30);
        expect(result.getSeconds()).toBe(45);
      }
    });
    
    test('should handle edge times', () => {
      const midnight = createTimeForToday('00:00:00');
      const endOfDay = createTimeForToday('23:59:59');
      
      expect(midnight).toBeInstanceOf(Date);
      expect(endOfDay).toBeInstanceOf(Date);
      
      if (midnight) {
        expect(midnight.getHours()).toBe(0);
        expect(midnight.getMinutes()).toBe(0);
        expect(midnight.getSeconds()).toBe(0);
      }
      
      if (endOfDay) {
        expect(endOfDay.getHours()).toBe(23);
        expect(endOfDay.getMinutes()).toBe(59);
        expect(endOfDay.getSeconds()).toBe(59);
      }
    });
    
    test('should return null for invalid format', () => {
      expect(createTimeForToday('invalid')).toBeNull();
      expect(createTimeForToday('14:30')).toBeNull(); // Requires HH:MM:SS
      // Note: createTimeForToday doesn't validate time ranges, it uses parseInt which handles overflow
      // JavaScript Date constructor handles overflow gracefully (25 hours becomes next day 1 AM)
      expect(createTimeForToday('25:00:00')).toBeInstanceOf(Date); // Creates valid date with hour overflow
      expect(createTimeForToday('12:60:00')).toBeInstanceOf(Date); // Creates valid date with minute overflow
      expect(createTimeForToday('12:30:60')).toBeInstanceOf(Date); // Creates valid date with second overflow
    });
  });
  
  describe('getElapsedTime', () => {
    test('should calculate elapsed time in minutes', () => {
      const start = new Date('2024-01-01T10:00:00');
      const current = new Date('2024-01-01T11:30:00');
      expect(getElapsedTime(start, current)).toBe(90);
    });
    
    test('should handle same times', () => {
      const time = new Date('2024-01-01T10:00:00');
      expect(getElapsedTime(time, time)).toBe(0);
    });
    
    test('should handle negative elapsed time', () => {
      const start = new Date('2024-01-01T11:00:00');
      const current = new Date('2024-01-01T10:00:00'); // Earlier time
      expect(getElapsedTime(start, current)).toBe(-60);
    });
    
    test('should handle invalid dates', () => {
      const invalidDate = null as any;
      expect(getElapsedTime(invalidDate, new Date())).toBe(0);
      expect(getElapsedTime(new Date(), invalidDate)).toBe(0);
      expect(getElapsedTime(invalidDate, invalidDate)).toBe(0);
    });
  });
  
  describe('getRemainingTime', () => {
    test('should calculate remaining time', () => {
      const start = new Date('2024-01-01T10:00:00');
      const current = new Date('2024-01-01T10:30:00');
      const planned = 60;
      expect(getRemainingTime(start, planned, current)).toBe(30);
    });
    
    test('should return 0 for overrun', () => {
      const start = new Date('2024-01-01T10:00:00');
      const current = new Date('2024-01-01T11:30:00');
      const planned = 60;
      expect(getRemainingTime(start, planned, current)).toBe(0);
    });
    
    test('should return full planned time when no time elapsed', () => {
      const start = new Date('2024-01-01T10:00:00');
      const current = new Date('2024-01-01T10:00:00');
      const planned = 120;
      expect(getRemainingTime(start, planned, current)).toBe(120);
    });
    
    test('should handle invalid dates', () => {
      const invalidDate = null as any;
      const planned = 60;
      expect(getRemainingTime(invalidDate, planned, new Date())).toBe(60);
      expect(getRemainingTime(new Date(), planned, invalidDate)).toBe(60);
    });
  });
  
  describe('getRemainingRaceTime', () => {
    test('should calculate remaining race time', () => {
      const start = new Date('2024-01-01T10:00:00');
      const current = new Date('2024-01-01T11:00:00');
      const raceLength = 24; // hours
      expect(getRemainingRaceTime(start, raceLength, current)).toBe(1380); // 23 hours in minutes
    });
    
    test('should return full race time if no start time', () => {
      const current = new Date();
      const raceLength = 12;
      expect(getRemainingRaceTime(null, raceLength, current)).toBe(720);
    });
    
    test('should return 0 for finished race', () => {
      const start = new Date('2024-01-01T10:00:00');
      const current = new Date('2024-01-02T11:00:00'); // 25 hours later
      const raceLength = 24;
      expect(getRemainingRaceTime(start, raceLength, current)).toBe(0);
    });
    
    test('should handle different race lengths', () => {
      const start = new Date('2024-01-01T10:00:00');
      const current = new Date('2024-01-01T11:00:00'); // 1 hour elapsed
      
      expect(getRemainingRaceTime(start, 6, current)).toBe(300); // 5 hours remaining
      expect(getRemainingRaceTime(start, 12, current)).toBe(660); // 11 hours remaining
      expect(getRemainingRaceTime(start, 1, current)).toBe(0); // Race finished
    });
  });
  
  describe('Integration Tests', () => {
    test('should work together for race timing scenarios', () => {
      // Scenario: 2-hour stint, 30 minutes elapsed
      const stintStart = new Date('2024-01-01T10:00:00');
      const currentTime = new Date('2024-01-01T10:30:00');
      const stintLength = 120; // 2 hours
      
      const elapsed = getElapsedTime(stintStart, currentTime);
      const remaining = getRemainingTime(stintStart, stintLength, currentTime);
      
      expect(elapsed).toBe(30);
      expect(remaining).toBe(90);
      expect(formatDurationToHMS(elapsed)).toBe('00:30:00');
      expect(formatDurationToHMS(remaining)).toBe('01:30:00');
    });
    
    test('should handle race finish scenarios', () => {
      const raceStart = new Date('2024-01-01T10:00:00');
      const raceEnd = new Date('2024-01-02T10:00:00'); // 24 hours later
      const raceLength = 24;
      
      const remaining = getRemainingRaceTime(raceStart, raceLength, raceEnd);
      expect(remaining).toBe(0);
      expect(formatRaceTime(remaining)).toBe('00:00:00');
    });
  });
});
