
const path = require('path');

const looksSame = require('looks-same');
const tmp = require('tmp');

const ThumbnailPageCreator = require('../src/ThumbnailPageCreator');
const LayoutOptions = require('../src/LayoutOptions');
const Constants = require('../src/Constants');

const TEST_DATA = path.join(__dirname, './test-data');
const TEST_THUMBS = path.join(TEST_DATA, './bbb_thumbs');

const BASE_HEADER_DETAILS = {
    name: 'source file name',
    filename: 'full path to source file name',
    durationFractional: '00:01:04.510',
    startTimeFractional: '04:38:12.022',
    duration: '00:01:05',
    startTime: '04:38:12',
    formatName: 'mpegts'
};

/*
 * To leave any temporary file after the test, use this code
        const outFile = {
            name: 'tmp-output-tpc.png',
            removeCallback: () => { }
        };
 */
describe('ThumbnailPageCreator', () => {

    describe('with real LayoutOptions', () => {

        it('creates a single page from a short file list', async (done) => {
            const EXPECTED_IMAGE = path.join(TEST_DATA, './short-output-bbb.png');

            const outFile = tmp.fileSync({
                postfix: '.png'
            });

            const fileList = [];
            [1, 9, 17, 25, 33, 42, 50, 58, 66, 75].map(item => {
                fileList.push({
                    mark: item,
                    path: path.join(TEST_THUMBS, `./tn_${item}.png`)
                });
            });

            const layoutOptions = new LayoutOptions({
                imageWidth: 1920,
                imageHeight: 1080,
                thumbsRows: 7,
                thumbsCols: 8
            }, {});
            await layoutOptions.init(fileList[0].path);

            const headerDetails = { ...BASE_HEADER_DETAILS, numberOfPages: 1 };

            const tpc = new ThumbnailPageCreator(layoutOptions, headerDetails);
            const outputImage = await tpc.createPage(fileList, 1);
            await outputImage.writeAsync(outFile.name);

            looksSame(EXPECTED_IMAGE, outFile.name, (_err, result) => {
                expect(result.equal).toBeTrue();
                outFile.removeCallback();
                done();
            });

        });

        it('changes header based on contents', async (done) => {
            const EXPECTED_IMAGE = path.join(TEST_DATA, './header-test.png');

            const outFile = tmp.fileSync({
                postfix: '.png'
            });

            const fileList = [];

            const layoutOptions = new LayoutOptions({
                imageWidth: 1920,
                imageHeight: 1080,
                thumbsRows: 7,
                thumbsCols: 8,
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
            }, {});
            await layoutOptions.init();

            const headerDetails = { ...BASE_HEADER_DETAILS, numberOfPages: 42 };

            const tpc = new ThumbnailPageCreator(layoutOptions, headerDetails);
            const outputImage = await tpc.createPage(fileList, 24);
            await outputImage.writeAsync(outFile.name);

            looksSame(EXPECTED_IMAGE, outFile.name, (_err, result) => {
                expect(result.equal).toBeTrue();
                outFile.removeCallback();
                done();
            });

        });

    });

});
