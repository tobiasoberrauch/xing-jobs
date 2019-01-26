const cheerio = require('cheerio');
const fs = require('fs');

let keywords = 'machine%20learning';
let page_number = 1;
let html = fs.readFileSync('index.html', 'utf-8');
const $ = cheerio.load(html);

let items = $('.result-result-container-d527f6c7').map(function (index, element) {
    return {
        title: $(this).find('.result-result-title-f6a7c15d').text().trim(),
        company: $(this).find('.result-result-subtitle-3f97fea9').text().trim(),
        rating: $(this).find('.kununu-rating-kununu-rating-average-21e99cf7').text().trim(),
        rating_count: $(this).find('.kununu-rating-kununu-rating-reviews-1546bf28 b').text().trim(),
        time: $(this).find('.result-result-content-40c8b994 time').attr('datetime')
    };
});

let data = {
    title: $('.controls-controls-controls-03b6aeed h3').text(),
    keywords: keywords,
    items: items.get()
};

console.log(data);