//
// HDX Functions related to custom tooltip/title support
//
// These currently show up on many HDX components as green boxes
// that open when the mouse hovers over
//
// METAL Project
//
// Primary Author: Tyler Gorman, Modified by Jim Teresco
//

// Takes anything with a custom-title attribute and appends
// them into span tag under document.body. This then adds various
// styles and class, that function as ids (allowing for more "ids")
function HDXAddCustomTitles() {

    const body = document.body;
    // selects all things with attribute custom-title
    const titles = document.querySelectorAll("[custom-title]");
    const numberOfDataTitles = HDXGetLastCustomTitle();
    for (let x = 0; x <titles.length; x++) {
        // offset the numbering to avoid conflicts
        const offset = numberOfDataTitles + x;
        const theClass = "Atitle" + offset;
        // adds class to the original html
        titles[x].classList.add(theClass);
        // Remove any duplicates before after adding the class, but
        // before doing anything else
        HDXUpdateCustomTitle(titles[x]);
        
        // Adds a mouse event when it enters an object with a custom
        // title will grab the class(psuedo-ID) and change the
        // spantags display to block
        titles[x].addEventListener("mouseenter", function(event) {
            try {
                const target = event.target;
		// grabs the current class, acting as an ID
                let currClass = target.getAttribute("class");
                currClass = currClass.substr(currClass.indexOf("Atitle"));
                const classNodes =
		      document.body.getElementsByClassName(currClass);
		// grabs the spanTag as it is always the 2nd element
		// when pulled this way
                const spanTag = classNodes[1];
                const style = window.getComputedStyle(spanTag);
                const display = style.getPropertyValue("display");
                if (display == "none") {
                    spanTag.style.display = "block";
                }
                
                // Get the left and top x-y coordinates. Set them for
                // the span tag
                const rect = classNodes[0].getBoundingClientRect();
                const right = rect.right;
                const top = rect.top;
                spanTag.style.left = right + 2 + "px";
                spanTag.style.top = top + -4 + "px";
               //spanTag.style.left = "700px";
               // spanTag.style.top = (50 + rect.top) + "px";

               //Puts span tag to the right of the mouse
               //spanTag.style.left = event.clientX + 15 + "px";
               
                
                // Grab the span tag's right most side, if its past
                // the screen, shift it to the left the difference to
                // display it all
                const rect2 = spanTag.getBoundingClientRect();
                if (rect2.right > window.innerWidth) {
                    spanTag.style.left = right - (rect2.right - window.innerWidth) + "px";
                }
            }
            catch(err) {
                console.log("MouseEnter has encountered an error");
            }
        }, false);

        
	        
        // Adds a mouse event when it leaves an object with a custom
        // title will grab the class(psuedo-ID) and change the
        // spantags display to none
        titles[x].addEventListener("mouseleave", function(event) {
            try {
                const target = event.target;
		// grabs the current class, acting as an ID
                let currClass = target.getAttribute("class");
                currClass = currClass.substr(currClass.indexOf("Atitle"));
                const classNodes =
		      document.body.getElementsByClassName(currClass); 
		// grabs the spanTag as it is always the 2nd element
		const spanTag = classNodes[1];
                const style = window.getComputedStyle(spanTag);
                
                const display = style.getPropertyValue("display");
                if (display == "block") {
                    spanTag.style.display = "none";
                }
            }
            catch(err) {
                console.log("MouseLeave has encountered an error");
            }
            
        }, false);
	
        // obtains the text of the custom title and creates a text node
        const titleValue = titles[x].getAttribute("custom-title");
        const titleNode = document.createTextNode(titleValue);
        const title = document.createElement("span");
        // setAttribute
        // Adds attributes of Style to the span tag
        title.style.display = "none";
        title.classList.add(theClass);
        title.classList.add("data-title");
        title.style.position = "fixed";
	
        const rect = titles[x].getBoundingClientRect();
        title.style.left = "" + rect.left + "px";
        title.style.top = "" + rect.top + "px";

        
        title.style.zIndex = "99999";
        title.style.maxWidth = "550px";
        // adds the titleNode to title
        title.appendChild(titleNode);
        let textt = title.innerHTML;
        title.innerHTML =
	    title.innerHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        textt = textt.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        // in case the label glitches
        title.addEventListener("mouseenter", function(event) {
            event.target.style.display = "none";
        }, false);
        // span tag - title - is added to the body
        body.appendChild(title);
	
        // remove attribute custom-title from the object processed
        // This is to avoid running this multiple times on the same object
        // MUST BE HERE DUE TO CODE EXECUTION TOP TO BOTTOM
        titles[x].removeAttribute("custom-title");
    }
}

// Updates title classes of elements to assure there is no overlap of
// mult. classes, This will allow for the tags to auto update without
// any confusion
function HDXUpdateCustomTitle(customSpanTag) {
    
    // Last previously known class with the prefix title
    let lastClass = "";
    // grabs all classes from the current tag
    const classes = customSpanTag.classList;
    for (let temp of classes) {
        // if the current class has title in it
        if (temp.includes("Atitle")) {
            // if last class was already a title
            if (lastClass.includes("Atitle")) {
                // remove the class title###... from the main tag get
                // Elements both with the title###... and data-title
                // classes find the span tag and remove that node
                customSpanTag.classList.remove(lastClass);
                const pickMe = lastClass + " data-title";
                const spanTagRemove =
		      document.getElementsByClassName(pickMe)[0];
                spanTagRemove.parentNode.removeChild(spanTagRemove);
            }
            // Last class is set to a title
            lastClass = temp;
        }   
    }
}

// Gets the titile class with the last number. This will keep indexing
// constant so no numbers double over and mess up the link between the
// tags. OFFSET method
function HDXGetLastCustomTitle() {
    // last = length of data-title list -> Check to make sure theres
    // at least one
    const last = document.getElementsByClassName("data-title").length-1;
    if (last >= 0) {
        // Get the last indexed data-title class -> This directly relates with the
        // highest number one due to TOP to BOTTOM
        const lastOne = document.getElementsByClassName("data-title")[last];
        // Grabs the individual classes from the tag
        const classes = lastOne.classList;
        let theOne = "";
        // Go through and check the tag's classes. If any have the
        // pattern title#+ make theOne equal to it
        for (let title of classes) {
            if (/Atitle(\d+)/.test(title)) {
                theOne = title;
            }
        }
        // remove the "title" part and parse it for the number portion
        theOne = theOne.substring(6);
        return (parseInt(theOne) + 1);
    }
    else {
        // return there are NONE
        return 0;
    }
}
