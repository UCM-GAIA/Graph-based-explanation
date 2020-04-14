// TAMAÑO DEL SVG

// const  
var w = 1100; //1500 // 875.4
var h = 730; //1100
var num_recs = 5; // number of recommendations for one user

// global variables
var nodes, links;
var contFiles = 0; // file where I am currently
var contFilesRec = 0; // to change the recommendation
var attr_constraints = new Array(); // to keep the attributes that the user does not want
var my_recs_data = new Array(); // num_recs is its length
var numInteractions = 0;
var myExample = "";
var visualization;


function init(){

	// Inicialización de las variables
	nodes = new Array(), links = new Array();
	contFiles = 0; // file where I am currently
	contFilesRec = 0; // to change the recommendation
	attr_constraints = new Array(); // to keep the attributes that the user does not want
	my_recs_data = new Array(); // num_recs is its length
	numInteractions = 0;

	// Ocultar botón change
	document.getElementById("changeRec").style.visibility="hidden";
};

$(function(){

	

	$("#btn_ver").click( function() {


		init();

		// Leer ejemplo seleccionado
		var result;
		var dir = $("#options").val();
		
		// Updating the steps -- entering a new example
		var text_ex = dir;
		var text_ex = text_ex.slice(0, -1);
		var result = text_ex.split("example");
		myExample = "Example " + result[1].toString(10);
		updateSteps(myExample);
		
		for(var i = 1; i <= num_recs; i++){
			result = loadFile(dir + "question" + i.toString(10) + ".json");
			my_recs_data.push(result);
		};
		sortGraphsByAttr();
		
		// the best recommendation is always the first one in the structure
		nodes = my_recs_data[0][0], links = my_recs_data[0][1];
		
		print_graph(nodes, links);
	});
});

// Cambiar la recomendación index??
function sortGraphsByAttr(){
	my_recs_data.sort(function (a, b) {
		if (a[2].length > b[2].length) {
			return -1;
		}
		if (a[2].length < b[2].length) {
			return 1;
		}
		// equals
		return 0;
	});
};

function loadFile(my_file){
	var result;
	$.ajax({
		async: false,
		url: "data/".concat(my_file),
		success: function(data) {
			nodes = data.nodes;
			links = data.links;
			
			var attributes = new Array();
			function getNameAttr(element) {
				if(element.type == "attribute")
					attributes.push(element.name);
			}
			
			nodes.forEach(getNameAttr);
			
			result = [nodes, links, attributes];
		}
	});

	return result;
	
};

function print_graph(nodes, links) {
	//d3.select("svg").remove();

	visualization = configure_visualization("#vis", w, h);

	var force = configure_forces(nodes, links, w, h);

	var result = configureSuperNode(visualization, nodes);
	var groupIds = result[0], paths = result[1];
	
    var link = configure_link(visualization, links);

    var node = configure_node(visualization, nodes, force);

	var supernode = d3.selectAll("#group_supernode");
	
    // Configuración de la función tick (donde pintar en cada tick)
	force.on("tick", function () {
        link.attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            }); 
        node.attr("transform", function (d) { 
			var maxNodeSize = 100;
            d.x =  Math.max(maxNodeSize, Math.min(w - (d.imgwidth/2 || 16), d.x));
			d.y =  Math.max(maxNodeSize, Math.min(h - (d.imgheight/2 || 16), d.y));
			return "translate(" + d.x + "," + d.y + ")";
        });
		
		updateGroups(supernode, groupIds, paths);
    });
	
	force.start();
}

function configure_visualization(id, width, height) {
		
	var svg =  d3.select(id)
				.append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr({
					"width": "100%",
					"height": "100%"
				})
				.attr("viewBox", "0 0 " + width + " " + height )
				.attr("preserveAspectRatio", "xMidYMid meet");
				
	return svg;
}

function configure_forces(nodes, links, width, height) {
	var force = d3.layout.force()
				.nodes(nodes)
				.links(links)
				.gravity(0.05)
	            .distance(20) 
	            .charge(-2000) // -5000
	            .size([width, height]);

    return force;
}

function configure_link(visualization, links) {
	return visualization.selectAll(".link")
                .data(links)
                .enter().append("line")
                .style("stroke", "#B0E0E6")
				.style("stroke-width", "4px");
}

function configureSuperNode(visualization, nodes) {
	// create groups
	var groups = visualization.append('g').attr('class', 'groups');
    var groupIds = d3.set(nodes.map(function(n) { return n.type; }))
		.values()
		.map( function() {
		  return { 
			groupId : "supernode",
			count : nodes.filter(function(n) { return n.type == "attribute"; }).length
		  };
		})
		.filter( function(group) { return group.count > 2})
		.map( function(group) { return group.groupId; });
	 
	var paths = groups.selectAll('.path_placeholder')
		.data(groupIds, function(d) { return +d; })
		.enter()
		.append('g')
		.attr('class', 'path_placeholder')
		.append('path')
		.attr("stroke", "#FFDAB9")
		.attr("fill", "#FFDAB9")
		.style("opacity", .2);
		
	var result = [groupIds, paths];
	return result;
}

// Pasar ratón encima de película y aparece título
function mouseEventsVisibility(my_node, state){
	var my_item = my_node;
	var my_id = ".text" + my_item.id.toString(10);
	d3.select(my_id)
		.style("visibility", function () {
			if (my_item.type != "attribute")
				return state;
		});
}

// Cómo se visualizan nodos
function configure_node(visualization, nodes, force) {
	// Configuración de los nodos
	var node = visualization.selectAll("g.node")
				.data(nodes, function(d) { return d.id; })
				.enter().append("g")
				.attr("id", function(d) { 
					if (d.type != "explanatory_item")
						return "group_" + "supernode"; 
				})
				//.on("dblclick", function(d) {click(d);}) mousedownNode
				.on("dblclick", mousedownNode)
				.call(force.drag);

	// Configuración de los circulos de los nodos
	node.append("circle")
	  .attr("r", function (d) {
	  		if (d.type == "attribute")
	  			return 20;
	  		else
	  			return 0;
	  	})
	  .style("fill", "#FFDAB9")
	  .style("opacity", .1);
	  
	
	// Configuración del texto de los nodos
	node.append("text")
		.attr("class", function(d) { return "text" + d.id.toString(10); })
		.attr("dx", function (d) {
        	if (d.type == "attribute")
            	return -18;
			else
				return 80;
        })
        .attr("dy", 10)
        .style("font-size", "14px") //20px
        .style("font-family", "Trebuchet MS")
		.style("visibility", function (d) {
        	if (d.type != "attribute")
				return "hidden"
        })
        .text(function (d) {
			return d.name
        });

    // Configuración de las imágenes de los nodos
    node.append("svg:image")
	  	.attr("xlink:href",  function(d) { 
	  		if (d.type == "explanatory_item" || d.type == "movie_recommended")
	  			return d.img;
		})
		.attr("x", function(d) { return -35;}) 
		.attr("y", function(d) { return -35;})
		.attr("height", 70) //100
		.attr("width", 70) //100
		.on( 'mouseenter', function(n) {
			// select element in current context
			d3.select( this )
				.transition()
				.attr("x", function(d) { return -70;}) 
				.attr("y", function(d) { return -70;})
				.attr("height", 140) 
				.attr("width", 140);
			mouseEventsVisibility(n, "visible");
		})
		// set back
		.on( 'mouseleave', function(n) {
			d3.select( this )
				.transition()
				.attr("x", function(d) { return -35;}) 
				.attr("y", function(d) { return -35;})
				.attr("height", 70) 
				.attr("width", 70);
			mouseEventsVisibility(n, "hidden");
			});
			

	return node;
}

// Crear un grupo y creamos el supernodo
function updateGroups(supernode, groupIds, paths) {
	var scaleFactor = 1.2; // to draw the groups

	// to draw the supernode
	var valueline = d3.svg.line()
		  .x(function(d) { return d[0]; })
		  .y(function(d) { return d[1]; })
		  .interpolate("curveLinearClosed");
		  
	var polygonGenerator = function(groupId) {
		var node_coords = supernode // node
		.data()
		.map(function(d) { return [d.x, d.y]; });
		
		return d3.polygonHull(node_coords);
	};
	
	
	groupIds.forEach(function(groupId) {
		var path = paths.filter(function(d) { return d == groupId;})
			.attr('transform', 'scale(1) translate(0,0)')
			.attr('d', function(d) {

				polygon = polygonGenerator(d);   
				centroid = d3.polygonCentroid(polygon);

				return valueline(
					polygon.map(function(point) {
						return [  point[0] - centroid[0], point[1] - centroid[1] ];
					})
				);
			});

			d3.select(path.node().parentNode).attr('transform', 'translate('  + centroid[0] + ',' + (centroid[1]) + ') scale(' + scaleFactor + ')');
		});
		
}

function zoomClick(){
	zoomValue = zoomValue - 0.05;
	clickedZoom(zoomValue);
}

function unZoomClick(){
	if(zoomValue <= 1)
		zoomValue = zoomValue + 0.05;
	clickedZoom(zoomValue);
}

// Esto es el Zoom
var zoomValue = 1; // mover arriba
function clickedZoom(value) {
	
	
	visualization.attr({
		"width": "100%",
		"height": "100%"
	})
	.attr("viewBox", "0 0 " + (w*value) + " " + (h * value))
	.attr("preserveAspectRatio", "xMidYMid meet")
	.style("overflow", "auto");
	
	// for doing the zoom; solution?: http://bl.ocks.org/shawnbot/6518285
	/*var zoom = d3.behavior.zoom()
		.scaleExtent([1, 10])
		.center([w / 2, h / 2])
		//.size([w, h])
		.on("zoom", zoomed);
		
	function zoomed() {
		visualization.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
	};

	visualization.call(zoom.event);

	zoom.scale(zoom.scale() * Math.pow(2, + value));

	visualization.transition().duration(750).call(zoom.event);*/
	
};



// function that check if there is at least an attribute between two graphs
// removeNode is the set of the attributes that the user wants to keep
// 
// Comparación entre atributos en común entre grafos de un mismo ejemplo
function compareAttr(my_attribute, set_attributes, cont, removeNode){
	
	// First, I have to check if there is a constraint with the attributes that keeps in the node (with several attributes)
	if(removeNode == true) removeNode = ""
	// I have to split removeNode into an array if there is several attributes
	var checkCommaRemove = removeNode.indexOf(',');
	var removeNodeArray = new Array();
	// In that case, the attribute is multiple and I have to separate
	if (checkCommaRemove != -1){			
		var tmp = removeNode.split(", ");
		tmp.forEach(element => removeNodeArray.push(element));
	} else {
		removeNodeArray.push(removeNode);
	};
	
	
	function checkRemoveNode(element){
		if (removeNodeArray.includes(element) == false){ // If the element is in the array
			attr_constraints.push(element);
		}
	};
	
	if (cont == 0){ // I check if it is the first time to add the element to the array
		// First, I check if the string has a comma. 
		var checkComma = my_attribute.indexOf(',');
		//var first = Array();
		// In that case, the attribute is multiple and I have to separate, getting a new array
		if (checkComma != -1){			
			var first = my_attribute.split(", ");
			
			//first.forEach(element => attr_constraints.push(element));
			first.forEach(checkRemoveNode);
		} else {// else, I have to push the element in an array with one element
			attr_constraints.push(my_attribute);
		};
	}
	console.log(attr_constraints);
	// Later, I have to do the same thing with all of the elements in the set_attributes
	// I have to go through the array and check if there is a comma
	var second = Array();
	function getSecond(element) {
		var checkCommaElement = element.indexOf(',');
		if (checkCommaElement != -1){
			var secondElement = element.split(", ");			
			secondElement.forEach(element2 => second.push(element2));
		} else {// else, I have to push the element in an array with one element
			second.push(element);
		};
	};
	
	set_attributes.forEach(getSecond);
	
	// Finally I have to get the intersection
	var intersection = attr_constraints.filter(function(x) {
		if(second.indexOf(x) != -1)
			return true;
		else
			return false;
	});
	// false if there is not intersection, true if it is intersection
	if (intersection.length == 0) 
		return false;
	else
		return true;
};

// Comprobar si 2 nodos están unidos
function nodeIsTarget(d, n, links){
	var isTarget = false;
	var i = 0;
	
	while (i < links.length && isTarget == false){
		var l = links[i];
		if (l.source == d && l.target == n) {
			isTarget = true;
		}
		else
			i++;
	}
	return isTarget;
};

// get what is the best recommendation that does not include the attributes the user does not like
// //index.js
function changeGraph(d, my_attribute, removeNode) {
	var attrInSet = true;
	//var result;
	var cont = 0;
	while (attrInSet == true && cont < num_recs){
		//my_attribute = d.name;
		
		var attributes_new_graph = my_recs_data[cont][2];
		attrInSet = compareAttr(my_attribute, attributes_new_graph, cont, removeNode);
		
		if (attrInSet == true)
			cont++;
	}
	if (cont >= num_recs){ 
		console.log("reiniciar");
		attr_constraints = Array();
	};
	
	return cont;
}

// get the node with the recommendation that has the current name
function getName(current){
	var node = my_recs_data[current][0].filter(function(n) {
		if (n.type == 'movie_recommended')
			return n;
	})[0].name;
	return node;
};

// function to check if I have to display the prompt again because users 
// have not included the attributes in the good format
// 
// Sobra??
function checkRepetition(original, promptValue){
	
	var repeatPrompt = true;
	if (original != promptValue){
		// check if promptValue is a value of original 
		var attrOriginalArray = original.split(", ");
		var checkComma = promptValue.indexOf(',');
		if (checkComma != -1){	
			var promptValueArray = promptValue.split(", ");
			
			// check if all of the values in promptValue are in original
			repeatPrompt = promptValueArray.every(i => attrOriginalArray.includes(i));
			
		} else {
			console.log("repetition");
			// check if promptValue (that has one value) is in original
			repeatPrompt = attrOriginalArray.includes(promptValue);
			
		}
		
	}
	
	return repeatPrompt;
};


// get the array (nodes, links and attributes) with the recommendation with this name
// 
// Devuelve la posición de una recomendación (revisar)
function findStructureWithName(name){
	var i = 0;
	var found = false;
	while (i < num_recs && !found){
		if (getName(i) == name){
			found = true;
		}
		else
			i++;
	}
	return i;
}

// Quita un nodo
function eliminateNode(i, d, removeNode){
	
	var my_attribute = d.name;
	var attributes = new Array();
	
	// ************ STATE OF THE CURRENT GRAPH
	// If there is only an attribute in the node, I delete the node, the links and its children
	if (removeNode == true){
		nodes.splice(i, 1);
		nodes = nodes.filter(function(n) {
			if (nodeIsTarget(d, n, links) == false)
				return n;
		});
		links = links.filter(function(l) {
			return l.source !== d && l.target !== d;
		});
		var attributes_nodes = nodes.filter(function(n) {
			if (n.type == 'attribute')
				return n;
		});
		
		for (var i = 0; i < attributes_nodes.length; i++)
			attributes.push(attributes_nodes[i].name);
		
		//d3.event.stopPropagation();
		
	} else{
		// If the node has several attributes, I keep the attribute that the user wants to keep
		
		// I change the name in the node
		nodes = nodes.filter(function(n) {
			if (n.name == d.name){
				n.name = removeNode
				return n;
			} else return n;
		});
		
		var attributes_nodes = nodes.filter(function(n) {
			if (n.type == 'attribute')
				return n;
		});
		
		for (var i = 0; i < attributes_nodes.length; i++){
			attributes.push(attributes_nodes[i].name);
		};
		
		console.log("No quitar nodo");
	}
	
	
	// I load the new state of my current graph
	my_recs_data[contFiles][0] = nodes;
	my_recs_data[contFiles][1] = links;
	my_recs_data[contFiles][2] = attributes;
	
	//console.log(my_recs_data[contFiles]);
	
	// ************ STATE OF THE PROGRAM
	// TO ASK IF THE USER WANTS TO CHANGE THE REC 
	// I save the name of the previous recommendation
	var previousName = getName(contFiles);		
	
	// I sort the recommendations by the number of nodes of attributes
	sortGraphsByAttr();
	
	// I check if I have to change the graph (if there is a new graph with less amount of links without the attributes the user doesnt like)
	contFiles = changeGraph(d, my_attribute, removeNode) ;
	// To change the recommendation
	contFilesRec = contFiles;
	
	// TO ASK IF THE USER WANTS TO CHANGE THE REC
	// I save the current name of the recommendation
	var currentName = getName(contFiles);
	
	if (previousName != currentName){ // I check if the recommendation is the same than the previous one
		//if (confirm("Según tus preferencias, tenemos una mejor recomendación para ti, ¿Quieres cambiarla?") == false) {
			
			// I find the array with the data from the previous recommendation
			var tmp_i = findStructureWithName(previousName);
			var tmp_str = my_recs_data[tmp_i];
			
			// I do not change the recommendation
			nodes = tmp_str[0];
			links = tmp_str[1];
			
			// I have to keep the contFiles according the index in which is the tmp_str
			contFiles = tmp_i;
			document.getElementById("changeRec").style.visibility="visible";
	};

	// ************ DRAW 
	// I draw the graph
	print_graph(nodes, links);
}

// Cuando se hace click en un atributo
function mousedownNode(d, idx) {
	// the process is carried out only if the node clicked is an attribute
	if (d.type == "attribute"){
		numInteractions++; // to show the number of interaction when the button like is clicked
		var my_attribute = d.name;
		
		// removeNode is true when the node clicked has one attribute
		// removeNode is a string with the vale that the user has written in the prompt (the attributes that she wants to keep)
		// First, I check if the string has a comma. 
		var checkComma = my_attribute.indexOf(',');
		
		// In that case, the attribute is multiple and I have to separate
		if (checkComma != -1){		

			var attrOriginal = my_attribute.split(", ");
			
			var my_checkboxes = new Array();
			for(var i = 0; i < attrOriginal.length; i++){
				var myObject = {text: attrOriginal[i], value: attrOriginal[i]}; 
				my_checkboxes.push(myObject);
			};
			
			// show the prompt to the user
			bootbox.prompt({
				title: "Click the checkbox of the attributes that you want to keep!",
				value: attrOriginal,
				inputType: 'checkbox',
				inputOptions: my_checkboxes,
				callback: function (result) {
					if (result == null){
						eliminateNode(idx, d, my_attribute);
					} 
					else if (result.length == 0) {
						updateSteps("Revomed the attribute " + my_attribute);
						eliminateNode(idx, d, true);
					}
					else {
						var resultString = result[0];
						for (var i = 1; i < result.length; i++){
							resultString = resultString + ", " + result[i];
						};
						
						if (resultString === my_attribute){
							eliminateNode(idx, d, my_attribute);
						} else {
							// to update steps
							var intersection = attrOriginal.filter(function(x) {
								if(result.indexOf(x) == -1)
									return true;
								else
									return false;
							});
							console.log(intersection);
							var resultStringText = intersection[0];
							for (var i = 1; i < intersection.length; i++){
								resultStringText = resultStringText + ", " + intersection[i];
							};
							
							updateSteps("Revomed the attribute " + resultStringText);
							eliminateNode(idx, d, resultString); 
						}
					}	
				}
			});
			
		} else {
			updateSteps("Revomed the attribute " + my_attribute);
			eliminateNode(idx, d, true);
		};
		
	}
};

// change to the more explanaible recommendation
function changeToBestRecommendation(){
	nodes = my_recs_data[contFilesRec][0];
	links = my_recs_data[contFilesRec][1];
	contFiles = contFilesRec;
	numInteractions++; // to show the number of interaction when the button like is clicked
	
	updateSteps("Changed recommendation");
	document.getElementById("changeRec").style.visibility="hidden";
	print_graph(nodes, links);
};

// HECHo !!!
function like(){
	bootbox.alert({message: "You liked the recommendation! You have interacted " + numInteractions.toString(10) + " times with the system. Write it down!", size: 'small'});
	updateSteps("You liked the " + myExample + " with " + numInteractions.toString(10) + " interactions");
};

// HECHo !!!
function dislike(){
	bootbox.alert({message: "You didn't like the recommendation! You have interacted " + numInteractions.toString(10) + " times with the system. Write it down!", size: 'small'});
	updateSteps("You didn't like the " + myExample + " with " + numInteractions.toString(10) + " interactions");
};

// HECHO !!!
function updateSteps(new_action) {
  var ul = document.getElementById("steps_list");
  var li = document.createElement("li");
  li.appendChild(document.createTextNode(new_action));
  ul.appendChild(li);
}
