import { config } from "../../package.json";
import { getString } from "../utils/locale";
import {
  getPref,
  setPref,
  saveSingleServiceUnderUse,
  saveJsonToDisk,
  getSingleServiceUnderUse
} from "../utils/prefs";
import {
  serviceManage,
  TranslateService,
  servicePriorityWithKey,
  servicePriorityWithoutKey,
  servicesFilename,
  services
} from "./serviceManage";
import { fullTextTranslate } from "./fullTextTranslate";

let oldkey = "";
let isModify = false;
const plugin = "ZoteroPDFTranslate";

let servicePriorityWithKeyColumns: any;
let table2rows: { serviceID: string; locale: string; forbidden: string; }[];
let servicePriorityWithoutKeyColumns: any;
let table3rows: { serviceID: string; locale: string; forbidden: string; }[];

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/chrome/content/preferences.xul onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [
        {
          dataKey: "key",
          label: getString("prefs-table-key"),
          staticWidth: false,
          fixedWidth: false,
          flex: 3
        },
        {
          dataKey: "usable",
          label: getString("prefs-table-usable"),
          staticWidth: false,
          fixedWidth: false,
          flex: 1
        },
        {
          dataKey: "charConsum",
          label: getString("prefs-table-charConsum"),
          staticWidth: false,
          fixedWidth: false,
          flex: 1
        },
      ],
      rows: [{
        key: "",
        usable: '',
        charConsum: '',
      }],
    };
  } else {
    addon.data.prefs.window = _window;
  }
  addon.data.prefs.window.addEventListener('unload', (e) => {
    e.preventDefault();
    saveJsonToDisk(services, servicesFilename);
    const json1 = JSON.stringify(servicePriorityWithoutKey);
    setPref('servicePriorityWithoutKey', json1);
    const json2 = JSON.stringify(servicePriorityWithKey);
    setPref('servicePriorityWithKey', json2);
  });
  servicePriorityWithKeyColumns = [
    {
      dataKey: "serviceID",
      label: getString("prefs-table2-serviceID"),
    },
    {
      dataKey: "locale",
      label: getString("prefs-table2-locale"),
    },
    {
      dataKey: "forbidden",
      label: getString("prefs-table2-forbidden"),
    },
  ];
  servicePriorityWithoutKeyColumns = servicePriorityWithKeyColumns;
  buildPrefsPane();
  updatePrefsUI();
  table2UpdateUI();
  table3UpdateUI();
  bindPrefEvents();
  // 更新限制参数，以便进入界面就能显示
  const serviceID = getElementValue("serviceID");
  if (serviceID !== undefined && serviceID != "" && serviceID != null) {
    onPrefsEvents("update-serviceAndKeyUnderuse");
    onPrefsEvents("update-secretKeyInfo");
    onPrefsEvents("update-QPS");
    onPrefsEvents("update-charasPerTime");
    onPrefsEvents("update-hasSecretKey");
    onPrefsEvents("update-charasLimit");
    onPrefsEvents("update-limitMode");
    onPrefsEvents("update-isMultiParas");
    addon.data.prefs!.rows = getRows(serviceID);
    updatePrefsUI();
  }
}

function buildPrefsPane() {
  const doc = addon.data.prefs?.window?.document;
  if (!doc) {
    return;
  }
  ztoolkit.UI.replaceElement(
    {
      // 下拉列表
      tag: "menulist",
      id: makeId("serviceID"),
      attributes: {
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e: Event) => {
            const serviceID = getElementValue("serviceID")!;
            serviceManage.syncBaiduSecretKey(serviceID);
            serviceManage.mergeAndRemoveDuplicates(serviceID);
            addon.data.prefs!.rows = getRows(serviceID);
            updatePrefsUI();
            onPrefsEvents("update-QPS");
            onPrefsEvents("update-charasPerTime");
            onPrefsEvents("update-hasSecretKey");
            onPrefsEvents("update-charasLimit");
            onPrefsEvents("update-limitMode");
            onPrefsEvents("update-isMultiParas");
            onPrefsEvents("update-secretKeyInfo");
          },
        },
      ],
      children: [
        {
          tag: "menupopup",
          //map出的对象数组赋值给键 children
          children: Object.values(services).filter(e => !e.forbidden).map((service) => ({
            tag: "menuitem",
            id: makeId(`${service.id}`),
            attributes: {
              label: getString(`service-${service.id}`),
              value: service.id,
            },
          })),
        },
      ],
    },
    // 将要被替换掉的元素
    doc.querySelector(`#${makeId("serviceID-placeholder")}`)!
  );

  ztoolkit.UI.replaceElement(
    {
      // 下拉列表
      tag: "menulist",
      id: makeId("sourceLang"),
      attributes: {
        native: "true",
      },
      children: [
        {
          tag: "menupopup",
          //map出的对象数组赋值给键 children
          children: Object.keys(Zotero.Locale.availableLocales).map(e => ({
            tag: "menuitem",
            id: makeId(e),
            attributes: {
              label: e,
              value: e,
            },
          })),
        },
      ],
    },
    // 将要被替换掉的元素
    doc.querySelector(`#${makeId("sourceLang-placeholder")}`)!
  );



  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      id: makeId("limitMode"),
      attributes: {
        value: '',
        native: "true",
      },
      children: [
        {
          tag: "menupopup",
          children: [
            {
              tag: "menuitem",
              attributes: {
                label: getString("pref-limitMode-daily"),
                value: "daily",
              },
            },
            {
              tag: "menuitem",
              attributes: {
                label: getString("pref-limitMode-month"),
                value: "month",
              },
            },
            {
              tag: "menuitem",
              attributes: {
                label: getString("pref-limitMode-total"),
                value: "total",
              },
            },
            {
              tag: "menuitem",
              attributes: {
                label: getString("pref-limitMode-noLimit"),
                value: "noLimit",
              },
            },
            {
              tag: "menuitem",
              attributes: {
                label: getString("pref-limitMode-pay"),
                value: "pay",
              },
            },
          ]
        },
      ],
    },
    doc.querySelector(`#${makeId("limitMode-placeholder")}`)!
  );
}

/* function updatePrefsPaneDefault() {
  onPrefsEvents("serviceID", false);
} */

function onPrefsEvents(type: string, fromElement = true) {
  const doc = addon.data.prefs?.window?.document;
  if (!doc) {
    return;
  }
  //通过className类名，禁止元素显示
  const setDisabled = (className: string, disabled: boolean) => {
    doc
      .querySelectorAll(`.${className}`)
      .forEach(
        (elem) => ((elem as XUL.Element & XUL.IDisabled).disabled = disabled)
      );
  };
  const serviceID = getElementValue("serviceID");
  switch (type) {
    //更新表格上方秘钥数据

    case "update-serviceAndKeyUnderuse":
      {
        const serviceIDUnderUse = getSingleServiceUnderUse().serviceID as string;
        const secretKeyUnderUse = getSingleServiceUnderUse().key as string;

        setElementValue("serviceIDUnderUse", serviceIDUnderUse);
        setElementValue("secretKeyUnderUse", secretKeyUnderUse);

      }
      break;
    case "update-secretKeyInfo":
      {
        if (services[serviceID].hasSecretKey) {
          const sk = addon.data.prefs?.rows[0];
          if (sk) {
            setElementValue("secretKey", sk.key);
            setElementValue("secretKey-charConsum", sk.charConsum);
            setElementValue("secretKeyUsable", sk.usable);
          }
        }
        else {
          setElementValue("secretKey", '');
          setElementValue("secretKey-charConsum", '');
          setElementValue("secretKeyUsable", '');
        }
      }
      break;
    case "setBilingualContrast":
      {
        const elemValue = fromElement
          ? (doc.querySelector(`#${makeId("bilingualContrast")}`) as XUL.Checkbox)
            .checked
          : (getPref("bilingualContrast") as boolean);
        const hidden = !elemValue;
        setDisabled("checkbox-bilingualContrast", hidden);
      }
      break;
    case "setIsSourceFirst":
      {
        const elemValue = fromElement
          ? (doc.querySelector(`#${makeId("isSourceFirst")}`) as XUL.Checkbox)
            .checked
          : (getPref("isSourceFirst") as boolean);
        const hidden = !elemValue;
        setDisabled("checkbox-isSourceFirst", hidden);
      }
      break;

    case "update-QPS":
      {
        if (serviceID == "" || serviceID === undefined || serviceID == null) {
          setElementValue("QPS", '');
          break;
        }
        const QPS = serviceManage.serviceCRUD("read")(serviceID)("QPS");
        if (QPS != undefined) {
          setElementValue("QPS", QPS);
        }
      }
      break;
    case "update-charasPerTime":
      {
        if (serviceID == "" || serviceID === undefined || serviceID == null) {
          setElementValue("charasPerTime", '');
          break;
        }
        let charasPerTime = serviceManage.serviceCRUD("read")(serviceID)("charasPerTime");
        if (charasPerTime !== undefined) {
          charasPerTime = new Intl.NumberFormat().format(charasPerTime);
          setElementValue("charasPerTime", charasPerTime);
        }
        //测试
        const el = selectEle("charasPerTime");
        let value = (el as any).value;
        value = value + "ok";

      }
      break;
    case "update-hasSecretKey":
      {
        if (serviceID == "" || serviceID === undefined || serviceID == null) {
          setElementValue("hasSecretKey", '');
          break;
        }
        const hasSecretKey = serviceManage.serviceCRUD("read")(serviceID)("hasSecretKey");
        if (hasSecretKey !== undefined) {
          setElementValue("hasSecretKey", hasSecretKey);
        }
      }
      break;
    case "update-isMultiParas":
      {
        if (serviceID == "" || serviceID === undefined || serviceID == null) {
          setElementValue("isMultiParas", '');
          break;
        }
        const isMultiParas = serviceManage.serviceCRUD("read")(serviceID)("isMultiParas");
        if (isMultiParas !== undefined) {
          setElementValue("isMultiParas", isMultiParas);
        }
      }
      break;
    case "update-charasLimit":
      {
        if (serviceID == "" || serviceID === undefined || serviceID == null) {
          setElementValue("charasLimit", '');
          break;
        }
        let charasLimit = serviceManage.serviceCRUD("read")(serviceID)("charasLimit");
        if (charasLimit !== undefined && !isNaN(charasLimit)) {
          charasLimit = new Intl.NumberFormat().format(charasLimit);
          setElementValue("charasLimit", charasLimit);
        }
      }
      break;
    case "update-limitMode":
      {
        if (serviceID == "" || serviceID === undefined || serviceID == null) {
          setElementValue("limitMode", '');
          break;
        }
        const limitMode = serviceManage.serviceCRUD("read")(serviceID)("limitMode");
        if (limitMode !== undefined && limitMode != null && limitMode != '') {
          setElementValue("limitMode", limitMode);
        }
      }
      break;
    case "update-untranslatedLanguage":
      {
        let ut = getPref("untranslatedLanguage") as string;
        if (ut === undefined || ut == "" || ut! == null) {
          ut = "zh-CN,ja-JP ko-KR";
          setPref("untranslatedLanguage", ut);
          setElementValue("untranslatedLanguage", ut);
        }

      }

      break;
    default:
      return;
  }

}

//表格操作
async function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;
  //新添加的，主要百度秘钥可能为空，没必要
  //并且行数据在之前已经赋值
  /* const serviceID = getElementValue("serviceID");
    addon.data.prefs!.rows = getRows(serviceID); */
  const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      // Do not use setLocale, as it modifies the Zotero.Intl.strings
      // Set locales directly to columns
      columns: addon.data.prefs?.columns,
      showHeader: true,
      multiSelect: true,
      staticColumns: false,
      disableFontSizeScaling: true,

    })
    .setProp("getRowCount", () => addon.data.prefs?.rows.length || 0)
    .setProp(
      "getRowData",
      (index) =>
        addon.data.prefs?.rows[index] || {
          key: "",
          usable: '',
          charConsum: '',
        },
    )


    // 当选择发生变化时显示信息（显示在进度条上）
    /* 在代码中的.filter((v, i) => ...)，
 v和i是回调函数的参数名，用于表示数组中的元素和索引。
 v：表示数组中当前遍历到的元素。
 在这段代码中，v用于表示addon.data.prefs?.rows数组中的每个元素。
 i：表示当前元素的索引值。
 在这段代码中，i用于表示addon.data.prefs?.rows数组中每个元素的索引位置。
 通过在.filter方法中使用(v, i) => ...作为回调函数，
 可以传入两个参数来同时访问数组中的元素和索引，以便进行元素的筛选操作或其他相关处理。 */


    //将选中的最后一行数据显示在表格上方
    .setProp("onSelectionChange", (selection) => {
      const rowDataToModify = addon.data.prefs?.rows.filter(
        (v, i) => tableHelper.treeInstance.selection.isSelected(i))
        .slice(-1)[0];
      if (rowDataToModify && rowDataToModify.key !== undefined
        && rowDataToModify.key !== "" && rowDataToModify.key !== "empty"
        && rowDataToModify.key !== null) {
        setElementValue('secretKey', rowDataToModify.key);
        setElementValue('secretKeyUsable', rowDataToModify.usable);
        setElementValue('secretKey-charConsum', rowDataToModify.charConsum);
      }
    })
    // When pressing delete, delete selected line and refresh table.
    // Returning false to prevent default event.
    .setProp("onKeyDown", ((event: KeyboardEvent) => {

      //return返回的是控制默认按键功能是否启用
      if (event.key == "Delete" || event.key == "Backspace" || (Zotero.isMac && event.key == "Backspace")) {
        //获取要删除的行数据，获得秘钥，和services中的秘钥比较,然后删除秘钥
        const rowDataDelete = addon.data.prefs?.rows.filter(
          (v, i) => tableHelper.treeInstance.selection.isSelected(i)
        );
        //确认删除，点击cancel则取消
        const confirm = addon.data.prefs!.window.confirm(getString("info-delete-secretKey") + '\n'
          + getString("info-delete-confirm"));
        if (!confirm) return true;

        //过滤掉选中行的数据，保留未选中的数据为数组，赋值给rows
        addon.data.prefs!.rows =
          addon.data.prefs?.rows.filter(
            (v, i) => !tableHelper.treeInstance.selection.isSelected(i),
          ) || [];
        tableHelper.render();
        //上面先更新表格，刷新后再删除services中的秘钥
        const serviceID = getElementValue("serviceID");
        let secretKeyObj: SecretKey[] | undefined = [];
        if (rowDataDelete && (serviceID !== undefined && serviceID != null && serviceID != '')) {
          for (const rowData of rowDataDelete) {
            const secretkey = rowData.key;
            secretKeyObj = services[serviceID].secretKey
              ?.filter((e: any) => e.key != secretkey);
            if (secretKeyObj) {
              services[serviceID].secretKey = secretKeyObj;
            }
          }

          if (serviceID.includes("baidu")) {
            let serviceID2 = "";
            if (serviceID.includes("Modify")) {
              serviceID2 = serviceID.replace("Modify", "");
            } else {
              serviceID2 = serviceID + "Modify";
            }
            services[serviceID2].secretKey = services[serviceID].secretKey;
          }
        }

        return true;
      }
      return true;
    }))
    // For find-as-you-type
    .setProp(
      "getRowString",
      (index) => addon.data.prefs?.rows[index].key || "",
    )
    // Enter, double-clicking
    //双击或回车编辑数据并保存
    .setProp(
      "onActivate",
      () => {
        //ztoolkit.log(indices)
        //ztoolkit.log(event.target)        
        const rowDataToModify = addon.data.prefs?.rows.filter(
          (v, i) => tableHelper.treeInstance.selection.isSelected(i)
        )[0];
        if (rowDataToModify && rowDataToModify.key !== undefined
          && rowDataToModify.key != "" && rowDataToModify.key != "empty") {
          setElementValue('secretKey', rowDataToModify.key);
          setElementValue('secretKeyUsable', rowDataToModify.usable);
          setElementValue('secretKey-charConsum', rowDataToModify.charConsum);
        }
        const verifyModify = addon.data.prefs!.window.confirm(
          `${getString("info-please-verifyModify")}\n${getString("prefs-table-key")}${rowDataToModify!.key}`
        );
        if (verifyModify) {
          oldkey = rowDataToModify!.key as string;
          isModify = true;
        }
        //返回布尔值，决定是否使用默认操作
        return false;
        //无需在此处删除数据，保存时会完整更新数据
        //删除表格中被修改的行
        /*         addon.data.prefs!.rows = addon.data.prefs?.rows.filter(
                  (v, i) => tableHelper.treeInstance.selection.isSelected(i)
                ) || []
                updatePrefsUI(); */

      }
    )

    // Render the table.
    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;
  onPrefsEvents("update-untranslatedLanguage");
  ztoolkit.log("Preference table rendered!");
}


async function table2UpdateUI() {
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;
  table2rows = Object.values(services).filter(e => e.hasSecretKey)
    .map(e2 => ({
      serviceID: e2.id,
      locale: getString(`service-${e2.id}`),
      forbidden: e2.forbidden !== undefined ? getString(`forbidden-${String(e2.forbidden)}`) : getString("forbidden-false"),
    }));
  if (getPref("isPriority") && servicePriorityWithKey.length) {
    let tempArr = table2rows.map(e => e.serviceID);
    tempArr = tempArr.filter(e => !servicePriorityWithKey.includes(e) && e !== undefined && e !== "undefined");
    if (tempArr.length) {
      servicePriorityWithKey.push(...tempArr);
    }
    table2rows = servicePriorityWithKey.map(e => table2rows.filter(e2 => e2.serviceID == e)[0]);
  }

  const tableHelper2 = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-table-servicePriorityWithKey`)
    .setProp({
      id: `${config.addonRef}-prefs-table2`,
      // Do not use setLocale, as it modifies the Zotero.Intl.strings
      // Set locales directly to columns
      columns: servicePriorityWithKeyColumns,
      showHeader: true,
      multiSelect: true,
      staticColumns: false,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => table2rows.length || 0)
    .setProp(
      "getRowData",
      (index) =>
        table2rows[index] || {
          serviceID: "",
          locale: "",
          forbidden: "",
        },
    )
    .setProp(
      "getRowString",
      (index) => table2rows[index].serviceID || "",
    ).setProp("onKeyDown", ((event: KeyboardEvent) => {

      //return返回的是控制默认按键功能是否启用
      if (event.key == "Delete" || event.key == "Backspace" || (Zotero.isMac && event.key == "Backspace")) {
        //获取要禁用的行数据，
        const rowDataForbidden = table2rows.filter(
          (v, i) => tableHelper2.treeInstance.selection.isSelected(i)
        );
        //确认删除，点击cancel则取消
        const confirm = addon.data.prefs!.window.confirm(getString("info-forbidden") + '\n'
          + getString("info-delete-confirm"));
        if (!confirm) return true;

        //选中行的引擎，获得秘钥，设forbidden 为 true
        if (rowDataForbidden.length) {
          for (const rowData of rowDataForbidden) {
            const serviceID = rowData.serviceID;
            services[serviceID]["forbidden"] = true;
            const deleteService = selectEle(serviceID) as any;
            if (deleteService.isMenulistChild) {
              deleteService.remove();
            }

          }
        }
        /*         table2rows = Object.values(services).filter(e => e.hasSecretKey)
                  .map(e2 => ({
                    serviceID: e2.id,
                    locale: getString(`service-${e2.id}`),
                    forbidden: e2.forbidden !== undefined ? getString(`forbidden-${String(e2.forbidden)}`) : getString("forbidden-false"),
                  })); */
        table2UpdateUI();
      }
      if (event.key == "ArrowUp") {

        table2rows.map(
          (v, i) => {
            if (tableHelper2.treeInstance.selection.isSelected(i)) {
              if (i > 0) {
                const temp = table2rows[i];
                table2rows[i] = table2rows[i - 1];
                table2rows[i - 1] = temp;
              }
            }
          }
        );
        tableHelper2.render();
      }
      if (event.key == "ArrowDown") {
        table2rows.map(
          (v, i) => {
            if (tableHelper2.treeInstance.selection.isSelected(i)) {
              if (i < table2rows.length - 1) {
                const temp = table2rows[i];
                table2rows[i] = table2rows[i + 1];
                table2rows[i + 1] = temp;
              }
            }
          }
        );
        tableHelper2.render();
      }
      servicePriorityWithKey.length = 0;
      servicePriorityWithKey.push(...table2rows.map(e => e.serviceID as string));
      return true;
    }))
    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;

}

async function table3UpdateUI() {
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;
  table3rows = Object.values(services).filter(e => !e.hasSecretKey)
    .map(e2 => ({
      serviceID: e2.id,
      locale: getString(`service-${e2.id}`),
      forbidden: e2.forbidden !== undefined ? getString(`forbidden-${String(e2.forbidden)}`) : getString("forbidden-false"),
    }));
  if (getPref("isPriority") && servicePriorityWithoutKey.length) {
    //筛选出优先顺序中没有的ID添加到末尾
    let tempArr = table3rows.map(e => e.serviceID);
    tempArr = tempArr.filter(e => !servicePriorityWithoutKey.includes(e) && e !== undefined && e !== "undefined");
    if (tempArr.length) {
      servicePriorityWithoutKey.push(...tempArr);
    }
    table3rows = servicePriorityWithoutKey.map(e => table3rows.filter(e2 => e2.serviceID == e)[0]);
  }
  const tableHelper3 = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-table-servicePriorityWithoutKey`)
    .setProp({
      id: `${config.addonRef}-prefs-table3`,
      // Do not use setLocale, as it modifies the Zotero.Intl.strings
      // Set locales directly to columns
      columns: servicePriorityWithoutKeyColumns,
      showHeader: true,
      multiSelect: true,
      staticColumns: false,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => table3rows.length || 0)
    .setProp(
      "getRowData",
      (index) =>
        table3rows[index] || {
          serviceID: "",
          locale: "",
        },
    )
    .setProp(
      "getRowString",
      (index) => table3rows[index].serviceID || "",
    ).setProp("onKeyDown", ((event: KeyboardEvent) => {

      //return返回的是控制默认按键功能是否启用
      if (event.key == "Delete" || event.key == "Backspace" || (Zotero.isMac && event.key == "Backspace")) {
        //获取要禁用的行数据，
        const rowDataForbidden = table3rows.filter(
          (v, i) => tableHelper3.treeInstance.selection.isSelected(i)
        );
        //确认删除，点击cancel则取消
        const confirm = addon.data.prefs!.window.confirm(getString("info-forbidden") + '\n'
          + getString("info-delete-confirm"));
        if (!confirm) return true;

        //选中行的引擎，获得秘钥，设forbidden 为 true
        if (rowDataForbidden.length) {
          for (const rowData of rowDataForbidden) {
            const serviceID = rowData.serviceID;
            services[serviceID]["forbidden"] = true;
            const deleteService = selectEle(serviceID) as any;
            if (deleteService.isMenulistChild) {
              deleteService.remove();
            }

          }
        }
        table3UpdateUI();

      }
      if (event.key == "ArrowUp") {

        table3rows.map(
          (v, i) => {
            if (tableHelper3.treeInstance.selection.isSelected(i)) {
              if (i > 0) {
                const temp = table3rows[i];
                table3rows[i] = table3rows[i - 1];
                table3rows[i - 1] = temp;
              }
            }
          }
        );
        tableHelper3.render();
      }
      if (event.key == "ArrowDown") {

        table3rows.map(
          (v, i) => {
            if (tableHelper3.treeInstance.selection.isSelected(i)) {
              if (i < table3rows.length - 1) {
                const temp = table3rows[i];
                table3rows[i] = table3rows[i + 1];
                table3rows[i + 1] = temp;
              }
            }
          }
        );
        tableHelper3.render();
      }
      servicePriorityWithoutKey.length = 0;
      servicePriorityWithoutKey.push(...table3rows.map(e => e.serviceID as string));
      return true;
    }))

    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;

}



/**
 * 数据绑定
 */
function bindPrefEvents() {
  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-enable`,
    )
    ?.addEventListener("command", (e) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as XUL.Checkbox).checked}!`,
      );
    });

  addon.data
    .prefs!.window.document.querySelector(
      `#${config.addonRef}-switchService`
    )
    ?.addEventListener("command", (e) => {
      ztoolkit.log(e);
      const serviceID = getElementValue("serviceID");
      let secretKeyString = getElementValue('secretKey');
      if (services[serviceID].hasSecretKey) {
        if (secretKeyString == "undefined" || secretKeyString == "" || secretKeyString === undefined) {
          if (services[serviceID].secretKey?.length) {
            secretKeyString = services[serviceID].secretKey?.filter((e: SecretKey) => e.usable)[0].key;
            if (secretKeyString == "undefined" || secretKeyString == "" || secretKeyString === undefined) {
              fullTextTranslate.fullTextTranslateInfo(getString("info-noneAvailableSecretKey"));
              return;
            } else {
              setElementValue("secretKey", secretKeyString);
            }

          } else {
            fullTextTranslate.fullTextTranslateInfo(getString("info-noneAvailableSecretKey"));
            return;
          }
        }
        saveSingleServiceUnderUse(serviceID, secretKeyString);
        serviceManage.switchServiceID(serviceID, plugin);
        serviceManage.switchServiceKey(secretKeyString, plugin);

      } else {
        saveSingleServiceUnderUse(serviceID);
        serviceManage.switchServiceID(serviceID, plugin);
      }
      onPrefsEvents("update-serviceAndKeyUnderuse");
    });

  addon.data
    .prefs!.window.document.querySelector(
      `#${config.addonRef}-bilingualContrast`
    )
    ?.addEventListener("command", (e) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `${getString("pref-bilingualContrast")}
        ${getString("pref-info-bilingualContrast")}
        ${(e.target as XUL.Checkbox).checked}!`
      );
    });

  addon.data
    .prefs!.window.document.querySelector(
      `#${config.addonRef}-isSourceFirst`
    )
    ?.addEventListener("command", (e) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `${getString("pref-isSourceFirst")}
        ${getString("pref-info-isSourceFirst")}
        ${(e.target as XUL.Checkbox).checked}!`
      );
    });



  //注意id有没有zotero-prefpane-
  addon.data
    .prefs!.window.document.querySelector(
      `#${config.addonRef}-deleteService`
    )
    ?.addEventListener("click", (e) => {
      ztoolkit.log(e);
      const serviceID = getElementValue("serviceID") as string;
      const confirm = addon.data.prefs!.window.confirm(
        `${getString("pref-deleteService")}:         
        ${serviceID}`
      );
      if (confirm) {
        services[serviceID as keyof typeof services].forbidden = true;
        if (serviceID.includes("baidu")) {
          let serviceID2 = "";
          if (serviceID.includes("Modify")) {
            serviceID2 = serviceID.replace("Modify", "");
          } else {
            serviceID2 = serviceID + "Modify";
          }
          services[serviceID2].forbidden = services[serviceID].forbidden;
          const deleteService = selectEle(serviceID2) as any;
          if (deleteService.isMenulistChild) {
            deleteService.remove();
          }
        }

        serviceManage.serviceCRUD('saveAll');
        const deleteService = selectEle(serviceID) as any;
        if (deleteService.isMenulistChild) {
          deleteService.remove();
        }
        setElementValue("serviceID", '');
        onPrefsEvents("update-QPS");
        onPrefsEvents("update-charasPerTime");
        onPrefsEvents("update-hasSecretKey");
        onPrefsEvents("update-charasLimit");
        onPrefsEvents("update-limitMode");
        onPrefsEvents("update-isMultiParas");
        onPrefsEvents("update-secretKeyInfo");
        table2UpdateUI();
        table3UpdateUI();
      }
    });


  addon.data
    .prefs!.window.document.querySelector(
      `#${config.addonRef}-recoverService`
    )
    ?.addEventListener("click", (e) => {
      ztoolkit.log(e);
      const doc = addon.data.prefs?.window?.document;

      if (!doc) {
        return;
      }
      const serviceMenu_popup = doc.querySelector(`#${config.addonRef}-serviceID > menupopup`)!;
      //用户确认，弹出在addon.data.prefs!.window窗口
      const confirm = addon.data.prefs!.window.confirm(
        `${getString("pref-recoverService")}`
      );
      if (confirm) {
        //const forbiddenArr = Object.values(services).filter(e => e.forbidden)
        Object.values(services).forEach(e => {
          if (e.forbidden) {
            e.forbidden = false;
            const menuItemObj = {
              tag: "menuitem",
              id: makeId(`${e.id}`),
              attributes: {
                label: getString(`service-${e.id}`),
                value: e.id,
              }
            };
            ztoolkit.UI.appendElement(menuItemObj, serviceMenu_popup);
          }
        });
        serviceManage.serviceCRUD('saveAll');
        table2UpdateUI();
        table3UpdateUI();
      }
    });

  // 点击按钮保存秘钥
  addon.data
    .prefs!.window.document.querySelector(
      `#${config.addonRef}-saveSecretKey`
    )
    ?.addEventListener("click", (e) => {
      //保存新秘钥，删除旧秘钥
      const key = getElementValue('secretKey');
      if (key == "" || key === undefined) {
        fullTextTranslate.fullTextTranslateInfo(getString("info-empty"), 2000);
        return;
      }
      const usable = (selectEle('secretKeyUsable') as XUL.Checkbox).checked;

      let charConsum = getElementValue('secretKey-charConsum');
      if (charConsum == "" || charConsum === undefined) {
        fullTextTranslate.fullTextTranslateInfo(getString("info-empty"), 2000);
        return;
      }
      charConsum = Number(charConsum);
      if (isNaN(charConsum)) {
        charConsum = 0;
      }
      const verifySave = addon.data.prefs!.window.confirm(
        `${getString("info-please-verify")}\n
     ${getString("prefs-table-key")} ${key}\n
     ${getString("prefs-table-usable")} ${usable}\n
     ${getString("prefs-table-charConsum")} ${charConsum}\n
     `
      );
      // 如选择取消，直接返回，不执行后续代码
      if (!verifySave) return;
      const serviceID = getElementValue("serviceID");
      //如果有需要删除的旧秘钥则进行删除，记得最后将旧秘钥的变量置空
      if (isModify && oldkey !== "empty" && oldkey !== undefined && oldkey !== null && oldkey !== ""
        && services[serviceID].secretKey?.length) {
        services[serviceID].secretKey = services[serviceID].secretKey!
          .filter((s: any) => s.key !== oldkey);
        oldkey = "";
        isModify = false;
      }

      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const currentDay = formatter.format(date);
      const secretKey: SecretKey = {
        key: key,
        usable: usable,
        dateMarker: currentDay,
        charConsum: charConsum,
      };
      serviceManage.serviceCRUD("update")(serviceID)("secretKey")(secretKey);
      serviceManage.mergeAndRemoveDuplicates(serviceID);
      fullTextTranslate.fullTextTranslateInfo(getString("pref-saveSecretKey"), 3000, addon.data.prefs!.window);
      addon.data.prefs!.rows = getRows(serviceID);
      updatePrefsUI();

    });

  addon.data
    .prefs!.window.document.querySelector(
      `#${config.addonRef}-saveSecretKeyBulk`
    )
    ?.addEventListener("click", (e) => {
      const dialogHelper = new ztoolkit.Dialog(3, 1)
        .addCell(0, 0, {
          tag: "h3",
          properties: { innerHTML: getString("info-secretKey-perLine") },
        })
        .addCell(1, 0,
          {
            tag: "textarea",
            namespace: "html",
            id: "dialog-input",
            attributes: {
              "style": "width: 100%; height: 300px;",
            },
          },
          true
        )
        .addButton(getString("info-Confirm"), "confirm", {
          callback: (e) => {
            const doc = dialogHelper.window.document;
            const inputTxt = (doc.querySelector("#dialog-input") as any).value as string;
            const secretKeys = inputTxt.split('\n').filter(e => e !== undefined && e != "undefined" && e != "");
            const sk: SecretKey[] = secretKeys.map(e => ({
              key: e,
              usable: true,
              charConsum: 0,
            }));
            const serviceID = getElementValue("serviceID");
            serviceManage.serviceCRUD("update")(serviceID)("secretKey")(sk);
            serviceManage.mergeAndRemoveDuplicates(serviceID);
            addon.data.prefs!.rows = getRows(serviceID);
            updatePrefsUI();
          }
        })
        .addButton(getString("info-Cancle"), "cancel")
        //`#${config.addonRef}`是弹出窗口的标题
        .open(`${config.addonRef}`,
          {
            width: 400,
            height: 450,
            resizable: true,
            centerscreen: true,
          }
        );
    });

  //点击保存限制参数
  const saveEle = selectEle("saveLimitParam");
  if (saveEle != null && saveEle !== undefined) {
    (saveEle as Element).addEventListener("click", (e) => {
      const serviceID = getElementValue("serviceID");

      const QPS = getElementValue("QPS");
      const charasPerTime = getElementValue("charasPerTime");
      const hasSecretKey = getElementValue("hasSecretKey");
      const isMultiParas = getElementValue("isMultiParas");
      const limitMode = getElementValue("limitMode");
      const charasLimit = getElementValue("charasLimit");
      serviceManage.serviceCRUD('update')(serviceID)("QPS")(Number(QPS));
      serviceManage.serviceCRUD('update')(serviceID)("charasPerTime")(Number(charasPerTime));
      serviceManage.serviceCRUD('update')(serviceID)("hasSecretKey")(Boolean(hasSecretKey));
      serviceManage.serviceCRUD('update')(serviceID)("isMultiParas")(Boolean(isMultiParas));
      serviceManage.serviceCRUD('update')(serviceID)("limitMode")(String(limitMode));
      serviceManage.serviceCRUD('update')(serviceID)("charasLimit")(Number(charasLimit));


      const QPS_new = serviceManage.serviceCRUD('read')(serviceID)("QPS");
      const charasPerTime_new = serviceManage.serviceCRUD('read')(serviceID)("charasPerTime");
      const hasSecretKey_new = serviceManage.serviceCRUD('read')(serviceID)("hasSecretKey");
      const isMultiParas_new = serviceManage.serviceCRUD('read')(serviceID)("isMultiParas");
      const limitMode_new = serviceManage.serviceCRUD('read')(serviceID)("limitMode");
      const charasLimit_new = serviceManage.serviceCRUD('read')(serviceID)("charasLimit");
      const showInfoSaved = `
     savedData; 
     QPS=${QPS_new}; charasPerTime=${charasPerTime_new}; 
     hasSecretKey=${hasSecretKey_new};isMultiParas=${isMultiParas_new};
     limitMode=${limitMode_new}; charasLimit=${charasLimit_new}`;
      fullTextTranslate.fullTextTranslateInfo(showInfoSaved, 3000, addon.data.prefs!.window);
    });
  }
}

function makeId(type: string) {
  return `${config.addonRef}-${type}`;
}

/**

@param keyword: string
*/
function selectEle(keyword: string) {
  const doc = addon.data.prefs?.window?.document;
  if (!doc) {
    return;
  }
  const selector = "#" + makeId(keyword);
  const ele = doc.querySelector(selector);
  return ele;
}
/**
@param keyword: string
*/
function getElementValue(keyword: string) {
  const ele = selectEle(keyword);
  if (ele !== undefined && ele != null) {
    if ((ele as any).tagName == "checkbox") {
      return (ele as XUL.Checkbox).checked;
    } else {
      return (ele as any).value;
    }
  }

}


/**
参数均为字符串，能够更具元素值类型自动转换
@param keyword: string
@param value: string)
*/
function setElementValue(keyword: string, value: string | boolean | number) {
  const ele = selectEle(keyword);
  if (ele !== undefined && ele != null) {
    //return (ele as Element).setAttribute("value", value)
    //setAttribute是尖括号内的属性，不获取值
    if ((ele as any).tagName == "checkbox") {
      (ele as XUL.Checkbox).checked = Boolean(value);
    } else if ((ele as any).tagName == "textbox") {
      (ele as any).textContent = String(value);
    } else if (typeof (ele as any).value == "number") {
      (ele as any).value = Number(value);
    } else if (typeof (ele as any).value == "string") {
      (ele as any).value = String(value);
    }
  }

  /* (
    doc.querySelector(`#${makeId("limitMode")}`) as XUL.MenuList
  ).getAttribute("value")! */
}

const getRows = <T extends keyof TranslateService>(serviceID: T) => {
  const serviceSelected: TranslateService = services[serviceID];
  let rows;
  if (serviceSelected.secretKey?.length) {
    const secretKey: object[] = serviceSelected.secretKey;
    rows = secretKey.map((e: any) => (
      {
        key: String(e.key),
        usable: String(e.usable),
        charConsum: String(e.charConsum),
      }
    ));
  } else {
    rows = [
      {
        key: "",
        usable: '',
        charConsum: '',
      },
    ];
  }
  return rows;
};

