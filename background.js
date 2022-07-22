// タブグループ化対象タブの設定
const targetTabConditions = {
    currentWindow: true,
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
    // ドメイン名ごとのタブIDを格納する連想配列を定義
    const tabDict = {};
    // 各タブのタブIDとドメイン名を連想配列に格納
    tabs.forEach(tab => {
        hostname = new URL(new URL(tab.url)).hostname;
        if (hostname in tabDict) tabDict[hostname].push(tab.id);
        else tabDict[hostname] = [tab.id];
    });
    // groupCount の値を元にタブグループのカラーを確定
    let groupCount = 0;
    // ドメイン名ごとにタブグループ作成
    for (let hostname in tabDict) {
        if (tabDict[hostname].length > 1) {
            // タブグループの作成
            const groupId = await chrome.tabs.group({
                tabIds: tabDict[hostname]
            });
            // タブグループ名、タブグループカラーを確定
            await chrome.tabGroups.update(groupId, {
                title: hostname,
                color: colorList[groupCount]
            });
            groupCount++;
        }
        // 同じドメインのタブが存在しない場合タブグループを解除する。
        else {
            try {
                const groupId = await chrome.tabs.ungroup(tabDict[hostname][0]);
            } catch (e) {
                console.log(e);
            }
        }
    }
};

// タブ新規作成、更新処理のリスナー
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.status == 'complete') setTabGroup();
});

// タブ削除時のリスナー
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    setTabGroup()
});