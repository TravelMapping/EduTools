//
//HDX Partitioning Support
//
//METAL project
//
//Primary Author: Michael Plekan

var hdxPart={

   numParts:1,
   parts:[],
   surfaceIndices:[],
   globalSI:0,
   maxSI:-1,
   avgSI:0,
   maxPartsize:waypoints.length,
   avgPartsize:waypoints.length,
   colscheme:"rainbow",

//runs the methods in the correct order
   partitionAnalysis() {
      this.setWaypointFields();
      this.partSizes();
      this.surfaceIndex();
   },

//Calculates the surface Indice Stats
   surfaceIndex() {
        var boundaryEdges=new Array(this.numParts).fill(0);
        var PartEdges=new Array(this.numParts).fill(0);
        var globalBoundaryEdges=0;
        //Goes through each edge and determines if it is a boundary edge. Then adds to the correct list(s) depending on the result
        for (var e=0;e < graphEdges.length;e++) {
             if (waypoints[graphEdges[e].v1].partId == waypoints[graphEdges[e].v2].partId) {
                      PartEdges[waypoints[graphEdges[e].v1].partId]++;
             }
             else {
                  globalBoundaryEdges++;
                  PartEdges[waypoints[graphEdges[e].v1].partId]++;
                  PartEdges[waypoints[graphEdges[e].v2].partId]++;
                  boundaryEdges[waypoints[graphEdges[e].v1].partId]++;
                  boundaryEdges[waypoints[graphEdges[e].v2].partId]++;
            }
        }
        this.globalSI=globalBoundaryEdges/graphEdges.length;
        this.surfaceIndices=new Array(this.numParts);
        this.avgSI=0;
        this.maxSI=-1;
        for (var i=0;i < this.numParts;i++) {
              this.surfaceIndices[i]=boundaryEdges[i]/PartEdges[i];
              this.avgSI+=this.surfaceIndices[i];
              if (this.surfaceIndices[i] > this.maxSI) this.maxSI=this.surfaceIndices[i];
        }
        this.avgSI/=this.numParts;
   },

//calculates Partition sizes
  partSizes() {
      var avg=0;
      var max=-999;
      for (var i=0; i < this.numParts;i++) {
          avg+=this.parts[i].length;
          if (this.parts[i].length>max) { max=this.parts[i].length;}
      }
      avg/=this.numParts;
      this.avgPartsize=avg;
      this.maxPartsize=max;
   },
   setWaypointFields() {
      for (var r=0; r < this.numParts;r++) {
          for (var c=0; c < this.parts[r].length; c++) {
              waypoints[this.parts[r][c]].partId =r;
          }
      }
   },

//Builds the string for AVs to use to add in the color scheme option
   colorHtml() {
        return '';
         //delete the empty return above and uncomment the return below to restore the option for picking the color scheme
        /*
        return `Coloring Scheme: <select id="ColoringScheme">
        <option value="rainbow">Rainbow</option></select>`;
        //new option goes here if added
        */
   },

  partHtml() {
      return '<br /><input id="calcparts" type="checkbox" name="partitions" onclick="partCallback()"> Calculate Partitions <br /> <p id="numpartsselector" style="display :none;" > Number of Partitions<input type="number" id="numOfParts" min="1" max="' + waypoints.length + '" value="2" ><p/>';
},


//Colors the partitions and builds the HTML strings for the table and hovering
  styling() {
      let statString='<table id="stats" class="table table-light table-bordered" style="width:100%; text-align:center;"><tr><td>Maximum Partition Size: '+this.maxPartsize+'</td></tr>'
      statString+='<tr><td>Average Partition Size: '+this.avgPartsize+'</td></tr>'
      statString+='<tr><td>Maximum Surface Index: '+this.maxSI.toFixed(2)+'</td></tr>'
      statString+='<tr><td>Average Surface Index: '+this.avgSI.toFixed(2)+'</td></tr>'
      statString+='<tr><td>Global Surface Index: '+this.globalSI.toFixed(2)+'</td></tr></table>'
      let pTable = '<table id="partitions" class="table table-light table-bordered" style="width:100%; text-align:center;"><thead class = "thead-dark"><tr><th scope="col" colspan="3" id="pt" style="text-align:center;">Partitions</th></tr><tr><th class="dtHeader">#</th><th scope="col" class="dtHeader">SI</th><th scope="col" class="dtHeader">|V|</th></tr></thead><tbody>';
      //uncomment line below to restore color scheme options functionality
     //this.colscheme=document.getElementById('ColoringScheme').value;
      if (this.colscheme == "rainbow") {
           //rainbow object constructor
           var rainbowGradiant = new Rainbow();
           rainbowGradiant.setNumberRange(0,360);
           rainbowGradiant.setSpectrum('ff0000','ffc000','00ff00','00ffff','0000ff','c700ff');
           for (var i=0;i < waypoints.length;i++) {
               updateMarkerAndTable(i, {color:"#"+ rainbowGradiant.colorAt((waypoints[i].partId * 223) % 360), scale:4, opacity:0.8, textColor: "white"} , 31, false); 
          }
          for (var e=0;e < graphEdges.length;e++) {
             if (waypoints[graphEdges[e].v1].partId == waypoints[graphEdges[e].v2].partId) {
                      updatePolylineAndTable(e,{color:"#"+ rainbowGradiant.colorAt((waypoints[graphEdges[e].v2].partId * 223) % 360), weight:4, opacity:0.8, textColor: "white"} , false);
             }
          }
         for (var i=0;i < this.numParts;i++) {
           var color="#"+ rainbowGradiant.colorAt((i * 223) % 360);
          pTable += '<tr id="partition' + i + '" custom-title = "Partition ' +i+'" onmouseover = "hoverP('+i+')" onmouseout = "hoverEndP('+i+')">';
          pTable+= '<td style ="word-break:break-all; text-align:center;" bgcolor='+color+'>'+i+'</td>'+'<td style ="word-break:break-all; text-align:center;" bgcolor='+color+'>' +this.surfaceIndices[i].toFixed(5)  + '</td>'+'<td style ="word-break:break-all; text-align:center;" bgcolor='+color+'>' +this.parts[i].length  + '</td></tr>';
         }
     }
     //add else if here if new option is added
 
   pTable += '</tbody></table>';
   return statString+pTable;
  }
};

//hover functions for when mouse hovers over data table entry
function hoverP(p) {
      if (hdxPart.colscheme == "rainbow") {
      //rainbow object constructor
           var rainbowGradiant = new Rainbow();
           rainbowGradiant.setNumberRange(0,360);
           rainbowGradiant.setSpectrum('ff0000','ffc000','00ff00','00ffff','0000ff','c700ff');
      for (var w=0; w < hdxPart.parts[p].length; w++) {
           updateMarkerAndTable(hdxPart.parts[p][w], {color:"#"+ rainbowGradiant.colorAt((p * 223) % 360), scale:8, opacity:1, textColor: "white"} , 31, false); 
      }
      }
    //add else if here if new option is added
  }

function hoverEndP(p) {
      if (hdxPart.colscheme == "rainbow") {
          //rainbow object constructor
           var rainbowGradiant = new Rainbow();
           rainbowGradiant.setNumberRange(0,360);
           rainbowGradiant.setSpectrum('ff0000','ffc000','00ff00','00ffff','0000ff','c700ff');
      for (var w=0; w < hdxPart.parts[p].length; w++) {
           updateMarkerAndTable(hdxPart.parts[p][w], {color:"#"+ rainbowGradiant.colorAt((p * 223) % 360), scale:4, opacity:0.8, textColor: "white"} , 31, false); 
      }
      }
    //add else if here if new option is added
  }

//This function makes the number selctor show up and dissappear depending on whether or not the checkbox is clicked for partHTML()
function partCallback() {
  // Get the checkbox
  var checkBox = document.getElementById("calcparts");
  // Get the output text
  var parts = document.getElementById("numpartsselector");

  // If the checkbox is checked, display the output text
  if (checkBox.checked == true) {
    parts.style.display = "inline-block";
  } else {
    parts.style.display = "none";
  }
}
