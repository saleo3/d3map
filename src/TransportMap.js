import React, { Component } from 'react';
import PropTypes from 'prop-types'; 
import * as d3 from 'd3';
import { geoPath as geo } from "d3-geo";
import { geoPatterson } from "d3-geo-projection";

class TransportMap extends Component {

  constructor(props) {
    super(props);

    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      routes: [],
      buses: [],
      routeTag: ''
    };

}

  componentDidMount() {

    this._getRoutes();
    this._drawMap();
    this.busesByRoute();

    setInterval(() => {

      this.busesByRoute(this.state.routeTag);
      
    }, this.props.fetchInterval);
  

  }

  async _getRoutes() {

    const data = await this._fetcher(`http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=${this.props.agency}`);
    this.setState( _ => ({ routes: data.route }) );

  }

  _getSVG() {

    return d3.select(this.svg);

  }

  _getProjection() {

    const projection = geoPatterson()
      .scale(1)
      .translate([0,0])
      .precision(0);

    const { innerWidth: width, innerHeight: height } = window;
    const path = geo().projection(projection);
    const bounds = path.bounds(this.props.mapData.streets);
    const [ xScale, yScale ] = [width / Math.abs(bounds[1][0] - bounds[0][0]), height / Math.abs(bounds[1][1] - bounds[0][1])];
    const scale = xScale < yScale ? xScale : yScale;
    const transl = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
    projection.scale(scale).translate(transl);

    return { path, projection };

  }

  _drawMap() {

    const map = this._getSVG();
    const { path } = this._getProjection();
    const drawFeature = this.setMap(map, path);
    const { neighborhoods, arteries, streets, freeways } = this.props.mapData;

    drawFeature(neighborhoods, 'neighborhoods', '#babaf1', '#eee');
    drawFeature(arteries, 'arteries', 'none', 'black');
    drawFeature(streets, 'streets', 'none', '#f79e9e96');
    drawFeature(freeways, 'freeways', 'none', 'yellow');

  }

  setMap(map, d) {

    return (data, cls, fill, stroke) => {

      map
        .append('g')
        .selectAll("path")
        .data(data.features)
        .enter()
        .append('path')
        .attr("class", cls)
        .attr("d", d)
        .style("fill", fill)
        .style("stroke", stroke);

    }

  }

  async busesByRoute(routeTag = '') {

    // Remove all vehicles before fetching new data
    const $buses = document.querySelectorAll('.buses');
    ($buses.length >= 1) && $buses[0].remove();
    this.setState( _ => ({ buses: [], }));

    // After fethicn new data, save it to state and draw the vehicles
    const data = await this._fetcher(`http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=${this.props.agency}&r=${routeTag}&t=15000`);
    this.setState( _ => ({ 
      buses: data.vehicle,
      routeTag
    }));

    this._drawBuses(data.vehicle);

  }

  async _fetcher(url) {

    const response = await fetch(url);
    return await response.json();

  }

  _drawBuses(vehicle) {

    const svg = this._getSVG();
    const { projection } = this._getProjection();
    const busesG = svg
      .append('g')
      .attr('class', 'buses');

    busesG
      .selectAll('.bus')
      .data(vehicle, d =>  d.id)
      .enter()
      .append('g')
      .attr('class', 'bus')
      .attr('transform', ({ lon, lat }) => `translate(${projection([lon, lat]).join(',')}) scale(1)` )
      .append("svg:image")
      .attr('width', 30)
      .attr('height', 30)
      .attr('xlink:href', this.props.vehicleIcon)

  }

  _showRoutes({ title, tag }) {

    return <option value={tag} key={tag}>{title}</option>;

  }


  render() {
    return <div>

      <select name="routes" onChange={ e => this.busesByRoute(e.target.value) }>
        <option value="">Select route</option>
        {this.state.routes.map(this._showRoutes)}
      </select>

      <svg
        ref={ elem => { this.svg = elem }}
        width={this.state.width}
        height={this.state.height}
      />

    </div>
  }
}

TransportMap.propTypes = {
  agency: PropTypes.string.isRequired, 
  fetchInterval: PropTypes.number,
  vehicleIcon: PropTypes.string.isRequired,
  mapData: PropTypes.object.isRequired
};

TransportMap.defaultProps = {
  agency: 'sf-muni', 
  fetchInterval: 15000
};

export default TransportMap;
