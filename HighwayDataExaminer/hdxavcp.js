//
// HDX Algorithm Visualization Control Panel
//
// METAL Project
//
// Primary Author: Jim Teresco
//

/* functions for algorithm visualization control panel */
var AVCPsuffix = "AVCPEntry";
var AVCPentries = [];
var AVCProws = [];

/* add entry to the algorithm visualization control panel */
function addEntryToAVControlPanel(namePrefix, vs) {
    
    const avControlTbody = document.getElementById('algorithmVars');
    const infoBox = document.createElement('td');
    const infoBoxtr = document.createElement('tr');
    infoBox.setAttribute('id', namePrefix + AVCPsuffix);
    infoBox.setAttribute('style', "color:" + vs.textColor +
                         "; background-color:" + vs.color);
    infoBoxtr.appendChild(infoBox);
    infoBoxtr.style.display = "none";
    AVCProws.push(infoBoxtr);
    avControlTbody.appendChild(infoBoxtr);
    AVCPentries.push(namePrefix);
}

function showAVCPEntries()
{
    for (let i = 0; i < AVCProws.length; i++)
    {
        AVCProws[i].style.display = "";
    }
}

function hideAVCPEntries()
{
    for (let i = 0; i < AVCProws.length; i++)
    {
        if (AVCProws[i].firstChild.innerHTML == "")
        {
            AVCProws[i].style.display = "none";
        }
    }
}
/* clean up all entries from algorithm visualization control panel */
function cleanupAVControlPanel() {

    document.getElementById("algorithmStatus").innerHTML = "";
    document.getElementById("pseudoText").innerHTML = "";
    while (AVCPentries.length > 0) {
        removeEntryFromAVControlPanel(AVCPentries.pop());
    }
}

/* remove entry from algorithm visualization control panel */
function removeEntryFromAVControlPanel(namePrefix) {

    const avControlTbody = document.getElementById('algorithmVars');
    const infoBox = document.getElementById(namePrefix + AVCPsuffix);
    if (infoBox != null) {
        const infoBoxtr= infoBox.parentNode;
        avControlTbody.removeChild(infoBoxtr);
    }
}

/* set the HTML of an AV control panel entry */
function updateAVControlEntry(namePrefix, text) {

        
    document.getElementById(namePrefix + AVCPsuffix).innerHTML = text;
    if (text == "")
    {
        document.getElementById(namePrefix + AVCPsuffix).parentNode.style.display = "none";
    }
    else
    {
        document.getElementById(namePrefix + AVCPsuffix).parentNode.style.display = "";
    }
    if (hdxAV.delay != 0) {
        HDXAddCustomTitles();
    }
    
    
}

/* set the visualSettings of an AV control panel entry */
function updateAVControlVisualSettings(namePrefix, vs) {

    const infoBox = document.getElementById(namePrefix + AVCPsuffix);
    infoBox.setAttribute('style', "color:" + vs.textColor +
                         "; background-color:" + vs.color);
}

/* get the document element of an AV control entry */
function getAVControlEntryDocumentElement(namePrefix) {

    return document.getElementById(namePrefix + AVCPsuffix);
}
