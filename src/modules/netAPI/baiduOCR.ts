
//const imagePath = path.resolve(__dirname, 'test.png');
//console.log(imagePath)
import md5 from "md5";
import { blobToBase64 } from "../../utils/prefs";

export async function fileBase64(path: string) {
    const buf = await IOUtils.read(path);
    const blob = new Blob([buf]);
    return await blobToBase64(blob);
    //Zotero.Utilities.Internal.Base64.encode();
}

export async function baiduOauth(secretKey: string) {
    const params = secretKey.split("#");
    const appid = params[0];
    const key = params[1];
    const token_url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${appid}&client_secret=${key}`;
    const headersToken = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    const tokenXhr = await Zotero.HTTP.request('POST', token_url, headersToken);
    if (tokenXhr.statusText == "OK") {
        const access_token = JSON.parse(tokenXhr.response).access_token;
        if (access_token) {
            return access_token;
        } else {
            throw 'Get Access Token Failed!';
        }
    } else {
        throw `Http Request Error\nHttp Status: ${tokenXhr.status}\n${JSON.stringify(tokenXhr.response)}`;
    }
}

/**
 * 识别语言类型，默认为CHN_ENG
可选值包括：
- auto_detect：自动检测语言，并识别
- CHN_ENG：中英文混合
- ENG：英文
- JAP：日语
- KOR：韩语
- FRE：法语
- SPA：西班牙语
- POR：葡萄牙语
- GER：德语
- ITA：意大利语
- RUS：俄语
- DAN：丹麦语
- DUT：荷兰语
- MAL：马来语
- SWE：瑞典语
- IND：印尼语
- POL：波兰语
- ROM：罗马尼亚语
- TUR：土耳其语
- GRE：希腊语
- HUN：匈牙利语
- THA：泰语
- VIE：越南语
- ARA：阿拉伯语
- HIN：印地语
 */
export declare type LanguageType = "CHN_ENG" | "ENG" | "JAP" | "KOR" | "FRE" | "SPA" | "POR" | "GER" | "ITA" | "RUS" | "DAN" | "DUT" | "MAL" | "SWE" | "IND" | "POL" | "ROM" | "TUR" | "GRE" | "HUN" | "THA" | "VIE" | "ARA" | "HIN";


/**
 * -image, url, pdf_file, ofd_file 四选一
 * -url 网络地址
 * -image为 base64 编码
 * -pdf_file, ofd_file 文件均需 base64 编码
 * -函数内处理 urlencode 编码
 * @param option image, url, pdf_file, ofd_file 四选一
 * @returns 
 */
export async function baiduOCR(option: BaiduOCRAccurateOption, secretKey: string) {

    const access_token = await baiduOauth(secretKey);
    if (!access_token) return;
    return await baiduOCRAccurate(access_token, option);
    ;

};

/**
 * | 参数         | 是否必选                          | 类型   | 可选值范围 | 说明                                                         |
| ------------ | --------------------------------- | ------ | ---------- | ------------------------------------------------------------ |
| image        | 和 url/pdf_file/ofd_file 四选一   | string | -          | 图像数据，base64编码后进行urlencode，要求base64编码和urlencode后大小不超过10M，最短边至少15px，最长边最大8192px，支持jpg/jpeg/png/bmp格式 **优先级**：image > url > pdf_file > ofd_file ，当image字段存在时，url、pdf_file、ofd_file 字段失效 |
| url          | 和 image/pdf_file/ofd_file 四选一 | string | -          | 图片完整url，url长度不超过1024字节，url对应的图片base64编码后大小不超过10M，最短边至少15px，最长边最大8192px，支持jpg/jpeg/png/bmp格式 **优先级**：image > url > pdf_file > ofd_file，当image字段存在时，url字段失效 **请注意关闭URL防盗链** |
| pdf_file     | 和 image/url/ofd_file 四选一      | string | -          | PDF文件，base64编码后进行urlencode，要求base64编码和urlencode后大小不超过10M，最短边至少15px，最长边最大8192px **优先级**：image > url > pdf_file > ofd_file，当image、url字段存在时，pdf_file字段失效 |
| pdf_file_num | 否                                | string | -          | 需要识别的PDF文件的对应页码，当 pdf_file 参数有效时，识别传入页码的对应页面内容，若不传入，则默认识别第 1 页 |
| ofd_file     | 和 image/url/pdf_file 四选一      | string | -          | OFD文件，base64编码后进行urlencode，要求base64编码和urlencode后大小不超过10M，最短边至少15px，最长边最大8192px **优先级**：image > url > pdf_file > ofd_file，当image、url、pdf_file字段存在时，ofd_file字段失效 |
| ofd_file_num | 否                                | string | -          | 需要识别的OFD文件的对应页码，当 ofd_file 参数有效时，识别传入页码的对应页面内容，若不传入，则默认识别第 1 页 |
| detect_direction | 否   | string | true/false | 是否检测图像朝向，默认不检测，即：false。朝向是指输入图像是正常方向、逆时针旋转90/180/270度。可选值包括: - true：检测朝向； - false：不检测朝向 |
| paragraph        | 否   | string | true/false | 是否输出段落信息                                             |
| probability      | 否   | string | true/false | 是否返回识别结果中每一行的置信度                             |
 */
export declare type BaiduOCRAccurateOption = {
    image?: string;
    url?: string;
    pdf_file?: string;
    ofd_file?: string;
    language_type?: LanguageType;
    detect_direction?: string;
    paragraph?: string;
    pdf_file_num?: string;
    ofd_file_num?: string;
    probability?: string;
};

export async function baiduOCRAccurate(access_token: string, option: BaiduOCRAccurateOption) {
    let url = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic';
    /*     const bodyProps = {
            language_type: language,
            detect_direction: detectDirection,
            paragraph: paragraph,
            image: base64,
            url: url,
            pdf_file: pdfFile,
            pdf_file_num: pdfFileNum,
            ofd_file: ofdFile,
            ofd_file_num: ofdFileNum,
            probability: probability,
        }; */

    const body = Object.entries(option)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
        .join('&');
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    url = url + `?access_token=${access_token}`;
    const options = { body, headers, timeout: 30000 };
    const res = await Zotero.HTTP.request('POST', url, options);
    if (res.statusText == "OK") {
        const result = JSON.parse(res.response);
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

//const url = 'https://fanyi-api.baidu.com/api/trans/sdk/picture';



