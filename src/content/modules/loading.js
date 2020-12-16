var loadingSpendRight = (function () {
  let req = '';
  const brandLinkSelector = document.querySelector(pageSelector);
  const documentHead = document.head || document.getElementsByTagName('head')[0];

  return {
    injectButton: function () {
      this.checkForOrphans(function (checks) {
        if (checks) {
          const mainCss = document.createElement('link');
          mainCss.rel = 'stylesheet';
          mainCss.href = chrome.extension.getURL('src/resources/assets/css/spendright.min.css');

          const spendrightButtonDiv = document.createElement('div');
          spendrightButtonDiv.id = 'spendright';

          if (!document.getElementById('spendright')) {
            const cssHref = chrome.extension.getURL('src/resources/assets/css/spendright.min.css');
            const checkForCss = document.querySelector('link[href="' + cssHref + '"]');
            if (checkForCss === null) {
              documentHead.appendChild(mainCss);
            }

            if (pageSelector === '#brand' || pageSelector === '#bylineInfo') {
              brandLinkSelector.parentNode.appendChild(spendrightButtonDiv);
            } else {
              brandLinkSelector.insertBefore(spendrightButtonDiv, brandLinkSelector.firstChild);
            }

            req = new XMLHttpRequest();
            req.open('GET', chrome.extension.getURL('src/templates/spendright.handlebars'), true);
            req.onreadystatechange = function () {
              if (req.readyState === 4 && req.status === 200) {
                const hbTemplate = Handlebars.compile(req.responseText);
                document.getElementById('spendright').innerHTML = hbTemplate({
                  imgSrc: chrome.extension.getURL('src/resources/assets/images/sr_icon_button.png'),
                  leafSrc: chrome.extension.getURL('/src/resources/assets/images/leaf/green.png'),
                  attributesSrc: chrome.extension.getURL('/src/resources/assets/images/attributes.png'),
                });
              }
            };
            req.send(null);
          }
        }
      });
    },

    /**
     * checks to see if #bubbleLayout, sprdtToggle.js and spendright.min.css are orphaned
     * if they are then remove so they can be reinjected
     *
     * @param callback
     */
    checkForOrphans: function (callback) {
      const jsSrc = chrome.extension.getURL('src/resources/assets/js/spdrtToggle.js');
      const checkForLayout = document.querySelector('#bubbleLayout');
      const checkForJs = document.querySelector('script[src="' + jsSrc + '"]');

      if (checkForLayout !== null) {
        checkForLayout.parentNode.removeChild(checkForLayout);
        this.createBubbleLayout();
      } else {
        this.createBubbleLayout();
      }

      if (checkForJs !== null) {
        checkForJs.parentNode.removeChild(checkForJs);
      }
      callback(true);
    },

    createBubbleLayout: function() {
      // place SpendRight bubble on a header element in Amazon Page
      const topOfAmazonProductPage = document.getElementById("navbar");
      const bubbleLayoutDiv = document.createElement('div');
      bubbleLayoutDiv.id = 'bubbleLayout';
      bubbleLayoutDiv.className = 'spdrtBubble';
      bubbleLayoutDiv.style.display = 'none';
      topOfAmazonProductPage.parentNode.appendChild(bubbleLayoutDiv);
    },
  }
})();
