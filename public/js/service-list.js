(function(window, $) {
  "use strict";

  /* globals jQuery, Service */

  /**
   * Trace an error in the console before blowing into space
   *
   * @param {Error} err
   */
  function errorHandler(err) {
    //jshint devel:true
    console.error(err);
    throw new Error('ServiceList - problem loading data');
  }

  /**
   * Service List constructor.
   * It manages the collection of services, and their business logic.
   *
   * @constructor
   */
  var ServiceList = function ServiceList(){
    var self  = this;

    /**
     * Holds the various services in memory for later use.
     * @type {Array.<Service>}
     */
    self.data = null;

    // Initiate the service with remote data
    $.get(self.url).then(function(data) {
      if (data.error) {
        errorHandler(data.error);
      }

      self.dataReceived(data);
    }, errorHandler);
  };

  /**
   * The URI where data are fetched on app boostrapping.
   * @type {string}
   */
  ServiceList.prototype.url = '/discovery.json';

  /**
   * Handle the data reception, and parse then store the results to drive the UI.
   *
   * @param {Array.<Object>} data
   */
  ServiceList.prototype.dataReceived = function dataReceived(data){
    var evt = $.Event('availableServices');
    this.data = data.map(this.parseService);
    this.sort();

    // Notify the app layers we are ready to use the data (basically, the ServiceListView)
    $(this).trigger(evt);
  };

  /**
   * Parse a response object and creates a new `Service` object with it.
   *
   * @param {Object} item
   * @returns {Service}
   */
  ServiceList.prototype.parseService = function parseService(item) {
    return new Service(item.id);
  };

  /**
   * Compare two object identifiers to help determining an alphabetical sorting.
   *
   * @param {Service} objA
   * @param {Service} objB
   * @returns {number}
   */
  ServiceList.prototype.serviceListComparison = function serviceListComparison(objA, objB) {
    var a = objA.id;
    var b = objB.id;

    if (a > b) { return  1; }
    if (a < b) { return -1; }
    return 0;
  };

  /**
   * Sorts the list of services in ascending alphabetical order.
   *
   * @api
   */
  ServiceList.prototype.sort = function sort() {
    this.data.sort(this.serviceListComparison);
  };

  /**
   * Returns the list of services.
   *
   * @returns {Array.<Service>}
   */
  ServiceList.prototype.services = function services() {
    return this.data;
  };

  /*
   Exporting
   */
  window['ServiceList'] = ServiceList;

})(window, jQuery);
