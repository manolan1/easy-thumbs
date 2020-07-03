
const path = require('path');

const Jimp = require('jimp');

const ImageDimensionCalculator = require('../src/ImageDimensionCalculator');

const TEST_DATA = path.join(__dirname, './test-data');
const HEADER_HEIGHT = 110;

describe('ImageDimensionCalculator', () => {

    let red, narrow;

    beforeAll(async () => {
        red = await Jimp.read(path.join(TEST_DATA, './red.png'));
        narrow = await Jimp.read(path.join(TEST_DATA, './narrow.png'));
    });

    beforeEach(() => {

    })

    // thumbsColsComputed from generation options is always ignored
    it('passes through thumbsRows & thumbsCols, if set in options', () => {
        const idc = new ImageDimensionCalculator({
            imageWidth: 1920,
            imageHeight: 1080,
            thumbsRows: 10,
            thumbsCols: 20
        }, {
            thumbsRowsDefined: 9,
            thumbsColsDefined: 19,
            thumbsColsComputed: 99
        }, HEADER_HEIGHT);

        expect(idc.thumbsRows).toEqual(10);
        expect(idc.thumbsCols).toEqual(20);
        expect(idc.thumbsPerPage).toEqual(200);
    });

    it('uses thumbsRows & thumbsCols from the generation options, if not set in options', () => {
        const idc = new ImageDimensionCalculator({
            imageWidth: 1920,
            imageHeight: 1080
        }, {
            thumbsRowsDefined: 9,
            thumbsColsDefined: 19,
            thumbsColsComputed: 99
        }, HEADER_HEIGHT);

        expect(idc.thumbsRows).toEqual(9);
        expect(idc.thumbsCols).toEqual(19);
        expect(idc.thumbsPerPage).toEqual(171)
    });

    it('computes thumbsRows & thumbsCols if not set in either set of options', () => {
        const idc = new ImageDimensionCalculator({
            imageWidth: 2160,
            imageHeight: 1200
        }, {
            thumbsColsComputed: 99
        }, HEADER_HEIGHT);

        idc.evaluateThumbnailImage(red);

        expect(idc.thumbsRows).toEqual(8);
        expect(idc.thumbsCols).toEqual(9);
        expect(idc.thumbsPerPage).toEqual(72);
    });

    it('defaults thumbsRows & thumbsCols if not set in either set of options and cannot be calculated', () => {
        const idc = new ImageDimensionCalculator({
            imageWidth: 1920,
            imageHeight: 1200
        }, {
            thumbsColsComputed: 99
        }, HEADER_HEIGHT);

        expect(idc.thumbsRows).toEqual(7);
        expect(idc.thumbsCols).toEqual(8);
        expect(idc.thumbsPerPage).toEqual(56);
    });

    it('passes through imageHeight and imageWidth if they are specified in either set of options', () => {
        const idc1 = new ImageDimensionCalculator({
            imageWidth: 640,
            imageHeight: 480
        }, {}, HEADER_HEIGHT);

        expect(idc1.imageWidth).toEqual(640);
        expect(idc1.imageHeight).toEqual(480);

        const idc2 = new ImageDimensionCalculator({}, {
            imageWidth: 640,
            imageHeight: 480
        }, HEADER_HEIGHT);

        expect(idc2.imageWidth).toEqual(640);
        expect(idc2.imageHeight).toEqual(480);
    });

    it('computes imageHeight and imageWidth if they are not specified in either set of options, but thumbnail has been analysed', () => {
        const idc1 = new ImageDimensionCalculator({
            thumbsRows: 2,
            thumbsCols: 3
        }, {}, HEADER_HEIGHT);

        expect(() => idc1.imageWidth).toThrowError('Cannot determine output page width');
        expect(() => idc1.imageHeight).toThrowError('Cannot determine output page height');
        expect(idc1.isPageSizeKnownAndValid).toBeFalse();

        idc1.evaluateThumbnailImage(red);

        expect(idc1.imageWidth).toEqual(720);
        expect(idc1.imageHeight).toEqual(380);
        expect(idc1.isPageSizeKnownAndValid).toBeTrue();

        const idc2 = new ImageDimensionCalculator({}, {}, HEADER_HEIGHT);

        expect(idc2.isPageSizeKnownAndValid).toBeFalse();

        idc2.evaluateThumbnailImage(narrow);

        expect(idc2.imageWidth).toEqual(800);
        expect(idc2.imageHeight).toEqual(1055);
        expect(idc2.isPageSizeKnownAndValid).toBeTrue();
    });

    it('errors if computed imageHeight or imageWidth are larger than specified', () => {
        const idc = new ImageDimensionCalculator({
            thumbsRows: 2,
            thumbsCols: 3,
            imageHeight: 200,
            imageWidth: 300
        }, {}, HEADER_HEIGHT);

        idc.evaluateThumbnailImage(red);

        expect(() => idc.imageWidth).toThrowError('Cannot determine output page width');
        expect(() => idc.imageHeight).toThrowError('Cannot determine output page height');
        expect(idc.isPageSizeKnownAndValid).toBeFalse();
    });

    it('analysing empty thumnbail has no effect', () => {
        const idc = new ImageDimensionCalculator({
            thumbsRows: 2,
            thumbsCols: 3
        }, {}, HEADER_HEIGHT);

        expect(() => idc.imageWidth).toThrowError('Cannot determine output page width');
        expect(() => idc.imageHeight).toThrowError('Cannot determine output page height');
        expect(idc.isPageSizeKnownAndValid).toBeFalse();

        idc.evaluateThumbnailImage();

        expect(() => idc.imageWidth).toThrowError('Cannot determine output page width');
        expect(() => idc.imageHeight).toThrowError('Cannot determine output page height');
        expect(idc.isPageSizeKnownAndValid).toBeFalse();
    });

    it('"rounds" imageHeight to nearest preferred size if not set and imageWidth matches', () => {
        const idc1 = new ImageDimensionCalculator({}, {}, HEADER_HEIGHT);
        idc1.evaluateThumbnailImage(red);

        expect(idc1.imageWidth).toEqual(1920);
        expect(idc1.imageHeight).toEqual(1080);
        expect(idc1.isPageSizeKnownAndValid).toBeTrue();

        const idc2 = new ImageDimensionCalculator({}, {}, HEADER_HEIGHT);
        idc2.evaluateThumbnailImage(narrow);

        expect(idc2.imageWidth).toEqual(800);
        expect(idc2.imageHeight).toEqual(1055);
        expect(idc2.isPageSizeKnownAndValid).toBeTrue();
    });

    it('does not "round" if overridden', () => {
        const idc1 = new ImageDimensionCalculator({
            preferKnownSizes: false
        }, {}, HEADER_HEIGHT);
        idc1.evaluateThumbnailImage(red);

        expect(idc1.imageWidth).toEqual(1920);
        expect(idc1.imageHeight).toEqual(1055);
        expect(idc1.isPageSizeKnownAndValid).toBeTrue();

        const idc2 = new ImageDimensionCalculator({
            imageHeight: 1060
        }, {}, HEADER_HEIGHT);
        idc2.evaluateThumbnailImage(narrow);

        expect(idc2.imageWidth).toEqual(800);
        expect(idc2.imageHeight).toEqual(1060);
        expect(idc2.isPageSizeKnownAndValid).toBeTrue();
    });

});
