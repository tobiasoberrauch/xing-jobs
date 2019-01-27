const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
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

let link = 'https://www.xing.com/jobs/muenchen-junior-sap-analytics-consultant-42210343?paging_context=search&search_query%5Bkeywords%5D=machine+learning&search_query%5Blimit%5D=20&search_query%5Boffset%5D=520&ijt=jb_18';
let url = new URL(link);

crawl_item(url.pathname);