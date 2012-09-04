/*
 * The MIT License
 * 
 * Copyright (c) 2012 MetaBroadcast
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
 * and associated documentation files (the "Software"), to deal in the Software without restriction, 
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, 
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software 
 * is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial 
 * portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 */
var http = require('http');
var util = require('util');
var xml2js = require('xml2js');
var SearchResult = require('../modules/SearchResult');

var ZoneOspreySearch = function(q, config, fn) {
	this.q = q;
	this.config = config;
	this.fn = fn; // callback function
};
  
ZoneOspreySearch.prototype.run = function() {
	var o = this;
	
	var options = {
		  host:'ospreydlf.zonedemos.com', 
		  port:80, 
		  path:'/OspreyDLF.asmx',
		  method: 'POST',
		  agent:false,
		  headers: {"Content-Type": "text/xml; charset=utf-8"}
    };
	  
	var parser = new xml2js.Parser();
	  
	var soapRequest = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
	     "<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
	     "<soap:Body>" +
	     "<DLFSearchProvider xmlns=\"http://www.ospreypublishing.com/dlf/\">" +
	     "<queryString>" + this.q + "</queryString>" +
	     "<pageSize>50</pageSize>" +
	     "</DLFSearchProvider>" +
	     "</soap:Body>" +
	     "</soap:Envelope>";
	  
	  var data = "";
	  
	  var req = http.request(options, function(res) {
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
		    data += chunk;
		  });
		  
		  res.on('end', function() {
			  parser.parseString(data, function (err, result) {
				  var parseFail = false;
				  var resultnum = 0;
			      if (result["soap:Body"] 
			        && result["soap:Body"]["DLFSearchProviderResponse"] 
			        && result["soap:Body"]["DLFSearchProviderResponse"]["DLFSearchProviderResult"] 
			        && result["soap:Body"]["DLFSearchProviderResponse"]["DLFSearchProviderResult"]["SearchResult"])  {
			    	  var searchResult = result["soap:Body"]["DLFSearchProviderResponse"]["DLFSearchProviderResult"]["SearchResult"];				      
				      var rawResults = [];
				      // if more than one item returned will be array
					  // otherwise it will be a single object
					  // ensure always an array
				      if (Array.isArray(searchResult)) {
				    	  rawResults = searchResult;
				      } else {
				    	  rawResults.push(searchResult);
				      }
			    	  for (var i in rawResults) {
				    	  if (rawResults[i].Identifiers) {
				    		  var result = new SearchResult();
							  result.addId("zone", rawResults[i].Identifiers.Identifiers.Key);
							  result.title = rawResults[i].Title;
							  result.thumbnail_url = rawResults[i].Url;
							  result.source = rawResults[i].Source;
							  result.type = rawResults[i].WorkTypeIdentifier;
							  o.fn(result, false);
				    	  } else {
				    	    parseFail = true;
				    	  }
				    	  resultnum++;
						  if (resultnum > o.config.limit) {
							 break;
						  }
				      }
			      } else {
			    	  parseFail = true;
			      }
			      
			      if (parseFail) {
					  util.error("zoneOsprey: Cannot understand response");
					  util.error(data);
					  util.error("=====");
				  }
			      
			      o.fn("zoneOsprey", true);
			  });
		  });
	  });
	  
	  req.on('error', function(e) {
		  util.error("zoneOsprey: An error occured");
		  util.error(e.message);
		  o.fn("zoneOsprey", true);
	  });
	  req.write(soapRequest + "\n");
	  req.end();
};
 
module.exports = ZoneOspreySearch;