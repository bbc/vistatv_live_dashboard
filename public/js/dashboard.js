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
     * Reference to the URL manager object
     * @type {URLManager}
     */
    self.urlManager = null;

    /**
     * Reference to the modal handler object
     * @type {ModalHandler}
     */
    self.modalHandler = options.modal_handler;

    self.$bubbleChartEl = options.bubble_chart_el;
    self.$detailTableEl = options.detail_table_el;

    $body.on('radioItemClick', function (evt){ self.showDetailPanelForChannel(evt.item); });
    $body.on('peakButtonClick', function (evt) { self.showPeakData(evt); });

    var initialServicesToDisplay = Dashboard.INITIAL_SERVICES_TO_DISPLAY;
    
    // If URL contains a service list then use that for initial services
    self.urlManager = new UrlManager({ key: 'services', delim: ',' });
    if (self.urlManager.hasItems()) {
      initialServicesToDisplay = self.urlManager.items();
    }

    options.initialServicesToDisplay = initialServicesToDisplay;

    this._initServices(initialServicesToDisplay);
    this._initStatsProcessor(options);
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
      filterServices: options.initialServicesToDisplay,
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
   * @param {Array.<string>} initialServicesToDisplay Service ids to be displayed 
   */
  Dashboard.prototype._initServices = function _initServices(initialServicesToDisplay){
    var self = this;

    // List of all available services
    self.serviceList = new ServiceList(initialServicesToDisplay);

    // View to allow user to select which services they want
    self.serviceListView = new ServiceListView('#services-list ul');

    // Connect the list with the view
    self.serviceList.services().then(function (services) {
      self.serviceListView.render(services);
      self.updateBookmark();
    });

    $(self.serviceList).on('serviceStateChanged', function (evt) {
      self.updateService(evt.service, evt.service.isSelected);
      self.updateBookmark();
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
   * @param {Service} service
   */
  Dashboard.prototype.updateService = function updateService(service) {
    if (service.isSelected) {
      this.statsProcessor.addService(service.id);
    } else {
      this.statsProcessor.removeService(service.id);
    }
  };

  /**
   * Update bookmarkable link to the current services
   *
   * @api
   */
  Dashboard.prototype.updateBookmark = function updateBookmark() {
    this.serviceList.selectedServices().then(function (services) {
      var ids = services.map(function (s) { return s.id; }).join(','),
          url = '?services=' + ids;
      $('.bookmark').attr('href', url);
    });
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
