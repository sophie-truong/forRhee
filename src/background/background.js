/**
 * Inject template loading to page and run opensecrets, unless reloading the UI.
 *
 * @param present loading
 * @param reloadBtn boolean used to send present='reload' to presenter
 */
chrome.runtime.onMessage.addListener(function (request) {
  if (request.run === 'getOrgData') {
    chrome.storage.sync.get(null, function (appSyncData) {
      Logger.debug('current appSyncData');
      Logger.debug(appSyncData);

      chrome.pageAction.show(request.onTab);
      let codeSnippetStr = 'var present = "loading";' +
        'var onTab = ' + request.onTab + ';';

      if (!appSyncData[request.brand]) {
        Logger.debug('creating new object with brand: ' + request.brand);
        executeScripts(request.onTab, [
          {code: 'var apiCall = "osGetOrgs";' + 'var onTab = ' + request.onTab + ';'},
          {file: 'src/resources/lib/logger.min.js'},
          {file: 'src/resources/config/logging.js'},
          {file: 'src/resources/config/os_keys.js'},
          {file: 'src/resources/lib/mappings.js'},
          {file: 'src/content/scripts/opensecretsAPI.js'}
        ]);
      } else {
        Logger.debug('brand - ' + request.brand + ' - was found, reloading saved object');
        codeSnippetStr = codeSnippetStr + 'var reloadBtn = true;';
      }

      executeScripts(request.onTab, [
        {code: codeSnippetStr},
        {file: 'src/resources/lib/logger.min.js'},
        {file: 'src/resources/config/logging.js'},
        {file: 'node_modules/handlebars/dist/handlebars.min.js'},
        {file: 'src/content/modules/loading.js'},
        {file: 'src/content/scripts/presenter.js'}
      ]);
    });

    return true;
  }
});

/**
 * Call opensecrets orgSummary method to get Democrat and Republican data
 */
chrome.runtime.onMessage.addListener(function (request) {
  if (request.run === 'orgSummary') {
    executeScripts(request.onTab, [
      {code: 'var apiCall = "osOrgSummary";' + 'var onTab = ' + request.onTab + ';'},
      {file: 'src/resources/lib/logger.min.js'},
      {file: 'src/resources/config/logging.js'},
      {file: 'src/content/scripts/opensecretsAPI.js'}
    ]);
    return true;
  }
});

/**
 * Save to chrome.storage.sync and inject data back to content script
 *
 * @param dems opensecrets democratic value
 * @param reps opensecrets republican value
 */
chrome.runtime.onMessage.addListener(function (request) {
  if (request.run === 'storeOrgSummary') {
    let codeSnippetStr = 'var present = "bubble";' +
      'var dems = "' + request.dems + '"; ' +
      'var reps = "' + request.reps + '";' +
      'var onTab = ' + request.onTab + '; ';
    executeScripts(request.onTab, [
      {code: codeSnippetStr},
      {file: 'node_modules/handlebars/dist/handlebars.min.js'},
      {file: 'src/resources/lib/logger.min.js'},
      {file: 'src/resources/config/logging.js'},
      {file: 'src/resources/lib/backend.js'},
      {file: 'src/resources/lib/industryAverages.js'},
      {file: 'src/resources/lib/notRated.js'},
      {file: 'src/content/modules/bubble.js'},
      {file: 'src/content/scripts/presenter.js'}
    ]);
    return true;
  }
});

/**
 * Opensecrets can be labeled as not found, in which case return the information as 0's
 *
 * @param run presenter-notfound
 * @param present bubble
 */
chrome.runtime.onMessage.addListener(function (request) {
  if (request.run === 'presenter-osnotfound') {
    let codeSnippetStr = 'var present = "' + request.present + '";' +
      'var dems = "NA"; ' +
      'var reps = "NA";' +
      'var onTab = ' + request.onTab + '; ';
    executeScripts(request.onTab, [
      {code: codeSnippetStr},
      {file: 'node_modules/handlebars/dist/handlebars.min.js'},
      {file: 'src/resources/lib/logger.min.js'},
      {file: 'src/resources/config/logging.js'},
      {file: 'src/resources/lib/backend.js'},
      {file: 'src/resources/lib/industryAverages.js'},
      {file: 'src/resources/lib/notRated.js'},
      {file: 'src/content/modules/bubble.js'},
      {file: 'src/content/scripts/presenter.js'}
    ]);
    return true;
  }
});

/**
 * SPDRT-121 show a notification when app is updated
 */
chrome.runtime.onInstalled.addListener(function (details) {
  try {
    if (details.reason === "update") {
      // wipe out storage
      chrome.storage.sync.clear();
    }
  } catch (e) {
    Logger.debug(e);
  }
});

/**
 * Reload UI in the button
 */
chrome.runtime.onMessage.addListener(function (request) {
  if (request.run === 'reload') {
    chrome.storage.sync.get(null, function (appSyncData) {
      let codeSnippetStr = 'var present = "reload";' +
        'var syncData = ' + JSON.stringify(appSyncData[request.brand]) + '; ' +
        'var onTab = ' + request.onTab + '; ';
      executeScripts(request.onTab, [
        {code: codeSnippetStr},
        {file: 'node_modules/handlebars/dist/handlebars.min.js'},
        {file: 'src/resources/lib/logger.min.js'},
        {file: 'src/resources/config/logging.js'},
        {file: 'src/content/modules/bubble.js'},
        {file: 'src/content/scripts/presenter.js'}
      ]);
    });
  }
});

/**
 * add affiliate id
 */
chrome.runtime.onMessage.addListener(function (request) {
  if (request.run === 'set-affiliate') {
    executeScripts(request.onTab, [
      {file: 'src/content/scripts/setAffiliateTag.js'}
    ])
  }
});
