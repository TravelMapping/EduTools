//
// HDX Graph search box functionality
//
// METAL Project
//
// Primary Author: Michael Dagostino
// Additional Author: Bailey Cross
// Maintenance edits: Jim Teresco

/***********************************************************************/
/* Code formerly in basic-sch.js mainly, Michael Dagostino Summer 2018 */
/* Mainly involved in managing the search box to load graphs by typing */
/* a word contained in the graph's name/description.                   */
/***********************************************************************/

// we will fill these two lists
var HDXGraphDescriptions = ['Choose A Graph'];
var HDXGraphs = {};

function HDXGraphSearchCleanup() {
    HDXGraphDescriptions = ['Choose A Graph'];
    var HDXGraphs = {};
}
// initialization code for HDX Graph search box
function HDXGraphSearchInit() {

    // first ajax request to get all of the values for the descriptions
    var xmlhttp = new XMLHttpRequest();
    var descr;
    var i =0;
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            descr = Array.from(JSON.parse(this.responseText));
            for (i=0; i < descr.length; i++) {
                HDXGraphDescriptions.push(descr[i]);
            }
        }
    };
    xmlhttp.open("GET", "jsdataLoadDescr.php", true);
    xmlhttp.send();

    // And now the graphs
    var xmlhttp2 = new XMLHttpRequest();
    xmlhttp2.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            HDXGraphs = JSON.parse(this.responseText);
        }
    };
    xmlhttp2.open("GET", "jsLoadDataGraphs.php", true);
    xmlhttp2.send();
}

// adapted from the example provided by
// http://twitter.github.io/typeahead.js/examples/ The Basics also
// thanks to https://codepen.io/jonvadillo/details/NrGWEX for
// providing a working example in which to work off of
// Made this code block a function because the new UI wasn't calling it
function HDXGraphBoxStart(){
var HDXGraphSubstringMatcher = function(strs) {

    return function findMatches(q, cb) {
        var matches, substringRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(strs, function(i, str) {
            if (substrRegex.test(str)) {
                matches.push(str);
            }
        });

        cb(matches);
    };
};
// Counter for the User Feedback of an Invalid Graph
var noGraphCounter = 0;

//jQuery asking if the DOM is in a ready state for our changes to commence
$(document).ready(function() {
    $('#the-basics .typeahead').typeahead(
        {
            hint: true,
            highlight: true,
            minLength: 1,

        },
        {
            name: 'description',
            source: HDXGraphSubstringMatcher(HDXGraphDescriptions)
        });

    // adapted from https://howtodoinjava.com/scripting/jquery/jquery-detect-if-enter-key-is-pressed/
    $("#searchBox").keypress(function(event) {
        var keycode = (event.keycode ? event.keycode : event.which);
        if (keycode == '13') {
	    let input = document.getElementById("searchBox").value;
	    if (HDXGraphs.hasOwnProperty(input)) {
            loadingMenu();
		HDXReadFileFromWebServer(HDXGraphs[input]);
	    }
	    else {
		      //creates text under the graph search box saying that the graph doesn't exist
          if(noGraphCounter == 1)
          {
            noGraphCounter = 0;
            var deleteP = document.getElementById("noGraphFound");
            deleteP.remove();
          }
          var noGraph = document.createElement('P');
          noGraph.innerHTML = "Graph Not Found: " + input;
          noGraph.style.color = 'rgb(255, 107, 107';
          noGraph.id = 'noGraphFound';
          document.getElementById('the-basics').appendChild(noGraph);
          noGraphCounter += 1;
	         }
        }
    });
})};

function nextPressed() {
    
    let input = document.getElementById("searchBox").value;
    if (HDXGraphs.hasOwnProperty(input)) {
	loadingMenu();
	HDXReadFileFromWebServer(HDXGraphs[input]);
    }
    else {
	//creates text under the graph search box saying that the graph doesn't exist
        if(document.getElementById("noGraphFound") != null) {
            document.getElementById("noGraphFound").remove();
        }
        var noGraph = document.createElement('P');
        noGraph.innerHTML = "Graph Not Found: " + input;
        noGraph.style.color = 'rgb(255, 107, 107)';
        noGraph.id = 'noGraphFound';
        document.getElementById('the-basics').appendChild(noGraph);
        
    }
}
