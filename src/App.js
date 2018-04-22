import React, { Component } from 'react';
// Map data
import arteries from './sfmaps/arteries.json';
import freeways from './sfmaps/freeways.json';
import neighborhoods from './sfmaps/neighborhoods.json';
import streets from './sfmaps/streets.json';
import falcon from './falcon.png';
// Map component
import TransportMap from './TransportMap';

class App extends Component {

  render() {

    return (
      <TransportMap 
        agency='sf-muni' 
        fetchInterval={15000} 
        vehicleIcon={falcon}
        mapData={{ arteries, freeways, neighborhoods, streets }}
      />
    );

  }

}

export default App;
