const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const sleep = require('sleep');

const DEBUG = false;

async function crawl_list(keywords, page_number) {
    let now = new Date().toISOString().split('T')[0];
    let page_url = 'https://www.xing.com/jobs/search?keywords=' + keywords + '&sc_o=jobs_search_button&page=' + page_number;
    let dir_path = 'cache/' + now;
    let file_path = dir_path + '/' + keywords + '-' + page_number + '.html';

    console.log(page_url);

    if (!fs.existsSync(dir_path)) {
        fs.mkdirSync(dir_path);
    }

    const browser = await puppeteer.launch({
        devtools: DEBUG
    });
    const page = await browser.newPage();

    await page.goto(page_url, {
        waitUntil: 'networkidle2'
    });
    await page.waitForSelector('.result-result-container-d527f6c7');

    const html = await page.content();

    fs.writeFileSync(file_path, html);

    await browser.close();
};


let keywords = [
    'machine%20learning',
    'künstliche%20intelligenz'
];
var counter = 0;

loop:
for (let keyword of keywords) {
    for (let page_number = 1; page_number < 41; page_number++) {

        let now = new Date().toISOString().split('T')[0];
        let dir_path = 'cache/' + now;
        let file_path = dir_path + '/' + keyword + '-' + page_number + '.html';

        if (!fs.existsSync(file_path)) {
            crawl_list(keyword, page_number)
                .then(function () {
                    console.log('finished');
                })
                .catch(function () {
                    console.error('error', arguments);
                });

            if (++counter == 10) {
                break loop;
            }
        }
    }
}
