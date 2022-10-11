const { Pool, request } = require('undici');
const { writeFileSync } = require('fs');

require('dotenv').config();

const requestPool = new Pool('https://api.chongluadao.vn/');
const requestList = ['blacklist', 'whitelist'];

const getList = async (type) => {
    const { body } = await requestPool.request({
        path: `/v2/${type}`,
        method: 'GET',
    });
    const data = await body.json();
    const final = data.map(el => `||${new URL(el.url.replace(/(www\.)|(\*\.)|(\[|\])/, '')).hostname}$all`);
    return [...new Set(final)].filter(el => !el.includes('facebook') && !el.includes('youtube')).join('\n');
};

const uploadToGithub = async (fileName, content) => {
    const headers = {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'undici',
    };
    const url = `https://api.github.com/repos/phamleduy04/adguard-generator-chongluadao/contents/${fileName}`;
    const fileData = await request(url, { headers })
        .then(el => el.body.json())
        .catch(() => null);
    const contentEncoded = Buffer.from(content).toString('base64');
    if (contentEncoded == fileData.content) return;

    const data = JSON.stringify({
        message: `[skip actions] Automatic update ${fileName}`,
        content: contentEncoded,
        sha: fileData ? fileData.sha : null,
    });

    try {
        await request(url, {
            headers,
            method: 'PUT',
            body: data,
        });
        console.log(`Uploaded ${fileName} to github!`);
    } catch (err) {
        console.error(`Error uploading ${fileName} to github!`, err);
    }
};

const saveList = async (fileName, list) => {
    if (process.env.GH_TOKEN) await uploadToGithub(fileName, list);
    else writeFileSync(fileName, list);
};


(async () => {
    for (const type of requestList) {
        const list = await getList(type);
        console.log('Done request', type);
        await saveList(`${type}.txt`, list);
    }
})();
