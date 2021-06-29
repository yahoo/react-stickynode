const { FUNC_PATH } = process.env;

// utils
const innerHeight = () => browser.execute(() => window.innerHeight);
const scrollTo = (x, y) => browser.execute(`window.scrollTo(${x}, ${y});`);
// wdio workaround https://github.com/webdriverio/webdriverio/issues/3608
const getRect = async (selector) => browser.execute((el) => el.getBoundingClientRect(), (await $(selector)));

describe('Sticky', () => {
    beforeEach(async () => {
        // FUNC_PATH set by CI to test github pages
        const url = FUNC_PATH ? `/react-stickynode/${FUNC_PATH}` : '/'; 
        await browser.url(url);
    });

    it('Sticky 1 should stick to the top', async () => {
        await scrollTo(0, 500);
        expect((await getRect('#sticky-1')).top).toEqual(0, 'sticky-1');
    });

    it('Sticky 2 should not stick to the top', async () => {
        await scrollTo(0, 500);
        expect((await getRect('#sticky-2')).top).toBeLessThan(0, 'sticky-2');

        await scrollTo(0, 1200);
        expect((await getRect('#sticky-2')).bottom).toBeLessThan((await innerHeight()), 'sticky-2');
    });
});
