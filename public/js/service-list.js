(function(window, $) {
  "use strict";

  /* globals jQuery, Service */

  /**
   * Trace an error in the console and throw an exception.
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
  var ServiceList = function ServiceList(selectedServiceIds){
    var self  = this;

    self.selectedServiceIds = selectedServiceIds || [];

    /**
     * Holds the various services in memory for later use.
     * @type {Array.<Service>}
     */
    self.data = null;
  };

  /**
   * The URI where data are fetched on app boostrapping.
   * @type {string}
   */
  ServiceList.prototype.url = '/discovery.json';

  /**
   * Fetch the available services list for a remote source.
   *
   * @returns {Promise} A jQuery Deferred.Promise object
   */
  ServiceList.prototype.remoteServiceList = function remoteServiceList() {
    return $.get(this.url);
  };

  /**
   * Handle the received data and parse then store the results to drive the UI.
   *
   * @param {Array.<Object>} data
   */
  ServiceList.prototype.dataReceived = function dataReceived(data){
    var self = this,
        evt  = $.Event('availableServices');
    this.data = data.map(this.parseService.bind(this));

    // Add event handlers for Service state changes
    // Propagte as 'serviceStateChanged' event on this class
    this.data.forEach(function (service) {
      $(service).on('serviceStateChanged', function() {
        self.triggerStateChange(service); });
    });

    // Notify the app layers we are ready to use the data (basically, the ServiceListView)
    $(this).trigger(evt);
  };

  /**
   * Trigger a state change, firing the 'serviceStateChanged' event
   * for the given Service.
   *
   * @param {Service} service
   */
  ServiceList.prototype.triggerStateChange = function(service) {
    var evt = $.Event('serviceStateChanged', {
      service: service
    });
    $(this).trigger(evt);
  };

  /**
   * Parses a response object and creates a new `Service` object with it.
   *
   * @param {Object} item
   * @returns {Service}
   */
  ServiceList.prototype.parseService = function parseService(item) {
    var service = new Service(item.id, item.title, item.logoId);

    service.isSelected = this.selectedServiceIds.indexOf(service.id) > -1;

    return service;
  };

  /**
   * Compares two object identifiers to help determining an alphabetical
   * sorting.
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
   * Returns a jQuery Deferred.Promise object providing the list of services
   * Use the `then` function with a callback to get the data e.g.
   *     list.services()
   *         .then(function (services) {
   *            console.log('Number of services: ' + services.length)
   *         });
   *
   * @returns {Deferred.Promise}
   */
  ServiceList.prototype.services = function services() {
    var self      = this,
        deferred = $.Deferred();

    self.remoteServiceList().then(
      function(data) {
        if (data.error) {
          errorHandler(data.error);
          deferred.reject(data.error);
        }

        self.dataReceived(data);
        deferred.resolve(self.data);
      },
      errorHandler
    );

    return deferred.promise();
  };

  /**
   * Returns a promise providing the list of selected services.
   *
   * @returns {Deferred.Promise}
   */
  ServiceList.prototype.selectedServices = function selectedServices() {
    var self      = this,
        deferred = $.Deferred();

    self.services().then(
      function(services) {
        deferred.resolve(services.filter(function(service) {
          return service.isSelected;
        }));
      },
      function(error) {
        deferred.reject(error);
      }
    );

    return deferred.promise();
  };

  /**
   * Returns a promise providing a particular service instance
   * identified by its id.
   *
   * @returns {Deferred.Promise}
   */
  ServiceList.prototype.findByIdSync = function findById(id) {
    var found = this.data.filter(function (service) {
      return service.id === id;
    });

    if (found.length > 0) {
      return found[0];
    } else {
      return null;
    }
  };

  /*
   Exporting
   */
  window['ServiceList'] = ServiceList;

})(window, jQuery);
