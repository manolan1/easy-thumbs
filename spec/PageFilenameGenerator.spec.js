
const PageFilenameGenerator = require('../src/PageFilenameGenerator');

describe('PageFilenameGenerator', () => {

    it('passes through plain filename if there is only one page', () => {
        const pfg1 = new PageFilenameGenerator('a.png', {
            pageCount: 1
        });
        expect(pfg1.getFilename(1)).toEqual('a.png');

        const pfg2 = new PageFilenameGenerator('x.y.z', {
            numberOfPages: 1
        }, 'numberOfPages');
        expect(pfg2.getFilename(1)).toEqual('x.y.z');
    });

    it('appends page number if there is more than one page', () => {
        const pfg1 = new PageFilenameGenerator('a.png', {
            pageCount: 2
        });
        expect(pfg1.getFilename(1)).toEqual('a_1.png');
        expect(pfg1.getFilename(2)).toEqual('a_2.png');

        const pfg2 = new PageFilenameGenerator('x.y.z', {
            numberOfPages: 2
        }, 'numberOfPages');
        expect(pfg2.getFilename(1)).toEqual('x.y_1.z');
        expect(pfg2.getFilename(2)).toEqual('x.y_2.z');
    });

    it('appends page number if there is more than one page, even if it is told there is only one page', () => {
        const pfg1 = new PageFilenameGenerator('a.png', {
            pageCount: 1
        });
        expect(pfg1.getFilename(1)).toEqual('a.png');
        expect(pfg1.getFilename(2)).toEqual('a_2.png');

        const pfg2 = new PageFilenameGenerator('x.y.z', {
            numberOfPages: 1
        }, 'numberOfPages');
        expect(pfg2.getFilename(1)).toEqual('x.y.z');
        expect(pfg2.getFilename(2)).toEqual('x.y_2.z');
    });

    it('if the outputBaseName is a template, interpolates it even if there is only one page', () => {
        const pfg1 = new PageFilenameGenerator('${pageNumber} of ${pageCount}.png', {
            pageCount: 1
        });
        expect(pfg1.getFilename(1)).toEqual('1 of 1.png');
        expect(pfg1.getFilename(2)).toEqual('2 of 1.png');

        const pfg2 = new PageFilenameGenerator('${pageNumber} of ${numberOfPages}.png', {
            numberOfPages: 2
        }, 'numberOfPages');
        expect(pfg2.getFilename(1)).toEqual('1 of 2.png');
        expect(pfg2.getFilename(2)).toEqual('2 of 2.png');
    });

    it('throws an error if the page count property does not exist', () => {
        expect(() => new PageFilenameGenerator('${pageNumber} of ${totalPages}.png', {
            totalPages: 1
        })).toThrowError('Page count property (pageCount) does not exist');

        expect(() => new PageFilenameGenerator('${pageNumber} of ${numberOfPages}.png', {
            numberOfPages: 2
        }, 'totalPages')).toThrowError('Page count property (totalPages) does not exist');
    });

});
