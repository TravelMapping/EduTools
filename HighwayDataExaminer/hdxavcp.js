//
// HDX Algorithm Visualization Control Panel
//
// METAL Project
//
// Primary Author: Jim Teresco
//

const hdxAVCP = {

    suffix: "AVCPEntry",
    entries: [],
    rows: [],

    // save 
    init: function() {

	this.tbody = document.getElementById('algorithmVars');
    },
    
    /* add entry to the algorithm visualization control panel */
    add: function(namePrefix, vs) {
    
	const infoBox = document.createElement('td');
	const infoBoxtr = document.createElement('tr');
	infoBox.setAttribute('id', namePrefix + this.suffix);
	infoBox.setAttribute('style', "color:" + vs.textColor +
                             "; background-color:" + vs.color);
	infoBoxtr.appendChild(infoBox);
	infoBoxtr.style.display = "none";
	this.rows.push(infoBoxtr);
	this.tbody.appendChild(infoBoxtr);
	this.entries.push(namePrefix);
    },

    showEntries: function() {
	
	for (let i = 0; i < this.rows.length; i++) {
            this.rows[i].style.display = "";
	}
    },

    hideEntries: function() {
	
	for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i].firstChild.innerHTML == "") {
		this.rows[i].style.display = "none";
            }
	}
    },
    
    /* clean up all entries from algorithm visualization control panel */
    cleanup: function() {
	
	document.getElementById("algorithmStatus").innerHTML = "";
	document.getElementById("pseudoText").innerHTML = "";
	while (this.entries.length > 0) {
            this.remove(this.entries.pop());
	}
    },

    /* remove entry from algorithm visualization control panel */
    remove: function(namePrefix) {

	const infoBox = document.getElementById(namePrefix + this.suffix);
	if (infoBox != null) {
            const infoBoxtr= infoBox.parentNode;
            this.tbody.removeChild(infoBoxtr);
	}
    },

    /* set the HTML of an AV control panel entry */
    update: function(namePrefix, text) {
        
	document.getElementById(namePrefix + this.suffix).innerHTML = text;
	if (text == "") {
            document.getElementById(namePrefix + this.suffix).parentNode.style.display = "none";
	}
	else {
            document.getElementById(namePrefix + this.suffix).parentNode.style.display = "";
	}
    },

    /* set the visualSettings of an AV control panel entry */
    updateVS: function(namePrefix, vs) {

	const infoBox = document.getElementById(namePrefix + this.suffix);
	infoBox.setAttribute('style', "color:" + vs.textColor +
                             "; background-color:" + vs.color);
    },
    
    /* get the document element of an AV control entry */
    getDocumentElement: function(namePrefix) {

	return document.getElementById(namePrefix + this.suffix);
    }
}

