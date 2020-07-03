
const Template = require('easy-template-string').default;

const Constants = require('./Constants');
const FontLoader = require('./FontLoader');
const JimpUtils = require('./JimpUtils');
const SafeEval = require('./SafeEval');
const TimeConverter = require('./TimeConverter');

/*
 * const plm = new PageLayoutManager(options, fontLoader);
 *
 * where:
 * options    is an options object, details below
 * fontLoader is a properly initalised FontLoader instance that supports
 *            the two LayoutManager fonts
 * 
 * options may have the following properties:
 * 
 * headerRows   the templates for the header rows (MANDATORY)
 * margin       the spacing to leave around text (MANDATORY)
 * headerHeight to override the height of the header on the page (OPTIONAL)
 */
module.exports = class PageLayoutManager {

    constructor(options, fontLoader) {
        this._options = options;
        if (!fontLoader.getFontsByKey(FontLoader.TITLE_FONT_NAME)
            || !fontLoader.getFontsByKey(FontLoader.TIME_FONT_NAME)) {
            throw new Error('fonts not loaded');
        }
        this._fontLoader = fontLoader;
        this._jimpUtils = new JimpUtils(fontLoader);
        this._headerRows = this._normaliseHeaderRows(this._options.headerRows);
    }

    /*
     * Theoretically, header rows are organized as an array of arrays of items.
     * 
     * Each item in the outer array indicates a possible row in the header and each
     * item in the inner array indicates some text that may appear on that row.
     * 
     * While this is how it is represented theoretically, in fact, we allow a single
     * header row to be represented by a single item (not an array of items, since
     * that will be assumed to be an array of rows).
     * 
     * We also allow a single item to be represented as an item without an array.
     * 
     * And we allow each item to be represented by a simple string, in which case
     * it is assumed to be left aligned without any condition.
     * 
     * Since each item can be optional (if a condition is specified), it is possible
     * that a whole row will not actually appear in the output. This is ignored when
     * calculating the header height: header height will always be sufficient for 
     * all possible rows.
     */
    _normaliseHeaderRows(headerRows) {
        const inputHeaderRows = Array.isArray(headerRows) ? headerRows : [headerRows];
        const outputHeaderRows = [];
        for (let headerRow of inputHeaderRows) {
            const items = Array.isArray(headerRow) ? headerRow : [headerRow];
            const outputItems = [];
            for (let item of items) {
                const normalisedItem = this._normaliseHeaderItem(item);
                outputItems.push(normalisedItem);
            }
            outputHeaderRows.push(outputItems);
        }
        return outputHeaderRows;
    }

    _normaliseHeaderItem(item) {
        if (typeof item === 'string') {
            return {
                text: item,
                align: Constants.LEFT,
                condition: undefined
            };
        }
        return {
            text: item.text,
            align: item.align || Constants.LEFT,
            condition: item.condition
        };
    }

    insertHeader(outputImage, headerValues) {
        let yPos = this._options.margin;
        const imageWidth = outputImage.getWidth();
        for (let headerRow of this._headerRows) {
            let height = 0;
            for (let headerItem of headerRow) {
                if (headerItem.condition) {
                    const condition = new Template(headerItem.condition);
                    if (!SafeEval.evaluate(condition.interpolate(headerValues))) {
                        break;
                    }
                }
                const template = new Template(headerItem.text);
                const textToPrint = template.interpolate(headerValues);
                height = Math.max(height,
                    this._jimpUtils.printTextInImage(
                        outputImage,
                        FontLoader.TITLE_FONT_NAME,
                        this._jimpUtils.calculateXPos(
                            headerItem.align,
                            FontLoader.TITLE_FONT_NAME,
                            imageWidth,
                            textToPrint,
                            this._options.margin
                        ),
                        yPos,
                        textToPrint
                    ));
            }
            yPos += height;
        }
    }

    get headerHeight() {
        const titleFont = this._fontLoader.getFontsByKey(FontLoader.TITLE_FONT_NAME);
        const lineHeight = titleFont[0].font.common.lineHeight;

        const computedHeight = this._headerRows.length * lineHeight + 2 * this._options.margin;
        if (this._options.headerHeight && computedHeight > this._options.headerHeight) {
            throw new Error(`Cannot set header height smaller than computed minimum ${computedHeight}`);
        }
        return this._options.headerHeight || computedHeight;
    }

    insertThumbs(outputImage, images, grid, startPos = { x: 0, y: this.headerHeight }) {
        let index = 0;
        let yPos = startPos.y;
        for (let row = 0; row < grid.rows; row++) {
            let xPos = startPos.x;
            let rowHeight = 0;
            for (let col = 0; col < grid.cols; col++) {
                if (index >= images.length) {
                    return;
                }
                const image = images[index].image;
                outputImage.composite(image, xPos, yPos);
                const time = TimeConverter.convertTimeToReadable(images[index].mark);
                this._jimpUtils.printTextInImage(
                    outputImage,
                    FontLoader.TIME_FONT_NAME,
                    xPos + this._options.margin,
                    yPos + this._options.margin,
                    time
                );
                index++;
                xPos += grid.thumbsWidth ? grid.thumbsWidth : image.getWidth();
                rowHeight = Math.max(rowHeight, image.getHeight());
            }
            yPos += grid.thumbsHeight ? grid.thumbsHeight : rowHeight;
        }
    }
}