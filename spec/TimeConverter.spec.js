
const TimeConverter = require('../src/TimeConverter');

describe('TimeConverter', () => {

    const tests = [
        // check zero padding
        { in: 0, out: '00:00:00' },
        { in: 1, out: '00:00:01' },
        { in: 2, out: '00:00:02' },
        { in: 3, out: '00:00:03' },
        { in: 4, out: '00:00:04' },
        { in: 5, out: '00:00:05' },
        { in: 6, out: '00:00:06' },
        { in: 7, out: '00:00:07' },
        { in: 8, out: '00:00:08' },
        { in: 9, out: '00:00:09' },
        { in: 10, out: '00:00:10' },
        // check minutes conversion
        { in: 101, out: '00:01:41' },
        { in: 1001, out: '00:16:41' },
        // check hours conversion
        { in: 10001, out: '02:46:41' },
        { in: 100001, out: '27:46:41' }
    ]

    it('converts time in seconds to human readable form', async () => {
        for (let test of tests) {
            expect(TimeConverter.convertTimeToReadable(test.in)).toEqual(test.out);
        }
    })

    it('converts time in seconds to human readable form handling fractions', async () => {
        expect(TimeConverter.convertTimeToReadable(3661.111)).toEqual('01:01:01');
        expect(TimeConverter.convertTimeToReadable(3661.111, 3)).toEqual('01:01:01.111');
    });
});

