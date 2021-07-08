const axios = require('axios');
const { writeFileSync } = require('fs');
(async () => {
    const res = await axios.get('https://api.chongluadao.vn/v1/blacklist');
    const json = res.data;
    const final = json.map(el => `||${new URL(el.url.replace('www.', '').replace('*.', '')).hostname}$all`);
    writeFileSync('list.txt', [...new Set(final)].filter(el => !el.includes('facebook')).join('\n'));
    console.log('Đã tạo file thành công!')
})();
