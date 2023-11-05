var maxSize = 100 * 1024; // 最大文件大小为100KB
var img = new Image();
img.src = "base64 or path";
img.onload = function () {
  const _this = this;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d", {alpha: false});
  var width = img.width;
  var height = img.height;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(_this, 0, 0, width, height);
  var quality = 0.8;
  let newBase64Image, resultBlob;
  do {
    newBase64Image = canvas.toDataURL("image/jpeg", quality);
    resultBlob = base64ToBlob(newBase64Image);
    quality -= 0.1;
  } while (resultBlob.size > maxSize && quality > 0.1);
};
 
// 将base64 转换为Blob
function base64ToBlob(base64) {
  var arr = base64.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {
    type: mime,
  });
}





//用户通过页面标签 <input type="file" /> 上传的本地图片直接转化 data URL 字符串形式。可以使用 FileReader 文件读取构造函数。FileReader 对象允许 Web 应用程序异步读取存储在计算机上的文件（或原始数据缓冲区）的内容，使用 File 或 Blob 对象指定要读取的文件或数据。该实例方法 readAsDataURL 读取文件内容并转化成 base64 字符串。在读取完后，在实例属性 result 上可获取文件内容
function file2DataUrl(file, callback) {
    var reader = new FileReader();
    reader.onload = function () {
      callback(reader.result);
    };
    reader.readAsDataURL(file);
  }








/*   file2Image(file, callback)

若想将用户通过本地上传的图片放入缓存并 img 标签显示出来，除了可以利用以上方法转化成的 base64 字符串作为图片 src，还可以直接用 URL 对象，引用保存在 File 和 Blob 中数据的 URL。使用对象 URL 的好处是可以不必把文件内容读取到 JavaScript 中 而直接使用文件内容。为此，只要在需要文件内容的地方提供对象 URL 即可。
 */

function file2Image(file, callback) {
    var image = new Image();
    var URL = window.webkitURL || window.URL;
    if (URL) {
      var url = URL.createObjectURL(file);
      image.onload = function() {
        callback(image);
        URL.revokeObjectURL(url);
      };
      image.src = url;
    } else {
      inputFile2DataUrl(file, function(dataUrl) {
        image.onload = function() {
          callback(image);
        }
        image.src = dataUrl;
      });
    }
  }






//通过图片链接（url）获取图片 Image 对象，由于图片加载是异步的，因此放到回调函数 callback 回传获取到的 Image 对象
  function url2Image(url, callback) {
    var image = new Image();
    image.src = url;
    image.onload = function() {
      callback(image);
    }
  }