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

let html = fs.readFileSync('cache\\2019-02-03\\jobs\\aachen-abschlussarbeit-einsatzmoeglichkeiten-artificial-intelligence-machine-learning-produktion-40133935.html', 'utf-8');
data = process(html);
console.log('Process finished', data);