
const Jimp = require('jimp');

const Constants = require('./Constants');

/*
 * Loads fonts used by Jimp.
 *
 * Each "font" here may be multiple bMFonts, which may or may not be offset
 * to achieve an embossed effect. The embossed effect may help particularly
 * with the font that is used to indicate the times since we cannot know ahead
 * of time what the background colour will be.
 * 
 * The input format is one of three styles:
 * 
 * 1. A single font.
 *     const input1 = {
 *         key: 'font index',
 *         fontName: Jimp.FONT_SANS_16_BLACK
 *     };
 * 
 * 2. Two fonts in an array. The first is at offset 1,1.
 *     const input2 = {
 *         key: 'font index',
 *         fontName: [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK]
 *     };
 * 
 * 3. As many fonts as wanted with explicit offsets.
 *     const input3 = {
 *         key: 'font index',
 *         fontName: [{
 *             fontName: Jimp.FONT_SANS_16_WHITE,
 *             offsetX: 1,
 *             offsetY: 1
 *         }, {
 *             fontName: Jimp.FONT_SANS_16_BLACK,
 *             offsetX: 0,
 *             offsetY: 0
 *         }]
 *     };
 *
 */

module.exports = class FontLoader {

    static TITLE_FONT_NAME = Constants.TITLE_FONT_NAME;
    static TIME_FONT_NAME = Constants.TIME_FONT_NAME;

    constructor(fontsDefs) {
        if (fontsDefs) {
            this._fontDefs = new Map(fontsDefs.map(item => this._mapFontFromInputFormat(item)));
        } else {
            this._fontDefs = new Map();
        }
    }

    _mapFontFromInputFormat(fontItem) {
        // If it isn't an array, make it one. 
        if (!Array.isArray(fontItem.fontName)) {
            fontItem.fontName = [fontItem.fontName];
        }

        const isSimple = (typeof fontItem.fontName[0] === 'string');
        if (isSimple && fontItem.fontName.length > 2) {
            throw new Error('can only specify up to 2 fonts in the simplified format');
        }
        let offset = fontItem.fontName.length - 1;
        const result = fontItem.fontName.map(item => {
            if (isSimple) {
                return {
                    fontName: item,
                    offsetX: offset,
                    offsetY: offset--
                };
            } else {
                return {
                    fontName: item.fontName,
                    offsetX: item.offsetX ? item.offsetX : 0,
                    offsetY: item.offsetY ? item.offsetY : 0
                }
            }
        });

        return [fontItem.key, result];
    }

    async loadAll() {
        // each item in the font definitions contains an array of fonts, 
        // this expression flattens that to a unique list of fonts
        const uniqueFontNames = new Set(
            Array.from(this._fontDefs.values())
                .map(item => item.map(font => font.fontName))
                .flat()
        );

        this._loadedFonts = new Map();
        for (let fontName of uniqueFontNames) {
            const loaded = await Jimp.loadFont(fontName);
            this._loadedFonts.set(fontName, loaded);
        }
    }

    /*
     * Returns a font in output format (with loaded font):
     *
     * const aFont = [{
     *     font: {},
     *     offsetX: 1,
     *     offsetY: 1
     * }, {
     *     font: {},
     *     offsetX: 0,
     *     offsetY: 0
     * }]
     * 
     * Note that each "font" may actually be made up of multiple real fonts (at
     * an offset, or not).
     */
    getFontsByKey(key) {
        if (!this._loadedFonts) {
            throw new Error('fonts not loaded');
        }
        const fontDef = this._fontDefs.get(key);
        return fontDef ? fontDef.map(item => {
            return {
                font: this._loadedFonts.get(item.fontName),
                offsetX: item.offsetX,
                offsetY: item.offsetY
            }
        }) : undefined;
    }

}
