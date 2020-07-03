
import ThumbnailGenerator from '../src/ThumbnailGenerator';

describe('ThumbnailGenerator', () => {

    it('instantiates', () => {
        const tg = new ThumbnailGenerator();
        expect(tg).toBeTruthy();
    });
});
