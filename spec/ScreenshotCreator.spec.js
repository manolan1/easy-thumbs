
const path = require('path');
const EventEmitter = require('events');
const v8 = require('v8');

const ScreenshotCreator = require('../src/ScreenshotCreator');

const TEST_DATA = path.join(__dirname, './test-data');
const SHORT_FILE = path.join(TEST_DATA, './bbb_short_sample.m2ts');
const RED = './red.png';
const GREEN = './green.png';
const BLUE = './blue.png';
const TRIAD = [RED, GREEN, BLUE];

const SIMPLE_METADATA = {
    format: {
        start_time: 16692.022,
        duration: 64.510333,
        format_name: 'mpegts'
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
};

// Poor man's deep copy or clone
const DUPLICATE_VIDEOSTREAM_METADATA = v8.deserialize(v8.serialize(SIMPLE_METADATA));
DUPLICATE_VIDEOSTREAM_METADATA.streams.push({
    index: 3,
    codec_type: 'video',
    width: 4,
    height: 3,
    display_aspect_ratio: '4:3'
});

describe('ScreenshotCreator', () => {

    describe('with fake ffmpeg', () => {

        let filenames;
        let metadata;

        class FakeFfmpeg extends EventEmitter {

            static async ffprobe(_filename, cb) {
                cb(null, metadata);
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

        let sc;

        beforeEach(() => {
            metadata = SIMPLE_METADATA;
            sc = new ScreenshotCreator(SHORT_FILE, FakeFfmpeg);
        });

        it('instantiates correctly', () => {
            expect(sc).toBeTruthy();
        });

        it('generates screenshots', async () => {
            filenames = [
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD,
                ...TRIAD, ...TRIAD, RED, GREEN
            ];

            await sc.init({
                thumbsCount: 56,
                thumbDirectory: TEST_DATA
            });

            const fileList = await sc.generate();

            expect(fileList.length).toEqual(56);
            expect(fileList[0]).toEqual({
                mark: 1,
                path: path.join(TEST_DATA, 'red.png')
            });
            expect(fileList[55]).toEqual({
                mark: 64,
                path: path.join(TEST_DATA, 'green.png')
            });
        });

        it('errors if there are more than 1 videostream', async () => {
            metadata = DUPLICATE_VIDEOSTREAM_METADATA;
            filenames = [];

            await expectAsync(sc.init({
                thumbsCount: 56,
                thumbDirectory: TEST_DATA
            })).toBeRejectedWithError('One video stream expected, found 2. Choose a stream from 1,3');
        });

        /*
         * We do not test the corresponding error condition (that the stream specified does
         * not exist), this is assumed to be tested by MetadataHandler. Here it is sufficient
         * to test that the stream index number is passed through.
         */
        it('allows videostream to be specified', async () => {
            metadata = DUPLICATE_VIDEOSTREAM_METADATA;
            filenames = [];

            const options = await sc.init({
                thumbsCount: 56,
                thumbDirectory: TEST_DATA,
                videoStream: 3
            });
            expect(options.metadata.width).toEqual(4);
        });

        it('errors if there are more thumbs than expected', async () => {
            filenames = [
                ...TRIAD, ...TRIAD, ...TRIAD, ...TRIAD
            ];

            await sc.init({
                thumbsCount: 10,
                thumbDirectory: TEST_DATA
            });

            await expectAsync(sc.generate()).toBeRejectedWithError('Received more thumbnails than expected: expected 10, received 12');
        });

        it('errors if init is not called', async () => {
            // no init

            await expectAsync(sc.generate()).toBeRejectedWithError('init() not called');
        });

        it('init returns options object', async () => {
            const om = await sc.init({
                thumbsCount: 10,
                thumbDirectory: TEST_DATA
            });

            expect(typeof om.makeThumbDirectory).toEqual('function');
        });

    });

});
