ZoneOspreySearch module for Silver
==================================

Add on module to search [Osprey](http://www.ospreypublishing.com/) from Silver. To use install the xml2js module using npm:

    npm install xml2js

Then add the path to the module to the searchProviders entry in your config.js file and add a configuration section like this:

    ZoneOspreySearch: {
	limit: 25,
    },
