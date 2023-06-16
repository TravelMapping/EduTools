//
// HDX Query String parameter parsing
//
// Author: Jim Teresco, December 2020
// Augmented with QS list functionality May 2023
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
const hdxQS = new Object();

// populate the object - this should be called on page load
function HDXInitQS() {
    
    // get the part of the URL that would contain QS parameters
    const qs = location.search.substring(1);

    // split into the QS parameters
    const qsitems = qs.split('&');

    // for each one, get the parameter and value and add
    // properties to the object
    for (let i = 0; i < qsitems.length; i++) {
        const qsitem = qsitems[i].split('=');
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

/*
   Functions below are related to parsing, tracking, and returning
   information about QS parameters for the AV parameters of a given
   AV.  In each AV's setupUI function, if it has AV parameters, they
   should be settable through QS parameters.

   The setupUI function should first call 

   HDXQSClear(this);
   
   then one of the HDXQSRegisterAndSet* functions below for each
   supported QS parameters.  The function to call depends on the type
   of information that can be specified.

   HDXQSRegisterAndSetSelectList: QS parameter sets the starting value
   from among the options in an HTML select, whose id is specified by
   the selectid parameter.

   HDXQSRegisterAndSetSelectNumber: QS parameter sets the starting
   value to a number in the given range, whose id is specified by the
   inputid parameter.

   HDXQSRegisterAndSetSelectCheckbox: QS parameter sets the starting
   value to true or false for a checkbox, whose id is specified by the
   inputid parameter.

*/

// clear/create the list of registered QS parameters for the given AV
function HDXQSClear(av) {

    av.QSList = [];
}

// check for QSList/create if needed with a warning message
function HDXQSCheck(av) {

    if (!av.hasOwnProperty("QSList")) {
        av.QSList = [];
        alert("Internal warning: AV " + av.value +
              " should call HDXQSClear before parsing QS parameters!");
    }
}

// function to check for and register a QS parameter intended to match
// a select object (drop-down option menu)
// the predicate is a callback function to the AV to determine if the
// given QS parameter should be included in URLs for the specific AV
// parameters chosen at the time the URL is generated
function HDXQSRegisterAndSetSelectList(av, field, selectid, predicate = null) {

    HDXQSCheck(av);
    av.QSList.push(
        {
            field: field,
            domid: selectid,
            type: "select",
            pred: predicate
        }
    );
    const elt = document.getElementById(selectid);
    if (elt == null) {
        alert("Internal warning: AV " + av.value + " QS parameter " + field +
             " using undefined DOM element id " + selectid + ", ignoring.");
        return;
    }
    if (HDXQSIsSpecified(field)) {
        const qsval = HDXQSValue(field);

        // loop over entries, return as soon as we have a successful match
        for (let i = 0; i < elt.length; i++) {
            if (elt.options[i].value == qsval) {
                elt.value = qsval;
                // in case we have an onchange listener, make sure it gets
                // triggered
                elt.dispatchEvent(new Event('change'));
                return;
            }
        }

        // no match
        console.error("Value " + qsval + " for QS parameter " + field +
                      " is not valid.");
    }
}

// function to check for and register a QS parameter intended to
// contain a number in the given range
// the predicate is a callback function to the AV to determine if the
// given QS parameter should be included in URLs for the specific AV
// parameters chosen at the time the URL is generated
function HDXQSRegisterAndSetNumber(av, field, inputid, minval, maxval,
                                   predicate = null) {

    HDXQSCheck(av);
    av.QSList.push(
        {
            field: field,
            domid: inputid,
            type: "number",
            min: minval,
            max: maxval,
            pred: predicate
        }
    );
    const elt = document.getElementById(inputid);
    if (elt == null) {
        alert("Internal warning: AV " + av.value + " QS parameter " + field +
             " using undefined DOM element id " + inputid + ", ignoring.");
        return;
    }
    if (HDXQSIsSpecified(field)) {
        const qsval = HDXQSValue(field);
        if (!isNaN(qsval)) {
            const numval = parseFloat(qsval);
            if (numval >= minval && numval <= maxval) {
                elt.value = numval;
                // in case we have an onchange listener, make sure it gets
                // triggered
                elt.dispatchEvent(new Event('change'));
                return;
            }
        }
        // if we get here, it was invalid
        console.error("Value " + qsval + " for QS parameter " + field +
                      " is not valid.");
    }
}

// function to check for and registe a QS parameter intended to
// contain a true/false value
// the predicate is a callback function to the AV to determine if the
// given QS parameter should be included in URLs for the specific AV
// parameters chosen at the time the URL is generated
function HDXQSRegisterAndSetCheckbox(av, field, inputid, predicate = null) {

    HDXQSCheck(av);
    av.QSList.push(
        {
            field: field,
            domid: inputid,
            type: "checkbox",
            pred: predicate
        }
    );
    const elt = document.getElementById(inputid);
    if (elt == null) {
        alert("Internal warning: AV " + av.value + " QS parameter " + field +
             " using undefined DOM element id " + inputid + ", ignoring.");
        return;
    }
    if (HDXQSIsSpecified(field)) {
        const qsval = HDXQSValue(field);
        if (qsval == "true" || qsval == "false") {
            elt.checked = (qsval == "true");
            // in case we have an onchange listener, make sure it gets
            // triggered
            elt.dispatchEvent(new Event('change'));
            return;
        }
        // if we get here, it was invalid
        console.error("Value " + qsval + " for QS parameter " + field +
                      " is not valid.");
    }
}

// generate the QS parameter string to be included in an AV-specific URL with
// the current values of all AV parameters
function HDXQSAVParams(av) {

    let r = "";
    if (av.hasOwnProperty("QSList")) {
        for (e of av.QSList) {
            // check if there is a predicate to determine inclusion conditions
            // and if so, call it, include this one only if true
            if (e.pred == null || e.pred(av)) {
                r += "&" + e.field + "=";
                if (e.type == "checkbox") {
                    r += document.getElementById(e.domid).checked;
                }
                else {
                    r += document.getElementById(e.domid).value;
                }
            }
        }
    }
    return r;
}
