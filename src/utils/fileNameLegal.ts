export function fileNameLegal(fileName: string) {
    fileName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
    return fileName;
}