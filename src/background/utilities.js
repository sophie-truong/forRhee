let tabsInAction = {};

/**
 * nests multiple chrome.tabs.executeScript() to a tab
 *
 * @param tabId tab to execute
 * @param injectDetailsArray array of the scripts/code to execute
 */
function executeScripts(tabId, injectDetailsArray) {
  function createCallback(tabId, injectDetails, innerCallback) {
    return function () {
      chrome.tabs.executeScript(tabId, injectDetails, innerCallback);
    };
  }

  let callback = null;

  for (let i = injectDetailsArray.length - 1; i >= 0; --i) {
    callback = createCallback(tabId, injectDetailsArray[i], callback);
  }

  if (callback !== null) {
    callback();
  }
}

/**
 * initiates page content script
 *
 * @param tabId
 */
function runAppOnTab(tabId) {
  Logger.debug('TAB has been UPDATED and contains an Amazon URL');
  executeScripts(tabId, [
    {code: 'var onTab = ' + tabId + ';'},
    {file: 'src/resources/lib/logger.min.js'},
    {file: 'src/resources/config/logging.js'},
    {file: 'src/content/scripts/page.js'}
  ]);
}

/**
 * this helps ensure that content script doesn't get launched more than once per 2 seconds
 * @param currentTs
 * @param tabId
 * @returns {boolean}
 */
function addTabInAction(currentTs, tabId) {
  const diff = currentTs - tabsInAction[tabId];
  return diff > 2000;
}

function removeTabInAction(tabId) {
  if (typeof tabsInAction[tabId] !== 'undefined') {
    Logger.debug(tabsInAction);
    delete tabsInAction[tabId];
    Logger.debug('removed ' + tabId.toString());
    Logger.debug(tabsInAction);
  }
}
