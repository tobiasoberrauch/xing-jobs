const cheerio = require('cheerio');
const fs = require('fs');

function process(html) {
    const $ = cheerio.load(html);
    return {
        title: $('#job-posting-header h1 strong').text().trim(),
        company: $('#job-posting-header .job-posting-header-company').text().trim(),
        city: $('#job-posting-header .job-posting-header-city').text().trim(),
        time: $('.job-posting-details time').attr('datetime'),
        description: $('#job-posting-description .job-posting-description-html').html()
    };
}

let html = fs.readFileSync('cache/2019-01-27/schwalbach-taunus-data-scientist-statistician-42980641.html', 'utf-8');
data = process(html);
console.log('Process finished', data);