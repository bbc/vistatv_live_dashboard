(function(window, $) {
  "use strict";

  /* globals jQuery, dashboardConfig, StatsProcessor, BubbleChart, DetailTable, BarChart, ServiceList, ServiceListView */

  var DashboardOptions;

  /**
   * Dashboard options
   * @typedef {{
   *  bubble_chart_el: HTMLElement|jQuery,
   *  detail_table_el: HTMLElement|jQuery,
   *  modal_handler: ModalHandler,
   *  stats_realtime_endpoint: String
   * }}
   */
  DashboardOptions = {
    bubble_chart_el: null,
    detail_table_el: null,
    modal_handler: null,
    stats_realtime_endpoint: null
  };

  /**
   * Dashboard constructor
   * It is the magic glue between the various graphs, the data and the network updates.
   *
   * @param {DashboardOptions} options
   * @constructor
   */
  var Dashboard = function Dashboard(options) {
    var self = this;
    var $body = $('body');

    /**
     * Reference to the barchart object
     * @type {BarChart}
     */
    self.barChart = null;

    /**
     * Reference to the stats processor  object
     * @type {StatsProcessor}
     */
    self.statsProcessor = null;

    /**
     * Reference to the bubble chart object
     * @type {BubbleChart}
     */
    self.bubbleChart = null;

    /**
     * Reference to the detail table object
     * @type {DetailTable}
     */
    self.detailTable = null;

    /**
     * Reference to the services list object
     * @type {ServiceList}
     */
    self.serviceList = null;

    /**
     * Reference to the services list view object
     * @type {ServiceListView}
     */
    self.serviceListView = null;

    /**
     * Reference to the modal handler object
     * @type {ModalHandler}
     */
    self.modalHandler = options.modal_handler;

    self.$bubbleChartEl = options.bubble_chart_el;
    self.$detailTableEl = options.detail_table_el;

    $body.on('radioItemClick', function (evt){ self.showDetailPanelForChannel(evt.item); });
    $body.on('peakButtonClick', function (evt) { self.showPeakData(evt); });

    this._initStatsProcessor(options);
    this._initServices();
  };

  Dashboard.INITIAL_SERVICES_TO_DISPLAY = dashboardConfig.initialServices || [];

  /**
   * Initialize the stats processor, grab some initial data and feed the graph layout
   *
   * @param {DashboardOptions} options
   * @private
   */
  Dashboard.prototype._initStatsProcessor = function _initStatsProcessor(options){
    var self = this;

    self.statsProcessor = new StatsProcessor({
      filterServices: Dashboard.INITIAL_SERVICES_TO_DISPLAY,
      endpoint: options.stats_realtime_endpoint
    });

    self.statsProcessor.initialData().then(function () {
      self.initWithData(self.statsProcessor.latest());
    });

    $(self.statsProcessor).on("update", function () {
      self.update(self.statsProcessor.latest());
    });
  };

  /**
   * Initializes services handling.
   * It let the ability to the user to choose the displayed channels on both bubble and detail graph
   *
   * @private
   */
  Dashboard.prototype._initServices = function _initServices(){
    var self = this;

    // List of all available services
    self.serviceList = new ServiceList();

    // View to allow user to select which services they want
    self.serviceListView = new ServiceListView('#services-list ul');

    // Connect the list with the view
    self.displayAvailableServices(self.serviceList, self.serviceListView, Dashboard.INITIAL_SERVICES_TO_DISPLAY);

    $(self.serviceList).on('serviceStateChanged', function (evt) {
      self.updateServices(evt.service, evt.service.isSelected);
    });
  };

  /**
   * Initialize the dashboard with fresh data.
   * Past this point, all further inbound data may arrive from Websocket connection
   *
   * @param {Array.<Stats>} latest
   */
  Dashboard.prototype.initWithData = function initWithData(latest) {
    this.bubbleChart = new BubbleChart(this.$bubbleChartEl, latest);
    this.detailTable = new DetailTable(this.$detailTableEl, latest);
  };

  /**
   * Displays the available list of services to the user
   *
   * @param {ServiceList} serviceList
   * @param {ServiceListView} serviceListView
   * @param {array.<Service>} initialServiceList
   */
  Dashboard.prototype.displayAvailableServices = function displayAvailableServices(serviceList, serviceListView, initialServiceList) {
    $(serviceList).on("availableServices", function (event) {
      // jshint unused:vars
      var services = serviceList.services();

      // Update all Service object states to indicate whether
      // they are currently active or not
      var servicesWithSelectedFlag = services.map(function (service) {
        var isSelected = initialServiceList.indexOf(service.id) > -1;
        service.isSelected = isSelected;
        return service;
      });

      serviceListView.render(servicesWithSelectedFlag);
    });
  };

  /**
   * Updates the dashboard with new data.
   * Everything is automatically redrawn on screen.
   *
   * @api
   * @param {array} latest
   */
  Dashboard.prototype.update = function update(latest) {
    this.bubbleChart.update(latest);
    this.detailTable.update(latest);

    if (this.modalHandler.isVisible( $('#stats') )){
      var serviceId  = this.barChart.getCurrentServiceId(),
          lastUpdate = this.statsProcessor.lastUpdateReceivedForService(serviceId);

      this.barChart.appendGraphData(lastUpdate);
      this.barChart.updateGraph();
    }
  };

  /**
   * Shorthand to alter the displayed services on screen
   *
   * @api
   * @param {string} service
   * @param {boolean} isSelected
   */
  Dashboard.prototype.updateServices = function updateServices(service) {
    if (service.isSelected) {
      this.statsProcessor.addService(service.id);
    } else {
      this.statsProcessor.removeService(service.id);
    }
  };

  /**
   * Once a bubble or channel detail row is clicked, we display a detailed view with an historical view
   *
   * @api
   * @param {Stats} item
   */
  Dashboard.prototype.showDetailPanelForChannel = function showDetailPanelForChannel(item) {
    var self = this;

    //jshint devel:true
    console.log('showDetailPanelForChannel', item);

    if (!this.barChart) {
      this.barChart = new BarChart();
      this.barChart.setup({
        mediums: Object.keys(item.audience.platforms),
        programme_uri: dashboardConfig.programmeUri,
        programme_picture_uri: dashboardConfig.programmePictureUri
      });
    }

    this.barChart.updateHeadline(item);
    this.modalHandler.load( $('#stats') );

    this.statsProcessor.historicalByService(item.channel).then(function(response){
      var service_data = self.statsProcessor.parseUpdates(response.stations)[ item.channel ];
      self.barChart.update(service_data);
      self.barChart.updateGraph();

      setTimeout(function(){
        self.modalHandler.loaded( $('#stats') );
      }, 1000 );
    });
  };

  /**
   * Shorthand to display the detailed++ chart.
   * Suppose you already have displayed the channel detailed view.
   *
   * @todo move that in the barchart as it's a bit unrelated to the dashboard (legacy code related)
   * @param {MouseEvent=} event
   */
  Dashboard.prototype.showPeakData = function showPeakData(event) {
    // jshint unused:vars
    this.barChart.showFluxChart();
  };

  /*
   Exporting
   */
  window['Dashboard'] = Dashboard;

}(window, jQuery));
