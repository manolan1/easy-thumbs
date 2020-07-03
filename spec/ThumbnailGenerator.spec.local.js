
const path = require('path');

const looksSame = require('looks-same');
const tmp = require('tmp');

const ThumbnailGenerator = require('../src/ThumbnailGenerator')();

const TEST_DATA = path.join(__dirname, './test-data');
const SHORT_FILE = path.join(TEST_DATA, './bbb_short_sample.m2ts');

/*
 * To make any temporary file visible, replace tmp.fileSync with:
        const outFile = {
            name: 'tmp-output-tg.png',
            removeCallback: () => { }
        };
 */
describe('ThumbnailGenerator', () => {

    describe('with local installed ffmpeg', () => {

        let originalTimeout;

        beforeEach(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
        });

        afterEach(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        it('instantiates correctly', () => {
            expect(new ThumbnailGenerator(SHORT_FILE)).toBeTruthy();
        });

        it('generates screenshots', async (done) => {
            const outFile = tmp.fileSync({
                postfix: '.png'
            });
            const EXPECTED_IMAGE = path.join(TEST_DATA, './m2ts-output.png');
            const tg = new ThumbnailGenerator(SHORT_FILE);

            const outputList = await tg.generate(outFile.name, {});

            expect(outputList).toEqual([outFile.name]);
            looksSame(EXPECTED_IMAGE, outFile.name, (_err, result) => {
                expect(result.equal).toBe(true);
                outFile.removeCallback();
                done();
            });

        });
    });

});
