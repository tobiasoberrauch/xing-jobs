const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const async = require("async");
const DEBUG = false;

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

function process(keywords, html) {
    const $ = cheerio.load(html);

    let items = $('.result-result-container-d527f6c7').map(function () {
        return {
            title: $(this).find('.result-result-title-f6a7c15d').text().trim(),
            company: $(this).find('.result-result-subtitle-3f97fea9').text().trim(),
            rating: $(this).find('.kununu-rating-kununu-rating-average-21e99cf7').text().trim(),
            rating_count: $(this).find('.kununu-rating-kununu-rating-reviews-1546bf28 b').text().trim(),
            time: $(this).find('.result-result-content-40c8b994 time').attr('datetime'),
            link: $(this).find('.result-result-logo-75e305ef').attr('href')
        };
    });

    return {
        title: $('.controls-controls-controls-03b6aeed h3').text(),
        keywords: keywords,
        items: items.get()
    };
}

let keywords = 'künstliche%20intelligenz';
let items = [];

for (let page_number = 1; page_number < 39; page_number++) {
    let html = fs.readFileSync('cache/2019-01-27/' + keywords + '-' + page_number + '.html', 'utf-8');
    let data = process(keywords, html);

    items = items.concat(data.items);
}

console.log('Processing ' + items.length + ' items');

let counter = 0;
async.eachSeries(items, function (item, callback) {
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