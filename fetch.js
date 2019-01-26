const puppeteer = require('puppeteer'); // v 1.1.0
const fse = require('fs-extra'); // v 5.0.0

async function start(keywords, page_number) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let page_url = 'https://www.xing.com/jobs/search?keywords=' + keywords + '&sc_o=jobs_search_button&page=' + page_number;
    let now = new Date().toISOString().split('T')[0];
    let dir_path = 'cache/' + now;
    let file_path = dir_path + '/' + keywords + '-' + page_number + '.html';

    page.on('response', async (response) => {
        await fse.outputFile(file_path, await response.buffer());
    });

    await page.goto(page_url, {
        waitUntil: 'networkidle2'
    });
}

let keywords = 'machine%20learning';
let page_number = 1;

start(keywords, page_number);