
const fs = require('fs');

const tmp = require('tmp');

const Constants = require('./Constants');
const IntervalCalculator = require('./IntervalCalculator');

/*
 * const om = new GenerationOptions(metadata, options);
 *
 * where:
 * 
 * metadata - ffprobe metadata output, processed through MetadataHandler
 * options - An object containing the following keys, all optional:
 * 
 *     imageWidth: 1920,    Preferred width of the output page of thumbnails
 *     thumbsCols: 8,       The number of columns of thumbs in the output (default = 8)
 *     thumbsCount: 56,     The number of thumbnails, if specified
 *     thumbsHeight: 120,   The height of the thumbnail images (in px)
 *     thumbsInterval: 1,   The interval between thumbnails, if specified
 *     thumbsRows: 7,       The number of rows of thumbs in the output (soft default = 7)
 *     thumbsSamples: [],   Array of time marks for the thumbnails
 *     thumbsWidth: 240,    The width of the thumbnail images (in px) (default = see below)
 *
 *     See individual getters for more details of how these are used to calculate the
 *     important data points.
 * 
 *     Notes:
 *     1. Only one of thumbsCount and thumbsInterval may be specified. thumbsSamples overrides both.
 *     2. The thumbsRows "soft default" means that this class may assume it is 7, but will not
 *        make that available externally (through the getter, which is renamed accordingly)
 *     3. However the number of thumbnails is determined, see below for detailed rules, it
 *        always acts as a maximum number. The actual number may be lower if the content is short.
 *     4. It is normal to specify just one of thumbnail width and height and let the other be
 *        determined by the aspect ratio of the video file. Specifying both may result in the
 *        thumbnails being stretched.
 *     5. Except for the restriction in note 1, options are not validated for reasonableness.
 * 
 * REMEMBER, when maintaining this class:
 * - this._options.X is the original value of X, as specified by the caller
 * - this.X          may be a computed or derived value
 */

module.exports = class GenerationOptions {

    constructor(metadata, options) {
        this._metadata = metadata;
        this._options = options || {};
        if (this._options.thumbsCount && this._options.thumbsInterval) {
            throw new Error('Cannot specify both a total number of thumbs and an interval');
        }
        tmp.setGracefulCleanup();
        this._createdThumbDirectory = false;
        this._samples = this._getSamplesFromOptions(this._options);
    }

    /*
     * Work out which times should have thumbs created.
     *
     * The sample times can be specified:
     * - in the options (thumbsSamples), in which case they are not validated at all.
     *   If they are wrong, the generation process will not work as expected, or at all.
     * - by interval (thumbsInterval in seconds).
     * - as a preferred number of thumbnails (thumbsCount).
     * - by specifying the rows and cols (thumbsRows, thumbsCols), in which case there 
     *   will be rows x cols samples.
     * - based on thumbsRows and thumbsCols defaults (7 rows x 8 cols).
     */
    _getSamplesFromOptions(options) {
        if (options.thumbsSamples) {
            return options.thumbsSamples;
        } else if (options.thumbsInterval) {
            return IntervalCalculator.calculateByInterval(this._metadata.duration, options.thumbsInterval)
        } else {
            const count = options.thumbsCount || this.thumbsRowsOrDefault * this.thumbsColsOrDefault;
            return IntervalCalculator.calculateByCount(this._metadata.duration, count);
        }
    }

    get thumbsCount() {
        return this._samples.length;
    }

    /*
     * Number of rows.
     * 
     * Note the distinction here between a defined number of rows and a default. If not
     * specified, we assume it will end up as 7, but the accessor will return undefined.
     */
    get thumbsRowsDefined() {
        return this._options.thumbsRows;
    }

    get thumbsRowsOrDefault() {
        return this.thumbsRowsDefined || Constants.DEFAULT_THUMBS_ROWS;
    }

    /*
     * The number of columns:
     * - may be specified (thumbsCols)
     * - If not specified, and both the output image width and thumbnail width are specified,
     *   then it will be determined from them.
     * - Otherwise defaults to 8.
     */
    get thumbsColsDefined() {
        return this._options.thumbsCols;
    }

    get thumbsColsComputed() {
        return this.thumbsColsDefined ||
            (this._options.imageWidth && this._options.thumbsWidth
                ? Math.floor(this._options.imageWidth / this._options.thumbsWidth)
                : undefined);
    }

    get thumbsColsOrDefault() {
        return this.thumbsColsComputed || Constants.DEFAULT_THUMBS_COLS;
    }

    get samplePositions() {
        return this._samples;
    }

    /*
     * The width is whatever was specified, if something was.
     * 
     * If nothing was specified, then it depends on the height: if the height was specified, 
     * return undefined (thumbnail size will be constrained by height). If the height was also
     * not specified, then it depends whether it can be calculated from the image size and the
     * number of columns. Otherwise, return the default width.
     */
    get thumbsWidth() {
        return this._options.thumbsWidth ||
            (this._options.thumbsHeight
                ? undefined
                : (this._options.imageWidth
                    ? Math.floor(this._options.imageWidth / this.thumbsColsOrDefault)
                    : Constants.DEFAULT_THUMBS_WIDTH)
            );
    }

    // Note use of the getter for the thumbsWidth, not the height
    get thumbSize() {
        return `${this.thumbsWidth || '?'}x${this._options.thumbsHeight || '?'}`
    }

    get thumbFilename() {
        return this._options.thumbFilename || Constants.DEFAULT_THUMBS_FILENAME;
    }

    makeThumbDirectory() {
        if (this._options.thumbDirectory) {
            if (!fs.existsSync(this._options.thumbDirectory)) {
                fs.mkdirSync(this._options.thumbDirectory, { recursive: true });
            }
        } else {
            const tmpDir = tmp.dirSync({ unsafeCleanup: true });
            this._options.thumbDirectory = tmpDir.name;
        }
        this._createdThumbDirectory = true;
    }

    get thumbDirectory() {
        if (this._createdThumbDirectory) {
            return this._options.thumbDirectory;
        } else {
            throw Error('Cannot use thumbDirectory before calling makeThumbDirectory()');
        }
    }

    get metadata() {
        return this._metadata;
    }

}