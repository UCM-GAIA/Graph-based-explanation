/**
 * Fichero encargado de pintar los grafos en el elemento SVG de la página.
 *
 * @author: Marta Caro-Martínez, Jose L. Jorro-Aragoneses
 * @version: 1.0
 */

/**
 * Constantes aplicadas en la visualización de los grafos
 */
const SVG_WIDTH = screen.availWidth; //1500
const SVG_HEIGTH = screen.availHeight; //652
const LINK_COLOR = "#B0E0E6";
const SUPERNODE_COLOR = "#FFDFD3";//"#FFCBA3";
const SUPERNODE_SIZE = 360; 
const INTERNAL_NODE_COLOR = "#E0BBE4";//"#BCA8E6";
const INTERNAL_NODE_SIZE = 200;
const LABEL_COLOR = "#782664"; 
const IMG_SIZE = 100;

/**
 * Constantes para el sistema de fuerzas
 */
const GRAVITY = 0.05;
const CHARGE = -4000; //-2000

/**
 * Variables globales
 */
var svg = null;
var g = null;
var SIZE_WINDOW = 100;

function init_svg(id) {
	
	svg = d3.select(id)
			.append('svg')
			.attr("width", SVG_WIDTH)
			.attr("height", SVG_HEIGTH)
			/*.attr({
					"width": "100%",
					"height": "100%"
				})*/
			.attr("viewBox", "0 0 " + SVG_WIDTH + " " + SVG_HEIGTH );

};

function paint_graph(nodes, links, newExample) {
	
	if(newExample){
		// We take off the zoom to see the whole graph when we change the recommendation 
		svg.attr({
			"width": "100%",
			"height": "100%"
		});
		SIZE_WINDOW = 100;
	}

	d3.selectAll("svg > *").remove(); // to remove all the elements inside the svg
	
	let force = configure_forces(nodes, links);
	
	// configure and draw supernodes
	let supernodes_data = configure_supernodes_graph(nodes);
	
	// configure and draw the links
	let link = configure_link(links);

	// configure and draw the nodes
    let node = configure_node(nodes, force);
	let supernode = d3.selectAll("#group_supernode");
	
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
            d.x =  Math.max(maxNodeSize, Math.min(SVG_WIDTH - (d.imgwidth/2 || 16), d.x));
			d.y =  Math.max(maxNodeSize, Math.min(SVG_HEIGTH - (d.imgheight/2 || 16), d.y));
			return "translate(" + d.x + "," + d.y + ")";
        });
		
		updateGroups(supernode, supernodes_data[0], supernodes_data[2], nodes);
		updateGroups(supernode, supernodes_data[1], supernodes_data[3], nodes);
		
    });
	
	force.start();
};

/**
 * Funcion para crear el zoom
 * @param  value		valor a aumentar o decrementar en el svg
 */
function clickedZoom(value) {
	SIZE_WINDOW = SIZE_WINDOW + value; 
	
	svg.attr({
		"width": SIZE_WINDOW.toString(10) + "%",
		"height": SIZE_WINDOW.toString(10) + "%"
	});
};

/**
 * Función que inicializa el sistema de fuerzas.
 * @param nodes lista con los nodes del grafo.
 * @param links lista con todas las arístas del grafo.
 * @return devuelve el objeto con el sistema de fuerzas inicializado.
 */
function configure_forces(nodes, links) {
	let DISTANCE = 5;
	
	// to change the distance of the links according to the number of nodes in the supernode
	if (get_length_attributes(nodes) >= 2 && get_length_attributes(nodes) < 5){
		DISTANCE = 60;
	} else if (get_length_attributes(nodes) === 1){
		DISTANCE = 70;
	}
	
	let force = d3.layout.force()
				.nodes(nodes)
				.links(links)
				.gravity(GRAVITY)
	            .distance(DISTANCE) 
	            .charge(CHARGE)
	            .size([SVG_WIDTH, SVG_HEIGTH]);

	return force;
}

/**
 * Función que configura los dos supernodos que va a haber en el grafo
 * pertenecen al supernodo.
 * @param  nodes lista con los nodes del grafo
 * @return variables necesarias para actualizar ambos supernodos
 */
function configure_supernodes_graph(nodes) {
	// configure and paint the paths of the supernode
	let groupInfo = configure_supernode(nodes);
	
	let groups = groupInfo[0], groupIds = groupInfo[1];
	let groupPaths = paint_supernode(groups, groupIds, nodes, SUPERNODE_SIZE, SUPERNODE_COLOR);
	
	
	// configure and paint the paths of the internal supernode
	let groupInfoInternal = configure_supernode(nodes);
	
	let groupsInternal = groupInfoInternal[0], groupIdsInternal = groupInfoInternal[1];
	let groupPathsInternal = paint_supernode(groupsInternal, groupIdsInternal, nodes, INTERNAL_NODE_SIZE, INTERNAL_NODE_COLOR);
	
	// devuelvo las variables que necesitamos para actualiza los supernodos
	let results = new Array();
	results.push(groupIds);
	results.push(groupIdsInternal);
	results.push(groupPaths);
	results.push(groupPathsInternal);
	
	return results;
};

/**
 * Función que configura el grupo de elementos que
 * pertenecen al supernodo.
 * @param  nodes lista con los nodes del grafo
 * @return {[type]}       [description]
 */
function configure_supernode(nodes) {

	// Creamos el elmento que representará el super nodo
	let groups = svg.append("g")
					.attr("class", "group");

	let groupIds = d3.set(
						 nodes.map(function(n) {
							return n.type;
						 }))
						 .values()
						 .map(function() {
						 	return {
						 		groupId: "supernode",
						 		count: nodes.filter(function(n){return n.type == "attribute";}).length
						 	}
						 })
						 .filter(function(group){ return group.count > 0;}) 
						 .map(function(group) {return groups});
	
	let result = [groups, groupIds];				 
	return result;
};

/**
 * Función auxiliar que calcula el numero de nodos atributos que hay en mi grafo
 * @param  nodes	array de nodos de mi grafo
 * @return numero de nodos atributo en mi grafo
 */
function get_length_attributes(nodes){
	let attr_nodes_len = nodes.filter(function(n) {
		if (n.type === 'attribute')
			return n;
	}).length;
	return attr_nodes_len;
};


/**
 * Función que dibuja las lineas que
 * pertenecen al supernodo.
 * @param  groups	elemento del svg donde se dibuja el supernodo
 * @param  groupIds	ids de los nodos que pertenecen al supernodo
 * @return {[type]}      lineas del supernodo
 */
function paint_supernode(groups, groupIds, nodes, size, color) {		
	let	paths = groups.selectAll('.path_placeholder')
					  .data(groupIds, function(d) { return +d; })
					  .enter()
					  .append('g')
					  .attr('class', 'path_placeholder')
					  .append('path')
					  .attr("stroke", color) // SUPERNODE_COLOR
					  .attr("fill", color)
					  //.style("opacity", 0.5)
					  .style("stroke-width", size) //300
					  .style("stroke-linecap", "round")
					  .style("stroke-linejoin", "round");	
	
	
	
	// to change the dimensions of the supernode according to the number of the nodes inside the supernode
	//if (get_length_attributes(nodes) > 2 && get_length_attributes(nodes) < 5){
		//paths.style("stroke-width", (size - 20)); //280
	//} else 
	if (get_length_attributes(nodes) <= 2){ 
		paths.style("stroke-width", (size - 60)); //240	
	}		
	//} else if (get_length_attributes(nodes) === 1){
	//	paths.style("stroke-width", (size - 60)); //150
	//}
	
	
		
	return paths;
};

/**
 * Función que dibuja las lineas de los enlaces
 * @param  links	lista de enlaces obtenida del json
 * @return el conjunto de lineas en el svg que dibujan los enlaces
 */
function configure_link(links) {
	return svg.selectAll(".link")
                .data(links)
                .enter().append("line")
                .style("stroke", LINK_COLOR)
				.style("stroke-width", "4px");
}



/**
 * Función que configura los nodos y los dibuja
 * @param  links	lista de enlaces obtenida del json
 * @return el conjunto de lineas en el svg que dibujan los enlaces
 */
function configure_node(nodes, force) {
	// Configuración de los nodos
	let node = svg.selectAll("g.node")
				.data(nodes, function(d) { return d.id; })
				.enter().append("g")
				.attr("class", function(d) { 
					return "node_" + d.id; 
				})
				.attr("id", function(d) { 
					if (d.type != "explanatory_item")
						return "group_" + "supernode"; 
				})
				.on( 'mouseenter', function(n) {
					if(n.type === "attribute"){
						d3.select("#x_" + n.id)
						  .style("visibility", "visible")
						  .style("opacity", "0.2");
					}
				})
				.on( 'mouseleave', function(n) {
					if(n.type === "attribute")
						d3.select("#x_" + n.id).style("visibility", "hidden");
				})
				.call(force.drag);
	
	drawImages(node);
	drawText(node, get_length_attributes(nodes)); 
	
	return node;
};

// Function que captura el evento de doble click
function mousedownNode(d, idx) {
	if (d.type == "attribute"){
		var checkComma = d.name.indexOf(',');
		if (checkComma != -1){	
			var attrOriginal = d.name.split(", ");
			
			var my_checkboxes = new Array();
			for(var i = 0; i < attrOriginal.length; i++){
				var myObject = {text: attrOriginal[i], value: attrOriginal[i]}; 
				my_checkboxes.push(myObject);
			};
			
			
			// show the prompt to the user
			bootbox.prompt({
				title: "Click the checkbox of the attributes that you want to delete!",
				buttons: {
					'cancel': {
						label: 'Cancel',
						className: 'btn-default pull-left'
					},
					'confirm': {
						label: 'Delete',
						className: 'btn-danger'
					}
				},
				inputType: 'checkbox',
				inputOptions: my_checkboxes,
				callback: function (result) {
					// result == null --> cancel, result.length == 0 -> no ha marcado ningun checkbox
					if (result != null && result.length != 0){ 
						for(var i = 0; i < result.length; i++){
							removeAttribute(result[i]);
							addStep("Removed the attribute " + result[i]);
						}
					} 
				}
			});
			
		} else { // hay un unico atributo en el nodo
			removeAttribute(d.name);
			addStep("Removed the attribute " + d.name);
		}
		
	}
}

function getBBox(selection) {
    selection.each(function(d){d.bbox = this.getBBox();})
}

/**
 * Función que dibuja el texto de los nodos 
 * @param  node		nodos dentro del svg
 */
function drawText(node, num_nodes){
	// Configuración del texto de los nodos
	node.append("text")
		.attr("class", function(d) { return "text" + d.id.toString(10); })
		.attr("dx", function (d) {
        	if (d.type == "attribute")
            	return -18;
			else
				return IMG_SIZE - 15;
        })
        .attr("dy", 8)
        .style("font-size", "18px")
        .style("font-family", "Trebuchet MS")
		.style("visibility", function (d) {
        	if (d.type != "attribute")
				return "hidden"
        })
        .text(function (d) {
			return d.name
        }).call(getBBox);
		
	// to insert a background to the text 
	node.insert("rect","text")
			.attr("id", function(d) { return "rect" + d.id.toString(10); })
			.attr("x", function (d) {
				if (d.type == "attribute")
					return -18;
				else
					return IMG_SIZE - 15;
			})
			.attr("y", -8)
			.attr("width", function(d){return d.bbox.width})
			.attr("height", function(d){return d.bbox.height})
			.style("fill", function (d) {
				if (d.type === "attribute")
					return LINK_COLOR;
				else if (d.type === "explanatory_item")
					return SUPERNODE_COLOR;
				else
					return INTERNAL_NODE_COLOR;
			})
			.style("visibility", function (d) {
				if (d.type === "attribute")
					return "visible";
				else
					return "hidden";
			});
	
	
	// LABELS
	
	// to add the label for "I recommend you..."
	node.append("text")
		.attr("id", "label_recommendation")
		.attr("dx", -IMG_SIZE + 10)
        .attr("dy",function (d) {
        	return IMG_SIZE - 15;
        })
        .style("font-size", "22px")
        .style("font-family", "Trebuchet MS")
		.style("fill", LABEL_COLOR) 
		.style("visibility", function (d) {
        	if (d.type != "movie_recommended")
				return "hidden";
        })
        .text("I recommend you...");
		
	// to add the label for "because"
	node.append("text")
		.attr("id", "label_recommendation")
		.attr("dx", IMG_SIZE)
        .attr("dy", function (d) {
        	if (num_nodes > 2)
				return IMG_SIZE + 40;
			else return IMG_SIZE + 10;
        })
        .style("font-size", "22px")
        .style("font-family", "Trebuchet MS")
		.style("fill", LABEL_COLOR)
		.style("visibility", function (d) {
        	if (d.type != "movie_recommended" || (d.type === "movie_recommended" && num_nodes === 0))
				return "hidden";
        })
        .text("because");
		
	// to add the label for "you watched"
	node.append("text")
		.attr("id", "label_recommendation")
		.attr("dx", IMG_SIZE + 70)
        .attr("dy", function (d) {
        	if (num_nodes > 2)
				return IMG_SIZE + 90;
			else return IMG_SIZE +70;
        })
        .style("font-size", "22px")
        .style("font-family", "Trebuchet MS")
		.style("fill", LABEL_COLOR)
		.style("visibility", function (d) {
        	if (d.type != "movie_recommended" || (d.type === "movie_recommended" && num_nodes === 0))
				return "hidden";
        })
        .text("you watched...");
};

/**
 * Función que dibuja las imagenes de los nodos y crea sus eventos
 * @param  node		nodos dentro del svg
 */
function drawImages(node, num_nodes){
	// Configuración de las imágenes de los nodos
    node.append("svg:image")
		.attr("class", "poster")
	  	.attr("xlink:href",  function(d) { 
	  		if (d.type == "explanatory_item" || d.type == "movie_recommended")
	  			return d.img;
		})
		.attr("x", function(d) { return -(IMG_SIZE/2);}) 
		.attr("y", function(d) { return -(IMG_SIZE/2);})
		.attr("height", IMG_SIZE) //100
		.attr("width", IMG_SIZE) //100
		.on( 'mouseenter', function(n) {
			// select element in current context
			d3.select( this )
				.transition()
				.attr("x", function(d) { return -IMG_SIZE;}) 
				.attr("y", function(d) { return -IMG_SIZE;})
				.attr("height", IMG_SIZE*2) 
				.attr("width", IMG_SIZE*2);
			mouseEventsVisibility(n, "visible");
			
		})
		// set back
		.on( 'mouseleave', function(n) {
			d3.select( this )
				.transition()
				.attr("x", function(d) { return -(IMG_SIZE/2);}) 
				.attr("y", function(d) { return -(IMG_SIZE/2);})
				.attr("height", IMG_SIZE) 
				.attr("width", IMG_SIZE);
			mouseEventsVisibility(n, "hidden");
			
		});
		
	// Configuración de las imágenes de la x en el atributo
    node.append("svg:image")
		.attr("id", function(d) {
			if (d.type === "attribute")
				return "x_" + d.id;
		})
	  	.attr("xlink:href",  function(d) { 
	  		if (d.type === "attribute")
	  			return "img/x_icon.png";
		})
		.attr("x", -40) 
		.attr("y", -15)
		.attr("height", "20") 
		.attr("width", "20") 
		.style("visibility", "hidden")
		.on("click", mousedownNode)
		.on( 'mouseenter', function(n) {
			// select element in current context
			d3.select( this )
				.style("opacity", "1");
		})
		.on( 'mouseleave', function(n) {
			// select element in current context
			d3.select( this )
				.style("opacity", "0.2");
		});
	
	
};

/**
 * Funcion para pasar ratón encima de película y aparece título
 * Si la pelicula por la que se pasa el raton es la recomendada tambien se mueve el label
 * @param  node		nodos dentro del svg
 */
function mouseEventsVisibility(my_node, state){
	let my_item = my_node;
	let my_id = ".text" + my_item.id.toString(10);
	let my_rect = "#rect" + my_item.id.toString(10);
	
	// change the text to visible and the position of the label
	d3.select(my_id)
		.style("visibility", function () {
			if (my_item.type === "movie_recommended"){
				// to move the label 
				let my_size = IMG_SIZE - 15;
				if(state === "visible")
					my_size = IMG_SIZE + 20;

				d3.select("#label_recommendation").attr("dy", my_size);
			}
			if (my_item.type != "attribute")
				return state;
		});
		
	// make visible the rectangle to make easier the visualisation
	d3.select(my_rect).style("visibility", function () {
		if (my_item.type != "attribute"){
			return state;
		}	
	});
};

// funcion auxiliar para encontrar las coordenadas del elemento recomendado, que va a ser nuestro centroide
function getCoordsRec(nodes){
	let movie_rec = nodes.filter(function(n){
		if(n.type == "movie_recommended")
			return n;
	})[0];
	let coords = new Array();
	coords.push(movie_rec.x);
	coords.push(movie_rec.y);
	
	return coords;	
};

// Crear un grupo y creamos el supernodo
function updateGroups(supernode, groupIds, paths, nodes) {
	// http://jsfiddle.net/FEM3e/7/
	let scaleFactor = 1.2; // to draw the groups

	// to draw the supernode
	let valueline = d3.svg.line()
		  .x(function(d) { return d[0]; })
		  .y(function(d) { return d[1]; })
		  .interpolate("curveCatmullRomClosed"); // curveCatmullRomClosed -- curveLinearClosed (polygon)

		  
	let polygonGenerator = function() {
		let node_coords = supernode // node
		.data()
		.map(function(d) { return [d.x, d.y]; });
		
		// If I have a supernode with two or less nodes, I need to add an invisible point to compute the centroid
		if(get_length_attributes(nodes) <= 2){
			//node_coords.push([node_coords[0][0] + 1, node_coords[0][1]]);
			//node_coords.push([node_coords[0][0] + 2, node_coords[0][1] + 1]);
			
			node_coords.push([node_coords[0][0] - 1, node_coords[0][1]]);
			node_coords.push([node_coords[0][0] - 2, node_coords[0][1] - 1]);
		}
		
		return d3.polygonHull(node_coords);
	};
	
	
	groupIds.forEach(function(groupId) {
		let path = paths.filter(function(d) { return d == groupId;})
			.attr('transform', 'scale(1) translate(0,0)')
			.attr('d', function(d) {

				polygon = polygonGenerator();   // polygon is the set of nodes of the supernode				
				
				//centroid = d3.polygonCentroid(polygon); // polygon
				
				centroid = getCoordsRec(nodes);
				
				// Circle **********
				return "M3,3 h0";
				
				// Polygon **********
				/*return valueline(
					polygon.map(function(point) {
						return [  point[0] - centroid[0], point[1] - centroid[1]];
					})
				);*/
			});

		d3.select(path.node().parentNode).attr('transform', 'translate('  + centroid[0] + ',' + (centroid[1]) + ') scale(' + scaleFactor + ')');
	});
	
};


