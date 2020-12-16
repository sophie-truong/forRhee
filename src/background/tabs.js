/**
 * Listen for created tabs that contain amazon urls
 */
chrome.tabs.onCreated.addListener(function (tabInfo) {
  // do nothing for now
});

/**
 * Listen for updates in tabs that contain amazon urls
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tabState) {
  if (changeInfo['status'] === 'complete') {
    if (tabState['url'].includes('amazon')) {
      if (typeof tabsInAction[tabState['id']] === 'undefined') {
        tabsInAction[tabState['id']] = new Date().getTime();
        runAppOnTab(tabState['id']);
      } else {
        const currentTs = new Date().getTime();
        if (addTabInAction(currentTs, tabState['id'])) {
          tabsInAction[tabState['id']] = currentTs;
          runAppOnTab(tabState['id']);
        }
      }
    }
  }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  removeTabInAction(tabId);
});
