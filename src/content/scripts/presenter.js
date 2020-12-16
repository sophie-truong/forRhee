var manufacturerNotRated = false;

// SPDRT-132 + SPDRT-171
var modBrand = brand.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/\-/g, ' ')
  .replace(/\'/g, '')
  .replace('\xAE', '')
  .replace(/\./g, '');

/**
 * Use brand and mappings to find the manufacturer in backend data. Mappings contains '&' while the backend uses 'and'
 * while looping through if '&' is in the entry replace it with 'and' to see if we can find a match.
 *
 * @return manufacturerName string
 */
function getManufacturer(callback) {
  let manufacturerName = 'NA';
  if (brand !== '') {
    Logger.debug('get manufacturer in mappings based on ' + modBrand);
    mappingsEntries = mappings[modBrand];
    backendEntry = backend[modBrand];
    if (typeof mappingsEntries !== 'undefined') {
      Logger.debug(mappingsEntries);
      Logger.debug('using mappings entry...');
      for (i = 0; i < mappingsEntries.length; i++) {
        if (backend[mappingsEntries[i]]) {
          manufacturerName = mappingsEntries[i];
        } else {
          if (mappingsEntries[i].indexOf('&') !== -1) {
            const editedStrEntry = String(mappingsEntries[i]).replace('&', 'and');
            if (backend[editedStrEntry]) {
              manufacturerName = editedStrEntry;
            }
          }
        }
        // mark manufacturer true if found in notRated list
        if (notRated.includes(mappingsEntries[i])) {
          manufacturerNotRated = true;
        }
      }
    } else if (typeof backendEntry !== 'undefined') {
      Logger.debug(backendEntry);
      Logger.debug('using backend...');
      manufacturerName = brand.toLowerCase();
    } else {
      Logger.debug(mappingsEntries);
      Logger.debug(backendEntry);
      Logger.debug('searching backend...');
      for (let key in backend) {
        if (backend.hasOwnProperty(key)) {
          if (key.indexOf(brand.toLowerCase().replace('-', ' ')) !== -1) {
            /**
             * indexOf will return an entry that may or may not be the manufacturer we are looking for. In order to help
             * solve this issue, we will split the brand and the key into an array by space. Loop through each to find
             * matches and record them as 'hits'.
             */
            Logger.debug('found: ' + key);
            commonBackend = [
              'technology',
              'technologies',
              'company',
              'company',
              'services',
              'systems',
              'corporated',
              'incorporated',
              'international',
              'industries',
              'group',
              'products',
              'corporation',
              'incorporation',
              'athletic',
              'athletica',
              'holdings',
              'berhad',
              'koninklijk',
              'koninklijke',
              'co',
              'llc',
              'ltd',
              'limited',
              'coltd',
              'inc',
              'corp',
              'plc',
              'pcl',
              'sa',
              'bhd',
              'ag',
              'usa'
            ];
            searchWithKey = key.split(/\s/);
            searchWithBrandVar = brand.toLowerCase().replace('-', ' ').split(/\s/);
            hits = 0;
            for (let i = 0; i < searchWithBrandVar.length; i++) {
              for (let j = 0; j < searchWithKey.length; j++) {
                if (searchWithBrandVar[i] === searchWithKey[j]) {
                  hits += 1;
                }
              }
            }
            // loop through commonBackend to add hits, since these are typically found at the end of
            // company/organizations/manufacturer they will not normally be in the product name.
            // This should assist in finding the appropriate manufacturer name and not the wrong one.
            for (let i = 0; i < commonBackend.length; i++) {
              for (let j = 0; j < searchWithKey.length; j++) {
                if (commonBackend[i] === searchWithKey[j]) {
                  Logger.debug(commonBackend[i] + ' === ' + searchWithKey[j]);
                  hits += 1;
                }
              }
            }
            Logger.debug('hits: ' + hits);
            if (hits === searchWithKey.length) {
              manufacturerName = key;
            }
          }
        }
      }
    }
  }

  callback(manufacturerName);
}

function repositionBubble() {
  const spdrtBtn = document.querySelector('#spendright');
  const rect = spdrtBtn.getBoundingClientRect();
  Logger.debug('button location: ' + rect.top + ', ' + rect.left);
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  Logger.debug('scrollLeft' + scrollLeft + '  ' + ' scrollTop' + scrollTop);
  const positionBubble = document.querySelector('#bubbleLayout');
  let top_pos = rect.top + scrollTop + 38;
  let left_pos = rect.left + scrollLeft - 120;
  positionBubble.style.top = top_pos + 'px';
  positionBubble.style.left = left_pos + 'px';
}

function createHandlebarsHelperFunction() {
  Handlebars.registerHelper('gridview', function (attributesObj) {
    return 6*attributesObj;
    /*let gridContainer = document.createElement('div');
    for (var key in attributesObj) {
      let simpleEle = document.createElement('img');
      simpleEle.src = attributesObj['iconsImgSrc'];
      gridContainer.appendChild(simpleEle);
    }

    Logger.debug(attributesObj['iconsImgSrc']);

    return gridContainer.toString();*/
  });
}

/**
 * Presenter runs the following states
 * 1. loading - injects SpendRight into Amazon Product page
 * 2. bubble - creates the pop up body (chat bubble) SpendRight states
 *             - fully rated
 *             - partially rated
 *             - not rated
 * 3. reload - recreates the bubble with sync object
 */
if (present === 'loading') {
  loadingSpendRight.injectButton();

  try {
    if (reloadBtn) {
      chrome.runtime.sendMessage({
        run: 'reload',
        brand: brand,
        onTab: onTab
      });
    }
  } catch (e) {
    // ignore this exception
  }
} else if (present === 'bubble') {
  let syncData = {};
  repositionBubble();

  getManufacturer(function (manufacturerName) {
    Logger.debug('MANUFACTURER: ' + manufacturerName);
    if (manufacturerName === "NA") {
      Logger.debug('No backend data found.');
      const opensecretsBadge = bubbleSpendRight.getOSResult();

      // SPDRT-201 Not Yet Rated and Not Rated are the same now
      // sync data will be the same for now until db change
      let bubbleDataObj = {
        brand: brand
      };

      syncData[brand] = bubbleDataObj;
      syncData[brand].reload = 'not rated';

      if (manufacturerNotRated) {
        // is in notRated.js
      } else {
        // notYetRated();
      }

      if (opensecretsBadge !== "NA") {
        bubbleDataObj.attributesIcons = opensecretsBadge;
      } else {
        bubbleDataObj.attributesIcons = [];
      }

      bubbleSpendRight.buttonComplete(0, "", 0, true);

      const bubbleTemplate = bubbleSpendRight.getTemplateText('bubble');
      const sscoreTemplate = bubbleSpendRight.getTemplateText('notRated'); // replacing sscore template with not rated
      const attributesTemplate = bubbleSpendRight.getTemplateText('attributes');
      const recommendationsTemplate = bubbleSpendRight.getTemplateText('recommendations');

      createHandlebarsHelperFunction();

      const hbTemplate = Handlebars.compile(bubbleTemplate);
      Handlebars.registerPartial({
        sscore: sscoreTemplate,
        attributes: attributesTemplate,
        recommendations: recommendationsTemplate
      });

      bubbleSpendRight.setAdditionalResources(bubbleDataObj, "red", true);

      document.getElementById('bubbleLayout').innerHTML = hbTemplate(bubbleDataObj);

      bubbleSpendRight.addSpdrtJS();
      chrome.storage.sync.set(syncData);
    } else {
      if (backend[manufacturerName][0] === "NA" || backend[manufacturerName][1] === "NA") {
        Logger.debug('Entry found but has no data - REMOVED SPENDRIGHT');
        bubbleSpendRight.removeSpendRight();
      } else {
        chrome.runtime.sendMessage({run: 'set-affiliate', onTab: onTab});
        const manuScore = backend[manufacturerName][0];
        let manuScoreColor = backend[manufacturerName][1];
        const manuStatus = backend[manufacturerName][2];
        const manuAttr = backend[manufacturerName][3];
        const manuIndustries = backend[manufacturerName][4];
        const indAvg = bubbleSpendRight.getIndustryAverage(manuIndustries);
        const attributesIcons = bubbleSpendRight.listBrandAttributesIcons(manuAttr);
        let addAsterisk = false;

        if (manuStatus === 'P') {
          manuScoreColor = 'yellow';
          addAsterisk = true;
        }

        bubbleSpendRight.buttonComplete(manuScore, manuScoreColor, attributesIcons.length);

        const bulletGraphLength = 150;
        const scorePos = ((manuScore / 100) * bulletGraphLength);
        let sscoreLeanPos = 0;
        const sectionHalf = 12.5;
        if (manuStatus === 'P' && manuScoreColor === 'yellow') {
          sscoreLeanPos = 75;
        } else {
          if (manuScoreColor === "red") {
            const redMedian = 25;
            if (scorePos < redMedian) {
              sscoreLeanPos = sectionHalf;
            } else {
              sscoreLeanPos = redMedian + sectionHalf;
            }
          } else if (manuScoreColor === "yellow") {
            const yellowMedian = 75;
            if (scorePos < yellowMedian) {
              sscoreLeanPos = yellowMedian - sectionHalf;
            } else {
              sscoreLeanPos = yellowMedian + sectionHalf;
            }
          } else if (manuScoreColor === "green") {
            const greenMedian = 125;
            if (scorePos < greenMedian) {
              sscoreLeanPos = greenMedian - sectionHalf;
            } else {
              sscoreLeanPos = greenMedian + sectionHalf;
            }
          }
        }

        sscoreLeanPos = 150 - sscoreLeanPos - 9.5; // reverse positions and subtract text height
        const sscoreBubbleLeanPos = sscoreLeanPos - 12.5;
        const avgPos = (indAvg / 100) * bulletGraphLength - 9;

        bubbleDataObj = bubbleSpendRight.setBubbleData(
          attributesIcons,
          manuScore,
          sscoreLeanPos,
          sscoreBubbleLeanPos,
          manuScoreColor,
          manuIndustries,
          indAvg,
          avgPos,
          addAsterisk,
          manufacturerName
        );

        syncData[brand] = bubbleDataObj;
        syncData[brand].reload = 'normal';

        // send info to storage
        chrome.storage.sync.set(syncData);

        const bubbleTemplate = bubbleSpendRight.getTemplateText('bubble');
        const sscoreTemplate = bubbleSpendRight.getTemplateText('sscore');
        const attributesTemplate = bubbleSpendRight.getTemplateText('attributes');
        const recommendationsTemplate = bubbleSpendRight.getTemplateText('recommendations');

        createHandlebarsHelperFunction();

        const hbTemplate = Handlebars.compile(bubbleTemplate);
        Handlebars.registerPartial({
          sscore: sscoreTemplate,
          attributes: attributesTemplate,
          recommendations: recommendationsTemplate
        });


        bubbleSpendRight.setAdditionalResources(bubbleDataObj, manuScoreColor);

        document.getElementById('bubbleLayout').innerHTML = hbTemplate(bubbleDataObj);

        setTimeout(function () {
          bubbleSpendRight.addSpdrtJS();
        }, 1000);
      }
    }
  });
} else if (present === 'reload') {
  chrome.runtime.sendMessage({run: 'set-affiliate', onTab: onTab});
  repositionBubble();
  let bubbleTemplateObj = {};
  let sscoreTemplate = bubbleSpendRight.getTemplateText('sscore');
  if (syncData['reload'] === 'not rated') {
    bubbleSpendRight.buttonComplete(0, "red", syncData['attributesIcons'].length, true);
    sscoreTemplate = bubbleSpendRight.getTemplateText('notRated');

    bubbleTemplateObj = {
      brand: syncData['brand'],
      attributesIcons: syncData['attributesIcons']
    }
  } else {
    bubbleSpendRight.buttonComplete(syncData['manuScore'], syncData['scoreColor'], syncData['attributesIcons'].length);

    bubbleTemplateObj = {
      brand: syncData['brand'],
      attributesIcons: syncData['attributesIcons'],
      manuScore: syncData['manuScore'],
      ssColorClass: syncData['ssColorClass'],
      sscorePos: syncData['sscorePos'],
      sscoreBubblePos: syncData['sscoreBubblePos'],
      industries: syncData['industries'],
      indAvg: syncData['indAvg'],
      avgPos: syncData['avgPos'],
      addAsterisk: syncData['addAsterisk']
    };
  }

  const bubbleTemplate = bubbleSpendRight.getTemplateText('bubble');
  const attributesTemplate = bubbleSpendRight.getTemplateText('attributes');
  const recommendationsTemplate = bubbleSpendRight.getTemplateText('recommendations');

  createHandlebarsHelperFunction();

  const hbTemplate = Handlebars.compile(bubbleTemplate);
  Handlebars.registerPartial({
    sscore: sscoreTemplate,
    attributes: attributesTemplate,
    recommendations: recommendationsTemplate
  });


  if (syncData['reload'] === 'not rated') {
    bubbleSpendRight.setAdditionalResources(bubbleTemplateObj, "red", true);
  } else {
    bubbleSpendRight.setAdditionalResources(bubbleTemplateObj, syncData['scoreColor']);
  }

  document.getElementById('bubbleLayout').innerHTML = hbTemplate(bubbleTemplateObj);

  setTimeout(function () {
    bubbleSpendRight.addSpdrtJS();
  }, 1000);
}
