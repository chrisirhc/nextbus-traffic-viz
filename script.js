/* global d3: true */
/* jshint browser: true, unused: true, undef: true */
(function () { 'use strict';

  var width = Math.max(500, window.innerWidth);
  var height = Math.max(500, window.innerHeight);

  var svg = d3.select('#cv')
    .attr('width', width)
    .attr('height', height)
    ;
  var outerG = svg.append('g');

  var projection = d3.geo.mercator()
          .center([-122.44, 37.755]).scale(202000)
          .translate([width / 2, height / 2]);

  var zoom = d3.behavior.zoom()
    .on('zoom', zoomed);

  svg.call(zoom);

  var speedScale = d3.scale.linear()
    .domain([0, 50])
    .range(['red', 'green']);

  getStreets();
  getVehicles();
  setInterval(getVehicles, 10000);

  var overlayCanvas = d3.select('#overlay')
    .attr('width', width)
    .attr('height', height)
    ;
  var overlayCtx = overlayCanvas[0][0].getContext('2d');

  function drawVehicles(vehicles) {
    var vehiclesG = outerG.select('.vehicles');
    if (vehiclesG.empty()) {
      vehiclesG = outerG.append('g').attr('class', 'vehicles');
    }

    var updateVehicles = vehiclesG.selectAll('.vehicle')
    .data(vehicles, function (v) {
      return v.id;
    });
    updateVehicles.enter().append('circle')
      .attr('class', 'vehicle')
      .attr('r', 2)
      ;

    updateVehicles.each(function (v) {
      var dThis = d3.select(this);
      var xy = projection([v.lon, v.lat]);

      var beforeXy = [dThis.attr('cx'), dThis.attr('cy')];

      dThis
        .attr('cx', xy[0])
        .attr('cy', xy[1]);

      paint(beforeXy, xy, v.speed);
    });

    updateVehicles.exit().remove();
  }

  function getVehicles() {
    var url = 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&t=';
    d3.xml(url + '0', function (xmlResult) {
      var xml = d3.select(xmlResult);
      var dVehicles = xml.selectAll('vehicle');
      var vehicles = dVehicles[0].map(function (d) {
        d = d3.select(d);
        return {
          id: d.attr('id'),
          lon: d.attr('lon'),
          lat: d.attr('lat'),
          speed: d.attr('speedKmHr'),
        };
      });

      drawVehicles(vehicles);
    });
  }

  function getStreets() {
    var url = 'streets.json';
    d3.json(url, function (error, jsonResult) {
      outerG.append('path')
        .style('stroke', 'rgba(0,0,0,0.1)')
        .datum(jsonResult)
        .attr('d', d3.geo.path().projection(
          projection
        ));
    });
  }

  function paint(from, to, speed) {
    if (from[0]) {
      overlayCtx.beginPath();
      overlayCtx.strokeStyle = speedScale(speed);
      overlayCtx.moveTo(from[0], from[1]);
      overlayCtx.lineTo(to[0], to[1]);
      overlayCtx.stroke();
    }
  }

  function zoomed() {
    var transformStr = 'translate(' + zoom.translate() + ')scale(' +
        zoom.scale() + ',' + zoom.scale() + ')';
    outerG.attr('transform', transformStr);

    var transformDecomp = d3.transform(transformStr);
    var translateStr = 'translate(' +
      transformDecomp.translate[0] + 'px, ' +
      transformDecomp.translate[1] + 'px)';
    var scaleStr = 'scale(' + transformDecomp.scale + ')';
    var cssTransformStr = translateStr + ' ' + scaleStr;

    overlayCanvas
      .style('transform', cssTransformStr)
      .style('transform-origin', '0 0')
      ;
  }

})();