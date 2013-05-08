(function setup (window, document, $, undefined) {
  "use strict";

  /* globals Dashboard, jQuery, ModalHandler */

  if (/debug/.test(window.location.search)) { document.body.classList.add('debug'); }

  /**
   * A list of vendor prefix we need to make assumptions on.
   * The empty value is here to test for unprefixed properties.
   * @type {Array}
   */
  var vendorDOMPrefixes = ['', 'webkit', 'moz', 'ms'];

  /**
   * Initialize the Dashboard with our app data
   *
   * @type {Dashboard}
   */
  var dashboard = new Dashboard({
    "bubble_chart_el": document.getElementById('bubble-chart'),
    "detail_table_el": document.getElementById('detail-table'),
    "modal_handler": new ModalHandler(),
    "stats_realtime_endpoint": $(document.body).attr('data-faye-client-host')
  });

  /**
   * Tests a CSS property.
   * It's very similar to what could propose Modernizr except we don't need to load the entire library for that.
   *
   * @param {String} property
   * @returns {Boolean} True if the `property` exists on any targeted browser vendor
   */
  var testCSSProperty = function(property){
    var el = document.body;

    //the weird concat is done to camelize properly the CSS computed value
    // DOMPrefix = moz, property = transition -> mozTransition
    // DOMPrefix = , property = transition -> transition
    return vendorDOMPrefixes.some(function(DOMPrefix){
      return el.style[DOMPrefix ? DOMPrefix+property[0].toUpperCase()+property.slice(1) : property] !== undefined;
    });
  };

  /*
  Testing the availability of native transitions/animations
   */
  $(document.body).addClass(testCSSProperty('transition') ? 'csstransition' : 'no-csstransition');
  $(document.body).addClass(testCSSProperty('transform') ? 'csstransform' : 'no-csstransform');

  /*
   Exporting
   */
  window.d = dashboard;
})(window, document, jQuery);
