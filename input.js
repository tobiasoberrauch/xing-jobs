const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let keywords = 'machine%20learning';
    let page_number = 1;
    let now = new Date().toISOString().split('T')[0];
    let page_url = 'https://www.xing.com/jobs/search?keywords=' + keywords + '&sc_o=jobs_search_button&page=' + page_number;
    let dir_path = 'cache/' + now;
    let file_path = dir_path + '/' + keywords + '-' + page_number + '.html';

    page.on('response', async (response) => {
        let headers = response.headers();

        if ('content-type' in headers && headers['content-type'].indexOf('text/html') == 0 && response.url().indexOf('www.xing.com') > -1) {
            if (!fs.existsSync(dir_path)) {
                fs.mkdirSync(dir_path);
            }
        
            fs.writeFile(file_path, await response.buffer(), function (err) {
                if (err) {
                    return console.error(err);
                }

                console.log('file saved ' + file_path + ' # ' + response.url());

                return true;
            });
        }
    });

    await page.goto(page_url, {
        waitUntil: 'networkidle2'
      });
    await browser.close();
})();