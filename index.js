// User-Agent	Mozilla/5.0 (Windows NT 10.0; …) Gecko/20100101 Firefox/64.0

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const async = require("async");
const path = require('path');
const request = require('request');

const DEBUG = false;
const LIMIT = 200;

const keywords = [
    'machine%20learning',
    'kuenstliche%20intelligenz',
    //'digitalisierung'
];
const now = new Date().toISOString().split('T')[0];
const dir_path = 'cache/' + now;


function extract_items(html) {
    const $ = cheerio.load(html);

    return $('.result-result-container-d527f6c7').map(function () {
        return {
            title: $(this).find('.result-result-title-f6a7c15d').text().trim(),
            company: $(this).find('.result-result-subtitle-3f97fea9').text().trim(),
            rating: $(this).find('.kununu-rating-kununu-rating-average-21e99cf7').text().trim(),
            rating_count: $(this).find('.kununu-rating-kununu-rating-reviews-1546bf28 b').text().trim(),
            time: $(this).find('.result-result-content-40c8b994 time').attr('datetime'),
            link: $(this).find('.result-result-logo-75e305ef').attr('href')
        };
    }).get();
}

async function create_browser_page(browser) {
    const page = await browser.newPage();
    page.setExtraHTTPHeaders({
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'de',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Host': 'www.xing.com',
        'Origin': 'https://www.xing.com',
        'Referer': 'https://www.xing.com/jobs/sear…tist&sc_o=jobs_recent_searches',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; …) Gecko/20100101 Firefox/64.0',
        'X-Requested-With': 'XMLHttpRequest'
    });

    return page;
}

async function crawl_item(pathname) {

    const browser = await puppeteer.launch({
        devtools: DEBUG
    });
    let page = await create_browser_page(browser);

    let page_url = 'https://www.xing.com' + pathname;

    let file_path = 'cache/' + now + '/' + pathname + '.html';
    let dir_path = path.dirname(file_path);

    await page.goto(page_url, {
        waitUntil: 'networkidle2'
    });

    if (!fs.existsSync(dir_path)) {
        fs.mkdirSync(dir_path);
    }

    const html = await page.content();

    fs.writeFileSync(file_path, html);

    await browser.close();
}

async function fetch_by_browser(page_url) {
    const browser = await puppeteer.launch({
        devtools: DEBUG
    });
    const page = await browser.newPage(browser);

    await page.goto(page_url, {
        waitUntil: 'networkidle2'
    });
    await page.waitForSelector('.result-result-container-d527f6c7');

    const html = await page.content();

    await browser.close();

    return html;
}

async function fetch_list_by_browser(keyword, page_number) {
    let page_url = 'https://www.xing.com/jobs/search?keywords=' + keyword + '&sc_o=jobs_search_button&page=' + page_number;
    let dir_path = 'cache/' + now;
    let file_path = dir_path + '/' + keyword + '-' + page_number + '.html';

    if (!fs.existsSync(dir_path)) {
        fs.mkdirSync(dir_path);
    }

    const html = await fetch_by_browser(page_url);

    let items = extract_items(html);

    fs.writeFileSync(file_path, html);

    return items;
};

async function fetch_items(items) {
    console.log('Processing ' + items.length + ' items');

    let counter = 0;
    return async.eachSeries(items, function (item, callback) {
        let url;
        try {
            url = new URL(item.link);
        } catch (TypeError) {
            return callback();
        }
        let file_path = 'cache/' + now + '/' + url.pathname + '.html';

        if (fs.existsSync(file_path)) {
            console.log(++counter + '/' + items.length, '[CACHE] crawl start ' + url);
            return callback();
        }

        console.log(++counter + '/' + items.length, '[LIVE] crawl start ' + url);
        setTimeout(function () {
            crawl_item(url.pathname).then(function () {
                callback();
            }).catch(callback);
        }, 5000);

    }, function (err) {
        if (err) {
            console.error(err);
        }
    });
}

async function fetch_list(keyword, offset = 0) {
    let file_path = 'cache/' + now + '/' + keyword + '-' + LIMIT + '-' + offset + '.json';
    
    console.log('Check ' + file_path);

    if (fs.existsSync(file_path) && fs.readFileSync(file_path)) {
        console.log('Using cached list for ' + keyword);

        let raw_data = fs.readFileSync(file_path, 'utf-8');
        let data = JSON.parse(raw_data);

        //await fetch_items(data.items);

        if (data.meta.currentPage < data.meta.maxPage) {
            fetch_list(keyword, offset + LIMIT);
        }
    } else {
        let url = 'https://www.xing.com/jobs/api/search?keywords=' + keyword + '&sc_o=jobs_recent_searches&limit=' + LIMIT + '&offset=' + offset;

        console.log('Using live list for ' + keyword + ' (' + url + ')');

        request.get(url, function (error, response, body) {
            console.log('error', error);
            console.log('body', body);
            console.log('url', url);

            let data = JSON.parse(body);

            if (!fs.existsSync(path.dirname(file_path))) {
                fs.mkdirSync(path.dirname(file_path));
            }
            
            fs.writeFileSync(file_path, JSON.stringify(data));

            //fetch_items(data.items);

            if (data.meta.currentPage < data.meta.maxPage) {
                fetch_list(keyword, LIMIT, data.meta.currentPage + LIMIT);
            }
        });
    }     
}


for (keyword of keywords) {
    fetch_list(keyword, 0);
}