(function(window) {
  "use strict";
  /* jshint devel: true */
  /* globals Stats, $, Faye */

  var StatsProcessorOptions;

  /**
   * Stats Processor options
   * @typedef {{filterServices: Array, endpoint: String|null}}
   */
  StatsProcessorOptions = {
    filterServices: [],
    endpoint: null,
    serviceList: null
  };

  /**
   * Processes the inbound data from AJAX/Websocket endpoints.
   *
   * @param {StatsProcessorOptions} opts
   * @constructor
   */
  var StatsProcessor = function (opts) {
    opts = opts || StatsProcessorOptions;

    /**
     * Whitelist of service ID we retain the data of.
     * @type {Array}
     */
    this.filterBy = opts.filterServices;

    /**
     * An object for querying services
     * @type {ServiceList}
     */
    this.serviceList = opts.serviceList;


    /**
     * All data updates
     * @type {Array.<Stats>}
     */
    this.dataUpdatesReceived = [];

    /**
     * Stores the Websocket client subscription object reference
     * @type {Object|null}
     */
    this.subscription = null;

    /**
     * Stores the Webstocket client object reference
     * @type {Faye.Client|null}
     */
    this.client = null;

    this.subscribeToUpdatesChannel(opts.endpoint);
  };

  /**
   * Checks if the service ID is valid among those emitted by the remote server.
   *
   * @param {string} id Service identifier
   * @returns {boolean}
   */
  StatsProcessor.prototype.isValidService = function (id) {
    if (this.filterBy) {
      return this.filterBy.indexOf(id) > -1;
    } else {
      return true;
    }
  };

  /**
   * Adds a service to the list of services to display.
   *
   * @api
   * @param {string} id Service identifier
   */
  StatsProcessor.prototype.addService = function (id) {
    this.filterBy.push(id);
    this.update();
  };

  /**
   * Removes a service to the list of services to display.
   *
   * @api
   * @param {string} id Service identifier
   */
  StatsProcessor.prototype.removeService = function (id) {
    var index = this.filterBy.indexOf(id);

    if (index > -1) {
      this.filterBy.splice(index, 1);
      this.update();
    }
  };

  /**
   * Initial query before relying only on websocket data exchange.
   *
   * @returns {jQuery.Deferred}
   */
  StatsProcessor.prototype.initialData = function () {
    var self   = this;

    var promise = $.getJSON("/latest.json").then(function success(latest) {
        var stations = (latest && latest.stations) ? latest.stations : [];

        self.dataUpdatesReceived = {};
        self.processUpdatesByService(stations);

        return self.latest();
      },
      function failure() {
        console.error('StatsProcessor.initialData fetch failed');
      }
    );

    return promise;
  };

  /**
   * Method triggered when receiving data from the network (like the Websocket
   * provider). It processes the data to convert them into Stats objects and
   * spreads the work through the `update` event.
   *
   * @api
   * @param {Object=} data
   */
  StatsProcessor.prototype.update = function (data) {
    var self = this;

    if (data) {
      console.log('StatsProcessor.update() has new data', data);
      this.processUpdatesByService(data.stations);
    }

    $(self).trigger("update", [ this.latest() ]);
  };

  /**
   * Returns an array of the latest data updates (as Stats objects),
   * one per service.
   *
   * @todo rename a way it reflects "latest by service"
   * @returns {Object.<Stats>}
   */
  StatsProcessor.prototype.latest = function () {
    var latest = [],
        dataForService,
        dataTotal,
        latestItem;

    for (var serviceKey in this.dataUpdatesReceived) {
      if (this.isValidService(serviceKey)) {
        dataForService = this.dataUpdatesReceived[serviceKey];
        dataTotal      = dataForService.length;
        latestItem     = dataForService[dataTotal-1];

        latest.push( latestItem );
      }
    }

    return latest;
  };

  /**
   * A hash of all updates, keyed by service id.
   *
   * @returns {jQuery.Deferred} A promise of data {@link http://api.jquery.com/category/deferred-object/}
   */
  StatsProcessor.prototype.historicalByService = function (serviceId) {
    return $.getJSON('/' + serviceId + '/historical.json');
  };

  /**
   * The latest update received for a particular service.
   *
   * @returns {array.<Stats>} the latest Stats
   */
  StatsProcessor.prototype.lastUpdateReceivedForService = function (serviceId) {
    return this.dataUpdatesReceived[serviceId];
  };

  /**
   * Parse an update response and returns an augmented object of Stats updates.
   *
   * @param {Object} jsonData Each key contains an array of objects parseable with `Stats.parse`
   * @returns {Object} One key per service, containing an array of Stats objects
   */
  StatsProcessor.prototype.parseUpdates = function (jsonData) {
    var parsedData = {};

    for (var serviceKey in jsonData) {
      var serviceData = jsonData[serviceKey];

      if (!parsedData[serviceKey]) {
        parsedData[serviceKey] = [];
      }

      for (var i = 0; i < serviceData.length; i++) {
        var stats = Stats.parse(serviceKey, serviceData[i]);
        parsedData[serviceKey].push(stats);
      }
    }

    return parsedData;
  };

  /**
   * Takes a hash of data updates keyed by service id and pushed them
   * onto a temporary storage, for some legacy usage
   *
   * @param {Object} jsonData Each key contains an array of `Stats` objects
   */
  StatsProcessor.prototype.processUpdatesByService = function (jsonData) {
    this.dataUpdatesReceived = this.parseUpdates(jsonData);
  };

  /**
   * Subscribes to a `/minute` channel on a given Websocket endpoint.
   *
   * @uses Faye {@link http://faye.jcoglan.com/browser.html}
   * @throws Error
   * @param {String} endpoint An URL to a websocket data broadcaster
   */
  StatsProcessor.prototype.subscribeToUpdatesChannel = function (endpoint) {
    var self = this;

    if (!endpoint) {
      throw new Error('No Faye endpoint found in body data-faye-client-host attribute');
    }

    this.client = new Faye.Client(endpoint);
    this.subscription = this.client.subscribe('/minute', function (message) {
      self.update(message);
    });
  };

  window.StatsProcessor = StatsProcessor;

}(window));
