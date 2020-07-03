
const path = require('path');

const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffprobe = require('@ffprobe-installer/ffprobe');
const FfmpegCommand = require('fluent-ffmpeg');

const MetadataHandler = require('../src/MetadataHandler');

const TEST_DATA = path.join(__dirname, './test-data');
const SHORT_FILE = path.join(TEST_DATA, './bbb_short_sample.m2ts');

describe('MetadataHandler', () => {

    describe('with real ffmpeg', () => {

        beforeAll(() => {
            FfmpegCommand.setFfmpegPath(ffmpeg.path);
            FfmpegCommand.setFfprobePath(ffprobe.path);
        });

        it('returns metadata', async () => {
            const metadataHandler = new MetadataHandler(FfmpegCommand);

            const metadata = await metadataHandler.process(SHORT_FILE);
            expect(metadata).toEqual({
                startTime: 1.422422,
                duration: 75.990211,
                formatName: 'mpegts',
                videoStream: 0,
                width: 1920,
                height: 1080,
                displayAspectRatio: '16:9'
            })

        });
    });

});

