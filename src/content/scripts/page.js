var pageSelector = '';
var brand = '';
var brandHref = '';

/**
 * Wait for the page selector to be found by javascript then begin
 *
 * @param tries
 * @param callback
 */
function waitForElement(tries, callback) {
  'use strict';
  if (tries === 20) {
    callback('failed');
  }
  window.setTimeout(function () {
    if (pageSelector !== '') {
      callback('set');
    } else {
      setPageSelector();
      waitForElement(tries + 1, callback);
    }
  }, 100);
}

/**
 * Amazon has different css on their pages which doesn't work well for where we stick the extension. var selectors
 * contains the known areas where SpendRight can live and also it's in order of least typical to most typical page.
 *
 * @returns {boolean}
 */
function setPageSelector() {
  'use strict';
  const selectors = [
    '#pantryPrimeExclusiveMessage_feature_div',
    '#superleafActionPanel',
    '#titleBlockRightSection',
    '#actionPanel',
    '#brand',
    '#bylineInfo',
  ];

  selectors.some(function (selector) {
    const el = document.querySelector(selector);
    if (el) {
      if (el === '#actionPanel') {
        pageSelector = '#unifiedPrice_feature_div';
      } else {
        pageSelector = selector;
      }
      return true;
    }
  });
  return false;
}

/**
 * Amazon pages typically have an `a` tag with attribute `id='brand'`. This can sometimes contain an image which can't be
 * used to store the brand name. In those cases we can use href attribute and take the first part of the url. Also, we
 * might have to use a different page selector in order to place the extension. Sometimes the page selector is the
 * same as the typical `a` tag so we must check to see if it has the link to the product list page.
 *
 * @param pageSelector
 * @returns {boolean}
 */
function setBrandName(pageSelector, callback) {
  'use strict';
  if (!document.querySelector(pageSelector).getAttribute('href')) {
    Logger.debug(pageSelector + ' is empty, using #brand');
    pageSelector = '#brand';
  }

  try {
    brandHref = document.querySelector(pageSelector).getAttribute('href').split('/')[1];
  } catch (e) {
    Logger.debug('pageSelector #brand empty, trying #byLineInfo');
    try {
      pageSelector = '#bylineInfo';
      brandHref = document.querySelector(pageSelector).getAttribute('href').split('/')[1];
    } catch (e) {
      Logger.debug('pageSelector #bylineInfo empty');
    }
  }

  try {
    if (document.querySelector(pageSelector).firstElementChild) {
      brand = brandHref.replace(/-/g, ' ');
    } else {
      brand = document.querySelector(pageSelector).innerHTML.trim();
      brand = brand.replace(/&amp;/g, '&').replace(/&quot/g, '"').replace(/&#39;/g, '\'').replace(/-/g, ' ');
    }
  } catch(e) {
    Logger.debug(pageSelector + ' could not set brand');
    callback(false);
  }
  callback(true);
}

/**
 * Gets the ASIN number from the URL, all amazon pages contain it
 * @param  urlContents
 * @param callback function
 * @return asin number
 */
function getASINNumberFromUrl(urlContents, callback) {
  let verify = new RegExp('[a-zA-Z0-9]{10}');

  for (let i = 3; i > 0; i--) {
    if (verify.test(urlContents[i]) && urlContents[i].length === 10) {
      callback(urlContents[i]);
    }
  }
  callback(false);
}

if (/amazon/.test(window.location.hostname)) {
  urlContents = window.location.pathname.split('/');
  getASINNumberFromUrl(urlContents, function(asin) {
    if (asin) {
      setPageSelector();
      waitForElement(1, function (readyToGo) {
        'use strict';
        if (readyToGo === 'set') {
          setPageSelector();
          setBrandName(pageSelector, function (brandNameSet) {
            if (brandNameSet) {
              const msgObj = {
                run: 'getOrgData',
                brand: brand,
                brandHref: brandHref,
                pageSelector: pageSelector,
                onTab: onTab
              };
              Logger.debug(msgObj);
              chrome.runtime.sendMessage(msgObj);
            }
          });
        }
      });
    }
  });
}
