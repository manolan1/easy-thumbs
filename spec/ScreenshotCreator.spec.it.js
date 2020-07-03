
const path = require('path');
const fs = require('fs');

const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffprobe = require('@ffprobe-installer/ffprobe');
const FfmpegCommand = require('fluent-ffmpeg');
const looksSame = require('looks-same');
const tmp = require('tmp');

const ScreenshotCreator = require('../src/ScreenshotCreator');

const TEST_DATA = path.join(__dirname, './test-data');
const TEST_THUMBS = path.join(TEST_DATA, './bbb_thumbs');
const SHORT_FILE = path.join(TEST_DATA, './bbb_short_sample.m2ts');

describe('ScreenshotCreator', () => {

    describe('with real ffmpeg', () => {

        let originalTimeout;

        beforeAll(() => {
            FfmpegCommand.setFfmpegPath(ffmpeg.path);
            FfmpegCommand.setFfprobePath(ffprobe.path);
        });

        beforeEach(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
        });

        afterEach(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        it('instantiates correctly', () => {
            expect(new ScreenshotCreator(SHORT_FILE, FfmpegCommand)).toBeTruthy();
        });

        it('generates screenshots', async (done) => {
            const thumbDirObj = tmp.dirSync({
                unsafeCleanup: true
            });
            const thumbDir = thumbDirObj.name;

            const sc = new ScreenshotCreator(SHORT_FILE, FfmpegCommand);
            await sc.init({
                thumbsCount: 10,
                thumbDirectory: thumbDir
            });

            await sc.generate();

            expect(fs.readdirSync(thumbDir).length).toEqual(10);
            Promise.all(['tn_1.png', 'tn_9.png', 'tn_17.png', 'tn_25.png', 'tn_33.png', 'tn_42.png', 'tn_50.png', 'tn_58.png', 'tn_66.png', 'tn_75.png'].map(item => {
                const expected = path.join(TEST_THUMBS, item);
                const actual = path.join(thumbDir, item);
                return new Promise((resolve, _reject) => {
                    expect(fs.existsSync(actual)).withContext(`checking if ${actual} exists`).toBeTrue();
                    looksSame(expected, actual, (_err, result) => {
                        expect(result.equal).withContext(`comparing ${item}`).toBeTrue();
                        resolve();
                    });
                });
            }))
                .then(() => {
                    thumbDirObj.removeCallback();
                    done();
                });
        });
    });
});
