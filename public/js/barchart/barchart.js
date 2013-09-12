(function (window) {
  "use strict";
  /* globals $, d3, Rickshaw, jQuery, Stats */

  var SetupOptions;

  /**
   * Available options to setup a BarChart object.
   *
   * @typedef {{mediums: Array}}
   */
  SetupOptions = {
    mediums: [],
    programme_uri: "",
    programme_picture_uri: ""
  };

  /**
   * Service audience timeline constructor.
   *
   * By default it displays the latest 60 minutes of audience for a given service,
   * then updates every minutes or so (depending on the refresh interval of the Websocket broadcaster).
   *
   * @constructor
   */
  function BarChart () {

    /**
     * Maximum amount of Stats data to display in the timeline at the same time.
     * This is used to preserve a timeline scale consistency.
     *
     * @type {number} Number of Stats item to display at
     */
    this.limit = 60;

    /**
     * Represents the timescale aggregation for peaks display.
     * When clicking on a peak, it will display this amount of Stats objects aggregation.
     *
     * @type {number} Number of Stats item to aggregate on
     */
    this.peaksInterval = 5;

    /**
     * Holds the graph instance close to its heart
     *
     * @type {Rickshaw.Graph}
     * @private
     */
    this._chart = null;

    /**
     * Timeline annotator, to visualize programmes debuts
     *
     * @type {Rickshaw.Graph.Annotate}
     * @private
     */
    this._chart_annotator = null;

    /**
     * Timeline holding the peaks display
     *
     * @type {Rickshaw.Graph.Annotate}
     * @private
     */
    this._chart_peaks = null;

    /**
     * Actual graph data used for rendering
     *
     * @type {Array.<Stats>}
     * @private
     */
    this._data = [];

    /**
     * "on air" broadcast data
     * Usually used for the modal header
     *
     * @type {Stats}
     * @private
     */
    this._item = null;

    /**
     * Local cache of stats mediums used for stacking charts and legend
     * It is computed once, on `setup`.
     *
     * @type {Array.<String>}
     * @private
     */
    this._mediums = [];

    /**
     * URL of an image to be used when programme doesn't have one
     * It is fetched from the DOM on `setup`.
     *
     * @type {<String>}
     * @private
     */
    this._programmeImagePlaceholder = '';
  }

  /**
   * Initial Barchart setup.
   * It is performed once to save resources and fasten the time to display.
   *
   * @api
   * @param {SetupOptions} options
   */
  BarChart.prototype.setup = function setup(options) {
    var palette = new Rickshaw.Color.Palette({ scheme: d3.scale.category10().range() });

    this._options = options;
    this._mediums = Array.isArray(options.mediums) ? options.mediums : SetupOptions.mediums;

    this._chart = new Rickshaw.Graph({
      element: document.getElementById('stats-chart'),
      width: 980,
      height: 300,
      renderer: 'area',
      stroke: true,
      series: this._mediums.map(function (name) {
        var color = d3.rgb(palette.color());

        return {
          "name": Stats.humanize(name),
          "color": "rgba(" + color.r + ", " + color.g + ", " + color.b + ", .35)",
          "stroke": "rgba(0, 0, 0, .15)",
          "data": [
            {x: 0, y: 0}
          ]
        };
      })
    });

    // Axis
    var timeFixture = new Rickshaw.Fixtures.Time();
    // Override the formatter to return time in browser timezone
    // See: - https://github.com/shutterstock/rickshaw/issues/140
    //      - https://github.com/shutterstock/rickshaw/blob/master/src/js/Rickshaw.Fixtures.Time.js#L67
    timeFixture.formatTime = function(d) {
      return d.toString().match(/(\d+:\d+):/)[1];
    };

    new Rickshaw.Graph.Axis.Time({
      graph: this._chart,
      timeUnit: timeFixture.unit('15 minute')
    });

    new Rickshaw.Graph.Axis.Y({
      element: document.getElementById('stats-y-axis'),
      graph: this._chart,
      orientation: 'left',
      tickFormat: " "
      //tickFormat: Rickshaw.Fixtures.Number.formatKMBT
    });

    // Show data point on hover
//    var hoverDetail = new Rickshaw.Graph.HoverDetail( {
//      graph: this._chart,
//      yFormatter: function(x) { return x; }
//    });

    // Annotators
    this._chart_peaks = new Rickshaw.Graph.PeaksAnnotate({
      graph: this._chart,
      element: document.getElementById('stats-peaks')
    });

    this._chart_annotator = new Rickshaw.Graph.Annotate({
      graph: this._chart,
      element: document.getElementById('stats-timeline')
    });

    // Interactive legends
    var legend = new Rickshaw.Graph.Legend({
      graph: this._chart,
      element: document.getElementById('legend')
    });

    new Rickshaw.Graph.Behavior.Series.Highlight({
      graph: this._chart,
      legend: legend
    });

    // Initial programme image placeholder
    this._programmeImagePlaceholder = $('#stats-show-image').attr('src');

    this._setupEvents();
  };

  /**
   * Setup charts interactions
   * - enables to go back from the flux chart to the barchart
   * - peaks interactions (/w event delegation)
   *
   * @private
   */
  BarChart.prototype._setupEvents = function _setupEvents () {
    $('#flux-back-button').on('click', $.proxy(this.handlePeakChartClose, this));
    $(document).on('click', 'div.annotation-peak[data-time]', $.proxy(this.handlePeakEvent, this));
  };

  /**
   * Updates the data used for visual processing.
   * It does not refresh the interface, though.
   *
   * @api public
   * @throws TypeError if input argument is not useable to draw the graph
   * @param {Stats|Array.<Stats>} data
   */
  BarChart.prototype.update = function update (data) {
    if (data instanceof Stats){
      this._data = [data];
    }
    else if (Array.isArray(data) && data[0] instanceof Stats){
      this._data = data;
    }
    else{
      throw new TypeError("Expecting an array of Stats item to display.");
    }

    this._item = this._data[ this._data.length-1 ];
  };

  /**
   * Draw or redraw the timeline chart.
   * It will use data previously stored with the `update()` method.
   *
   * @api
   */
  BarChart.prototype.updateGraph = function updateGraph(){
    var self = this;

    if (!self._item || !self._item.channel){
      throw new Error('self.update() should have been run prior with a Stats object.');
    }

    this.updateHeadline(this._item);

    this.pruneChartAnnotations();
    this.pruneChartSeries();

    this.updateChartSeries();
    this.updateChartPeaksAnnotation({interval: this.peaksInterval * 60});
    this.updateChartProgrammesAnnotation();

    // Rickshaw graph now has enough information to nicely present us a beautiful graph!
    this._chart.render();
  };

  /**
   * Works like `update()`.
   * Instead of replacing the whole dataset, it appends them in the storage.
   * Data are sliced according to the `limit` property.
   *
   * This is the ideal method to call when subscribing to realtime updates.
   * Like `update()`, only the data are refreshed, not the UI.
   *
   * @api
   * @param {Array.<Stats>} service_data
   */
  BarChart.prototype.appendGraphData = function appendGraphData(service_data){
    if (Array.isArray(service_data) && service_data[0] instanceof Stats){
      this.update(this._data.concat(service_data).slice(-1 * this.limit));
    }
  };

  /**
   * Prunes the Graph series data
   *
   * @api
   */
  BarChart.prototype.pruneChartSeries = function pruneChartSeries(){
    this._chart.series.forEach(function(series){
      series.data = [];
    });
  };

  /**
   * Updates the Graph Series UI
   *
   * Uses the data previously stored with `update()`.
   *
   * @api
   */
  BarChart.prototype.updateChartSeries = function updateChartSeries(){
    var self = this;
    var series_index = {};

    // quickly stores the numeric index for each medium name
    self._chart.series.forEach(function(series, index){
      series_index[series.name] = index;
    });

    this._data.forEach(function(d){
      d.datetime = Date.parse(d.timestamp);
      // Stacking data series
      self._mediums.forEach(function(medium){
        self._chart.series[ series_index[Stats.humanize(medium)] ].data.push({
          x: d.datetime / 1000,
          y: d.audience.platforms[medium]
        });
      });
    });
  };

  /**
   * Updates the Graph Peaks annotations UI
   *
   * Uses the data previously stored with `update()`.
   *
   * @param {{interval:Number}} options
   */
  BarChart.prototype.updateChartPeaksAnnotation = function updateChartPeaksAnnotation(options){
    var self = this;
    var latest_peak = 0;

    options = options || {};
    options.interval = options.interval || 5 * 60;    // 5 minutes by default

    this._data.forEach(function(d){
      var elected_medium, highest_value = 0;
      var current_time = d.datetime / 1000;

      // Skip if the interval is not respected
      if (current_time - latest_peak < options.interval){
        return;
      }

      //determine which is the most important value
      self._mediums.forEach(function(medium){
        if (d[medium] > highest_value){
          elected_medium = medium;
          highest_value = d[medium];
        }
      });

      self._chart_peaks.add(current_time, d.audience.total, {
        classes: [d.audience.change < 0 ? 'negative' : 'positive']
      });

      latest_peak = current_time;
    });
  };

  /**
   * Clears existing annotations from a time series
   *
   * Concerns Timeline Chart
   *
   * @todo PR something that can remove by time (or all)
   * @todo delete only annotation, and the corresponding Line in a loop
   */
  BarChart.prototype.pruneChartAnnotations = function pruneChartAnnotations(){
    [this._chart_annotator, this._chart_peaks].map(function(annotator){
      annotator.data = {};

      return annotator;
    });

    $('#stats-peaks .annotation, #stats-timeline .annotation, #stats-chart .annotation-line').remove();
  };

  /**
   * Updates the Graph Programmes annotations UI
   *
   * Uses the data previously stored with `update()`.
   *
   * @api
   */
  BarChart.prototype.updateChartProgrammesAnnotation = function updateChartProgrammesAnnotation(){
    var self = this;
    var programmes = {};

    this._data.forEach(function(d){
      var programme = d.getProgramme();

      if (!programmes[ programme.id ] && programme.startDate){
        programmes[ programme.id ] = [
          programme.startDate.valueOf() / 1000,
          "“"+ programme.title +"” programme starts."
        ];
      }
    });

    Object.keys(programmes).forEach(function(id){
      self._chart_annotator.add.apply(self._chart_annotator, programmes[id]);
    });
  };

  /**
   * Formats properly a timestamp-ish for human reading purpose
   *
   * @param {string} date A parseable `Date` text
   * @returns {string} Time formatted string
   */
  function getShowTime (date) {
    if ( isNaN(Date.parse(date)) ) { return ''; }

    var startDate = new Date(Date.parse(date));

    var startDateHours = startDate.getHours();
    var startDateMinutes = startDate.getMinutes();
    var startMins = startDateMinutes < 10 ? '0' + startDateMinutes.toString() : startDateMinutes;
    return startDateHours + ':' + startMins;
  }

  /**
   * Prepage to trigger an app-wide peakButton behavior
   */
  BarChart.prototype.handlePeakEvent = function handlePeakEvent (evt) {
    var event = jQuery.Event("peakButtonClick");
    var time = parseInt(evt.target.getAttribute('data-time'), 10);
    var index = 0;

    this._data.some(function(d, i){
      if (d.datetime / 1000 === time){
        index = i;
        return true;
      }
    });

    var data = aggregateStatsData(this._data.slice(index, index + 5));

    this.clearFluxData();
    var html = "";

    data.tracks.forEach(function(track){
      html = html + "<b>" + track.title + "</b> by " + track.artist + "<br />";
    });

    $('#flux-track .flux-track-group').html(html);
    updateBuzz(data.social.twitter);

    [{key: 'to', label: 'to', suffix: 'leaving'}, {key: 'from', label: 'from', suffix: 'joining'}].forEach(function(d){
      var flux = data.flux[ d.key ];
      var html = [];

      Object.keys(flux).forEach(function(service_id){
        html.push('<li>'+
        //  '<span class="value">'+ Rickshaw.Fixtures.Number.formatKMBT(flux[service_id]) +'</span> '+
          d.label +
          ' '+ Stats.humanize(service_id) +
        '</li>');
      });

      if (!html.length){
        html.push('<li>No Data found</li>');
      }

      $('#flux-'+d.suffix+' .flux-items').html(html.join(''));
    });

    this.updateHeadline(data);
    $("#flux-time").html(getShowTime(data.timestamp));

    $("body").trigger(event);
  };

  /**
   * What to do when the peak data are displayed
   */
  BarChart.prototype.handlePeakChartClose = function handlePeakChartClose () {
    this.updateHeadline(this._item);

    this.hideFluxChart();
  };

  BarChart.prototype.showFluxChart = function showFluxChart () {
    $('#flux-chart').css('visibility', 'visible');
  };

  BarChart.prototype.hideFluxChart = function hideFluxChart () {
    $('#flux-chart').css('visibility', 'hidden');
  };

  BarChart.prototype.clearFluxData = function clearFluxData () {
    $('#flux-track .flux-track-group').html('');
    $('#flux-track .flux-track-title').html('');
    $('#flux-time').html('');
  };

  /**
   * Display the social count
   *
   * @param {Number} count
   */
  function updateBuzz (count) {
    $('#flux-social-activity .social-tweet-number').html('No Data Found');
    $('#flux-social-activity .social-info').html('');

    if (count) {
      $('#flux-social-activity .social-tweet-number').html(count.toString());
      $('#flux-social-activity .social-info').html(count === 1 ? 'tweet' : 'tweets');
    }
  }

  /**
   * Aggregates several results in one.
   *
   * The deep copy will perform on the base and structure of the first Stats item of the `data` argument if no
   * `aggregate` argument is provided.
   *
   * @param {Array.<Stats>} data Series of Stats elements we want to compact in one Stats object
   * @param {Object=} aggregate Structure in which we aggregates the `data`
   * @returns <Stats> Compacted Stats object
   */
  function aggregateStatsData(data, aggregate){
    // first init? copy the structure of the object to aggregate
    if(arguments.length === 1){
      aggregate = data.shift();
    }

    data.forEach(function(item){
      Object.keys(item).forEach(function(key){
        var value = data[key];

        if (Array.isArray(value)){
          aggregate[key] = aggregate[key].concat(value);
        }
        else if (typeof value === 'number'){
          aggregate[key] += value;
        }
        else if ($.isPlainObject(value)){
          aggregate[key] = aggregateStatsData(value, aggregate[key]);
        }
      });
    });

    return aggregate;
  }

  /**
   * Updates the Modal's UI Header with programme informations.
   *
   * @api
   * @param {Stats} item
   */
  BarChart.prototype.updateHeadline = function updateHeadline(item) {
    var programme = item.getProgramme(),
        programmeImageUrl;

    if (programme.id) {

      $("#stats-show-title")
        .attr('href', this._options.programme_uri.replace(/{{id}}/g, programme.id))
        .text(item.channel_name+": "+programme.title);

      programmeImageUrl = this._options.programme_picture_uri.replace(/{{id}}/g, programme.id);

      if (programme.image) {
        programmeImageUrl = programme.image;
      }

      $("#stats-show-image").attr('src', programmeImageUrl);
      $("#stats-show-time").text(getShowTime(programme.start) + " - " + getShowTime(programme.end));
    }
    else {
      $("#stats-show-title").html(item.channel_name);
      $("#flux-show-title, #stats-show-time").html('');
      $("#stats-show-image").attr('src', this._programmeImagePlaceholder);
    }

    var $trend_icon = $("#stats-figures-trend");
    $trend_icon.attr('src', $trend_icon.attr('data-'+(item.audience.change > 0 ? 'up' : 'down')));
    //$("#stats-viewing-figures").text(item.audience.total);
    //$("#stats-viewing-change").text(item.getSignedAudienceChange());
  };

  /**
   * Return service id that bar chart is displaying data for
   *
   * @api
   * @param {string} service id
   */
  BarChart.prototype.getCurrentServiceId = function getCurrentServiceId() {
    var item = this._item || {};
    return item.channel;
  };

  window.BarChart = BarChart;

}(window));
