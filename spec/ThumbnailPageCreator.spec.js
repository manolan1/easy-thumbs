
const path = require('path');

const Jimp = require('jimp');

const ThumbnailPageCreator = require('../src/ThumbnailPageCreator');

const TEST_DATA = path.join(__dirname, './test-data');
const TEST_THUMBS = path.join(TEST_DATA, './bbb_thumbs');

describe('ThumbnailPageCreator', () => {

    describe('with fake LayoutOptions', () => {

        let plm, layoutOptions;

        beforeEach(() => {
            plm = jasmine.createSpyObj('PageLayoutManager', ['insertThumbs', 'insertHeader']);
            layoutOptions = {
                imageWidth: 1920,
                imageHeight: 1080,
                thumbsRows: 7,
                thumbsCols: 8,
                backgroundColour: '#ffffff',
                pageLayoutManager: plm
            }
        });

        it('creates a single page from a short file list', async () => {
            const fileList = [];
            [1, 9, 17, 25, 33, 42, 50, 58, 66, 75].map(item => {
                fileList.push({
                    mark: item,
                    path: path.join(TEST_THUMBS, `./tn_${item}.png`)
                });
            });

            const tpc = new ThumbnailPageCreator(layoutOptions, { test: 'test' });
            const outputImage = await tpc.createPage(fileList, 24);

            expect(outputImage).toBeInstanceOf(Jimp);

            expect(plm.insertThumbs).toHaveBeenCalledWith(outputImage,
                jasmine.arrayWithExactContents([
                    { mark: 1, image: jasmine.any(Jimp) },
                    { mark: 9, image: jasmine.any(Jimp) },
                    { mark: 17, image: jasmine.any(Jimp) },
                    { mark: 25, image: jasmine.any(Jimp) },
                    { mark: 33, image: jasmine.any(Jimp) },
                    { mark: 42, image: jasmine.any(Jimp) },
                    { mark: 50, image: jasmine.any(Jimp) },
                    { mark: 58, image: jasmine.any(Jimp) },
                    { mark: 66, image: jasmine.any(Jimp) },
                    { mark: 75, image: jasmine.any(Jimp) }
                ]), {
                rows: 7, cols: 8
            });

            expect(plm.insertHeader).toHaveBeenCalledWith(outputImage, { test: 'test', page: 24 });
        });

    });

});
