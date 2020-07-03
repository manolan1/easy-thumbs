
// Extract video stream data from ffprobe metadata.

const util = require('util');

module.exports = class MetadataHandler {

    constructor(FfmpegCommand) {
        this._ffprobeCommand = util.promisify(FfmpegCommand.ffprobe);
    }

    // videoSteamIndex is optional, though it does not require a default value
    async process(filename, videoStreamIndex) {
        const metadata = await this._ffprobeCommand(filename);
        const videoStream = this._findVideoStream(metadata.streams, videoStreamIndex);

        return {
            startTime: metadata.format.start_time,
            duration: metadata.format.duration,
            formatName: metadata.format.format_name,
            videoStream: videoStream.index,
            width: videoStream.width,
            height: videoStream.height,
            displayAspectRatio: videoStream.display_aspect_ratio
        }
    }

    // We do not assume that streams are in stream.index order
    _findVideoStream(streams, videoStreamIndex) {
        const result = new Map();
        for (let stream of streams) {
            if (stream.codec_type === 'video') {
                result.set(stream.index, stream);
            }
        }
        if (videoStreamIndex) {
            if (result.has(videoStreamIndex)) {
                return result.get(videoStreamIndex);
            } else {
                throw Error(`Requested video stream ${videoStreamIndex} not found, or is not a video stream`);
            }
        }
        if (result.size > 1) {
            throw Error(`One video stream expected, found ${result.size}. Choose a stream from ${Array.from(result.keys())}`);
        }
        if (result.size === 0) {
            throw Error('No video streams found');
        }

        // This weird expression returns the first item in an iterator
        return result.values().next().value;
    }
}