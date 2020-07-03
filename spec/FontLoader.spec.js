
const Jimp = require('jimp');

const FontLoader = require('../src/FontLoader');

describe('FontLoader', () => {

    it('instantiates correctly', () => {
        const fl = new FontLoader();
        expect(fl).toBeTruthy();
    });

    it('errors if fonts are not loaded', async () => {
        const fl = new FontLoader([{
            key: 'font1',
            fontName: Jimp.FONT_SANS_16_BLACK
        }]);
        expect(() => fl.getFontsByKey('font1')).toThrow();
    });

    it('loads a font', async () => {
        const fl = new FontLoader([{
            key: 'font1',
            fontName: Jimp.FONT_SANS_16_BLACK
        }]);
        await fl.loadAll();
        const fonts = fl.getFontsByKey('font1');
        expect(fonts[0].offsetX).toEqual(0);
        expect(fonts[0].offsetY).toEqual(0);
        expect(fonts[0].font.info.face).toEqual('open-sans-16-black');
    });

    it('returns undefined for a font that is not loaded', async () => {
        const fl = new FontLoader([{
            key: 'font1',
            fontName: Jimp.FONT_SANS_16_BLACK
        }]);
        await fl.loadAll();
        expect(fl.getFontsByKey('font2')).toBeUndefined();
    });

    it('loads multiple fonts', async () => {
        const fl = new FontLoader([{
            key: 'font1',
            fontName: Jimp.FONT_SANS_16_BLACK
        }, {
            key: 'font2',
            fontName: Jimp.FONT_SANS_32_BLACK
        }]);
        await fl.loadAll();
        const fonts1 = fl.getFontsByKey('font1');
        expect(fonts1[0].font.info.face).toEqual('open-sans-16-black');
        const fonts2 = fl.getFontsByKey('font2');
        expect(fonts2[0].font.info.face).toEqual('open-sans-32-black');
    });

    it('loads a compound font of 2 fonts in simple array format', async () => {
        const fl = new FontLoader([{
            key: 'font1',
            fontName: [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK]
        }]);
        await fl.loadAll();
        const fonts1 = fl.getFontsByKey('font1');
        expect(fonts1[0].font.info.face).toEqual('open-sans-16-white');
        expect(fonts1[0].offsetX).toEqual(1);
        expect(fonts1[0].offsetY).toEqual(1);
        expect(fonts1[1].font.info.face).toEqual('open-sans-16-black');
        expect(fonts1[1].offsetX).toEqual(0);
        expect(fonts1[1].offsetY).toEqual(0);
    });

    // This is unnecessary, but we'll make it work anyway, just in case
    it('loads a compound font of 1 font in simple array format', async () => {
        const fl = new FontLoader([{
            key: 'font1',
            fontName: [Jimp.FONT_SANS_16_WHITE]
        }]);
        await fl.loadAll();
        const fonts1 = fl.getFontsByKey('font1');
        expect(fonts1[0].font.info.face).toEqual('open-sans-16-white');
        expect(fonts1[0].offsetX).toEqual(0);
        expect(fonts1[0].offsetY).toEqual(0);
    });

    it('rejects a compound font of more than 2 fonts in simple array format', async () => {
        expect(() => new FontLoader([{
            key: 'font1',
            fontName: [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK, Jimp.FONT_SANS_14_BLACK]
        }])).toThrow();
    });

    it('loads a compound font in full format', async () => {
        const fl = new FontLoader([{
            key: 'font1',
            fontName: [{
                fontName: Jimp.FONT_SANS_16_WHITE,
                offsetX: 1,
                offsetY: 2
            }, {
                fontName: Jimp.FONT_SANS_16_BLACK,
                offsetX: 3,
                offsetY: 4
            }]
        }]);
        await fl.loadAll();
        const fonts1 = fl.getFontsByKey('font1');
        expect(fonts1[0].font.info.face).toEqual('open-sans-16-white');
        expect(fonts1[0].offsetX).toEqual(1);
        expect(fonts1[0].offsetY).toEqual(2);
        expect(fonts1[1].font.info.face).toEqual('open-sans-16-black');
        expect(fonts1[1].offsetX).toEqual(3);
        expect(fonts1[1].offsetY).toEqual(4);
    });

    it('handles missing offsets in compound font in full format', async () => {
        const fl = new FontLoader([{
            key: 'font1',
            fontName: [{
                fontName: Jimp.FONT_SANS_16_WHITE
            }, {
                fontName: Jimp.FONT_SANS_16_BLACK
            }]
        }]);
        await fl.loadAll();
        const fonts1 = fl.getFontsByKey('font1');
        expect(fonts1[0].font.info.face).toEqual('open-sans-16-white');
        expect(fonts1[0].offsetX).toEqual(0);
        expect(fonts1[0].offsetY).toEqual(0);
        expect(fonts1[1].font.info.face).toEqual('open-sans-16-black');
        expect(fonts1[1].offsetX).toEqual(0);
        expect(fonts1[1].offsetY).toEqual(0);
    });

});
