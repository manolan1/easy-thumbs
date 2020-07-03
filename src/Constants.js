
const Jimp = require('jimp');

module.exports = class Constants {
    static DEFAULT_THUMBS_COLS = 8;
    static DEFAULT_THUMBS_ROWS = 7;

    static DEFAULT_THUMBS_WIDTH = 240;   // default height is unconstrained (determined by width)
    static DEFAULT_THUMBS_FILENAME = 'tn_%s';

    static DEFAULT_TITLE_FONT = Jimp.FONT_SANS_32_BLACK;
    static DEFAULT_TIME_FONT = [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK];

    static TITLE_FONT_NAME = 'title';
    static TIME_FONT_NAME = 'time';

    static DEFAULT_BACKGROUND_COLOUR = '#FFFFFF';

    static MARGIN = 1;

    static LEFT = 0;
    static CENTRE = 1;
    static CENTER = 1;
    static RIGHT = 2;

    static DEFAULT_HEADER_ROWS = [[{
        align: Constants.LEFT,            // Not required, just for demonstration
        text: 'Name: ${name}'
    }, {
        align: Constants.RIGHT,
        text: 'Page: ${page} of ${numberOfPages}',
        condition: '${numberOfPages} > 1'
    }], {
        text: 'Start time: ${startTimeFractional}',
        condition: '${formatName} == mpegts'
    }, {
        text: 'Duration: ${durationFractional}'
    }];

    static PREFERRED_IMAGE_SIZES = [{
        width: 2560,
        height: 1440
    }, {
        width: 1920,
        height: 1080
    }, {
        width: 1600,
        height: 900
    }, {
        width: 1280,
        height: 720
    }, {
        width: 640,
        height: 360
    }]
}