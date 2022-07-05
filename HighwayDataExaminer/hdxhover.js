//
// HDX Hover-over support for vertices and edges
//
// METAL Project
//
// Primary Authors: Clarice Tarbay, Jim Teresco
//

// variables and functions to highlight waypoints and connections
// when the mouse hovers over them

var hdxHover = {
    vcolor: null,
    vtext: null,
    vicon: null,
    ecolor: null,
    etext: null,
    edge:null,
    edgew: null
};

function hoverV(i, bool) {
    if ((bool && hdxAV.paused()) || !bool) {
        hdxHover.vicon = markers[i].options.icon;
        hdxHover.vcolor = document.getElementById("waypoint"+i).style.backgroundColor;
        hdxHover.vtext = document.getElementById("waypoint"+i).style.color;
        updateMarkerAndTable(i, visualSettings.hoverV, 40, false);
    }
}

function hoverEndV(i, bool) {
    if ((bool && hdxAV.paused()) || !bool) {
        markers[i].setIcon(hdxHover.vicon);
        document.getElementById("waypoint"+i).style.backgroundColor = hdxHover.vcolor;
        document.getElementById("waypoint"+i).style.color = hdxHover.vtext;
        if ($("#l"+i).length > 0) {
            document.getElementById("l"+i).style.backgroundColor = hdxHover.vcolor;
        }
        if ($("#di"+i).length > 0) {
            document.getElementById("di"+i).style.backgroundColor = hdxHover.vcolor;
            document.getElementById("di"+i).style.color = hdxHover.vtext;
        }
    }
}

function hoverE(event, i) {
    hdxHover.ecolor = event.target.parentNode.style.backgroundColor;
    hdxHover.etext = event.target.parentNode.style.color;
    event.target.parentNode.style.color = visualSettings.hoverV.textColor;
    event.target.parentNode.style.backgroundColor = visualSettings.hoverV.color
    hdxHover.edge = connections[i].options.color;
    hdxHover.edgew = connections[i].options.opacity;
    connections[i].setStyle({
        color: visualSettings.hoverV.color,
        opacity: 0.7
    });
}

function hoverEndE(event, i) {
    connections[i].setStyle({
        color: hdxHover.edge,
        opacity: hdxHover.edgew
    });
    event.target.parentNode.style.color = hdxHover.etext;
    event.target.parentNode.style.backgroundColor = hdxHover.ecolor;
}
