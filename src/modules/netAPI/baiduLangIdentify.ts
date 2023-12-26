export function langIdentify(query: string, secretKey: string) {

    /*  const str2utf8 = window.TextEncoder ? function (str: string) {
         //@ts-ignore
         const encoder = new TextEncoder('utf-8')
         const bytes = encoder.encode(str);
         let result = '';
         for (let i = 0; i < bytes.length; ++i) {
             result += String.fromCharCode(bytes[i]);
         }
         return result;
     } : function (str:string) {
         return eval('\'' + encodeURI(str).replace(/%/gm, '\\x') + '\'');
     }; */
    //query = query.toString('utf-8');
    const str2utf8 = function (str: string) {
        //@ts-ignore
        const encoder = new TextEncoder('utf-8');
        const bytes = encoder.encode(str);
        let result = '';
        for (let i = 0; i < bytes.length; ++i) {
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    };

    const test2 = Zotero.Utilities.Internal._utf8_decode("中华");
    ztoolkit.log(test2);
    const qq = str2utf8("中华");
    ztoolkit.log(qq);

    /**
     * 签名
     */
    function makeSign(secretKey: string, query: string) {
        const params = secretKey.split("#");
        const appid = params[0];
        const key = params[1];
        const salt = new Date().getTime();
        const signStr = appid + query + salt + key;
        return Zotero.Utilities.Internal.md5(signStr);
    }
    const sign = makeSign(secretKey, query);
}