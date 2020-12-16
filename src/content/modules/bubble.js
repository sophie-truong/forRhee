var bubbleSpendRight = (function () {
  let req = '';
  const brandLinkSelector = document.querySelector(pageSelector);
  const documentHead = document.head || document.getElementsByTagName('head')[0];

  const attributesMap = {
    "Animal Test User": {
      "icon": "animal_tester.png",
      "alt": "Animal Tester",
      "category": "Planet"
    },
    "Burma Involved": {
      "icon": "conflict_profiteer.png",
      "alt": "Conflict Profiteer",
      "category": "People"
    },
    "Child Labor Involved": {
      "icon": "child_labor.png",
      "alt": "Child Labor",
      "category": "People"
    },
    "Coal Involvement": {
      "icon": "non_renewable_energy.png",
      "alt": "Non-Renewable Energy",
      "category": "Planet"
    },
    "Diverse Board": {
      "icon": "inclusive_leadership.png",
      "alt": "Inclusive Leadership",
      "category": "People"
    },
    "Fracking Involved": {
      "icon": "non_renewable_energy.png",
      "alt": "Non-Renewable Energy",
      "category": "Planet"
    },
    "Gay & Lesbian Sensitive": {
      "icon": "inclusive_leadership.png",
      "alt": "Inclusive Leadership",
      "category": "People"
    },
    "GMO Involved": {
      "icon": "gmo_producers.png",
      "alt": "GMO Producers",
      "category": "Planet"
    },
    "Iran Involved": {
      "icon": "conflict_profiteer.png",
      "alt": "Conflict Profiteer",
      "category": "People"
    },
    "Labor Unions Supporter": {
      "icon": "employee_friendly.png",
      "alt": "Empowers Workers",
      "category": "People"
    },
    "Military Contractor": {
      "icon": "military_contractor.png",
      "alt": "Military Contractor",
      "category": "People"
    },
    "Nuclear Power Involved": {
      "icon": "",
      "alt": "NA",
      "category": ""
    },
    "Pesticides & Pollutants": {
      "icon": "polluters.png",
      "alt": "Polluters",
      "category": "Planet"
    },
    "Sudan Involved": {
      "icon": "conflict_profiteer.png",
      "alt": "Conflict Profiteer",
      "category": "People"
    },
    "Sustainable Forestry Supporter": {
      "icon": "sustainable_materials.png",
      "alt": "Sustainable Materials",
      "category": "Planet"
    },
    "Trump Involved": {
      "icon": "trump_associated.png",
      "alt": "Trump Associated",
      "category": "People"
    },
    "Working Mother-Friendly": {
      "icon": "employee_friendly.png",
      "alt": "Empowers Workers",
      "category": "People"
    }
  };


  return {
    /**
     * Evaluate opensecrets data to distinguish whether or not current manufacturer's political affilation is
     * democratic or republican
     *
     * @returns proper icon
     */
    getOSResult: function () {
      if (dems === "NA" && reps === "NA") {
        return "NA";
      } else {
        if (parseInt(dems) > parseInt(reps)) {
          return {
            iconsImgSrc: chrome.extension.getURL('/src/resources/assets/images/democrat.png'),
            altName: 'Democratic Supporter',
            attrCategory: 'People'
          }
        } else {
          return {
            iconsImgSrc: chrome.extension.getURL('/src/resources/assets/images/republican.png'),
            altName: 'Republican Supporter',
            attrCategory: 'People'
          }
        }
      }
    },

    /**
     * Add score and badge count to button upon completion
     *
     * @param manuScore
     * @param manuColor
     * @param badgesCount
     */
    buttonComplete: function (manuScore, manuColor, badgesCount, notRated = false) {
      if (notRated) {
        const spdrtBtnTitle = document.getElementById('spdrtBtnTitle');
        spdrtBtnTitle.innerHTML = 'Not Rated';
      } else {
        if (manuColor !== "green") {
          const leaf = document.getElementById('leaf');
          const srcStr = '/src/resources/assets/images/leaf/' + manuColor + '.png';
          leaf.src = chrome.extension.getURL(srcStr)
        }

        const btnScore = document.getElementById('btnScore');
        const btnBadges = document.getElementById('btnBadges');
        let btnScoreTextColor = 'spdrtGreenText';
        if (manuColor === 'yellow') {
          btnScoreTextColor = 'spdrtYellowText';
        } else if (manuColor === 'red') {
          btnScoreTextColor = 'spdrtRedText';
        }

        btnScore.classList.add(btnScoreTextColor);
        btnScore.innerHTML = manuScore;
        btnBadges.innerHTML = badgesCount;
      }

      const spdrtWrap = document.getElementById('spendrightWrap');
      spdrtWrap.classList.add('btnExpand');
      spdrtWrap.style.transition = 'width 0.5s ease-out';

      const spdrtBtnTitle = document.getElementById('spdrtBtnTitle');
      spdrtBtnTitle.style.display = 'inline-block';
      setTimeout(function () {
        spdrtBtnTitle.style.opacity = 1;
      }, 300);

      document.getElementById('logoButton').classList.remove('loadingSpin');
    },

    /**
     * Add spdrtToggle.js to end of div id=spendright
     */
    addSpdrtJS: function () {
      const jsSrc = chrome.extension.getURL('src/resources/assets/js/spdrtToggle.js');

      if (!document.querySelector('script[src="' + jsSrc + '"]')) {
        const spdrtToggleJs = document.createElement('script');
        spdrtToggleJs.type = 'text/javascript';
        spdrtToggleJs.src = jsSrc;
        brandLinkSelector.parentNode.appendChild(spdrtToggleJs);
      }
    },

    /**
     * If there is more than 1 industry then average them
     *
     * @param industries
     * @returns {number}
     */
    getIndustryAverage: function (industries) {
      let nums = [];
      for (let i in industries) {
        if (industries.hasOwnProperty(i)) {
          nums.push(industryAverages[industries[i]]);
        }
      }
      const add = (a, b) => a + b;
      const sum = nums.reduce(add);
      return Math.ceil(sum / nums.length);
    },

    /**
     * Creates an array of objects that contains the path to file and the alt name for the img tag.
     * @returns {Array}
     */
    listBrandAttributesIcons: function (brandAttr) {
      Logger.debug('list of Brand Attributes');
      Logger.debug(brandAttr);
      'use strict';
      let urlIcons = [];
      const getOsResult = this.getOSResult();
      if (getOsResult !== "NA") {
        urlIcons.push(getOsResult);
      }

      let collected = [];
      for (let i = 0; i < brandAttr.length; i++) {
        if (collected.indexOf(attributesMap[brandAttr[i]]['alt']) === -1 && brandAttr[i] !== "Nuclear Power Involved") {
          urlIcons.push({
            iconsImgSrc: chrome.extension.getURL('/src/resources/assets/images/brand_attr_icons/' + attributesMap[brandAttr[i]]['icon']),
            altName: attributesMap[brandAttr[i]]['alt'],
            attrCategory: attributesMap[brandAttr[i]]['category']
          });
          Logger.debug('badge added: ' + attributesMap[brandAttr[i]]['alt']);
          collected.push(attributesMap[brandAttr[i]]['alt']);
        }
      }
      return urlIcons;
    },

    /**
     * GET request to get the text of the templates
     * @param templateName
     * @returns {string}
     */
    getTemplateText: function (templateName) {
      const templates = {
        loading: 'src/templates/spendright.handlebars',
        bubble: 'src/templates/bubble.handlebars',
        notRated: 'src/templates/partials/notrated.handlebars',
        sscore: 'src/templates/partials/sscore.handlebars',
        attributes: 'src/templates/partials/attributes.handlebars',
        recommendations: 'src/templates/partials/recommendations.handlebars'
      };


      req = new XMLHttpRequest();
      req.open('GET', chrome.extension.getURL(templates[templateName]), false);
      req.send(null);
      return req.responseText;
    },

    /**
     * returns the template object and the storage sync object
     *
     * @param attributesIcons
     * @param manufacturerSScore
     * @param leaningPosition
     * @param manufacturerScoreColor
     * @param manufacturerIndustries
     * @param industryAverageValue
     * @param averageBarPosition
     * @param includeAsterisk
     * @returns {{brand, attributesIcons: *, manuScore: *, sscorePos: string, ssColorClass: string, industries: *, indAvg: string, avgPos: string, addAsterisk: *}}
     */
    setBubbleData: function (attributesIcons, manufacturerSScore, leaningPosition, bubbleLeaningPosition, manufacturerScoreColor, manufacturerIndustries, industryAverageValue, averageBarPosition, includeAsterisk, manufacturerName) {
      return {
        brand: brand,
        attributesIcons: attributesIcons,
        manuScore: manufacturerSScore,
        sscorePos: 'style="top: ' + leaningPosition.toString() + 'px"',
        sscoreBubblePos: 'style="top: ' + bubbleLeaningPosition.toString() + 'px"',
        ssColorClass: "ss" + manufacturerScoreColor,
        industries: manufacturerIndustries,
        indAvg: String(industryAverageValue),
        avgPos: 'style="top: ' + averageBarPosition.toString() + 'px;"',
        addAsterisk: includeAsterisk,
        scoreColor: manufacturerScoreColor,
        manufacturer: manufacturerName
      }
    },

    /**
     * Additional bubble resources are colors, CTA icons and close image
     * @param tplObj
     * @param bubbleColor
     * @returns {*}
     */
    setAdditionalResources: function (tplObj, bubbleColor, notRated = false) {
      let bubbleColorSrc = chrome.extension.getURL('/src/resources/assets/images/sscore_greenbubble.png');
      if (bubbleColor === 'yellow') {
        bubbleColorSrc = chrome.extension.getURL('/src/resources/assets/images/sscore_yellowbubble.png');
      } else if (bubbleColor === 'red') {
        bubbleColorSrc = chrome.extension.getURL('/src/resources/assets/images/sscore_redbubble.png');
      }
      tplObj.closeXSrc = chrome.extension.getURL('/src/resources/assets/images/close.png');
      tplObj.leafSrc = chrome.extension.getURL('/src/resources/assets/images/leaf/green.png');
      tplObj.sustainabilityInfoSrc = chrome.extension.getURL('/src/resources/assets/images/sustainabilityinfo.png');
      tplObj.attrIconSrc = chrome.extension.getURL('/src/resources/assets/images/attributes.png');
      tplObj.attrInfoSrc = chrome.extension.getURL('/src/resources/assets/images/attributeinfo.png');
      tplObj.watermarkSrc = chrome.extension.getURL('/src/resources/assets/images/spendright_watermark.png');
      tplObj.sscoreMeterSrc = chrome.extension.getURL('/src/resources/assets/images/sscore_meter.png');
      tplObj.sscoreBubbleColorSrc = bubbleColorSrc;
      tplObj.indAvgIndicatorSrc = chrome.extension.getURL('/src/resources/assets/images/indAvg_indicator.png');
      tplObj.indAvgInfoSrc = chrome.extension.getURL('/src/resources/assets/images/industryinfo.png');
      tplObj.carouselNav = chrome.extension.getURL('/src/resources/assets/images/carousel_nav.png');
      tplObj.enableGrid = false;

      if (tplObj.attributesIcons.length > 3) {
        tplObj.enableGrid = true;
      }

      if (tplObj.attributesIcons.length === 0) {
        tplObj.noAttributesIconSrc = chrome.extension.getURL('/src/resources/assets/images/no_attributes.png');
      }

      if (notRated) {
        tplObj.notRatedImgSrc = chrome.extension.getURL('/src/resources/assets/images/NotRatedColor.png');
      }
      return tplObj;
    },

    /**
     * Removes injected html id="spendright"
     */
    removeSpendRight: function () {
      const spendrightButton = document.getElementById('spendright');
      spendrightButton.parentNode.removeChild(spendrightButton)
    }
  }
})();
