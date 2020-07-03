
const path = require('path');

const FluentFfmpeg = require('fluent-ffmpeg');

const Constants = require('./Constants');
const LayoutOptions = require('./LayoutOptions');
const PageFilenameGenerator = require('./PageFilenameGenerator');
const ScreenshotCreator = require('./ScreenshotCreator');
const ThumbnailPageCreator = require('./ThumbnailPageCreator');
const TimeConverter = require('./TimeConverter');

let FfmpegCommand;

class ThumbnailGenerator {

    // exported here to make them more "acceptable" to end users
    static LEFT = Constants.LEFT;
    static CENTRE = Constants.CENTRE;
    static CENTER = Constants.CENTER;
    static RIGHT = Constants.RIGHT;

    constructor(filename) {
        this._filename = filename;
    }

    async generate(thumbFile, rawOptions) {
        const sc = new ScreenshotCreator(this._filename, FfmpegCommand);
        const generationOptions = await sc.init(rawOptions);
        const fileList = await sc.generate();

        const layoutOptions = new LayoutOptions(rawOptions, generationOptions);
        await layoutOptions.init(fileList[0].path);

        const imagesPerPage = layoutOptions.thumbsCols * layoutOptions.thumbsRows;
        const numberOfPages = Math.ceil(fileList.length / imagesPerPage);

        const metadata = generationOptions.metadata;
        const headerDetails = {
            name: path.win32.basename(this._filename),
            filename: this._filename,
            durationFractional: TimeConverter.convertTimeToReadable(metadata.duration, 3),
            startTimeFractional: TimeConverter.convertTimeToReadable(metadata.startTime, 3),
            duration: TimeConverter.convertTimeToReadable(metadata.duration),
            startTime: TimeConverter.convertTimeToReadable(metadata.startTime),
            numberOfPages: numberOfPages,
            formatName: metadata.formatName
        }

        const tpc = new ThumbnailPageCreator(layoutOptions, headerDetails);
        const pfg = new PageFilenameGenerator(thumbFile, headerDetails, 'numberOfPages');

        let imageCount = 0;
        const outputList = [];
        for (let page = 1; page <= numberOfPages; page++) {
            const filename = pfg.getFilename(page);
            const outputImage = await tpc.createPage(fileList.slice(imageCount, imageCount + imagesPerPage), page);
            await outputImage.writeAsync(filename);
            outputList.push(filename);
            imageCount += imagesPerPage;
        }

        return outputList;
    }

}

module.exports = function (ffmpeg) {
    FfmpegCommand = ffmpeg || FluentFfmpeg;
    return ThumbnailGenerator;
}