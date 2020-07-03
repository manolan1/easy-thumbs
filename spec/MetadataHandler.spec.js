
const EventEmitter = require('events');
const path = require('path');

const MetadataHandler = require('../src/MetadataHandler');

const TEST_DATA = path.join(__dirname, './test-data');
const SHORT_FILE = path.join(TEST_DATA, './bbb_short_sample.m2ts');

const DATA_STREAM_0 = {
    index: 0,
    codec_name: 'timed_id3',
    codec_type: 'data',
};
//Currently has much more than is needed, may cut down, but here for reference
const VIDEO_STREAM_1 = {
    index: 1,
    codec_name: 'h264',
    codec_type: 'video',
    width: 1920,
    height: 1080,
    coded_width: 1920,
    coded_height: 1080,
    sample_aspect_ratio: '1:1',
    display_aspect_ratio: '16:9',
    start_time: 13711.533,
    duration_ts: 268109940,
    duration: 2978.999333
};
const AUDIO_STREAM_2 = {
    index: 2,
    codec_name: 'aac',
    codec_type: 'audio',
};
const VIDEO_STREAM_3 = {
    index: 3,
    codec_type: 'video',
    width: 1280,
    height: 768,
    display_aspect_ratio: '16:9'
};

describe('MetadataHandler', () => {

    describe('with fake ffmpeg', () => {

        let startTime, duration, formatName, streams;
        let metadataHandler;

        class FakeFfmpeg extends EventEmitter {

            static async ffprobe(_filename, cb) {
                cb(null, {
                    streams: streams,
                    format: {
                        start_time: startTime,
                        duration: duration,
                        format_name: formatName
                    }
                });
            }
        }

        beforeEach(() => {
            metadataHandler = new MetadataHandler(FakeFfmpeg);
        });

        it('instantiates correctly', () => {
            expect(metadataHandler).toBeTruthy();
        });

        it('returns metadata', async () => {
            startTime = 16692.022;
            duration = 64.510333;
            formatName = 'mpegts';
            streams = [DATA_STREAM_0, VIDEO_STREAM_1, AUDIO_STREAM_2];

            const metadata = await metadataHandler.process(SHORT_FILE);
            expect(metadata).toEqual({
                startTime: 16692.022,
                duration: 64.510333,
                formatName: 'mpegts',
                videoStream: 1,
                width: 1920,
                height: 1080,
                displayAspectRatio: '16:9'
            })
        });

        it('returns metadata even if streams are not in order', async () => {
            startTime = 1000.042;
            duration = 42.42;
            formatName = 'mpegts';
            streams = [DATA_STREAM_0, AUDIO_STREAM_2, VIDEO_STREAM_1];

            const metadata = await metadataHandler.process(SHORT_FILE);
            expect(metadata).toEqual({
                startTime: 1000.042,
                duration: 42.42,
                formatName: 'mpegts',
                videoStream: 1,
                width: 1920,
                height: 1080,
                displayAspectRatio: '16:9'
            })
        });

        it('fails if more than one video stream', async () => {
            startTime = 16692.022;
            duration = 64.510333;
            formatName = 'mpegts';
            streams = [DATA_STREAM_0, VIDEO_STREAM_1, AUDIO_STREAM_2, VIDEO_STREAM_3];

            await expectAsync(metadataHandler.process(SHORT_FILE))
                .toBeRejectedWithError('One video stream expected, found 2. Choose a stream from 1,3');

        });

        it('optional parameter to choose from more than one video stream', async () => {
            startTime = 1000.042;
            duration = 42.42;
            formatName = 'mpegts';
            streams = [DATA_STREAM_0, VIDEO_STREAM_1, AUDIO_STREAM_2, VIDEO_STREAM_3];

            const metadata = await metadataHandler.process(SHORT_FILE, 3);
            expect(metadata).toEqual({
                startTime: 1000.042,
                duration: 42.42,
                formatName: 'mpegts',
                videoStream: 3,
                width: 1280,
                height: 768,
                displayAspectRatio: '16:9'
            })
        });

        it('if stream specified, it must be a video stream', async () => {
            startTime = 1000.042;
            duration = 42.42;
            formatName = 'mpegts';
            streams = [DATA_STREAM_0, VIDEO_STREAM_1, AUDIO_STREAM_2, VIDEO_STREAM_3];

            await expectAsync(metadataHandler.process(SHORT_FILE, 2))
                .toBeRejectedWithError('Requested video stream 2 not found, or is not a video stream');

            streams = [DATA_STREAM_0, VIDEO_STREAM_1];

            await expectAsync(metadataHandler.process(SHORT_FILE, 2))
                .toBeRejectedWithError('Requested video stream 2 not found, or is not a video stream');
        });

        it('fails if no video streams', async () => {
            startTime = 16692.022;
            duration = 64.510333;
            formatName = 'mpegts';
            streams = [DATA_STREAM_0, AUDIO_STREAM_2];

            await expectAsync(metadataHandler.process(SHORT_FILE))
                .toBeRejectedWithError('No video streams found');

        });

    });

});

