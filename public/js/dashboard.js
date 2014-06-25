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

    self._initServices(initialServicesToDisplay)
        .then(function () {
          self._initStatsProcessor(options);
        });
    
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

    // Get the Stats objects for the view and augment 
    // then with programme data from an external API
    // This is asyncronous and when all the data has
    // been augmented, run initWithData
    self.statsProcessor
        .initialData()
        .then(function () {
          return self._latestStatsObjectsWithProgrammeInfo();
        })
        .then(function (latest) {
          self.initWithData(latest);
        });

    $(self.statsProcessor).on("update", function () {
      self._latestStatsObjectsWithProgrammeInfo().
          then(
            function (latest) {
              self.update(latest);
            }
          );
    });
  };

  /**
   * Fetches all the latest Stats objects and augments them
   * with programme info. 
   * 
   * Returns a Promise that resolves with the array of 
   * augmented latest Stats objects
   *
   * @private
   */
  Dashboard.prototype._latestStatsObjectsWithProgrammeInfo = function latestStatsObjectsWithProgrammeInfo() {
    var self     = this,
        deferred = $.Deferred(),
        latest = self.statsProcessor.latest(),
        promises;

    // For each Stats object in the latest array,
    // run the method that augments with remote programme data
    promises = latest.map(self._augmentStatsWithProgrammeData);
    
    // When all the Stats objects in the `latest` 
    // array augmented, we resolve the promise 
    // and pass the latest array through
    $.when.apply(null, promises)
     .then(
      function () {
        deferred.resolve(latest);
      });

    // return the promise so the caller
    // can listen using `then` for the
    // stats objects to be augmented
    return deferred.promise();
  };

  /**
   * Augments a Stats with programme data from an external API.
   * Note: The Stats object is modified directly so any references
   *       to it will gain the programme data
   *
   * @private
   * @param {<Stats>} stats Stats object to be augmented
   * @returns {<jQuery.Deferred>} A promise that resolves when the
                                  Stat object has been augmented.
   */
  Dashboard.prototype._augmentStatsWithProgrammeData = function _augmentStatsWithProgrammeData(stats){
    var deferred = $.Deferred();
    var self = this;
    var now = new Date();    
    var time_now = now.toISOString();
    var channel = stats.channel_name;

    var url =  "http://dev.notu.be/2014/05/on_tv/?start_time="+time_now+"&service_key="+channel;

    var jqxhr =  $.getJSON(url)
                  .done(function(data) {
                    if(data["response"]["docs"][0]){
                      var prog = {
                        id: data["response"]["docs"][0]["pid"],
                        title: data["response"]["docs"][0]["title"],
                        subtitle: data["response"]["docs"][0]["title"],
                        service_id: data["response"]["docs"][0]["service_key"],
                        start: data["response"]["docs"][0]["start_time"],
                        end: data["response"]["docs"][0]["end_time"],
                        image: data["response"]["docs"][0]["image_url"]
                      };
                      stats.programme = prog;
                      deferred.resolve(stats);
                    }
                  });    

    return deferred.promise();
  };

  /**
   * Initializes services handling.
   * It let the ability to the user to choose the displayed channels on both bubble and detail graph
   *
   * @private
   * @param {Array.<string>} initialServicesToDisplay Service ids to be displayed 
   */
  Dashboard.prototype._initServices = function _initServices(initialServicesToDisplay){
    var self = this,
        deferred = $.Deferred();

    // List of all available services
    self.serviceList = new ServiceList(initialServicesToDisplay);

    // View to allow user to select which services they want
    self.serviceListView = new ServiceListView('#services-list ul');

    // Connect the list with the view
    self.serviceList
        .services()
        .then(function (services) {
          self.serviceListView.render(services);
          self.updateBookmark();

          // Link to the Stats class so that Stats objects 
          // can be linked to their parent services
          Stats.serviceList = self.serviceList;

          // All done, notify anything waiting for 
          // our promise to resolve
          deferred.resolve();
        });

    $(self.serviceList).on('serviceStateChanged', function (evt) {
      self.updateService(evt.service, evt.service.isSelected);
      self.updateBookmark();
    });

    return deferred.promise();
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
      
      // Swap the last data item form the server with
      // that one passed in as it will have programme
      // data
      //sometimess there's no historical data, this helps
      if(!service_data){
        console.log("No service data yet for "+item.channel+" continuing anyway");
      }else{
        service_data[service_data.length - 1] = item;
        self.barChart.update(service_data);
        self.barChart.updateGraph();
      }

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
