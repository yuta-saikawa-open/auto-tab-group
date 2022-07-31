// タブグループ化対象タブの設定
const targetTabConditions = {
    pinned: false,
    url: ['http://*/*', 'https://*/*'],
};

// タブグループカラーリスト
const colorList = [
    "grey",
    "blue",
    "red",
    "yellow",
    "green",
    "pink",
    "purple",
    "cyan",
    "orange"
]

// 同じドメイン名のサイトが2つ以上のタブで開かれていた場合にグループ化する関数
async function setTabGroup() {
    // targetTabConditions の条件に該当するタブリスト
    const tabs = await chrome.tabs.query(targetTabConditions);
    const tabDict = createTabDict(tabs);
    // groupCount の値を元にタブグループのカラーを確定
    let groupCount = 0;
    for (let windowId in tabDict) {
        // 現在使用中のタブを取得
        const currentWindowTabs = await chrome.tabs.query({ active: true, windowId: Number(windowId) });
        // ドメイン名ごとにタブグループ作成
        for (let hostname in tabDict[windowId]) {
            if (tabDict[windowId][hostname].length > 1) {
                // 現在使用中のタブのホスト名とグループのホスト名が同じ場合タブグループを折りたたまない
                let collapsedTab = !(hostname == new URL(currentWindowTabs[0].url).hostname);
                // タブグループの作成
                const groupId = await chrome.tabs.group({
                    tabIds: tabDict[windowId][hostname],
                    createProperties: {
                        windowId: Number(windowId)
                    }
                });
                // タブグループ名、タブグループカラーを確定
                await chrome.tabGroups.update(groupId, {
                    title: hostname,
                    color: colorList[groupCount],
                    collapsed: collapsedTab
                });
                groupCount++;
            }
            // 同じドメインのタブが存在しない場合タブグループを解除する。
            else {
                try {
                    const groupId = await chrome.tabs.ungroup(tabDict[windowId][hostname][0]);
                } catch {}
            }
        }
    }
};

// ウインドウ、ドメイン名ごとのタブIDを格納する連想配列を生成
function createTabDict(tabs) {
    // ウインドウ、ドメイン名ごとのタブIDを格納する連想配列を定義
    let tabDict = {};
    // 各タブのタブIDとドメイン名を連想配列に格納
    tabs.forEach(tab => {
        if (!(tab.windowId in tabDict)) tabDict[tab.windowId] = {};
        hostname = new URL(new URL(tab.url)).hostname;
        hostname in tabDict[tab.windowId] ? tabDict[tab.windowId][hostname].push(tab.id) : tabDict[tab.windowId][hostname] = [tab.id];
    });
    return tabDict;
}

// タブ新規作成、更新処理のリスナー
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.status == 'complete') setTabGroup(tabId);
});

// タブ削除時のリスナー
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    setTabGroup();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    setTimeout(function () {
        setTabGroup(activeInfo.tabId);
    }, 500);
});

chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
    setTabGroup();
});