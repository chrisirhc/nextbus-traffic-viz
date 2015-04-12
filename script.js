/* global d3: true */
/* jshint browser: true, unused: true, undef: true */
(function () { 'use strict';

  var svg = d3.select('#cv');

  var projection = d3.geo.mercator()
          .center([-122.43, 37.72]).scale(142000)
          .translate([500 / 2, 500 / 2]);

  getStreets();
  getVehicles();
  setInterval(getVehicles, 10000);

  var overlayCanvas = document.querySelector('#overlay');
  var overlayCtx = overlayCanvas.getContext('2d');

  function drawVehicles(vehicles) {
    var vehiclesG = svg.select('.vehicles');
    if (vehiclesG.empty()) {
      vehiclesG = svg.append('g').attr('class', 'vehicles');
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

      paint(beforeXy, xy, 10);
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
        };
      });

      drawVehicles(vehicles);
    });
  }

  function getStreets() {
    var url = 'streets.json';
    d3.json(url, function (error, jsonResult) {
      svg.append('path')
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
      overlayCtx.strokeStyle = 'blue';
      overlayCtx.moveTo(from[0], from[1]);
      overlayCtx.lineTo(to[0], to[1]);
      overlayCtx.stroke();
    }
  }

})();