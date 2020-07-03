
const path = require('path');

const Defer = require('easy-defer').default;

const GenerationOptions = require('./GenerationOptions');
const MetadataHandler = require('./MetadataHandler');

module.exports = class ThumbnailFileCreator {

    constructor(filename, ffmpegCommand) {
        this._filename = filename;
        this._ffmpegCommand = ffmpegCommand;
    }

    async init(rawOptions) {
        const metadataHandler = new MetadataHandler(this._ffmpegCommand);
        this._om = new GenerationOptions(
            await metadataHandler.process(this._filename, rawOptions.videoStream),
            rawOptions);
        return this._om;
    }

    async generate() {
        if (!this._om) {
            throw new Error('init() not called')
        }
        this._om.makeThumbDirectory();
        const thumbDir = this._om.thumbDirectory;
        const marks = this._om.samplePositions;

        const result = new Defer();
        let mappedList;

        new this._ffmpegCommand(this._filename)
            .on('filenames', list => {
                mappedList = list.map((item, index, array) => {
                    if (index > marks.length) {
                        result.reject(new Error(`Received more thumbnails than expected: expected ${marks.length}, received ${array.length}`));
                    }
                    return {
                        mark: marks[index],
                        path: path.resolve(thumbDir, item)
                    }
                });
            })
            .on('end', () => {
                setImmediate(() => result.resolve(mappedList));
            })
            .screenshots({
                timemarks: marks,
                filename: this._om.thumbFilename,
                size: this._om.thumbSize
            }, thumbDir);

        return result;
    }

}
