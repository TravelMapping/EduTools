//
// HDX "no algorithm selected" dummy AV entry
//
// METAL Project
//
// Primary Author: Jim Teresco
//

// dummy AV entry for main menu

const hdxNoAV = {

    // entries for list of AVs
    value: "none",
    name: "No Algorithm Visualization",
    description: "Visualize Graph Data Only",

    code: "Select and start an algorithm to view pseudocode.",
    
    // provide prepToStart, nextStep, setupUI, just in case buttons are
    // somehow active when this option is selected
    prepToStart() {

        alert("Please select an algorithm first.");
    },
    
    nextStep() {

        alert("Please select an algorithm first.");
    },

    setupUI() {
        const algDescription = document.getElementById("algDescription");
        algDescription.innerHTML = this.description;
    },

    cleanupUI() {}
};
