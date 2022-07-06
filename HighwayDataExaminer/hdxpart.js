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
   partitionAnalysis(){
      this.setWaypointFields();
      this.partSizes();
      this.surfaceIndex();
   },

//Calculates the surface Indice Stats
   surfaceIndex(){
        var boundaryEdges=new Array(this.numParts).fill(0);
        var PartEdges=new Array(this.numParts).fill(0);
        var globalBoundaryEdges=0;
        for(var e=0;e<graphEdges.length;e++){
             if(waypoints[graphEdges[e].v1].partId==waypoints[graphEdges[e].v2].partId){ PartEdges[waypoints[graphEdges[e].v1].partId]++;}
             else{
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
        for(var i=0;i<this.numParts;i++){
              this.surfaceIndices[i]=boundaryEdges[i]/PartEdges[i];
              this.avgSI+=this.surfaceIndices[i];
              if(this.surfaceIndices[i]>this.maxSI)this.maxSI=this.surfaceIndices[i];
        }
        this.avgSI/=this.numParts;
   },

//calculates Partition sizes
  partSizes(){
      var avg=0;
      var max=-999;
      for(var i=0; i<this.numParts;i++){
          avg+=this.parts[i].length;
          if(this.parts[i].length>max){ max=this.parts[i].length;}
      }
      avg/=this.numParts;
      this.avgPartsize=avg;
      this.maxPartsize=max;
   },
   setWaypointFields(){
      for(var r=0; r<this.numParts;r++){
          for(var c=0; c<this.parts[r].length; c++){
              waypoints[this.parts[r][c]].partId =r;
          }
      }
   },

//Builds the string for AVs to use to add in the color scheme option
   colorHtml(){
        return `Coloring Scheme: <select id="ColoringScheme">
        <option value="rainbow">Rainbow</option></select>`;
        //<option value="random">Random</option>
        


   },

//Colors the partitions and builds the HTML strings for the table and hovering
  styling(){
      let statString='<table id="stats" class="table table-light table-bordered" style="width:100%; text-align:center;"><tr><td>Maximum Partition Size: '+this.maxPartsize+'</td></tr>'
      statString+='<tr><td>Average Partition Size: '+this.avgPartsize+'</td></tr>'
      statString+='<tr><td>Maximum Surface Index: '+this.maxSI+'</td></tr>'
      statString+='<tr><td>Average Surface Index: '+this.avgSI+'</td></tr>'
      statString+='<tr><td>Global Surface Index: '+this.globalSI+'</td></tr></table>'
      let pTable = '<table id="partitions" class="table table-light table-bordered" style="width:100%; text-align:center;"><thead class = "thead-dark"><tr><th scope="col" colspan="3" id="pt" style="text-align:center;">Partitions</th></tr><tr><th class="dtHeader">#</th><th scope="col" class="dtHeader">SI</th><th scope="col" class="dtHeader">|V|</th></tr></thead><tbody>';
      var colscheme=document.getElementById('ColoringScheme').value;
      if(colscheme=="rainbow"){
           //rainbow object constructor
           var rainbowGradiant = new Rainbow();
           rainbowGradiant.setNumberRange(0,360);
           rainbowGradiant.setSpectrum('ff0000','ffc000','00ff00','00ffff','0000ff','c700ff');
           for(var i=0;i<waypoints.length;i++){
               updateMarkerAndTable(i, {color:"#"+ rainbowGradiant.colorAt((waypoints[i].partId * 223) % 360), scale:4, opacity:0.8, textColor: "white"} , 31, false); 
          }
         for(var i=0;i<this.numParts;i++){
           var color="#"+ rainbowGradiant.colorAt((i * 223) % 360);
          pTable += '<tr id="partition' + i + '" custom-title = "Partition' +i+'" onmouseover = "hoverP('+i+')" onmouseout = "hoverEndP('+i+')">';
          pTable+= '<td style ="word-break:break-all; text-align:center;" bgcolor='+color+'>'+i+'</td>'+'<td style ="word-break:break-all; text-align:center;" bgcolor='+color+'>' +this.surfaceIndices[i].toFixed(5)  + '</td>'+'<td style ="word-break:break-all; text-align:center;" bgcolor='+color+'>' +this.parts[i].length  + '</td></tr>';
         }
     }
     else if(colscheme=="random"){
          for(var r=0; r<this.numParts;r++){
               var currColor=Math.trunc(Math.random()*16777215);
               console.log(currColor.toString(16));
               for(var c=0; c<this.parts[r].length; c++){
                     updateMarkerAndTable(this.parts[r][c], {color:"#"+ currColor.toString(16), scale:4, opacity:1, textColor: "white"} , 31, false);
               }
          }
      }
   pTable += '</tbody></table>';
   return statString+pTable;
  }
};

function hoverP(p){
      //rainbow object constructor
           var rainbowGradiant = new Rainbow();
           rainbowGradiant.setNumberRange(0,360);
           rainbowGradiant.setSpectrum('ff0000','ffc000','00ff00','00ffff','0000ff','c700ff');
      for(var w=0; w<hdxPart.parts[p].length; w++){
           updateMarkerAndTable(hdxPart.parts[p][w], {color:"#"+ rainbowGradiant.colorAt((p * 223) % 360), scale:8, opacity:1, textColor: "white"} , 31, false); 
      }
  }

function hoverEndP(p){
      //rainbow object constructor
           var rainbowGradiant = new Rainbow();
           rainbowGradiant.setNumberRange(0,360);
           rainbowGradiant.setSpectrum('ff0000','ffc000','00ff00','00ffff','0000ff','c700ff');
      for(var w=0; w<hdxPart.parts[p].length; w++){
           updateMarkerAndTable(hdxPart.parts[p][w], {color:"#"+ rainbowGradiant.colorAt((p * 223) % 360), scale:4, opacity:0.8, textColor: "white"} , 31, false); 
      }
  }
