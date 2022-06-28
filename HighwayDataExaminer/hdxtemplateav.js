//
// HDX Algorithm Visualization Template File
//
// METAL Project
//
// Primary Authors: (Insert names here)
//

//this variable name is used to store the document containaing all the necessary fields, functions, and states for a given AV
//variable must be pushed to the this.avList in the hdxav.js file
//additionally, the file of this AV must be linked in the index.php file
var hdxTemplateAV = {
    //entries for list of avs
    value: 'Sample',

    //name here is what is shown in the drop down menu when selecting from different algorithms
    name: "Template",

    //description is what is shown after the user selects the algorithm in the drop down 
    //but before they press the visualise button
    description: "This description is used to decribe the algorithm to the user. Include note if something is broken",

    //here you list global fields that you want your av to have access to on a global level 

    //here are some common examples

    //list of polylines, any line you manually insert onto the HDX to aid the AV. 
    //often used in vertex only algorithms
    //these polylines must be removed during
    highlightPoly: [],

    //loop variable that tracks which point is currently being operated upon
    nextToCheck: -1,

    avActions : [
        {
            //label represents the current state in state machine you are accessing
            //if you want the psuedocode to highlight when 
            label: "START",
            comment: "Initializes fields",
            code: function(thisAV){
                highlightPseudocode(this.label, visualSettings.visiting);

                //here you establish thisAV.variables that you need access to between states. 
                //You cannot access this.variables inside the state machine/actions

                thisAV.nextToCheck = -1;

                //this is typically used to track progress or how many times to loop through the algorithm
                thisAV.numVUndiscovered = waypoints.length,
            
                //this establishes what the next state in the state machine you are going to
                //which in many cases after the start state is the top of a for loop
                //if there are multiple states that can be entered from a state, you can use if else statements
                hdxAV.iterationDone = true;
                hdxAV.nextAction = "topForLoop";
            },
            //logMessage is what is printed on top of the pseudocode when running step by step
            logMessage: function(thisAV){
                return "Doing some setup stuff";
            }
        },
        {
            //all avs need a cleanup state from which things such as additional polylines and global variables are reset
                label: "cleanup",
                comment: "cleanup and updates at the end of the visualization",
                code: function(thisAV) {
                    


                    hdxAV.nextAction = "DONE";
                    hdxAV.iterationDone = true;

                    /*here is a loop where we remove all the polylines from the map
                        note this is not the same as popping the polylines
                        */
                    for (var i = 0; i < thisAV.highlightPoly.length; i++) {
                        thisAV.highlightPoly[i].remove();
                    }
                    
                },
                logMessage: function(thisAV) {
                    return "Cleanup and finalize visualization";
                }
        }
    ],
    
    //prepToStart is a necessary function for everyAV and is called when you hit visualize but before you hit start
    prepToStart() {
        hdxAV.algStat.innerHTML = "Initializing";
        //this function determines if you are using vertices (first param), edges (second param), and color (this gives black)
        initWaypointsAndConnections(true, false, visualSettings.undiscovered);

        //here is where you establish the pseudocode, which is a table in html, with each state being a different row
        //make sure each row is labeled the same EXACT name as the label in the state machine
        //hmtl can be written in javascript by using the grave key `
        //basic things to know
        //line break -> <br />
        //left facing arrow -> &larr;
        //make a new row -> </td></tr>
        //to associate a line of pseudocode with a state use the function pcEntry
        // this.code += '</td></tr>' + pcEntry(numSpacesIndented,'text',"label")
        this.code = '<table class="pseudocode"><tr id="START" class="pseudocode"><td class="pseudocode">';
},
    //setup UI is called after you click the algorithm in algorithm selection but before you press the visualize button, required
    setupUI() {
        var algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
        hdxAV.algStat.style.display = "";
        hdxAV.algStat.innerHTML = "Setting up";
        hdxAV.logMessageArr = [];
        hdxAV.logMessageArr.push("Setting up");

        let newAO;
        //here we place the additional options to choose from, be it a checkbox, scrolling number box, or a combobox
        //check other algorithms for examples, but here it is from hdxorderingav
        /*
             let newAO = `Order: <select id="traversalOrdering" onchange="refinementChanged();">
        <option value="byLat">By Latitude</option>
        <option value="byLng">By Longitude</option>
        <option value="rand">Random</option>
        <option value="morton">Morton/Z Curve</option>
        <option value="hilbert">Hilbert Curve</option>
        <option value="moore">Moore Curve</option>
        <option value="grey">Grey Code</option>
        <option value="default">Default</option>

        <!--<option value="fixedGrey">Fixed Grey Curve</option>-->
        </select>`;

        newAO += '<br />Refinement Threshold<input type="number" id="refinement" min="2" max="' 
        + (waypoints.length) + '" value="2">';

        newAO += `<br /><input id="boundingBox" type="checkbox" name="Show Bounding Box"/>&nbsp;
        Show Bounding Box<br />`

        hdxAV.algOptions.innerHTML = newAO;
        */

        hdxAV.algOptions.innerHTML = newAO;

        //here we insert the entries to control panels which allows us to update variables that the user sees on the sidebar
        //while the algorithms is being run
        addEntryToAVControlPanel("undiscovered", visualSettings.undiscovered); 
        addEntryToAVControlPanel("visiting",visualSettings.visiting)
       
    },
    //cleanupUI is called when you select a new AV or map when after running an algorithm, required
    cleanupUI() {
        //remove all the polylines made by any global bounding box
    },

    //this is necessary for HDXAV to access the code inside our state machine, required
    idOfAction(action) {
	
        return action.label;
    },

     //note this is currently not working
     setConditionalBreakpoints(name) {
        let max = waypoints.length-1;
        let temp = HDXCommonConditionalBreakpoints(name);
        if (temp != "No innerHTML") {
            return temp;
        }
        switch (name) {
            case "isLeaf":
                html = createInnerHTMLChoice("boolean","",
                                             "",
                                             "");
                return html;
                
            }
        return "No innerHTML";
    },
    //note this is currently not working
    hasConditionalBreakpoints(name){
        let answer = HDXHasCommonConditonalBreakpoints(name);
        if (answer) {
            return true;
        }
        return false;
    }
    //here add any additional functions you may need to access in your AV

}