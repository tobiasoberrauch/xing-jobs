// User-Agent	Mozilla/5.0 (Windows NT 10.0; …) Gecko/20100101 Firefox/64.0

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const async = require("async");
const path = require('path');
const request = require('request');

const DEBUG = false;
const keywords = [
    'machine%20learning',
    'künstliche%20intelligenz'
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

function read_list_file(keyword, page_number) {
    let html = fs.readFileSync('cache/' + now + '/' + keyword + '-' + page_number + '.html', 'utf-8');

    return extract_items(html);
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

    let now = new Date().toISOString().split('T')[0];
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

async function fetch_list(keyword, page_number) {
    let now = new Date().toISOString().split('T')[0];
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
        let now = new Date().toISOString().split('T')[0];
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
        }, 1000);

    }, function (err) {
        if (err) {
            console.error(err);
        }
    });
}




for (keyword of keywords) {

    // meta.maxPage
    // meta.currentPage
    // meta.count

    let file_path = 'cache/' + now + '/' + keyword + '.json';

    if (fs.readFileSync(file_path)) {
        console.log('Using cached list for ' + keyword);

        let raw_data = fs.readFileSync(file_path, 'utf-8');
        let data = JSON.parse(raw_data);
        
        fetch_items(data.items);
    } else {
        console.log('Using live list for ' + keyword)

        let url = 'https://www.xing.com/jobs/api/search?keywords=' + keyword + '&sc_o=jobs_recent_searches&limit=1000&offset=0';

        request.get(url, function (error, response, body) {
            let data = JSON.parse(body);
            fetch_items(data.items);
        });
    }
}