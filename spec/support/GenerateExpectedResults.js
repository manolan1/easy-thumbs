
const path = require('path');
const EventEmitter = require('events');

const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffprobe = require('@ffprobe-installer/ffprobe');
const FfmpegCommand = require('fluent-ffmpeg');
const Jimp = require('jimp');

const PageLayoutManager = require('../../src/PageLayoutManager');
const Constants = require('../../src/Constants');
const FontLoader = require('../../src/FontLoader');

const TEST_DATA = path.join(__dirname, '../test-data');
const SHORT_FILE = path.join(TEST_DATA, './bbb_short_sample.m2ts');

const RED = path.join(TEST_DATA, './red.png');
const GREEN = path.join(TEST_DATA, './green.png');
const BLUE = path.join(TEST_DATA, './blue.png');
const TRIAD = [RED, GREEN, BLUE];

const LARGE = path.join(TEST_DATA, './large.png');
const SMALL = path.join(TEST_DATA, './small.png');
const NARROW = path.join(TEST_DATA, './narrow.png');

/* eslint-disable-next-line no-console */
console.log('*** New expected results files will be generated in the project root folder');
describe('Generate new expected results files', () => {

    describe('with real ffmpeg', () => {

        let ThumbnailGenerator;
        let originalTimeout;

        beforeAll(() => {
            FfmpegCommand.setFfmpegPath(ffmpeg.path);
            FfmpegCommand.setFfprobePath(ffprobe.path);
            ThumbnailGenerator = require('../../src/ThumbnailGenerator')(FfmpegCommand);
        });

        beforeEach(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        });

        afterEach(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        it('generates screenshots', async () => {
            const tg = new ThumbnailGenerator(SHORT_FILE);
            await tg.generate('./new-m2ts-output.png', {});
        });
    });

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
            ThumbnailGenerator = require('../../src/ThumbnailGenerator')(FakeFfmpeg);
        });

        it('processes video', async () => {
            startTime = 16692.022;
            duration = 64.510333;
            formatName = 'mpegts';
            filenames = [
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, RED, GREEN
            ];

            const tg = new ThumbnailGenerator(SHORT_FILE);
            await tg.generate('./new-simple-output.png', {});
        });

        it('handles more thumbnails than a single page', async () => {
            startTime = 16692.022;
            duration = 64.510333;
            formatName = 'mpegts';
            filenames = [
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD
            ];
            const tg = new ThumbnailGenerator(SHORT_FILE);

            await tg.generate('./new-simple-page.png', {
                thumbsCount: 60
            });

        });

        it('handles fewer thumbnails than a full page', async () => {
            startTime = 16692.022;
            duration = 64.510333;
            formatName = 'mpegts';
            filenames = [
                ...TRIAD, ...TRIAD, ...TRIAD, RED
            ];
            const tg = new ThumbnailGenerator(SHORT_FILE);

            await tg.generate('./new-short-output.png', {
                thumbsCount: 10
            });
        });
    });

    describe('for PageLayoutManager', () => {

        let fontLoader;
        // really constants, but must be initialised asynchronously
        let large, small, red, blue, narrow, imageGrid;

        beforeAll(async () => {
            large = await Jimp.read(LARGE);
            small = await Jimp.read(SMALL);
            red = await Jimp.read(RED);
            blue = await Jimp.read(BLUE);
            narrow = await Jimp.read(NARROW);
            imageGrid = [
                { mark: 1, image: narrow },
                { mark: 2, image: blue },
                { mark: 3, image: large },
                { mark: 4, image: small },
                { mark: 5, image: small },
                { mark: 6, image: small },
                { mark: 7, image: red }
            ];
        })

        beforeEach(async () => {
            fontLoader = new FontLoader([{
                key: FontLoader.TITLE_FONT_NAME,
                fontName: Jimp.FONT_SANS_32_BLACK
            }, {
                key: FontLoader.TIME_FONT_NAME,
                fontName: [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK]
            }]);
            await fontLoader.loadAll();
        });

        it('inserts header rows', async () => {
            const outputImage = new Jimp(1920, 1080, '#FFFFFF');
            const headerDetails = {
                name: 'source file name',
                filename: 'full path to source file name',
                durationFractional: '00:01:04.510',
                startTimeFractional: '04:38:12.022',
                duration: '00:01:05',
                startTime: '04:38:12',
                numberOfPages: 42,
                formatName: 'mpegts',
                page: 24
            }

            const plm = new PageLayoutManager({
                margin: 1,
                headerRows: [[{
                    text: '${filename}'
                }, {
                    align: Constants.RIGHT,
                    text: '${duration}'
                }], {
                    align: Constants.RIGHT,
                    text: '${startTime}'
                }, {
                    text: '${formatName}'
                }, {
                    align: Constants.CENTRE,
                    text: 'Page ${page} of ${numberOfPages}'
                }, {
                    text: 'This will not appear',
                    condition: '${page} > ${numberOfPages}'
                }, {
                    text: 'This will appear',
                    condition: '${page} < ${numberOfPages}'
                }]
            }, fontLoader);

            plm.insertHeader(outputImage, headerDetails);

            await outputImage.writeAsync('./new-header-test.png');
        });

        it('inserts thumbnails in a variable grid', async () => {
            const outputImage = new Jimp(1920, 1080, '#FFFF');

            const plm = new PageLayoutManager({
                margin: 1,
                headerRows: Constants.DEFAULT_HEADER_ROWS
            }, fontLoader);

            plm.insertThumbs(outputImage, imageGrid, {
                rows: 7,
                cols: 2
            }, {
                x: 0,
                y: 135
            });

            await outputImage.writeAsync('./new-variable-grid.png');
        });

        it('inserts thumbnails with default start position', async () => {
            const outputImage = new Jimp(1920, 1080, '#FFFF');

            const plm = new PageLayoutManager({
                margin: 1,
                headerRows: Constants.DEFAULT_HEADER_ROWS
            }, fontLoader);

            plm.insertThumbs(outputImage, imageGrid, {
                rows: 7,
                cols: 2
            });

            await outputImage.writeAsync('./new-variable-grid-default.png');
        });

        it('inserts thumbnails in a fixed grid', async () => {
            const outputImage = new Jimp(1920, 1080, '#FFFF');

            const plm = new PageLayoutManager({
                margin: 1,
                headerRows: Constants.DEFAULT_HEADER_ROWS
            }, fontLoader);

            plm.insertThumbs(outputImage, imageGrid, {
                rows: 7,
                cols: 2,
                thumbsWidth: 240,
                thumbsHeight: 135
            }, {
                x: 0,
                y: 135
            });

            await outputImage.writeAsync('./new-fixed-grid.png');
        });

    });

});
