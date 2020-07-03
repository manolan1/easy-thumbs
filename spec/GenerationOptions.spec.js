
const fs = require('fs');
const path = require('path');

const GenerationOptions = require('../src/GenerationOptions');

const MINIMAL_METADATA = {
    duration: 72.99933
};

describe('GenerationOptions', () => {

    it('accepts a total number of thumbnails', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsCount: 64
        });

        expect(generationOptions.thumbsCount).toEqual(64);
    });

    it('accepts row and col counts of thumbnails', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsRows: 5,
            thumbsCols: 7
        });

        expect(generationOptions.thumbsCount).toEqual(35);
        expect(generationOptions.thumbsRowsDefined).toEqual(5);
        expect(generationOptions.thumbsColsDefined).toEqual(7);
        expect(generationOptions.thumbsColsComputed).toEqual(7);
        expect(generationOptions.thumbsColsOrDefault).toEqual(7);
    });

    it('accepts different row and col counts of thumbnails', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsRows: 4,
            thumbsCols: 6
        });

        expect(generationOptions.thumbsCount).toEqual(24);
        expect(generationOptions.thumbsRowsDefined).toEqual(4);
        expect(generationOptions.thumbsColsDefined).toEqual(6);
        expect(generationOptions.thumbsColsComputed).toEqual(6);
        expect(generationOptions.thumbsColsOrDefault).toEqual(6);
    });

    it('calculates col count if thumbnail width and image width are specified', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            imageWidth: 1280,
            thumbsWidth: 142,
            thumbsRows: 7
        });

        expect(generationOptions.thumbsColsDefined).toBeUndefined();
        expect(generationOptions.thumbsColsComputed).toEqual(9);
        expect(generationOptions.thumbsColsOrDefault).toEqual(9);
    });

    it('defaults col count of thumbnails', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsRows: 9
        });

        expect(generationOptions.thumbsCount).toEqual(72);
        expect(generationOptions.thumbsRowsDefined).toEqual(9);
        expect(generationOptions.thumbsColsDefined).toBeUndefined();
        expect(generationOptions.thumbsColsComputed).toBeUndefined();
        expect(generationOptions.thumbsColsOrDefault).toEqual(8);
    });

    it('if all else fails, defaults thumbs count', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA);

        expect(generationOptions.thumbsCount).toEqual(56);
        expect(generationOptions.thumbsRowsDefined).toBeUndefined();
        // expect(om.thumbsRowsEstimated).toEqual(7);
        expect(generationOptions.thumbsColsDefined).toBeUndefined();
        expect(generationOptions.thumbsColsComputed).toBeUndefined();
        expect(generationOptions.thumbsColsOrDefault).toEqual(8);
    });

    it('defaults row and col counts of thumbnails even if total is specified', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsCount: 72
        });

        expect(generationOptions.thumbsCount).toEqual(72);
        // expect(om.thumbsRowsEstimated).toEqual(7);
        expect(generationOptions.thumbsRowsDefined).toBeUndefined();
        expect(generationOptions.thumbsColsDefined).toBeUndefined();
        expect(generationOptions.thumbsColsComputed).toBeUndefined();
        expect(generationOptions.thumbsColsOrDefault).toEqual(8);
    });

    it('supports specifying thumbs by interval', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsInterval: 1
        });

        expect(generationOptions.thumbsCount).toEqual(72);
        // expect(om.thumbsRowsEstimated).toEqual(7);
        expect(generationOptions.thumbsRowsDefined).toBeUndefined();
        expect(generationOptions.thumbsColsDefined).toBeUndefined();
        expect(generationOptions.thumbsColsComputed).toBeUndefined();
        expect(generationOptions.thumbsColsOrDefault).toEqual(8);
    });

    it('cannot calculate thumbs by count and interval at the same time', () => {
        expect(() => {
            new GenerationOptions(MINIMAL_METADATA, {
                thumbsCount: 56,
                thumbsInterval: 1
            });
        }).toThrowError('Cannot specify both a total number of thumbs and an interval');

    });

    it('calculates sample positions', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsInterval: 10
        });

        expect(generationOptions.samplePositions).toEqual([1, 11, 21, 31, 41, 51, 61, 71]);
    });

    it('calculates sample positions by thumbnail count', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsCount: 10
        });

        expect(generationOptions.samplePositions).toEqual([1, 8, 16, 24, 32, 40, 48, 56, 64, 71]);
    });

    it('accepts preset positions', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsSamples: [1, 10, 11]
        });

        expect(generationOptions.samplePositions).toEqual([1, 10, 11]);
        expect(generationOptions.thumbsCount).toEqual(3);
    });

    it('allows thumbnail dimensions to be specified by height, width or both', () => {
        const generationOptions1 = new GenerationOptions(MINIMAL_METADATA, {
            thumbsSamples: [1, 10, 11],
            thumbsWidth: 120,
            thumbsCols: 10,
            imageWidth: 1920
        });

        expect(generationOptions1.thumbSize).toEqual('120x?');

        const generationOptions2 = new GenerationOptions(MINIMAL_METADATA, {
            thumbsSamples: [1, 10, 11],
            thumbsHeight: 80,
            thumbsCols: 10,
            imageWidth: 1920
        });

        expect(generationOptions2.thumbSize).toEqual('?x80');

        const generationOptions3 = new GenerationOptions(MINIMAL_METADATA, {
            thumbsSamples: [1, 10, 11],
            thumbsHeight: 42,
            thumbsWidth: 101,
            thumbsCols: 10,
            imageWidth: 1920
        });

        expect(generationOptions3.thumbSize).toEqual('101x42');
    });

    it('calculates thumbnail width from image width and number of columns (specified or default)', () => {
        const generationOptions1 = new GenerationOptions(MINIMAL_METADATA, {
            thumbsSamples: [1, 10, 11],
            thumbsCols: 7,
            imageWidth: 1920
        });

        expect(generationOptions1.thumbSize).toEqual('274x?');

        const generationOptions2 = new GenerationOptions(MINIMAL_METADATA, {
            thumbsSamples: [1, 10, 11],
            // columns defaults to 8
            imageWidth: 1280
        });

        expect(generationOptions2.thumbSize).toEqual('160x?');
    });

    it('gives default thumbnail size if nothing was specified', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {
            thumbsSamples: [1, 10, 11]
        });

        expect(generationOptions.thumbSize).toEqual('240x?');
    });

    it('gets a temporary directory name', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {});

        generationOptions.makeThumbDirectory();
        const thumbDir = generationOptions.thumbDirectory;

        expect(thumbDir).toBeTruthy();
        expect(fs.existsSync(thumbDir)).toBeTrue();
    });

    it('creates thumb directory if it does not exist, uses it if it does', () => {
        const expectedDir = path.join(__dirname, './test-data/tmp');
        // safety check
        expect(fs.existsSync(expectedDir)).toBeFalse();

        const generationOptions1 = new GenerationOptions(MINIMAL_METADATA, {
            thumbDirectory: expectedDir
        });

        generationOptions1.makeThumbDirectory();
        const thumbDir1 = generationOptions1.thumbDirectory;

        expect(thumbDir1).toEqual(expectedDir);
        expect(fs.existsSync(thumbDir1)).toBeTrue();

        const generationOptions2 = new GenerationOptions(MINIMAL_METADATA, {
            thumbDirectory: expectedDir
        });

        generationOptions2.makeThumbDirectory();
        const thumbDir2 = generationOptions2.thumbDirectory;

        expect(thumbDir2).toEqual(expectedDir);
        expect(fs.existsSync(thumbDir2)).toBeTrue();

        fs.rmdirSync(expectedDir);
    });

    it('cannot use thumb directory before created, regardless if specified, or not', () => {
        const expectedDir = path.join(__dirname, './test-data/tmp');
        // safety check
        expect(fs.existsSync(expectedDir)).toBeFalse();

        const generationOptions1 = new GenerationOptions(MINIMAL_METADATA, {
            thumbDirectory: expectedDir
        });

        expect(() => generationOptions1.thumbDirectory).toThrowError('Cannot use thumbDirectory before calling makeThumbDirectory()');

        const generationOptions2 = new GenerationOptions(MINIMAL_METADATA, {});

        expect(() => generationOptions2.thumbDirectory).toThrowError('Cannot use thumbDirectory before calling makeThumbDirectory()');
    });

    it('gets thumbnail file name, or default if not specified', () => {
        const generationOptions1 = new GenerationOptions(MINIMAL_METADATA, {});

        expect(generationOptions1.thumbFilename).toEqual('tn_%s');

        const generationOptions2 = new GenerationOptions(MINIMAL_METADATA, {
            thumbFilename: '42_%s',
            thumbsCount: 56
        });

        expect(generationOptions2.thumbFilename).toEqual('42_%s');
    });

    it('passes through metadata', () => {
        const generationOptions = new GenerationOptions(MINIMAL_METADATA, {});

        expect(generationOptions.metadata).toEqual(MINIMAL_METADATA);
    });

});
