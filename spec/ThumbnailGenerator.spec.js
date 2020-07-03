
const path = require('path');
const EventEmitter = require('events');
const fs = require('fs');

const looksSame = require('looks-same');
const tmp = require('tmp');
const Defer = require('easy-defer').default;

const Constants = require('../src/Constants');

const TEST_DATA = path.join(__dirname, './test-data');
const SHORT_FILE = path.join(TEST_DATA, './bbb_short_sample.m2ts');

const RED = path.join(TEST_DATA, './red.png');
const GREEN = path.join(TEST_DATA, './green.png');
const BLUE = path.join(TEST_DATA, './blue.png');
const TRIAD = [RED, GREEN, BLUE];

/*
 * To make any temporary file visible, replace tmp.fileSync with:
        const outFile = {
            name: 'tmp-output-tg.png',
            removeCallback: () => { }
        };
 */
describe('ThumbnailGenerator', () => {

    describe('with fake ffmpeg', () => {

        let ThumbnailGenerator;
        let startTime, duration, filenames, formatName;

        class FakeFfmpeg extends EventEmitter {

            static async ffprobe(_filename, cb) {
                cb(null, {
                    format: {
                        start_time: startTime,
                        duration: duration,
                        format_name: formatName
                    },
                    streams: [{
                        index: 0,
                        codec_type: 'data',
                    }, {
                        index: 1,
                        codec_type: 'video',
                        width: 1920,
                        height: 1080,
                        display_aspect_ratio: '16:9'
                    }, {
                        index: 2,
                        codec_type: 'audio',
                    }]
                });
            }

            screenshots(_options, _dir) {
                process.nextTick(this._finish.bind(this));
                return this;
            }

            _finish() {
                this.emit('filenames', filenames);
                process.nextTick(this.emit.bind(this), 'end');
            }
        }

        beforeAll(() => {
            ThumbnailGenerator = require('../src/ThumbnailGenerator')(FakeFfmpeg);
        });

        it('instantiates correctly', () => {
            expect(new ThumbnailGenerator(SHORT_FILE)).toBeTruthy();
        });

        it('exports alignment constants', () => {
            expect(ThumbnailGenerator.LEFT).toEqual(Constants.LEFT);
            expect(ThumbnailGenerator.RIGHT).toEqual(Constants.RIGHT);
            expect(ThumbnailGenerator.CENTRE).toEqual(Constants.CENTRE);
            expect(ThumbnailGenerator.CENTER).toEqual(Constants.CENTER);
        });

        it('processes video', async (done) => {
            startTime = 16692.022;
            duration = 64.510333;
            formatName = 'mpegts';
            filenames = [
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, RED, GREEN
            ];
            const outFile = tmp.fileSync({
                postfix: '.png'
            });
            const EXPECTED_IMAGE = path.join(TEST_DATA, './simple-output.png');
            const tg = new ThumbnailGenerator(SHORT_FILE);

            const outputList = await tg.generate(outFile.name, {});

            expect(outputList).toEqual([outFile.name]);
            looksSame(EXPECTED_IMAGE, outFile.name, (_err, result) => {
                expect(result.equal).toBe(true);
                outFile.removeCallback();
                done();
            });
        });

        it('handles more thumbnails than a single page', async (done) => {
            startTime = 16692.022;
            duration = 64.510333;
            formatName = 'mpegts';
            filenames = [
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD
            ];
            const outFileName = tmp.tmpNameSync({
                postfix: '.png'
            });
            const EXPECTED_IMAGE1 = path.join(TEST_DATA, './simple-page_1.png');
            const EXPECTED_IMAGE2 = path.join(TEST_DATA, './simple-page_2.png');
            const tg = new ThumbnailGenerator(SHORT_FILE);
            const d1 = new Defer();
            const d2 = new Defer();

            const outputList = await tg.generate(outFileName, {
                thumbsCount: 60
            });

            expect(outputList.length).toEqual(2);
            expect(outputList[0]).toContain('_1.png');
            expect(outputList[1]).toContain('_2.png');
            looksSame(EXPECTED_IMAGE1, outputList[0], (_err, result) => {
                expect(result.equal).toBe(true);
                fs.unlinkSync(outputList[0]);
                d1.resolve();
            });
            looksSame(EXPECTED_IMAGE2, outputList[1], (_err, result) => {
                expect(result.equal).toBe(true);
                fs.unlinkSync(outputList[1]);
                d2.resolve();
            });
            Promise.all([d1, d2]).then(() => done());
        });

        it('handles fewer thumbnails than a full page', async (done) => {
            startTime = 16692.022;
            duration = 64.510333;
            formatName = 'mpegts';
            filenames = [
                ...TRIAD, ...TRIAD, ...TRIAD, RED
            ];
            const outFile = tmp.fileSync({
                postfix: '.png'
            });
            const EXPECTED_IMAGE = path.join(TEST_DATA, './short-output.png');
            const tg = new ThumbnailGenerator(SHORT_FILE);

            const outputList = await tg.generate(outFile.name, {
                thumbsCount: 10
            });

            expect(outputList).toEqual([outFile.name]);
            looksSame(EXPECTED_IMAGE, outFile.name, (_err, result) => {
                expect(result.equal).toBe(true);
                outFile.removeCallback();
                done();
            });
        });

    });

});
