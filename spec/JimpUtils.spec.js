
const path = require('path');

const Jimp = require('jimp');
const tmp = require('tmp');
const looksSame = require('looks-same');

const JimpUtils = require('../src/JimpUtils');
const FontLoader = require('../src/FontLoader');
const Constants = require('../src/Constants');

const TEST_DATA = path.join(__dirname, './test-data');
const HELLO = path.join(TEST_DATA, './hello.png');

describe('JimpUtils', () => {

    let openSans16Black, openSans16White;
    let fontLoader, ju;

    beforeAll(async () => {
        openSans16Black = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
        openSans16White = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
    });

    beforeEach(() => {
        fontLoader = new FontLoader();
        spyOn(fontLoader, 'getFontsByKey').and.returnValue([{
            font: openSans16Black,
            offsetX: 0,
            offsetY: 0
        }, {
            font: openSans16White,
            offsetX: -1,
            offsetY: -1
        }]);
        ju = new JimpUtils(fontLoader);
    });

    it('is instantiated', () => {
        expect(ju).toBeTruthy();
    });

    it('calculates x position for left alignment', () => {
        const xPos = ju.calculateXPos(Constants.LEFT, FontLoader.TITLE_FONT_NAME, 200, 'Hello', 1);
        expect(xPos).toEqual(1);
    });

    it('calculates x position for right alignment', () => {
        const xPos = ju.calculateXPos(Constants.RIGHT, FontLoader.TITLE_FONT_NAME, 200, 'Hello', 1);
        expect(xPos).toEqual(161);
    });

    it('calculates x position for centre alignment', () => {
        const xPos = ju.calculateXPos(Constants.CENTRE, FontLoader.TITLE_FONT_NAME, 200, 'Hello', 1);
        expect(xPos).toEqual(81);
    });

    it('prints text in image', async (done) => {
        const tmpObj = tmp.fileSync({
            postfix: '.png'
        });
        const outputImage = new Jimp(200, 100, '#FFFFFF');

        const height = ju.printTextInImage(outputImage, FontLoader.TITLE_FONT_NAME, 2, 5, 'Hello');

        expect(height).toEqual(18);
        await outputImage.writeAsync(tmpObj.name);
        looksSame(HELLO, tmpObj.name, (_err, result) => {
            expect(result.equal).toBeTrue();
            tmpObj.removeCallback();
            done();
        });
    });
});
