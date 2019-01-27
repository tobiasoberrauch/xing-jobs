let link = 'https://www.xing.com/jobs/muenchen-junior-sap-analytics-consultant-42210343?paging_context=search&search_query%5Bkeywords%5D=machine+learning&search_query%5Blimit%5D=20&search_query%5Boffset%5D=520&ijt=jb_18';
let url = new URL(link);

console.log(url.pathname);