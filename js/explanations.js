/**
 * Clase que contiene todas las explicaciones de un ejemplo.
 * Aquí se gestiona la explicación que se muestra en cada momento
 * y los atributos que se encuentran activos.
 *
 * @author: Jose L. Jorro-Aragoneses, Marta Caro-Martínez
 * @version: 1.0
 */
class ExplanationsSet {

	/**
	 * Constructora de las explicaciones a partir de un fichero JSON.
	 * @param string path ruta donde se encuentra el fichero de la explacación.
	 */
	constructor(path) {
		this.explanations = new Array();
		this.currentExplanationIndex = 0;
		this.bestExplanationIndex = 0;
	}

	/**
	 * Función que incluye una explicación al conjutno de explicaciones.
	 * @param Object data objeto que incluye la lista de nodos y links de una explicación.
	 */
	addExplanation(data) {
		this.explanations.push(new Explanation(data.nodes, data.links));
	}

	/**
	 * Método que devuelve la explicación que esta seleccionada en un momento concreto.
	 * @return Object objeto explicación seleccionada en un momento concreto.
	 */
	getCurrentExplanation() {
		return this.explanations[this.currentExplanationIndex];
	}

	/**
	 * Función que analiza todas las explicaciones para saber cual es
	 * la mejor explicación.
	 */
	checkExplanations() {
		let maxNodes = -1;
		let maxIndex = -1;

		for (var i = 0; i < this.explanations.length; i++) {
			if(maxNodes < this.explanations[i].getNumNodesAttribute()) {
				maxNodes = this.explanations[i].getNumNodesAttribute();
				maxIndex = i;
			}
		}
		
		// comprobamos que la mejor explicacion no sea igual de explicable que la actual
		// en ese caso no hay que cambiarla
		if (maxNodes > this.explanations[this.bestExplanationIndex].getNumNodesAttribute())
			this.bestExplanationIndex = maxIndex;
	}

	/**
	 * Función que cambia la explicación actual por la mejor explicación.
	 */
	changeExplanation() {
		this.currentExplanationIndex = this.bestExplanationIndex;
	}

	/**
	 * Función que elimina un atributo de todas las explicaciones alamcenadas.
	 * Además, actualiza el índice de la mejor explicación.
	 * @param  String attr atributo que se quiere eliminar de todas las explicaciones.
	 */
	removeAttribute(attr) {
		for(var i = 0; i < this.explanations.length; i++){
			this.explanations[i].removeAttribute(attr);
		}
		this.checkExplanations();
	}

	isThereBestExplanation() {
		return this.currentExplanationIndex != this.bestExplanationIndex;
	}

	setCurrentExplanation(index) {
		this.currentExplanationIndex = index;
	}
	
	setBestExplanation(index) {
		this.bestExplanationIndex = index;
	}
	
	getExplanationByIndex(i){
		return this.explanations[i];
	}
	

	/**
	 * Función que obtiene una copia del ejemplo
	 */
	cloneExample(){
		let cloned_example = new ExplanationsSet();
		cloned_example.setCurrentExplanation(this.currentExplanationIndex);
		cloned_example.setBestExplanation(this.bestExplanationIndex);
		
		for (var i = 0; i < this.explanations.length; i++){
			let my_explanation = this.explanations[i];
			
			cloned_example.explanations.push(new Explanation(my_explanation.cloneNodes(), my_explanation.cloneLinks()));
		}
		
		return cloned_example;
	}

}

/**
 * Clase que representa una explicación.
 */
class Explanation {

	/**
	 * Constructora de una explicación a partir de un conjunto de nodos y
	 * los links que unen los nodos.
	 * @param  Array nodes lista con los nodos de la explicación.
	 * @param  Array links lista con los links de la explicación.
	 */
	constructor(nodes, links) {
		this.nodes = nodes;
		this.links = links;
		
		for(var i = 0; i < links.length; i++){
			this.links[i].source = this.getNodebyId(this.links[i].source, this.nodes);
			this.links[i].target = this.getNodebyId(this.links[i].target, this.nodes);
		}
	}
	
	
	/**
	 * Función para clonar los nodos de esta explicación
	 * @return	conjunto de nodos copiados
	 */
	cloneNodes(){
		let cloned_nodes = new Array();
		
		for (var i = 0; i < this.nodes.length; i++){
			let clonedNode = new Object();
			
			Object.assign(clonedNode, this.nodes[i]);
			
			cloned_nodes.push(clonedNode);
		}
		
		return cloned_nodes;
	}
	
	/**
	 * Función para clonar los links de esta explicación
	 * @return	conjunto de links copiados
	 */
	cloneLinks(){
		let cloned_links = new Array();
		
			
		for(var i = 0; i < this.links.length; i++){
			let clonedLink = new Object();
			
			clonedLink["source"] = this.links[i].source.id;
			clonedLink["target"] = this.links[i].target.id;
			
			cloned_links.push(clonedLink);
		}
		
		return cloned_links;
	}

	/**
	 * Función que obtiene un nodo por su id
	 * @param  my_id	id del nodo que quiero encontrar
	 * @param	nodes	conjunto de nodos de la explicación
	 * @return	nodo con el my_id que pasamos por parametro
	 */
	getNodebyId(my_id, nodes){
		let myNode = $.grep(nodes, function(node) {
			return node.id == my_id;
		});
		return myNode[0];
	}
	
	/**
	 * Función que elimina el atributo que se pasa por parámetro de la
	 * expliación. Si este atributo es el único del nodo, se elimina
	 * el nodo completamente.
	 * @param  String attr atributo que se quiere eliminar.
	 */
	removeAttribute(attr) {
		
		var nodeIndex = this.nodes.findIndex(x => x.type === "attribute" && x.name.includes(attr));
		
		if(nodeIndex > -1) {
			
			var node = this.nodes[nodeIndex];
			
			if(node.name === attr) {
				// Obtenemos los hijos del nodo atributo
				let nodesToRemove = this.getChildren(node.id);
				nodesToRemove.push(node.id);
				
				// Eliminamos todos los nodos (nodo atributo + hijos)
				let newNodes = $.grep(this.nodes, function(elem) {
					return !nodesToRemove.includes(elem.id)
				});
				this.nodes = newNodes;

				// Eliminamos todos los links que iban o salian del nodo atributo
				let newLinks = $.grep(this.links, function(elem) {
					return elem.source.id !== node.id && elem.target.id !== node.id;
				});
				this.links = newLinks;
				
			} else {
				// Sino, eliminamos el atributo del nombre
				if(node.name.includes(", " + attr)) {
					this.nodes[nodeIndex].name = this.nodes[nodeIndex].name.replace(", " + attr, "");
				} else {
					this.nodes[nodeIndex].name = this.nodes[nodeIndex].name.replace(attr + ", ", "");
				}
			}
		}
		

	}

	/**
	 * Función que devuelve los identificadores de los hijos en
	 * el grafo del identificador que se pasa por parámetro.
	 * @param  Integer nodeId identificador del nodo que se quiere
	 *                        saber los hijos
	 * @return Array lista con los identificadores de los hijos.
	 */
	getChildren(nodeId) {

		var linksChildren = $.grep(this.links, function(elem) {
			return elem.source.id === nodeId;
		});
	
		let indexChildren = new Array();
		for(var i = 0; i < linksChildren.length; i++) {
			indexChildren.push(linksChildren[i].target.id);
		}
		
		return indexChildren;
	}
	

	/**
	 * Función que devuelve el número de nodos de tipo atributo que
	 * tiene la explicación.
	 * @return Integer número de nodos de tipo atributo
	 */
	getNumNodesAttribute() {
		let numAttributes = 0;

		for (var i = 0; i < this.nodes.length; i++) {
			let node = this.nodes[i];

			if (node.type === "attribute")
				numAttributes += 1;
		}

		return numAttributes;
	}
	
	
	/**
	 * Función que devuelve el poster de la pelicula recomendada
	 * @return Integer número de nodos de tipo atributo
	 */
	getPosterMovieRec(){
		let recommendation = this.getNodebyId(0, this.nodes);
		return recommendation.img;
	}

}