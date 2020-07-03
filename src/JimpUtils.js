
const Jimp = require('jimp');

const Constants = require('./Constants');

module.exports = class JimpUtils {

    constructor(fontLoader) {
        this._fl = fontLoader;
    }

    calculateXPos(alignment, fontKey, imageWidth, text, margin) {
        let xPos = 0;
        if (alignment && alignment !== Constants.LEFT) {
            const fonts = this._fl.getFontsByKey(fontKey);
            const width = Jimp.measureText(fonts[0].font, text);
            if (alignment === Constants.RIGHT) {
                xPos = imageWidth - margin - width;
            } else {
                xPos = Math.floor((imageWidth - width) / 2);
            }
        }
        xPos = Math.max(margin, xPos);
        return xPos;
    }

    printTextInImage(image, fontKey, xPos, yPos, text) {
        const fonts = this._fl.getFontsByKey(fontKey);
        let maxHeight = 0;
        for (let font of fonts) {
            image.print(font.font, xPos + font.offsetX, yPos + font.offsetY, text);
            maxHeight = Math.max(maxHeight, font.font.common.lineHeight + font.offsetY);
        }
        return maxHeight;
    }
}