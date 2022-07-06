The Highway Data Examiner (HDX) can be installed on any web server.  In addition to installing the files here, it requires access to the Travel Mapping "lib" directory to find common code and images.  A copy of TravelMapping/Web can be installed for this purpose.  In the HDX installation directory, "tmlib" needs to be a copy of TravelMapping/Web/lib or be a link to one.

The main index page `index.php` takes optional query string parameters to control what happens at startup.

* `load=tmgfilename` will attempt to load a `.tmg` file from the TM/METAL graph data repository.
* `noav` bypasses the AV selection panel after a file is loaded.

The JS code for HDX is split among several files for easier management.

* `hdxapclosestpts.js` contains the implementation for the brute force All Points Closest Pairs AV.
* `hdxav.js` contains the  `hdxAV` object, which is the main AV engine.
* `hdxavcp.js` contains functionality of the Algorithm Visualization Control Panel (AVCP).
* `hdxbfchav.js` contains the implementation for the brute-force convex hull AV.
* `hdxbftravelav.js` contains the implementation of the brute force traveling salesman problem AV.
* `hdxbreakpoints.js` contains conditional breakpoint support.
* `hdxcallbacks.js` contains implementation of UI callback functions.
* `hdxclosestpairsrecav.js` contains the recursive implementation of the vertex closest pairs AV.
* `hdxcustomtitles.js` contains the implementation of custom 'title' attributes (larger text)
* `hdxdegreeav.js` contains the implementation of the vertex degree extremes search AV.
* `hdxdfsrecav.hs` contains the implementation of the recursive depth-first traversal AV.
* `hdxedgeextremesav.js` contains the implementation of the edge-based extremes search AV.
* `hdxextremepairsav.js` contains the implementation of the extreme pairs (closest and furthest pairs) AV.
* `hdxgraphcoloringav.js` contains the implementation of the Welsh-Powell graph coloring algorithm visualization.
* `hdxgraphsearchbox.js` contains the functionality related to the "Option 1" search box for loading graph data.
* `hdxhover.js` contains the implementation of "hover over" highlighting of graph vertices and edges.
* `hdxinit.js` provides the `HDXInit` function called on the main HDX page load.
* `hdxjsfuncs.js` contains miscellaneous functions and data.
* `hdxkruskalav.js` contains the implementation of the Kruskal's algorithm AV.
* `hdxlinear.js` contains the implementation of the `HDXLinear` objects, which reprsent the structures including stacks, queues, and priority queues, with a representation in the AVCP.
* `hdxmenufuncs.js` contains the implementation of the various panels in HDX.
* `hdxnoav.js` contains the implementation of the dummy "no AV selected" AV.
* `hdxorderingav.js` contains the implementation of the 1D traversal AV.
* `hdxpresort.js` contains the waypoint sorting needed for recursive closest pairs.
* `hdxpseudocode.js` contains functions related to pseudocode display and highlighting.
* `hdxqs.js` contains the support for Query String parameters.
* `hdxquadtreeav.js` contains the implementation of the quadtree construction AV.
* `hdxsimplebridgeav.js` contains the implementation of the naïve bridge detection AV.
* `hdxtravspanavs.js` contains the implementations of the graph traversal (BFS, DFS, RFS) and spanning tree (Dijkstra's, Prim's) AVs.
* `hdxtwicearoundtreeav.js` contains the implementation of the twice-around-the-tree traveling salesman approximation AV.
* `hdxvertexextremesav.js` contains the implementation of the vertex-based extremes search AV.
* `hdxvertexselector.js` contains the implemenation of the vertex selector objects, which allow the selection of a vertex as an AV parameter by entering its number, clicking on it on the map, or clicking on it in the data table.
* `hdxvisualsettings.js` contains the object that defines visual settings (colors, sizes, opacities) that are used consistently across multiple AVs.
* `hdxpartitionerrecursive.js` contains the implemenatation of a recursive coordinate bisection AV.
* `hdxpart.js` contains a structure and supporting methods for partitioning algorithms.
