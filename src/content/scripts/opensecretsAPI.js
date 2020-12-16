/**
 * Relay message back to background script to notify opensecrets info was not found.
 */
function opensecretsNotFound() {
  msgObj = {
    run: 'presenter-osnotfound',
    present: 'bubble',
    onTab: onTab
  };
  Logger.debug(msgObj);
  chrome.runtime.sendMessage(msgObj);
}


/**
 * Encodes the org to be sent and adjusts some of the orgs naming.
 *
 * @param orgParam manufacturer name e.g. Microsoft Corporation
 * @returns serialized url
 */
function getOrgUrl(orgParam) {
  if (orgParam.toLowerCase().includes('corporation')) {
    orgParam = orgParam.toLowerCase().replace('corporation', 'corp');
  } else {
    orgParam = orgParam.toLowerCase();
  }

  const orgParamEncoded = encodeURIComponent(orgParam);
  return 'https://www.opensecrets.org/api/?method=getOrgs&org=' + orgParamEncoded + '&apikey=' + osApiKey + '&output=json';
}

/**
 * Opensecrets will either find the org and return the json for it or it will find multiple organizations from the
 * provided string.
 *
 * @param data
 * @returns {boolean}
 */
function prepare(data) {
  const orgResponse = data['response']['organization'];
  const lengthOfOrgResp = Object.keys(orgResponse).length;
  let msgObj = '';

  if (lengthOfOrgResp === 1) {
    opensecretsOrgId = data['response']['organization']['@attributes']['orgid'];
    msgObj = {
      run: 'orgSummary',
      opensecretsOrgId: opensecretsOrgId,
      onTab: onTab
    };
    Logger.debug(msgObj);
    chrome.runtime.sendMessage(msgObj);
    return true;
  } else {
    // multiple orgs returned, treat this as not found.
    Logger.debug('multiple orgs found');
    Logger.debug(orgResponse);
    opensecretsNotFound();
    return false;
  }
}

/**
 * API call to Opensecrets
 *
 * @param {[string]} getOrgUrl opensecrets url
 * @param {function} callback
 */
function apiFetch(getOrgUrl, callback) {
  Logger.debug('GETORG URL: ' + getOrgUrl);

  const FETCH_TIMEOUT = 8000;
  let didTimeOut = false;
  new Promise(function (resolve, reject) {
    const timeout = setTimeout(function () {
      didTimeOut = true;
      reject(false);
    }, FETCH_TIMEOUT);

    fetch(getOrgUrl).then(function (response) {
      if (response.status !== 200) {
        Logger.debug('API Response: ' + response.status + ' Text: ' + response.statusText);
        reject(false);
      }

      response.json().then(function (data) {
        clearTimeout(timeout);
        if (!didTimeOut) {
          resolve(data);
        }
      }).catch(function (err) {
        Logger.warn('Nothing returned with ' + getOrgUrl + ', error message: ', err);
        reject(err)
      });
    });
  })
    .then(function (data) {
      callback(data)
    })
    .catch(function (err) {
      callback(err)
    });
}

/**
 * Loops through the manufacturer list in mappings.js for brand entry.
 *
 * @param {[list]} mappingsEntry
 * @param {[int]}  index
 * @return run prepare if there's a json response else report back to background.js
 */
function fetchWithMappings(mappingsEntry, index) {
  Logger.debug('search: ' + mappingsEntry[index]);
  if (index < mappingsEntry.length) {
    apiFetch(getOrgUrl(mappingsEntry[index]), function (onReturn) {
      if (onReturn === false) {
        fetchWithMappings(mappingsEntry, index + 1);
      } else {
        Logger.debug("Found: " + mappingsEntry[index]);
        prepare(onReturn);
      }
    });
  } else {
    Logger.debug('mappings.js returned nothing, try brand');
    apiFetch(getOrgUrl(brand), function (onReturn) {
      if (onReturn === false) {
        opensecretsNotFound();
      } else {
        prepare(onReturn);
      }
    });
  }
}


if (apiCall === 'osGetOrgs') {
  if (mappings[brand.toLowerCase()]) {
    Logger.debug("mappings.js entry found for " + brand.toLowerCase());
    fetchWithMappings(mappings[brand.toLowerCase()], 0);
  } else {
    Logger.debug('nothing listed in mappings.js, trying brand');
    apiFetch(getOrgUrl(brand), function (onReturn) {
      if (onReturn === false) {
        opensecretsNotFound();
      } else {
        prepare(onReturn);
      }
    });
  }
} else  if (apiCall === 'osOrgSummary') {
  const orgSummaryUrl = 'https://www.opensecrets.org/api/?method=orgSummary&id=' + opensecretsOrgId + '&apikey=' + osApiKey + '&output=json';
  Logger.debug('orgSummary URL: ' + orgSummaryUrl);
  fetch(orgSummaryUrl).then(function (response) {
    if (response.status !== 200) {
      Logger.warn('Unable to get any information. Status Code: ' + response.status);
    }

    response.json().then(function (data) {
      dems = data['response']['organization']['@attributes']['dems'];
      reps = data['response']['organization']['@attributes']['repubs'];

      msgObj = {
        run: 'storeOrgSummary',
        dems: dems,
        reps: reps,
        onTab: onTab
      };
      Logger.debug(msgObj);
      chrome.runtime.sendMessage(msgObj);
    });
  });
}
