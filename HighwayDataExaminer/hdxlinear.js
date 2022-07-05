//
// HDX implementation of the HDXLinear structure
//
// METAL Project
//
// Primary Author: Jim Teresco
//

/*
  Linear structure that can be displayed in a collapsed form
*/
var hdxLinearTypes = {

    // constants to refer to these, if new ones are added,
    // place before UNKNOWN and increment UNKNOWN's value
    STACK: 1,
    QUEUE: 2,
    RANDOM: 3,
    PRIORITY_QUEUE: 4,
    CALL_STACK: 5,
    UNKNOWN: 6
};

// to generate unique document element ids
var HDXLinearCounter = 1;

function HDXLinear(type, displayName) {

    // supported types listed above
    if (type < hdxLinearTypes.STACK || type >= hdxLinearTypes.UNKNOWN) {
        console.log("Invalid type of HDXLinear!");
    }
    this.type = type;
    this.displayName = displayName;
    this.idNum = HDXLinearCounter;
    this.maxLabelLength = 10;
    this.valPrecision = 3;
    HDXLinearCounter++;

    // the actual array representing this linear structure
    this.items = [];

    // some stats about it
    this.addCount = 0;
    this.removeCount = 0;
    this.maxSize = 0;
    // used to calculate an average size across all redraws
    this.cumulativeSize = 0;
    this.numRedraws = 0;
    
    // the document element in which to display the contents
    this.docElement = null;

    // the callback to use to get the actual text to
    // display for each displayed element
    this.elementHTMLCallback = null;

    // default comparator function for priority queues
    this.comesBefore = function(a, b) {

        return a < b;
    };

    // set custom comparator for priority queues
    this.setComparator = function(c) {

        this.comesBefore = c;
    };
    
    // set the element and callback
    this.setDisplay = function(dE, eC, value=6) {

        this.docElement = dE;
        this.elementHTMLCallback = eC;
        let t = this.displayName + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;size = <span id="HDXLinear' +
        this.idNum + 'Span">'+ this.items.length +
        '</span>; max = <span id="HDXLinear' + this.idNum +
        'Mspan">' + this.maxSize +
        '</span>; avg = <span id="HDXLinear' + this.idNum +
        'Aspan">' + 0 +
        '</span> <table><tbody id="HDXLinear' + this.idNum + 'TBody">' +
            '</tbody></table>';
        this.docElement.innerHTML = t;
        this.lengthSpan = document.getElementById("HDXLinear" + this.idNum + "Span");
        this.maxSizeSpan = document.getElementById("HDXLinear" + this.idNum + "Mspan");
        this.avgSizeSpan = document.getElementById("HDXLinear" + this.idNum + "Aspan");
        this.tbody = document.getElementById("HDXLinear" + this.idNum + "TBody");
        this.limitCheck = document.getElementById("HDXLinear" + this.idNum + "Limit");
        this.limit = 4;
        this.redraw();
    };
    
    // add a item to this linear structure
    this.add = function(e) {

        if ((this.type == hdxLinearTypes.PRIORITY_QUEUE) &&
            this.items.length > 0) {
            // need to maintain in order
            // does e come first?
            let i = 0;
            while ((i < this.items.length) &&
                   this.comesBefore(e, this.items[i])) {
                i++;
            }
            this.items.splice(i, 0, e);
        }
        else {
            this.items.push(e);
        }
        this.addCount++;
        if (this.items.length > this.maxSize) {
            this.maxSize = this.items.length;
        }
        
        this.redraw();
    };

    // remove next based on type
    this.remove = function() {

        this.removeCount++;
        let retval = null;
        switch (this.type) {

        case hdxLinearTypes.STACK:
        case hdxLinearTypes.CALL_STACK:
        case hdxLinearTypes.PRIORITY_QUEUE:
            retval = this.items.pop();
            break;
            
        case hdxLinearTypes.QUEUE:
            retval = this.items.shift();
            break;
            
        case hdxLinearTypes.RANDOM:
            let index = Math.floor(Math.random() * this.items.length);
            retval = this.items[index];
            this.items.splice(index, 1);
            break;
        }

        this.redraw();
        return retval;
    };
    
    // search for an entry with the given field having the given value
    this.containsFieldMatching = function(field, value) {

        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i][field] == value) {
                return true;
            }
        }
        return false;
    };

    // check for empty list
    this.isEmpty = function() {

        return this.items.length == 0;
    };

    // redraw in the HTML element
    this.redraw = function() {

        if (this.docElement != null) {
            this.lengthSpan.innerHTML = this.items.length;
            this.maxSizeSpan.innerHTML = this.maxSize;
	        this.cumulativeSize += this.items.length;
	    this.numRedraws++;
            this.avgSizeSpan.innerHTML =
               parseFloat(1.0*this.cumulativeSize/this.numRedraws).toFixed(1);
            let t = "<tr>";
            if (this.type == hdxLinearTypes.CALL_STACK) {
                t = "";
            }
            
            
            let maxDisplay = 4;
            
            if (maxDisplay >= this.items.length) {
                if (this.type == hdxLinearTypes.CALL_STACK) {
                    for (let i = this.items.length - 1; i >= 0; i--) {
                        t += "<tr><td>" + this.elementHTMLCallback(this.items[i], this) + "</td></tr>";
                    }
                }
                else {
                    for (let i = 0; i < this.items.length; i++) {
                        t += "<td>" + this.elementHTMLCallback(this.items[i], this) + "</td>";
                    }
                }
            }
            else {
                // we have to limit: with stacks and randoms, we
                // ignore the initial entries
                if (this.type == hdxLinearTypes.STACK ||
                    this.type == hdxLinearTypes.RANDOM) {
                    // first a placeholder entry
                    t += "<td id='dotdotdot'>...</td>";
                    for (let i = this.items.length - maxDisplay;
                         i < this.items.length; i++) {
                        t += "<td>" + this.elementHTMLCallback(this.items[i], this) + "</td>";
                    }
                }
                // queues will ignore the middle
                else if ((this.type == hdxLinearTypes.QUEUE) ||
                         (this.type == hdxLinearTypes.PRIORITY_QUEUE)) {
                    // half of the displayable elements from the front
                    let firstChunk = Math.floor(maxDisplay / 2);
                    for (let i = 0; i < firstChunk; i++) {
                        t += "<td>" + this.elementHTMLCallback(this.items[i], this) + "</td>";
                    }
                    // next a placeholder entry
                    t += "<td id='dotdotdot'>...</td>";
                    // half of the displayable elements from the end
                    for (let i = this.items.length -
                             (maxDisplay - firstChunk);
                         i < this.items.length; i++) {
                        t += "<td>" + this.elementHTMLCallback(this.items[i], this) + "</td>";
                    }
                }

                else if (this.type == hdxLinearTypes.CALL_STACK) {
                    // half of the displayable elements from the front
                    let firstChunk = Math.floor(maxDisplay / 2);
                    for (let i = this.items.length - 1;
                         i >= this.items.length - (maxDisplay - firstChunk); i--) {
                        t += "<tr><td>" + this.elementHTMLCallback(this.items[i], this) + "</td></tr>";
                    }
                    // next a placeholder entry
                    t += "<tr><td>...</td></tr>";
                    // half of the displayable elements from the end
                    for (let i = firstChunk - 1; i >= 0; i--) {
                        t += "<tr><td>" + this.elementHTMLCallback(this.items[i], this) + "</td></tr>";
                    }
                }
            }
            if (this.type != hdxLinearTypes.CALL_STACK) {
                t += "</tr>";
            }
            this.tbody.innerHTML = t;
        }
    };

    // names to use when referring to add and remove operations
    this.addOperation = function() {
        switch(this.type) {
	    
        case hdxLinearTypes.STACK:
            return "push";
        case hdxLinearTypes.PRIORITY_QUEUE:
        case hdxLinearTypes.RANDOM:
            return "add";
        case hdxLinearTypes.QUEUE:
            return "enqueue";
        }
    };
    
    this.removeOperation = function() {
        switch(this.type) {
	    
        case hdxLinearTypes.STACK:
            return "pop";
        case hdxLinearTypes.PRIORITY_QUEUE:
        case hdxLinearTypes.RANDOM:
            return "remove";
        case hdxLinearTypes.QUEUE:
            return "dequeue";
        }
    };
    
    return this;
}

