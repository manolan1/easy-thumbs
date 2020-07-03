
const path = require('path');

const Jimp = require('jimp');
const tmp = require('tmp');
const looksSame = require('looks-same');

const PageLayoutManager = require('../src/PageLayoutManager');
const FontLoader = require('../src/FontLoader');
const Constants = require('../src/Constants');

const TEST_DATA = path.join(__dirname, './test-data');

/*
 * To make any temporary file visible, use the following:
        const outFile = {
            name: 'tmp-output-plm.png',
            removeCallback: () => { }
        };
 */
describe('PageLayoutManager', () => {

    let fontLoader;
    // really constants, but must be initialised asynchronously
    let LARGE, SMALL, RED, BLUE, NARROW, IMAGE_GRID;

    beforeAll(async () => {
        LARGE = await Jimp.read(path.join(TEST_DATA, './large.png'));
        SMALL = await Jimp.read(path.join(TEST_DATA, './small.png'));
        RED = await Jimp.read(path.join(TEST_DATA, './red.png'));
        BLUE = await Jimp.read(path.join(TEST_DATA, './blue.png'));
        NARROW = await Jimp.read(path.join(TEST_DATA, './narrow.png'));
        IMAGE_GRID = [
            { mark: 1, image: NARROW },
            { mark: 2, image: BLUE },
            { mark: 3, image: LARGE },
            { mark: 4, image: SMALL },
            { mark: 5, image: SMALL },
            { mark: 6, image: SMALL },
            { mark: 7, image: RED }
        ];
    })

    beforeEach(async () => {
        fontLoader = new FontLoader([{
            key: FontLoader.TITLE_FONT_NAME,
            fontName: Jimp.FONT_SANS_32_BLACK
        }, {
            key: FontLoader.TIME_FONT_NAME,
            fontName: [Jimp.FONT_SANS_16_WHITE, Jimp.FONT_SANS_16_BLACK]
        }]);
        await fontLoader.loadAll();
    });

    it('fails if fonts have not been loaded or loaded incorrectly', async () => {
        fontLoader = new FontLoader([{
            key: FontLoader.TITLE_FONT_NAME,
            fontName: Jimp.FONT_SANS_32_BLACK
        }, {
            key: 'aa',
            fontName: Jimp.FONT_SANS_16_BLACK
        }]);

        // fonts not loaded

        expect(() => new PageLayoutManager({
            headerHeight: 135,
            margin: 1,
            headerRows: Constants.DEFAULT_HEADER_ROWS
        }, fontLoader)).toThrowError('fonts not loaded');

        await fontLoader.loadAll();

        expect(() => new PageLayoutManager({
            headerHeight: 135,
            margin: 1,
            headerRows: Constants.DEFAULT_HEADER_ROWS
        }, fontLoader)).toThrowError('fonts not loaded');
    });

    it('allows header height to be set', () => {
        const plm = new PageLayoutManager({
            headerHeight: 135,
            margin: 1,
            headerRows: Constants.DEFAULT_HEADER_ROWS
        }, fontLoader);

        // Default is 110, so this is overridden
        expect(plm.headerHeight).toEqual(135);
    });

    it('calculates header height for default font', () => {
        const plm = new PageLayoutManager({
            margin: 1,
            headerRows: Constants.DEFAULT_HEADER_ROWS
        }, fontLoader);

        // Default is calculated from header rows and font size
        expect(plm.headerHeight).toEqual(110);
    });

    it('calculates header height for different font', async () => {
        fontLoader = new FontLoader([{
            key: FontLoader.TITLE_FONT_NAME,
            fontName: Jimp.FONT_SANS_14_BLACK
        }, {
            key: FontLoader.TIME_FONT_NAME,
            fontName: Jimp.FONT_SANS_16_BLACK
        }]);
        await fontLoader.loadAll();

        const plm = new PageLayoutManager({
            margin: 1,
            headerRows: [{ text: '' }]
        }, fontLoader);

        expect(plm.headerHeight).toEqual(22);
    });

    it('errors if computed header height is larger than defined header height', () => {
        const plm = new PageLayoutManager({
            margin: 1,
            headerHeight: 100,
            headerRows: Constants.DEFAULT_HEADER_ROWS
        }, fontLoader);

        expect(() => plm.headerHeight).toThrowError('Cannot set header height smaller than computed minimum 110');
    });

    // This test checks a private property (because we can and it simplifies the test)
    it('allows headers to be specified as an array, a single item, or text', async () => {
        const plm1 = new PageLayoutManager({
            margin: 1,
            headerRows: [{ text: 'a' }],
        }, fontLoader);

        const headerRows1 = plm1._headerRows;
        expect(headerRows1.length).toEqual(1);
        expect(headerRows1[0].length).toEqual(1);
        expect(headerRows1[0][0]).toEqual({
            text: 'a',
            align: Constants.LEFT,
            condition: undefined
        });

        const plm2 = new PageLayoutManager({
            margin: 1,
            headerRows: { text: 'a' }
        }, fontLoader);

        expect(plm2._headerRows).toEqual(headerRows1);

        const plm3 = new PageLayoutManager({
            margin: 1,
            headerRows: 'a'
        }, fontLoader);

        expect(plm3._headerRows).toEqual(headerRows1);
    });

    it('inserts header rows', async (done) => {
        const EXPECTED_IMAGE = path.join(TEST_DATA, './header-test.png');
        const outputImage = new Jimp(1920, 1080, '#FFFFFF');
        const outFile = tmp.fileSync({
            postfix: '.png'
        });
        const headerDetails = {
            name: 'source file name',
            filename: 'full path to source file name',
            durationFractional: '00:01:04.510',
            startTimeFractional: '04:38:12.022',
            duration: '00:01:05',
            startTime: '04:38:12',
            numberOfPages: 42,
            formatName: 'mpegts',
            page: 24
        }

        const plm = new PageLayoutManager({
            margin: 1,
            headerRows: [[{
                text: '${filename}'
            }, {
                align: Constants.RIGHT,
                text: '${duration}'
            }], {
                align: Constants.RIGHT,
                text: '${startTime}'
            }, {
                text: '${formatName}'
            }, {
                align: Constants.CENTRE,
                text: 'Page ${page} of ${numberOfPages}'
            }, {
                text: 'This will not appear',
                condition: '${page} > ${numberOfPages}'
            }, {
                text: 'This will appear',
                condition: '${page} < ${numberOfPages}'
            }]
        }, fontLoader);

        plm.insertHeader(outputImage, headerDetails);

        await outputImage.writeAsync(outFile.name);
        looksSame(EXPECTED_IMAGE, outFile.name, (_err, result) => {
            expect(result.equal).toBeTrue();
            outFile.removeCallback();
            done();
        });
    });

    it('inserts thumbnails in a variable grid', async (done) => {
        const EXPECTED_IMAGE = path.join(TEST_DATA, './variable-grid.png');
        const outFile = tmp.fileSync({
            postfix: '.png'
        });

        const outputImage = new Jimp(1920, 1080, '#FFFF');

        const plm = new PageLayoutManager({
            margin: 1,
            headerRows: Constants.DEFAULT_HEADER_ROWS
        }, fontLoader);

        plm.insertThumbs(outputImage, IMAGE_GRID, {
            rows: 7,
            cols: 2
        }, {
            x: 0,
            y: 135
        });

        await outputImage.writeAsync(outFile.name);

        looksSame(EXPECTED_IMAGE, outFile.name, (_err, result) => {
            expect(result.equal).toBeTrue();
            outFile.removeCallback();
            done();
        });
    });

    it('inserts thumbnails with default start position', async (done) => {
        const EXPECTED_IMAGE = path.join(TEST_DATA, './variable-grid-default.png');
        const outFile = tmp.fileSync({
            postfix: '.png'
        });

        const outputImage = new Jimp(1920, 1080, '#FFFF');

        const plm = new PageLayoutManager({
            margin: 1,
            headerRows: Constants.DEFAULT_HEADER_ROWS
        }, fontLoader);

        plm.insertThumbs(outputImage, IMAGE_GRID, {
            rows: 7,
            cols: 2
        });

        await outputImage.writeAsync(outFile.name);

        looksSame(EXPECTED_IMAGE, outFile.name, (_err, result) => {
            expect(result.equal).toBeTrue();
            outFile.removeCallback();
            done();
        });
    });

    it('inserts thumbnails in a fixed grid', async (done) => {
        const EXPECTED_IMAGE = path.join(TEST_DATA, './fixed-grid.png');
        const outFile = tmp.fileSync({
            postfix: '.png'
        });

        const outputImage = new Jimp(1920, 1080, '#FFFF');

        const plm = new PageLayoutManager({
            margin: 1,
            headerRows: Constants.DEFAULT_HEADER_ROWS
        }, fontLoader);

        plm.insertThumbs(outputImage, IMAGE_GRID, {
            rows: 7,
            cols: 2,
            thumbsWidth: 240,
            thumbsHeight: 135
        }, {
            x: 0,
            y: 135
        });

        await outputImage.writeAsync(outFile.name);

        looksSame(EXPECTED_IMAGE, outFile.name, (_err, result) => {
            expect(result.equal).toBeTrue();
            outFile.removeCallback();
            done();
        });
    });

});
