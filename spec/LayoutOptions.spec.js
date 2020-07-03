
const path = require('path');

const Jimp = require('jimp');

const LayoutOptions = require('../src/LayoutOptions');

const TEST_DATA = path.join(__dirname, './test-data');
const RED = path.join(TEST_DATA, './red.png');

describe('LayoutOptions', () => {

    it('loads fonts', async () => {
        const layoutOptions = new LayoutOptions({
            imageWidth: 1920,
            imageHeight: 1080
        }, {
            thumbsRowsDefined: 7
        });

        await layoutOptions.init();

        // Default is Jimp.FONT_SANS_32_BLACK
        expect(layoutOptions.titleFont[0].font.info.face).toEqual('open-sans-32-black');

        // Default is [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK]
        expect(layoutOptions.timeFont[0].font.info.face).toEqual('open-sans-16-white');
        expect(layoutOptions.timeFont[1].font.info.face).toEqual('open-sans-16-black');
    });

    it('allows fonts to be overridden', async () => {
        const layoutOptions = new LayoutOptions({
            titleFont: Jimp.FONT_SANS_14_BLACK,
            imageWidth: 1920,
            imageHeight: 1080
        }, {
            thumbsRowsDefined: 7
        });

        await layoutOptions.init();

        // Default is Jimp.FONT_SANS_32_BLACK, so this is overridden
        expect(layoutOptions.titleFont[0].font.info.face).toEqual('Open Sans Regular');
        expect(layoutOptions.titleFont[0].font.info.size).toEqual(14);

        // Default is [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK]
        expect(layoutOptions.timeFont[0].font.info.face).toEqual('open-sans-16-white');
        expect(layoutOptions.timeFont[1].font.info.face).toEqual('open-sans-16-black');
    });

    it('fails if fonts have not been loaded', async () => {
        const layoutOptions = new LayoutOptions({}, {});

        // no init()

        expect(() => {
            layoutOptions.titleFont;
        }).toThrowError('Fonts not loaded, call init()');
        expect(() => {
            layoutOptions.timeFont;
        }).toThrowError('Fonts not loaded, call init()');
    });

    it('generates dimensions through the ImageDimensionCalculator', async () => {
        const layoutOptions = new LayoutOptions({}, {});

        expect(() => layoutOptions.thumbsCols).toThrowError('Image dimensions not calculated, call init()');
        expect(() => layoutOptions.thumbsRows).toThrowError('Image dimensions not calculated, call init()');
        expect(() => layoutOptions.imageWidth).toThrowError('Image dimensions not calculated, call init()');
        expect(() => layoutOptions.imageHeight).toThrowError('Image dimensions not calculated, call init()');

        await expectAsync(layoutOptions.init()).toBeRejectedWithError('Cannot determine page dimensions');

        await layoutOptions.init(RED);

        expect(layoutOptions.thumbsCols).toEqual(8);
        expect(layoutOptions.thumbsRows).toEqual(7);
        expect(layoutOptions.imageWidth).toEqual(1920);
        expect(layoutOptions.imageHeight).toEqual(1080);
    });

    it('empty options and no options are treated the same', async () => {
        const layoutOptions = new LayoutOptions();

        await layoutOptions.init(RED);

        expect(layoutOptions.thumbsCols).toEqual(8);
        expect(layoutOptions.thumbsRows).toEqual(7);
        expect(layoutOptions.imageWidth).toEqual(1920);
        expect(layoutOptions.imageHeight).toEqual(1080);
    });

    it('sets background colour from layout options', async () => {
        const layoutOptions1 = new LayoutOptions({
            imageWidth: 1920,
            imageHeight: 1080,
            backgroundColour: '#FF0000'
        }, {
            thumbsRowsDefined: 7,
            thumbsCols: 8
        });

        await layoutOptions1.init();

        expect(layoutOptions1.backgroundColour).toEqual('#FF0000');
        expect(layoutOptions1.backgroundColor).toEqual('#FF0000');

        const layoutOptions2 = new LayoutOptions({
            imageWidth: 1920,
            imageHeight: 1080,
            backgroundColor: '#00FF00'
        }, {
            thumbsRowsDefined: 7,
            thumbsCols: 8
        });

        await layoutOptions2.init();

        expect(layoutOptions2.backgroundColour).toEqual('#00FF00');
        expect(layoutOptions2.backgroundColor).toEqual('#00FF00');
    });

    it('sets background colour from generation options', async () => {
        const layoutOptions1 = new LayoutOptions({
            imageWidth: 1920,
            imageHeight: 1080,
        }, {
            thumbsRowsDefined: 7,
            thumbsCols: 8,
            backgroundColor: '#0000FF'
        });

        await layoutOptions1.init();

        expect(layoutOptions1.backgroundColour).toEqual('#0000FF');
        expect(layoutOptions1.backgroundColor).toEqual('#0000FF');

        const layoutOptions2 = new LayoutOptions({
            imageWidth: 1920,
            imageHeight: 1080,
        }, {
            thumbsRowsDefined: 7,
            thumbsCols: 8,
            backgroundColour: '#FF00FF'
        });

        await layoutOptions2.init();

        expect(layoutOptions2.backgroundColour).toEqual('#FF00FF');
        expect(layoutOptions2.backgroundColor).toEqual('#FF00FF');
    });

    it('defaults background colour', async () => {
        const layoutOptions = new LayoutOptions({
            imageWidth: 1920,
            imageHeight: 1080,
        }, {
            thumbsRowsDefined: 7,
            thumbsCols: 8
        });

        await layoutOptions.init();

        expect(layoutOptions.backgroundColour).toEqual('#FFFFFF');
        expect(layoutOptions.backgroundColor).toEqual('#FFFFFF');
    });

});
