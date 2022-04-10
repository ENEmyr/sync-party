var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import got from 'got';
import cheerio from 'cheerio';
const getLinkMetadata = (req, res, logger) => __awaiter(void 0, void 0, void 0, function* () {
    let url;
    try {
        url = new URL(req.body.url);
    }
    catch (error) {
        return res.status(404);
    }
    const origin = url.origin;
    const pathname = url.pathname;
    const videoId = url.searchParams.get('v');
    const videoIdRegex = /[a-zA-Z0-9\-_]/;
    if (videoId &&
        req.user &&
        origin === 'https://www.youtube.com' &&
        pathname === '/watch' &&
        videoIdRegex.test(videoId) &&
        videoId.length < 20) {
        const requestUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const result = { videoTitle: '', channelTitle: '' };
        logger.log('info', `External request: User ${req.user.id} requested link metadata from ${requestUrl}`);
        try {
            const response = yield got(requestUrl, {
                timeout: {
                    connect: 50,
                    secureConnect: 50,
                    socket: 1000,
                    send: 2000,
                    response: 1000
                }
            });
            const $ = cheerio.load(response.body);
            result.videoTitle = $("meta[property='og:title']").attr('content') || '';
            result.channelTitle = $("*[itemprop = 'author']")
                .find('link:nth-child(2)')
                .attr('content') || '';
        }
        catch (error) {
            return res.status(404);
        }
        return res.json(result);
    }
    else {
        return res.status(404);
    }
});
export default { getLinkMetadata };
