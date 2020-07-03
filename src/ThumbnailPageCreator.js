
const Jimp = require('jimp');

module.exports = class ThumbnailPageCreator {

    constructor(layoutOptions, headerDetails) {
        this._layoutOptions = layoutOptions;
        this._headerDetails = headerDetails;
    }

    async createPage(list, pageNumber) {
        const plm = this._layoutOptions.pageLayoutManager;

        const images = [];
        for (let item of list) {
            const image = await Jimp.read(item.path);
            images.push({
                mark: item.mark,
                image: image
            });
        }

        const outputImage = new Jimp(
            this._layoutOptions.imageWidth,
            this._layoutOptions.imageHeight,
            this._layoutOptions.backgroundColour);

        plm.insertThumbs(outputImage, images, {
            rows: this._layoutOptions.thumbsRows,
            cols: this._layoutOptions.thumbsCols
        });

        plm.insertHeader(outputImage, { ...this._headerDetails, page: pageNumber });

        return outputImage;
    }

}
