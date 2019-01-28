const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const async = require("async");
const path = require('path');

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

async function crawl_item(pathname) {
    const browser = await puppeteer.launch({
        devtools: DEBUG
    });
    const page = await browser.newPage();

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
    const page = await browser.newPage();

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


for (let keyword of keywords) {
    for (let page_number = 1; page_number < 2; page_number++) {
        let file_path = dir_path + '/' + keyword + '-' + page_number + '.html';

        if (fs.existsSync(file_path)) {
            fetch_items(read_list_file(keyword, page_number));
        }
        if (!fs.existsSync(file_path)) {
            setTimeout(function () {
                fetch_list(keyword, page_number)
                    .then(fetch_items)
                    .catch(console.error);
            }, 1000);
        }
    }
}
