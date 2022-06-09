//
// HDX functions to handle menus
//
// METAL Project
//
// Primary Author: Spencer Moon
// Edits by Jim Teresco

function basicMenu() {
    
    // Calls the Functions for the Graph Search box to Initiate
    HDXGraphSearchInit();
    HDXGraphBoxStart();
    
    // Creates and sets the attributes pf our search bar
    var box = document.createElement("input");
    box.setAttribute("class", "typeahead");
    box.setAttribute("type", "text");
    box.setAttribute("id", "searchBox");
    box.setAttribute("placeholder", "Start typing to get suggestions");
    
    // Datapanel to contain all of the elements
    var dataPanel = document.getElementById("loadDataPanel");
    dataPanel.innerHTML = "";
    
    // Back Button
    var back = document.createElement("button");
    back.setAttribute("id", "back");
    back.innerHTML = "Back";
    dataPanel.appendChild(back);
    back.addEventListener("click", HDXGraphSearchCleanup());
    if (hdxGlobals.titleScreen) {
	back.addEventListener("click", defaultMenu);
    }
    else {
	back.addEventListener("click", newGraphMenu);
    }
    
    // Spacing on the panel
    var br = document.createElement("br");
    dataPanel.appendChild(br);
    dataPanel.appendChild(br);
    dataPanel.appendChild(br);
    
    // Instructions for the Grpah Search Box
    var instructions = document.createElement("p");
    instructions.innerHTML = "Search by name for a METAL graph";
    dataPanel.appendChild(instructions);
    /*var instr2 = document.createElement("p");
    instr2.innerHTML = "Start typing a place name to get suggestions";
    instr2.setAttribute("class", "descr");
    instr2.setAttribute("id", "instr2");
    dataPanel.appendChild(instr2);*/
    
    // Container for the input element
    var basic = document.createElement("div");
    basic.setAttribute("id", "the-basics");
    basic.appendChild(box);
    
    // puts the basic variable with the child box into the dataPanel
    dataPanel.appendChild(basic);
    
    // makes the next button
    var next = document.createElement("button");
    next.setAttribute("id", "next");
    next.innerHTML = "Next";
    next.addEventListener("click", nextPressed);
    dataPanel.appendChild(next);
    
}

function advancedMenu() {
    
    var dataPanel = document.getElementById("loadDataPanel");
    
    dataPanel.innerHTML = "";
    
    var br = document.createElement("br");
    
    var back = document.createElement("button");
    back.setAttribute("id", "back2");
    back.innerHTML = "Back";
    
    dataPanel.appendChild(back);
    
    container = document.createElement("div");
    container.setAttribute("id", "selects")
    
    var title = document.createElement("h4");
    title.innerHTML = "Advanced Graph Data Search";
    title.setAttribute("id", "advancedTitle");
    container.appendChild(title);
    
    if (hdxGlobals.titleScreen) {
	back.addEventListener("click", defaultMenu);
    }
    else {
	back.addEventListener("click", newGraphMenu);
    }
    
    var sortP = document.createElement("p");
    sortP.innerHTML = "Sort by";
    container.appendChild(sortP);
    container.innerHTML += "<br>";
    
    var select = document.createElement("select");
    select.setAttribute("id", "orderOptions");
    
    var opt1 = document.createElement("option");
    opt1.setAttribute("value", "alpha");
    opt1.innerHTML = "Alphabetical";
    select.appendChild(opt1);
    
    var opt2 = document.createElement("option");
    opt2.setAttribute("value", "small");
    opt2.innerHTML = "Smallest First";
    select.appendChild(opt2);
    
    var opt3 = document.createElement("option");
    opt3.setAttribute("value", "large");
    opt3.innerHTML = "Largest First";
    select.appendChild(opt3);
    
    container.appendChild(select);
    container.innerHTML += "<br>";
    
    var formatP = document.createElement("p");
    formatP.innerHTML = "Format";
    container.appendChild(formatP);
    container.innerHTML += "<br>";
    
    var select2 = document.createElement("select");
    select2.setAttribute("id", "restrictOptions");
    
    var optA = document.createElement("option");
    optA.setAttribute("value", "collapsed");
    optA.innerHTML = "Standard";
    select2.appendChild(optA);
    
    var optB = document.createElement("option");
    optB.setAttribute("value", "traveled");
    optB.innerHTML = "Traveled (include traveler info)";
    select2.appendChild(optB);
    
    var optC = document.createElement("option");
    optC.setAttribute("value", "simple");
    optC.innerHTML = "Simple (straight line edges only)";
    select2.appendChild(optC);
    
    var optD = document.createElement("option");
    optD.setAttribute("value", "all");
    optD.innerHTML = "All";
    select2.appendChild(optD);
    
    container.appendChild(select2);
    container.innerHTML += "<br>";
    
    var categoryP = document.createElement("p");
    categoryP.innerHTML = "Category";
    container.appendChild(categoryP);
    container.innerHTML += "<br>";
    
    var select3 = document.createElement("select");
    select3.setAttribute("id", "categoryOptions");
    
    var optAll = document.createElement("option");
    optAll.setAttribute("value", "all");
    optAll.innerHTML = "All Graphs";
    select3.appendChild(optAll);
    
    for (let i = 0; i < labels.length; i++) {
	let category = document.createElement("option");
	category.innerHTML = labels[i];
	select3.appendChild(category);
    }
    
    container.appendChild(select3);
    container.innerHTML += "<br>";
    
    var sizeP = document.createElement("p");
    sizeP.innerHTML = "Vertices";
    sizeP.setAttribute("id", "vert");
    container.appendChild(sizeP);
    container.innerHTML += "<br>";
    
    var min = document.createElement("input");
    min.setAttribute("type", "number");
    min.setAttribute("min", "1");
    min.setAttribute("value", "1");
    min.setAttribute("id", "minVertices");
    min.setAttribute("style", "width:5rem;");
    container.appendChild(min);
    
    var sizeP2 = document.createElement("p");
    sizeP2.innerHTML = "to";
    sizeP2.setAttribute("id", "to");
    container.appendChild(sizeP2);
    
    var max = document.createElement("input");
    max.setAttribute("type", "number");
    max.setAttribute("min", "1");
    max.setAttribute("value", "2000");
    max.setAttribute("id", "maxVertices");
    max.setAttribute("style", "width:5rem;");
    container.appendChild(max);
    container.innerHTML += "<br>";
    
    
    var back = document.createElement("button");
    back.setAttribute("id", "back2");
    back.innerHTML = "Back";
    
    var getList = document.createElement("input");
    getList.setAttribute("type", "button");
    getList.setAttribute("value", "Get Graph List");
    getList.setAttribute("id", "getlist");
    getList.setAttribute("onclick", "HDXFillGraphList(event)");
    container.appendChild(getList);
    
    dataPanel.appendChild(container);    
}

function loadingMenu() {

    var dataPanel = document.getElementById("loadDataPanel");
    
    dataPanel.innerHTML = "";
    
    var loading = document.createElement("p");
    loading.setAttribute("id", "loading");
    loading.innerHTML = "Loading...";
    
    dataPanel.appendChild(loading);
}

function newGraphMenu() {
    
    if (hdxAV.status == hdxStates.AV_RUNNING) {
	hdxAV.setStatus(hdxStates.AV_PAUSED);
	if (hdxAV.delay == -1) {
            hdxAV.startPause.innerHTML = "Next Step";
        }
        else {
            hdxAV.startPause.innerHTML = "Resume";
        }
    }
    var mainbox = document.getElementById("loadDataPanel");
    
    // clear it
    mainbox.innerHTML = "";
    
    var br = document.createElement("br");
    
    var cancel = document.createElement("button");
    cancel.setAttribute("id", "cancel");
    cancel.innerHTML = "Cancel";
    cancel.addEventListener("click", hideLoadDataPanel)
    mainbox.appendChild(cancel);
    
    var instruct = document.createElement("p");
    instruct.innerHTML = "Search for a graph in our database";
    
    mainbox.appendChild(instruct);
    
    var basicSearch = document.createElement("button");
    basicSearch.setAttribute("class", "opt");
    basicSearch.innerHTML = "Basic Search";
    
    mainbox.appendChild(basicSearch);
    
    basicSearch.addEventListener("click", basicMenu);
    
    var advanced = document.createElement("button");
    advanced.setAttribute("class", "opt");
    advanced.innerHTML = "Advanced Search";
    mainbox.appendChild(advanced);
    
    advanced.addEventListener("click", advancedMenu);
    
    mainbox.appendChild(br);
    
    var or = document.createElement("p");
    or.setAttribute("id", "or")
    or.innerHTML = "or";
    
    mainbox.appendChild(or);
    
    var uploadLabel = document.createElement("label");
    uploadLabel.setAttribute("for", "fileToLoad");
    uploadLabel.setAttribute("id", "uploadLabel");
    uploadLabel.innerHTML = "Upload File";
    mainbox.appendChild(uploadLabel);
    
    mainbox.appendChild(br);
    
    var uploadIn = document.createElement("input");
    uploadIn.setAttribute("id", "fileToLoad");
    uploadIn.setAttribute("name", "fileToLoad");
    uploadIn.setAttribute("type", "file");
    uploadIn.setAttribute("value", "Start");
    uploadIn.setAttribute("accept", ".tmg, .wpt, .pth, .nmp, .gra, .wpl");
    uploadIn.setAttribute("onChange", "HDXStartFileselectorRead('fileToLoad')");
    
    var bod = document.querySelector("body");
    
    bod.appendChild(uploadIn);
    mainbox.style.display = "";
}


function defaultMenu() {

    var mainbox = document.getElementById("loadDataPanel");
    
    // clear it
    mainbox.innerHTML = "";
    
    var h3 = document.createElement("h3");
    h3.innerHTML = "METAL HDX";
    mainbox.appendChild(h3);
    
    var intro = document.createElement("p");
    intro.setAttribute("class", "descr");
    intro.setAttribute("id", "overview");
    intro.innerHTML = "Visualize algorithms on maps using real world highway data";
    mainbox.appendChild(intro);
    
    var br = document.createElement("br");
    mainbox.appendChild(br);
    
    
    var instruct = document.createElement("p");
    instruct.innerHTML = "Load a graph from the METAL database";
    
    mainbox.appendChild(instruct);
    
    var basicSearch = document.createElement("button");
    basicSearch.setAttribute("class", "opt");
    basicSearch.innerHTML = "Basic Search";
    
    mainbox.appendChild(basicSearch);
    
    basicSearch.addEventListener("click", basicMenu);
    
    var advanced = document.createElement("button");
    advanced.setAttribute("class", "opt");
    advanced.innerHTML = "Advanced Search";
    mainbox.appendChild(advanced);
    
    advanced.addEventListener("click", advancedMenu);
    
    mainbox.appendChild(br);
    
    var or = document.createElement("p");
    or.setAttribute("id", "or")
    or.innerHTML = "or";
    
    mainbox.appendChild(or);
    
    var uploadLabel = document.createElement("label");
    uploadLabel.setAttribute("for", "fileToLoad");
    uploadLabel.setAttribute("id", "uploadLabel");
    uploadLabel.innerHTML = "Upload File";
    mainbox.appendChild(uploadLabel);
    
    mainbox.appendChild(br);
    
    var uploadIn = document.createElement("input");
    uploadIn.setAttribute("id", "fileToLoad");
    uploadIn.setAttribute("name", "fileToLoad");
    uploadIn.setAttribute("type", "file");
    uploadIn.setAttribute("value", "Start");
    uploadIn.setAttribute("accept", ".tmg, .wpt, .pth, .nmp, .gra, .wpl");
    uploadIn.setAttribute("onChange", "HDXStartFileselectorRead('fileToLoad')");
    
    var bod = document.querySelector("body");
    
    bod.appendChild(uploadIn);
    mainbox.appendChild(br);
    
    var help = document.createElement("p");
    help.setAttribute("class", "descr");
    help.innerHTML = "Need help?  HDX tips can be found <a href='https://courses.teresco.org/metal/tips.html' target='_blank'>here</a>.";
    mainbox.appendChild(help);
}
