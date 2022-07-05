//
// HDX Query String parameter parsing
//
// Author: Jim Teresco, December 2020
//

// this object will be populated with properties that are the QS
// parameter names and values of those properties will be the QS
// parameter values
//
// the QS parameter load=NY-region-collapsed.tmg would result in
//
// HDXQS.load = "NY-region-collapsed.tmg"
//
// being one of its properties
var hdxQS = new Object();

// populate the object - this should be called on page load
function HDXInitQS() {
    
    // get the part of the URL that would contain QS parameters
    var qs = location.search.substring(1);

    // split into the QS parameters
    var qsitems = qs.split('&');

    // for each one, get the parameter and value and add
    // properties to the object
    for (let i = 0; i < qsitems.length; i++) {
        var qsitem = qsitems[i].split('=');
	if (qsitem.length > 1) {
	    hdxQS[qsitem[0]] = qsitem[1];
	}
	else {
	    hdxQS[qsitem[0]] = "";
	}
    }
}

// check if a given QS was provided
function HDXQSIsSpecified(param) {

    return hdxQS.hasOwnProperty(param);
}

// get the value associated with a given QS param
function HDXQSValue(param) {

    return hdxQS[param];
}
