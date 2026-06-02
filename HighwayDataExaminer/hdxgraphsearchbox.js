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
    HDXGraphs = {};
}

// initialization code for HDX Graph search box
function HDXGraphSearchInit() {

    // pass in the current graph archive set to use in the search
    const params = {
	graphSet:hdxGlobals.graphSet
    };
    const jsonParams = JSON.stringify(params);
    $.ajax({
	type: "POST",
	url: "./generateSimpleGraphList.php",
	datatype: "json",
	data: {"params":jsonParams},
	success: function(data) {
	    // we get back the graph names and descriptions
            const opts = $.parseJSON(data);
            const filenames = opts['filenames'];
	    const descriptions = opts['descriptions'];
	    // copy into our arrays used by the search box
            for (let i = 0; i < filenames.length; i++) {
                HDXGraphs[descriptions[i]] = filenames[i];
		HDXGraphDescriptions.push(descriptions[i]);
	    }
	}
    });
}

// adapted from the example provided by
// http://twitter.github.io/typeahead.js/examples/ The Basics also
// thanks to https://codepen.io/jonvadillo/details/NrGWEX for
// providing a working example in which to work off of
// Made this code block a function because the new UI wasn't calling it
function HDXGraphBoxStart() {
    var HDXGraphSubstringMatcher = function(strs) {
	
	return function findMatches(q, cb) {

            // an array that will be populated with substring matches
            const matches = [];
	    
            // regex used to determine if a string contains the substring `q`
            const substrRegex = new RegExp(q, 'i');
	    
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
    let noGraphCounter = 0;
    
    //jQuery asking if the DOM is in a ready state for our changes to commence
    $(document).ready(function() {
	$('#basicgraphsearch .typeahead').typeahead(
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
            const keycode = (event.keycode ? event.keycode : event.which);
            if (keycode == '13') {
		const input = document.getElementById("searchBox").value;
		if (HDXGraphs.hasOwnProperty(input)) {
		    HDXLoadingMenu();
		    HDXReadFileFromWebServer(HDXGraphs[input]);
		}
		else {
		    //creates text under the graph search box saying that
		    //the graph doesn't exist
		    if (noGraphCounter == 1) {
			noGraphCounter = 0;
			const deleteP = document.getElementById("noGraphFound");
			deleteP.remove();
		    }
		    const noGraph = document.createElement('P');
		    noGraph.innerHTML = "Graph Not Found: " + input;
		    noGraph.style.color = 'rgb(255, 107, 107';
		    noGraph.id = 'noGraphFound';
		    document.getElementById('basicgraphsearch').appendChild(noGraph);
		    noGraphCounter += 1;
		}
            }
	});
    })
};

// in the basic search, the "Next" button has been pressed, so we
// try to load that graph
function HDXGraphSearchNextPressed() {
    
    const input = document.getElementById("searchBox").value;
    if (HDXGraphs.hasOwnProperty(input)) {
	HDXLoadingMenu();
	HDXReadFileFromWebServer(HDXGraphs[input]);
    }
    else {
	// creates text under the graph search box saying that the
	// graph doesn't exist
        if (document.getElementById("noGraphFound") != null) {
            document.getElementById("noGraphFound").remove();
        }
        const noGraph = document.createElement('P');
        noGraph.innerHTML = "Graph Not Found: " + input;
        noGraph.style.color = 'rgb(255, 107, 107)';
        noGraph.id = 'noGraphFound';
        document.getElementById('basicgraphsearch').appendChild(noGraph);
    }
}
