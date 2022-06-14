//
// HDX AV Visual Settings
//
// METAL Project
//
// Primary Author: Jim Teresco
//

// algorithm visualization color settings and other parameters
var visualSettings = {
    // first, some used by many algorithms
    
    undiscovered: {
        color: "rgb(60, 60, 60)",
        textColor: "#ffffff",
        scale: 4,
        name: "undiscovered", 
        value: 0,
        weight: 5,
        opacity: 0.6
    },
    visiting: {
        color: "rgb(30, 179, 238)",
        textColor: "white",
        scale: 8,
        name: "visiting",
        value: 0,
        weight: 8,
        opacity: 1
    },
    leader: {
        color: "rgb(255, 130, 0)",
        textColor: "white",
        scale: 6,
        name: "leader",
        value: 0
    },
    leader2: {
        color: "rgb(164, 81, 255)",
        textColor: "white",
        scale: 6,
        name: "leader",
        value: 0
    },
    //not used by everything, but this is a placeholder in case things need to be made universal in the future
    v1: {
        color: "rgb(30, 179, 238)",
        textColor: "white",
        scale: 6,
        name: "v1",
        value: 0
    },
    //same as v1
    v2: {
        color: "rgb(255, 60, 60)",
        textColor: "white",
        scale: 6,
        name: "v2",
        value: 0
    },

    searchFailed: {
        color: "firebrick",
        textColor: "white",
        scale: 6,
        name: "searchFailed",
        value: 0
    },
    mismatchFound: {
        color: "rgb(255, 233, 64)",
        textColor: "white",
        scale: 6,
        name: "mismatchFound",
        value: 0
    },
    discarded: { //discard on removal
        color: "rgb(142, 142, 142)",
        textColor: "white",
        scale: 3,
        name: "discarded",
        value: 0,
        weight: 5,
        opacity: 0.6
    },

    // these are in graph traversals and Dijkstra's so far
    discardedOnDiscovery: {
        color: "rgb(255, 233, 64)",
        textColor: "black",
        scale: 4,
        name: "discardedOnDiscovery",
        value: 0,
        weight: 5,
        opacity: 0.6
    },
    startVertex: {
        color: "rgb(63, 210, 34)",
        textColor: "white",
        scale: 7,
        name: "startVertex",
        value: 0
    },
    endVertex: {
        color: "rgb(255, 60, 60)",
        textColor: "white",
        scale: 7,
        name: "endVertex",
        value: 0
    },

    // both vertex and edge search
    shortLabelLeader: {
        color: "rgb(255, 60, 60)",
        textColor: "white",
        scale: 6,
        name: "shortLabelLeader",
        value: 0,
        weight: 8,
        opacity: 0.6
    },
    longLabelLeader: {
        color: "rgb(63, 210, 34)",
        textColor: "white",
        scale: 6,
        name: "longLabelLeader",
        value: 0,
        weight: 8,
        opacity: 0.6
    },
    firstLabelLeader: {
        color: "rgb(254, 201, 66)",
        textColor: "black",
        scale: 6,
        name: "firstLabelLeader",
        value: 0,
        weight: 8,
        opacity: 0.6
    },
    lastLabelLeader: {
        color: "rgb(1, 107, 84)",
        textColor: "white",
        scale: 6,
        name: "lastLabelLeader",
        value: 0,
        weight: 8,
        opacity: 0.6
    },
    averageCoord: {
        color: "rgb(32, 178, 170)",
        textColor: "white",
        scale: 4,
        name: "averageCoord",
        value: 0,
        weight: 5,
        opacity: 0.6
    },
    spanningTree: {
        color: "rgb(113, 88, 255)",
        textColor: "white",
        scale: 4,
        name: "spanningTree",
        value: 0,
        weight: 5,
        opacity: 0.6
    },
    discovered: {
        color: "rgb(255, 130, 0)",
        textColor: "white",
        scale: 4,
        name: "discovered",
        value: 0,
        weight: 5,
        opacity: 0.6
    },
    hoverV: {
        color: "rgb(190, 235, 252)",
        textColor: "black",
        scale: 8,
        name: "hoverV",
        value: 0
    },
    pseudocodeDefault: {
        color: "white",
        textColor: "black"
    },
    highlightBounding: {
        color: "rgb(255, 60, 60)",
        textColor: "white",
        name: "highlightBounding",
        weight: 4,
        opacity: 0.7
    }
};