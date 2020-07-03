
const IntervalCalculator = require('../src/IntervalCalculator');

describe('IntervalCalculator', () => {

    it('calculates the right intervals 1', () => {
        const duration = 2978.999333;

        const intervals = IntervalCalculator.calculateByCount(duration, 10);
        expect(intervals).toEqual([1, 331, 662, 993, 1324, 1654, 1985, 2316, 2647, 2978]);
    });

    it('calculates the right intervals 2', () => {
        const duration = 64.510333;

        const intervals = IntervalCalculator.calculateByCount(duration, 10);
        expect(intervals).toEqual([1, 8, 15, 22, 29, 36, 43, 50, 57, 64]);
    });

    it('calculates the right intervals for integer durations', () => {
        const duration = 64;

        const intervals = IntervalCalculator.calculateByCount(duration, 10);
        expect(intervals).toEqual([1, 7, 14, 21, 28, 35, 42, 49, 56, 62]);
    });

    it('returns fewer samples if they would be too short', () => {
        const duration = 10;

        const intervals = IntervalCalculator.calculateByCount(duration, 10);
        expect(intervals).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('returns a single sample if it can', () => {
        const duration = 2;

        const intervals = IntervalCalculator.calculateByCount(duration, 10);
        expect(intervals).toEqual([1]);
    });

    it('returns no samples if length is too short', () => {
        const duration = 0.9;

        const intervals = IntervalCalculator.calculateByCount(duration, 10);
        expect(intervals).toEqual([]);
    });

    it('creates list of intervals as specified 1', () => {
        const duration = 14.510333;

        const intervals = IntervalCalculator.calculateByInterval(duration, 1);
        expect(intervals).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    });

    it('creates list of intervals as specified 2', () => {
        const duration = 14.510333;

        const intervals = IntervalCalculator.calculateByInterval(duration, 5);
        expect(intervals).toEqual([1, 6, 11]);
    });

    it('creates list of intervals for fractional interval', () => {
        const duration = 14.510333;

        const intervals = IntervalCalculator.calculateByInterval(duration, 3.6);
        expect(intervals).toEqual([1, 4, 8, 11]);
    });

    it('reverts to 1 if interval is too small', () => {
        const duration = 14.510333;

        const intervals = IntervalCalculator.calculateByInterval(duration, 0.4);
        expect(intervals).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    });

    it('returns no samples if length is too short by interval', () => {
        const duration = 0.9;

        const intervals = IntervalCalculator.calculateByInterval(duration, 1);
        expect(intervals).toEqual([]);
    });

    it('calculates the right intervals (by interval) for integer duration', () => {
        const duration = 14;

        const intervals = IntervalCalculator.calculateByInterval(duration, 1);
        expect(intervals).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });

    it('returns no intervals if duration not specified (by interval)', () => {
        const duration = undefined;

        const intervals = IntervalCalculator.calculateByInterval(duration, 1);
        expect(intervals).toEqual([]);
    });

    it('returns no intervals if duration not specified (by count)', () => {
        const duration = undefined;

        const intervals = IntervalCalculator.calculateByCount(duration, 10);
        expect(intervals).toEqual([]);
    });


});
