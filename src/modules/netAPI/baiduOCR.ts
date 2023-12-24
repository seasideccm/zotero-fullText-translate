

export async function baiduOCR(imagePath: string, language: string, secretKey: string) {
    const params = secretKey.split("#");
    const appid = params[0];
    const key = params[1];
    const url = 'https://fanyi-api.baidu.com/api/trans/sdk/picture';
    const sourceLang = "auto";
    targetLang = language === 'auto' ? 'zh' : language;

    const salt = new Date().getTime();
    if (appid === '' || key === '') {
        throw 'Please configure appid and secret';
    }

    const file = await IOUtils.read(imagePath);
    const str = appid + Zotero.Utilities.Internal.md5(file) + salt + 'APICUIDmac' + key;
    const sign = Zotero.Utilities.Internal.md5(str);

    const xhr = await Zotero.HTTP.request("GET",
        `${url}?rom=${sourceLang}&to=${targetLang
        }q=${encodeURIComponent(
            sourceText
        )}&appid=${appid}&from=${sourceLang}&to=${targetLang
        }&domain=${domain}&salt=${salt}&sign=${sign}`,
        {
            responseType: "json",
        }
    );
    if (xhr?.status !== 200) {
        throw `Request error: ${xhr?.status}`;
    }
    // Parse
    if (xhr.response.error_code) {
        throw `Service error: ${xhr.response.error_code}:${xhr.response.error_msg}`;
    }
    let tgt = "";
    for (let i = 0; i < xhr.response.trans_result.length; i++) {
        tgt += xhr.response.trans_result[i].dst + "\n";
    }
    const data = {
        "result": tgt,
        "error": `${xhr.response.error_code}`
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        body: Body.form({
            image: {
                file: file,
                mime: 'image/png',
                fileName: 'pot_screenshot_cut.png',
            },
            from: 'auto',
            to: language === 'auto' ? 'zh' : language,
            appid: appid,
            salt: salt,
            cuid: 'APICUID',
            mac: 'mac',
            version: '3',
            sign: sign,
        }),
    });

    if (res.ok) {
        const result = res.data;
        if (result['data'] && result['data']['sumSrc'] && result['data']['sumDst']) {
            if (language === 'auto') {
                return result['data']['sumSrc'].trim();
            } else {
                return result['data']['sumDst'].trim();
            }
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}

export * from './Config';
export * from './info';