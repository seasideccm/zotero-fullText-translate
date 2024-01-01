export async function upload(path: string) {
    const webDavController = Zotero.Sync.Runner.getStorageController("webdav");
    //生成文件

    //let file = Zotero.File.pathToFile(path);
    Components.utils.importGlobalProperties(["File"]);
    //@ts-ignore has
    let file = File.createFromFileName ? File.createFromFileName(path) : new File(file);
    if (file.then) {
        file = await file;
    }
    const baseName = OS.Path.basename(path);
    if (!baseName.includes(".zip")) {
        return;
    }
    const uri = webDavController.rootURI.mutate().setSpec(webDavController.rootURI.spec + baseName).finalize();
    //传输文件
    let req;
    try {
        req = await Zotero.HTTP.request(
            "PUT",
            uri,
            {
                headers: {
                    "Content-Type": "application/zip"
                },

                body: file,
                requestObserver: function (req: any) {
                    //request.setChannel(req.channel);
                    req.upload.addEventListener("progress", function (event: any) {
                        if (event.lengthComputable) {
                            //request.onProgress(event.loaded, event.total);
                            ztoolkit.log(event.loaded, event.total);
                        }
                    });
                },
                errorDelayIntervals: webDavController.ERROR_DELAY_INTERVALS,
                errorDelayMax: webDavController.ERROR_DELAY_MAX,
                timeout: 0,
                debug: true
            });


    }
    catch (e: any) {
        if (e instanceof Zotero.HTTP.UnexpectedStatusException) {
            if (e.status == 507) {
                throw new Error(
                    Zotero.getString('sync.storage.error.webdav.insufficientSpace'));

            }

            webDavController._throwFriendlyError("PUT", Zotero.HTTP.getDisplayURI(uri).spec, e.status);
        }
        throw e;

        // TODO: Detect cancel?
        //onUploadCancel(httpRequest, status, data)
        //deferred.resolve(false);
    }
    ztoolkit.log(req.status);

}