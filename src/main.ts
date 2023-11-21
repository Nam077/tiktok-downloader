import * as cheerio from 'cheerio';
import fs, {createWriteStream} from 'fs';
import axios, {AxiosResponse} from 'axios';
import select from '@inquirer/select';
import input from '@inquirer/input';
import ProgressBar from 'progress';
import slugify from 'slugify';

const folderDownload = './downloads';

const removeAccent = (str: string): string => {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    return str;
}

interface DownloadLink {
    name: string;
    link: string;
    value: string;
}

interface VideoLink {
    size: string;
    f: string;
    q: string;
    q_text: string;
    k: string;
    url?: string;
}

interface RelatedVideo {
    title: string;
    contents: {
        v: string;
        t: string;
    }[];
}

interface VideoData {
    status: string;
    mess: string;
    page: string;
    vid: string;
    extractor: string;
    title: string;
    t: number;
    a: string;
    links: {
        mp4: VideoLink[];
        mp3: VideoLink[];
        other: VideoLink[];
    };
    related: RelatedVideo[];
}

if (!fs.existsSync(folderDownload)) {
    fs.mkdirSync(folderDownload);
}
const extractOriginalFilename = (encodedString: string): string | null => {
    return decodeURIComponent(encodedString.trim()).replaceAll("; filename*", '').replaceAll('%20', ' ').replace("y2mate.com - ", '').replaceAll('"', '').replace('ssstik.io_', '')

}
const downloadFile = async (url: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const response: AxiosResponse = await axios.get(url, {responseType: 'stream'});
            const regex: RegExp = /\/([^/?]+\.(\w+))(\?|$)/;
            const match: RegExpExecArray | null = regex.exec(url);
            let filename = match ? match[1] : '';
            if (response.headers['content-disposition']) {
                filename = response.headers['content-disposition'].split('=')[1];
                filename = extractOriginalFilename(filename) ?? filename;
            }
            const contentLength = response.headers['content-length'];
            let downloadedBytes = 0;
            const progressBar = new ProgressBar('Downloading [:bar] :rate/Mb    :percent :etas', {
                width: 40,
                complete: '=',
                incomplete: ' ',
                renderThrottle: 1,
                total: parseInt(contentLength)
            });

            response.data.on('data', (chunk: any) => {
                downloadedBytes += chunk.length;
                progressBar.tick(chunk.length);
            });

            const outputPath = `${folderDownload}/${filename}`;
            const writeStream = createWriteStream(outputPath);
            response.data.pipe(writeStream);

            response.data.on('end', () => {
                progressBar.terminate();
                writeStream.end();
                resolve();
                console.log(`Downloaded file: ${outputPath}`);
            });

            response.data.on('error', (error: any) => {
                progressBar.terminate();
                writeStream.end();
                reject(new Error(`Error downloading file: ${error.message}`)); // Reject the Promise on error
            });
        } catch (error: any) {
            reject(new Error(`Error downloading file: ${error.message}`)); // Reject the Promise on error
        }
    });
}

interface FaceBookDownload {
    title: string;
    duration: string;
    thumbnail: string;
    links: any[];
}

class X2MateAPI {
    private readonly apiUrl: string = "https://x2mate.com/api/ajaxSearch";
    private _url = ''

    get url(): string {
        return this._url;
    }

    set url(value: string) {
        this._url = value;
    }

    async fetchVideo(): Promise<null | FaceBookDownload> {
        try {
            const requestBody = `q=${encodeURIComponent(this.url)}&vt=home`;

            const response: AxiosResponse<any> = await axios.post(this.apiUrl, requestBody, {
                headers: {
                    "accept": "*/*",
                    "accept-language": "vi,en-US;q=0.9,en;q=0.8",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"YaBrowser\";v=\"23\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest",
                    "cookie": ".AspNetCore.Culture=c%3Den%7Cuic%3Den; .AspNetCore.Antiforgery.w9l6cVXihDo=CfDJ8JQ6kw6hphNOgwIcdl-D-Q0xoSZN9e-k-0x16_60Mk0PWGP5oMe6qJVoc2TGLkpQdeK0X8EUfu4QspXFBsdngb7xOY9fDH-x13-u3ysledHi24U3lNBIEZgf0AqINhB0YG0tkM0-tVcK-GFq09putq8",
                    "Referer": "https://x2mate.com/en78",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                }
            });
            return {
                title: response.data.title,
                duration: response.data.duration,
                thumbnail: response.data.thumbnail,
                links: response.data.links
            }
            // Handle the response data here
        } catch (error) {
            return null
        }
    }

    async runDownload(): Promise<void> {
        const data = await this.fetchVideo();
        console.log(data)
        if (data) {
            let choices: any = [];
            let index = 1;
            for (const key in data.links) {
                choices.push({
                    name: `${index}. ${data.title} - ${key}`,
                    value: data.links[key],
                });
                index++;
            }
            while (true) {
                const optionPick = await select({
                    message: 'Select option',
                    choices: [...choices, {
                        name: 'Cancel',
                        value: null,
                    }],
                });
                if (optionPick === null) {
                    break;
                }
                await downloadFile(optionPick as string)
            }
        }
    }
}

class YoutubeDownloader {
    private readonly baseUrlSearch = 'https://www.y2mate.com/mates/vi751/analyzeV2/ajax';
    private readonly baseUrlConverter = 'https://www.y2mate.com/mates/convertV2/index';
    private headers = {
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://www.y2mate.com/en737/download-youtube',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36'
    };
    private _optionPick: VideoLink = {
        size: '',
        f: '',
        q: '',
        q_text: '',
        k: ''
    }
    private _url: string;

    constructor() {
        this._url = '';
    }

    set url(videoUrl: string) {
        this._url = videoUrl;
    }

    get url() {
        return this._url;
    }

    set optionPick(optionPick: VideoLink) {

        this._optionPick = optionPick;
    }

    get optionPick() {
        return this._optionPick;
    }


    async fetchY2MateData(k_page = 'mp3'): Promise<VideoData & { link_all: any } | null> {
        const requestData = {
            k_query: this.url,
            k_page: k_page
        };
        try {
            const response: AxiosResponse = await axios.post(this.baseUrlSearch, new URLSearchParams(requestData).toString(), {
                headers: this.headers
            });
            if (response.status === 200) {
                if (response.data.links.video) {
                    return {
                        ...response.data,
                        links: {
                            mp4: Object.values(response.data.links.video),
                        },
                        link_all: [...Object.values(response.data.links.video)]
                    };
                }
                return {
                    ...response.data,
                    links: {
                        mp4: Object.values(response.data.links.mp4),
                        mp3: Object.values(response.data.links.mp3),
                        other: Object.values(response.data.links.other)
                    },
                    link_all: [...Object.values(response.data.links.mp4), ...Object.values(response.data.links.mp3), ...Object.values(response.data.links.other)]
                };

            }
            return null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async converter(videoData: VideoData): Promise<any> {
        const data = {
            'vid': videoData.vid,
            'k': this.optionPick.k,
        }
        try {
            const response: AxiosResponse = await axios.post(this.baseUrlConverter, new URLSearchParams(data).toString(), {
                headers: this.headers
            })
            if (response.status === 200) {
                if (response.data.status === 'ok') {
                    return await downloadFile(response.data.dlink);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }


    async runDownloader(): Promise<void | number> {
        const data = await this.fetchY2MateData();
        if (data) {
            let choices: any = [];
            for (let i = 0; i < data.link_all.length; i++) {
                choices.push({
                    name: ` ${i}. ${data.link_all[i].f} > ${data.title} - ${data.link_all[i].q} ${data.link_all[i].size}`,
                    value: data.link_all[i],
                });
            }
            while (true) {
                const optionPick = await select({
                    message: 'Select option',
                    choices: [...choices, {
                        name: 'Cancel',
                        value: null,
                    }],
                });
                this.optionPick = optionPick as VideoLink;
                if (!optionPick) {
                    break;
                }
                await this.converter(data);
            }
        }
    }

    async runDownloaderAnother(): Promise<void | number> {
        const data = await this.fetchY2MateData('Instagram');
        if (data) {
            let choices: any = [];
            for (let i = 0; i < data.link_all.length; i++) {
                choices.push({
                    name: ` ${i}. ${data.link_all[i].f} > ${data.title} - ${data.link_all[i].q_text} `,
                    value: data.link_all[i].url,
                });
            }
            while (true) {
                const optionPick = await select({
                    message: 'Select option',
                    choices: [...choices, {
                        name: 'Cancel',
                        value: null,
                    }],
                });
                if (!optionPick) {
                    break;
                }
                await downloadFile(optionPick as string);
            }
        }
    }
}


class TiktokDownloader {
    get url(): string {
        return this._url;
    }

    set url(value: string) {
        this._url = value;
    }

    private _url: string = ''
    private host: string = 'https://ssstik.io/vi';
    private apiSearch: string = 'https://ssstik.io/abc?url=dl';

    constructor() {
    }


    public async getKey() {
        const regex = /tt:'([^']+)'/; // Biểu thức chính quy
        const response = await axios.get(this.host)

        const match = regex.exec(response.data)

        if (match) {
            return match[1]
        } else {
            return null
        }
    }


    public async getDownloads(): Promise<DownloadLink[]> {
        const apiKey = this.getKey();
        const response = await axios.post(this.apiSearch, {
                id: this.url,
                locale: 'vi',
                tt: apiKey
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.931 YaBrowser/23.9.3.931 Yowser/2.5 Safari/537.36'
                },

            }
        );
        const $ = cheerio.load(response.data);
        const anchorTags = $('a');
        const downloadLinks: DownloadLink[] = [];
        anchorTags.each((_index, element) => {
            const href = $(element).attr('href');
            if (href && href.length > 1) {
                downloadLinks.push({
                    name: $(element).text().replaceAll('\n', ' ').replaceAll('\t', ''),
                    link: href,
                    value: href
                });
            }
        });
        return downloadLinks;
    }

    public async runDownloader(): Promise<void> {
        const downloadLinks = await this.getDownloads();
        const check = true;
        while (check) {
            const answer = await select({
                message: 'Download tiktok',
                choices: [...downloadLinks, {name: 'Exit', value: 'q'}]
            });
            if (answer === 'q') {
                break;
            }
            await downloadFile(answer);
        }
    }
}

function isYoutubeUrl(url: string): boolean {
    const youtubeUrlPattern = /^(http:\/\/|https:\/\/)(www\.)?(youtube\.com|music\.youtube\.com)\/s*/;
    const shortYoutubeUrlPattern = /^(http:\/\/|https:\/\/)(www\.)?youtu\.be\/[\w-]+/;
    return youtubeUrlPattern.test(url) || shortYoutubeUrlPattern.test(url);
}

const isTikTokUrl = (url: string) => {
    return url.includes('tiktok.com');
}

const isInstagramUrl = (url: string) => {
    return url.includes('instagram.com');
}

const isFacebookUrl = (url: string) => {
    return url.includes('facebook.com' || 'm.facebook.com' || 'fb.com');
}

const isTwitterUrl = (url: string) => {
    return url.includes('twitter.com');
}
const enterUrl = async (): Promise<{ url: string; type: 'tiktok' | 'youtube' | 'exit' | 'facebook' | 'another' }> => {

    const url = await input({message: 'Enter link you want to download (q to exit): '});
    if (isTikTokUrl(url)) {
        return {url, type: 'tiktok'};
    } else if (isYoutubeUrl(url)) {
        return {url, type: 'youtube'};
    } else if (isFacebookUrl(url)) {
        return {url, type: 'facebook'}
    } else if (isInstagramUrl(url) || isTwitterUrl(url)) {
        return {url, type: 'another'}
    } else {
        return enterUrl()
    }
}

const mainMain = async () => {
    console.log('\n' +
        '███╗░░██╗░█████╗░███╗░░░███╗░█████╗░███████╗███████╗\n' +
        '████╗░██║██╔══██╗████╗░████║██╔══██╗╚════██║╚════██║\n' +
        '██╔██╗██║███████║██╔████╔██║██║░░██║░░░░██╔╝░░░░██╔╝\n' +
        '██║╚████║██╔══██║██║╚██╔╝██║██║░░██║░░░██╔╝░░░░██╔╝░\n' +
        '██║░╚███║██║░░██║██║░╚═╝░██║╚█████╔╝░░██╔╝░░░░██╔╝░░\n' +
        '╚═╝░░╚══╝╚═╝░░╚═╝╚═╝░░░░░╚═╝░╚════╝░░░╚═╝░░░░░╚═╝░░░')
    const tiktokDownloader = new TiktokDownloader();
    const youtubeDownloader = new YoutubeDownloader();
    const x2MateAPI: X2MateAPI = new X2MateAPI();
    let exit = true;
    while (exit) {
        const {url, type} = await enterUrl();
        if (type === 'tiktok') {
            tiktokDownloader.url = url;
            await tiktokDownloader.runDownloader();
        } else if (type === 'youtube') {
            youtubeDownloader.url = url;
            await youtubeDownloader.runDownloader();
        } else if (type === 'facebook') {
            x2MateAPI.url = url;
            await x2MateAPI.runDownload()
        } else if (type === 'another') {
            youtubeDownloader.url = url;
            await youtubeDownloader.runDownloaderAnother()
        } else {
            exit = false;
        }
    }

}
(async () => {
    await mainMain();
})();
