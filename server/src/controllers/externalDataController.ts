import { Logger } from 'winston';
import { Request, Response } from 'express';
import got from 'got';
import cheerio from 'cheerio';
// import fs from 'fs';

const getLinkMetadata = async (req: Request, res: Response, logger: Logger) => {
    let url;

    try {
        url = new URL(req.body.url);
    } catch (error) {
        return res.status(404);
    }

    const origin = url.origin;
    const pathname = url.pathname;
    const videoId = url.searchParams.get('v');
    const videoIdRegex = /[a-zA-Z0-9\-_]/;

    if (
        origin === 'https://www.youtube.com' &&
        pathname === '/watch' &&
        videoIdRegex.test(videoId) &&
        videoId.length < 20
    ) {
        const requestUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const result = { videoTitle: '', channelTitle: '' };

        logger.log(
            'info',
            `External request: User ${req.user.id} requested link metadata from ${requestUrl}`
        );

        try {
            const response = await got(requestUrl, { timeout: 3000 });

            const $ = cheerio.load(response.body);
            result.videoTitle = $("meta[property='og:title']").attr('content');
            result.channelTitle = $("*[itemprop = 'author']")
                .find('link:nth-child(2)')
                .attr('content');
        } catch (error) {
            return res.status(404);
        }

        res.json(result);
    } else {
        return res.status(404);
    }
};

const getPlaylistData = async (req: Request, res: Response, logger: Logger) => {
    let url;

    try {
        url = new URL(req.body.url);
    } catch (error) {
        return res.status(404);
    }

    const origin = url.origin;
    const pathname = url.pathname;
    const listId = url.searchParams.get('list');
    const listIdRegex = /[a-zA-Z0-9\-_]/;

    if (
        origin === 'https://www.youtube.com' &&
        pathname === '/playlist' &&
        listIdRegex.test(listId) &&
        listId.length < 64
    ) {
        const requestUrl = `https://www.youtube.com/playlist?list=${listId}`;
        const result = { videoTitle: '', channelTitle: '' };

        logger.log(
            'info',
            `External request: User ${req.user.id} requested playlist metadata from ${requestUrl}`
        );

        try {
            const response = await got(requestUrl, { timeout: 3000 });

            // fs.writeFileSync('./ytlist.html', response.body);
            const $ = cheerio.load(response.body);
            const scriptElements = $('script');
            for (let i = 0; i < scriptElements.length; i++) {
                const scriptChildren = scriptElements[i].children;
                scriptChildren.forEach((scriptChild) => {
                    const matchX = scriptChild.data.match(
                        /window\["ytInitialData"\] = /
                    );
                    if (matchX) {
                        const playlistJsonRaw = matchX.input.slice(
                            matchX.input.indexOf('{') - 1,
                            matchX.input.indexOf(';')
                        );
                        const playlistJson = JSON.parse(playlistJsonRaw);
                        // console.log(playlistJson);
                        const contentList =
                            playlistJson.contents.twoColumnBrowseResultsRenderer
                                .tabs[0].tabRenderer.content.sectionListRenderer
                                .contents[0].itemSectionRenderer.contents[0]
                                .playlistVideoListRenderer.contents;
                        contentList.forEach((item: any) => {
                            const track = {
                                id: item.playlistVideoRenderer.videoId,
                                title:
                                    item.playlistVideoRenderer.title.runs[0]
                                        .text
                            };
                            console.log(track);
                        });
                    }
                });
            }
        } catch (error) {
            console.log(error);
            return res.status(404);
        }

        res.json(result);
    } else {
        return res.status(404);
    }
};

export default { getLinkMetadata, getPlaylistData };
