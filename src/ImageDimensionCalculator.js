
const Constants = require('./Constants');

module.exports = class ImageDimensionCalculator {

    constructor(rawLayoutOptions, generationOptions, headerHeight) {
        this._layoutOptions = rawLayoutOptions;
        this._generationOptions = generationOptions;
        this._headerHeight = headerHeight;
    }

    get isPageSizeKnownAndValid() {
        return !!this._imageWidthOrUndefined && !!this._imageHeightOrUndefined;
    }

    evaluateThumbnailImage(image) {
        if (image && image.getHeight && image.getWidth) {
            this._thumbnailHeight = image.getHeight();
            this._thumbnailWidth = image.getWidth();
        }
    }

    /*
     * imageWidth
     * - specified in options
     * - computed from thumbsCols * thumbsWidth
     * - if that cannot be done, throws
     */
    get imageWidth() {
        const imageWidth = this._imageWidthOrUndefined;
        if (imageWidth) {
            return imageWidth;
        }
        throw new Error('Cannot determine output page width');
    }

    get _imageWidthOrUndefined() {
        const defined = this._imageWidthDefined;
        const computed = this._imageWidthComputed;
        if (defined && computed && computed > defined) {
            return undefined;
        }
        return defined || computed;
    }

    get _imageWidthDefined() {
        return this._layoutOptions.imageWidth
            || this._generationOptions.imageWidth;
    }

    get _imageWidthComputed() {
        return this._thumbnailWidth ? this.thumbsCols * this._thumbnailWidth : undefined;
    }

    /*
     * imageHeight
     * - specified in options
     * - computed from thumbsRows * thumbsHeight (plus header)
     * - if that cannot be done, throws
     */
    get imageHeight() {
        const imageHeight = this._imageHeightOrUndefined;
        if (imageHeight) {
            return imageHeight;
        }
        throw new Error('Cannot determine output page height');
    }

    get _imageHeightOrUndefined() {
        const defined = this._imageHeightDefined;
        const computed = this._imageHeightComputed;
        if (defined && computed && computed > defined) {
            return undefined;
        }
        const preferred = this._determinePreferredHeight(defined, computed);
        return preferred || defined || computed;
    }

    get _imageHeightDefined() {
        return this._layoutOptions.imageHeight
            || this._generationOptions.imageHeight;
    }

    get _imageHeightComputed() {
        if (this._thumbnailHeight && this._headerHeight) {
            return (this.thumbsRows * this._thumbnailHeight) + this._headerHeight;
        }
        return undefined;
    }

    _determinePreferredHeight(defined, computed) {
        if (defined || !this._preferKnownSizes) {
            return undefined;
        }
        const width = this._imageWidthOrUndefined;
        if (!width) {
            return undefined;
        }
        for (let preferred of Constants.PREFERRED_IMAGE_SIZES) {
            if (preferred.width === width && preferred.height > computed) {
                return preferred.height;
            }
        }
        return undefined;
    }

    // defaults to true
    get _preferKnownSizes() {
        return (this._layoutOptions.preferKnownSizes !== undefined) ? this._layoutOptions.preferKnownSizes : true;
    }

    /*
     * thumbsRows:
     * - specified in options
     * - specified at generation time
     * - computed from imageHeight / thumbsHeight (imageHeight specified, thumbsHeight analyzed), allowing for header
     * - defaults to 7
     * - currently, when calculating number of thumbs, if that is not specified somehow, will be
     *               rows defined or the default * cols estimated or the default
     */
    get thumbsRows() {
        return this._layoutOptions.thumbsRows
            || this._generationOptions.thumbsRowsDefined
            || this._thumbsRowsComputed
            || Constants.DEFAULT_THUMBS_ROWS;
    }

    get _thumbsRowsComputed() {
        if (this._imageHeightDefined && this._thumbnailHeight && this._headerHeight) {
            return Math.floor((this._imageHeightDefined - this._headerHeight) / this._thumbnailHeight);
        }
        return undefined;
    }

    /*
     * thumbsCols:
     * - specified in options
     * - specified at generation time
     * - computed from imageWidth / thumbsWidth (specified at generation time, in which case re-evaluate at layout time)
     * - computed from imageWidth / thumbsWidth (imageWidth specified, thumbsWidth analyzed)
     * - defaults to 8
     * - estimated value is specified || computed || default
     */
    get thumbsCols() {
        return this._layoutOptions.thumbsCols
            || this._generationOptions.thumbsColsDefined
            || this._thumbsColsComputed
            || Constants.DEFAULT_THUMBS_COLS
    }

    get _thumbsColsComputed() {
        if (this._imageWidthDefined && this._thumbnailWidth) {
            return Math.floor(this._imageWidthDefined / this._thumbnailWidth);
        }
        return undefined;
    }

    get thumbsPerPage() {
        return this.thumbsRows * this.thumbsCols;
    }

}