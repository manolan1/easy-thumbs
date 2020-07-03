
const SafeEval = require('../src/SafeEval');

describe('SafeEval', () => {

    it('evaluates equality', () => {
        expect(SafeEval.evaluate('a == a')).toBeTrue();
    });

    it('evaluates inequality', () => {
        expect(SafeEval.evaluate('a == b')).toBeFalse();
    });

    it('evaluates greater than', () => {
        expect(SafeEval.evaluate('22 > 9')).toBeTrue();
        expect(SafeEval.evaluate('8 > 9')).toBeFalse();
    });

    it('performs numeric comparison on numbers', () => {
        expect(SafeEval.evaluate('22 == 22.0')).toBeTrue();
    });

    it('evaluates greater than or equal', () => {
        expect(SafeEval.evaluate('22 >= 9')).toBeTrue();
        expect(SafeEval.evaluate('9 >= 9')).toBeTrue();
        expect(SafeEval.evaluate('8.9 >= 9')).toBeFalse();
    });

    it('evaluates less than', () => {
        expect(SafeEval.evaluate('22 < 9')).toBeFalse();
        expect(SafeEval.evaluate('8 < 9')).toBeTrue();
    });

    it('evaluates less than or equal', () => {
        expect(SafeEval.evaluate('22 <= 9')).toBeFalse();
        expect(SafeEval.evaluate('9 <= 9')).toBeTrue();
        expect(SafeEval.evaluate('8.9 <= 9')).toBeTrue();
    });

    it('evaluates not equal', () => {
        expect(SafeEval.evaluate('a != a')).toBeFalse();
        expect(SafeEval.evaluate('a != b')).toBeTrue();
        expect(SafeEval.evaluate('9 != 22')).toBeTrue();
        expect(SafeEval.evaluate('22.0 != 22')).toBeFalse();
    });

    it('returns false if it cannot evaluate', () => {
        expect(SafeEval.evaluate('a=a')).toBeFalse();
        expect(SafeEval.evaluate('a = b')).toBeFalse();
        expect(SafeEval.evaluate('1+1 = 2')).toBeFalse();
        expect(SafeEval.evaluate('1 == 1 == 1')).toBeFalse();
        expect(SafeEval.evaluate('9')).toBeFalse();
    });

    it('spaces are completely ignored around operator', () => {
        expect(SafeEval.evaluate('aa== aa')).toBeTrue();
        expect(SafeEval.evaluate('aa==aa')).toBeTrue();
        expect(SafeEval.evaluate('aa ==aa')).toBeTrue();
        expect(SafeEval.evaluate('aa == aa')).toBeTrue();
        expect(SafeEval.evaluate('a a == aa')).toBeFalse();
        expect(SafeEval.evaluate('a a == a a')).toBeTrue();
    });


});
