import { config } from "../package.json";
import { getString, initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";
import { fullTextTranslate } from "./modules/fullTextTranslate";
import { serviceInit } from "./modules/serviceManage";
import { registerNotifier } from "./modules/notify";
import { zoteroMenubarButton } from "./modules/toolbarButton";
import { enableMasonry } from "./utils/prefs";
import { observeImageItem } from "./modules/observeImageItem";


async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();
  //注册选项标签
  fullTextTranslate.registerPrefs();
  // 注册通知
  registerNotifier();
  await onMainWindowLoad(window);


}

async function onMainWindowLoad(win: Window): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();
  enableMasonry();
  const popupWin = new ztoolkit.ProgressWindow(config.addonName, {
    closeOnClick: true,
    closeTime: -1,
  })
    .createLine({
      text: getString("startup-begin"),
      type: "default",
      progress: 0,
    })
    .show();

  fullTextTranslate.registerShortcuts();
  await Zotero.Promise.delay(1000);
  popupWin.changeLine({
    progress: 30,
    text: `[30%] ${getString("startup-begin")}`,
  });
  fullTextTranslate.rightClickMenuItem();
  await serviceInit();
  zoteroMenubarButton();
  await Zotero.Promise.delay(1000);
  popupWin.changeLine({
    progress: 100,
    text: `[100%] ${getString("startup-finish")}`,
  });
  fullTextTranslate.getHtmlMdInterconvert();

  popupWin.startCloseTimer(3000);
  observeImageItem();

}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any; }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

function onShortcuts(type: string) {
  switch (type) {
    case "translateNote":
      fullTextTranslate.translateFT("note");
      break;
    case "translatePDF":
      fullTextTranslate.translateFT("pdf");
      break;
    default:
      break;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  //onNotify,
  onPrefsEvent,
  onShortcuts,
};

