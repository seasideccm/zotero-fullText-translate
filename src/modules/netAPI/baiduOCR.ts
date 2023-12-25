
//const imagePath = path.resolve(__dirname, 'test.png');
//console.log(imagePath)
import md5 from "md5";
export async function baiduOCR(base64: string, secretKey: string, language: string) {
    const params = secretKey.split("#");
    const appid = params[0];
    const key = params[1];
    //const url = 'https://fanyi-api.baidu.com/api/trans/sdk/picture';
    const url = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic';
    const token_url = 'https://aip.baidubce.com/oauth/2.0/token';
    const tokenOption = {
        query: {
            grant_type: 'client_credentials',
            appid,
            key,
        },
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    };


    const tokenXhr = await Zotero.HTTP.request('POST', token_url, tokenOption.headers, tokenOption.query);

    let token;
    if (tokenXhr.ok) {
        if (tokenXhr.data.access_token) {
            token = tokenXhr.data.access_token;
        } else {
            throw 'Get Access Token Failed!';
        }
    } else {
        throw `Http Request Error\nHttp Status: ${tokenXhr.status}\n${JSON.stringify(tokenXhr.data)}`;
    }

    const bodyProps = {
        language_type: language,
        detect_direction: 'false',
        image: base64,
    };

    const body = Object.entries(bodyProps)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
        .join('&');
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    const query = { access_token: token };
    const options = { body, headers, query, timeout: 30000 };
    const res = await Zotero.HTTP.request('POST', url, options);
    if (res.ok) {
        const result = res.data;
        if (result['words_result']) {
            let target = '';
            for (const i of result['words_result']) {
                target += i['words'] + '\n';
            }
            return target.trim();
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}



