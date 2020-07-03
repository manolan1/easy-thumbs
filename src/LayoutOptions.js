
const Jimp = require('jimp');

const Constants = require('./Constants');
const FontLoader = require('./FontLoader');
const ImageDimensionCalculator = require('./ImageDimensionCalculator');
const JimpUtils = require('./JimpUtils.js');
const PageLayoutManager = require('./PageLayoutManager');

/*
 * const om = new GenerationOptions(options, generationOptions);
 *
 * where:
 *
 * options           - An object containing the keys below, all optional, as is the object itself.
 * generationOptions - An instance of GenerationOptions, or an object with the same keys.
 * 
 *     backgroundColour: '#ffffff',  Background colour of thumbnail page (default = '#ffffff', white)
 *     backgroundColor: '#ffffff',   Same
 *     headerHeight: 135,            Height of header text, override calculated value
 *     headerRows: [],               Array of header text items, see below
 *     imageHeight: 1080,            Output thumbnail page height 
 *                                   (default = calculated from thumbnail size and rows, if possible)
 *     imageWidth: 1920,             Output thumbnail page width 
 *                                   (default = calculated from thumbnail size and cols, if possible)
 *     margin: 1,                    Distance of text from edge of image (default = 1px)
 *     preferKnownSizes: true,       If true (default), imageHeight is not specified and imageWidth matches
 *                                   a known width, use the appropriate height unless it is too small (see below)
 *     thumbsCols: 8                 Number of columns of thumbnails on the page
 *     thumbsRows: 7,                Number of rows of thumbnails on the page
 *     timeFont: Jimp....            Filename(s) of font for time values
 *                                   (default = [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK])
 *     titleFont: Jimp....           Filename(s) of font for header items 
 *                                   (default = Jimp.FONT_SANS_32_BLACK)
 * 
 * Note that GenerationOptions slightly modifies the keys, so if not using an instance, you need to check
 * what the appropriate keys are.
 * 
 * 
 */

/*
 * REMEMBER, WHEN MAINTAINING THIS:
 * - ANYTHING ACCESSED FROM 'this._options' IS THE ORIGINAL VALUE, AS SPECIFIED BY THE CALLER
 * - ANYTHING ACCESSED FROM 'this.' MAY BE A COMPUTED OR DERIVED VALUE.
 */

module.exports = class LayoutOptions {

    constructor(options, generationOptions) {
        this._options = options || {};
        this._generation = generationOptions || {};
    }

    async init(sampleImageFile) {
        this._fl = new FontLoader([{
            key: FontLoader.TITLE_FONT_NAME,
            fontName: this._titleFontName
        }, {
            key: FontLoader.TIME_FONT_NAME,
            fontName: this._timeFontName
        }]);
        await this._fl.loadAll();

        this._ju = new JimpUtils(this._fl);
        this._plm = new PageLayoutManager({
            margin: this._margin,
            headerHeight: this._options.headerHeight,
            headerRows: this._options.headerRows || Constants.DEFAULT_HEADER_ROWS
        }, this._fl);

        this._idc = new ImageDimensionCalculator(this._options, this._generation, this._plm.headerHeight);

        if (!this._idc.isPageSizeKnownAndValid) {
            if (sampleImageFile) {
                const image = await Jimp.read(sampleImageFile);
                this._idc.evaluateThumbnailImage(image);
            }
            if (!this._idc.isPageSizeKnownAndValid) {
                throw new Error('Cannot determine page dimensions');
            }
        }
    }

    get pageLayoutManager() {
        return this._plm;
    }

    get _margin() {
        return this._options.margin || Constants.MARGIN;
    }

    get _titleFontName() {
        return this._options.titleFont || Constants.DEFAULT_TITLE_FONT;
    }

    get _timeFontName() {
        return this._options.timeFont || Constants.DEFAULT_TIME_FONT;
    }

    // This set are delegated to the FontLoader
    _checkFontsLoaded() {
        if (!this._fl) {
            throw new Error('Fonts not loaded, call init()');
        }
    }

    get titleFont() {
        this._checkFontsLoaded();
        return this._fl.getFontsByKey(FontLoader.TITLE_FONT_NAME);
    }

    get timeFont() {
        this._checkFontsLoaded();
        return this._fl.getFontsByKey(FontLoader.TIME_FONT_NAME);
    }

    // This set are delegated to the ImageDimensionCalculator
    _checkImageDimensionsCalculated() {
        if (!this._idc) {
            throw new Error('Image dimensions not calculated, call init()');
        }
    }

    get thumbsRows() {
        this._checkImageDimensionsCalculated();
        return this._idc.thumbsRows;
    }

    get thumbsCols() {
        this._checkImageDimensionsCalculated();
        return this._idc.thumbsCols;
    }

    get imageWidth() {
        this._checkImageDimensionsCalculated();
        return this._idc.imageWidth;
    }

    get imageHeight() {
        this._checkImageDimensionsCalculated();
        return this._idc.imageHeight;
    }


    get backgroundColour() {
        return this._generation.backgroundColour || this._generation.backgroundColor
            || this._options.backgroundColour || this._options.backgroundColor
            || Constants.DEFAULT_BACKGROUND_COLOUR;
    }

    get backgroundColor() {
        return this.backgroundColour;
    }

}