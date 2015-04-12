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
      dThis
        .attr('cx', xy[0])
        .attr('cy', xy[1]);
    });

    updateVehicles.exit().remove();
  }

  function getVehicles() {
    var url = 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&r=N&t=';
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
        .style('stroke', 'black')
        .datum(jsonResult)
        .attr('d', d3.geo.path().projection(
          projection
        ));
    });
  }

})();