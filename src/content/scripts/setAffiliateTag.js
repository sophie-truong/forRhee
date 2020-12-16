if (window.location.href.indexOf('spendright06-20') === -1) {
  let withAffiliateId = window.location.href + '&tag=spendright06-20';
  if (window.location.href.indexOf('?') === -1) {
    withAffiliateId = window.location.href + '?tag=spendright06-20';
  }
  window.history.replaceState({path: withAffiliateId}, '', withAffiliateId);
}
