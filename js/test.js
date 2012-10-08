$(function() {
	graph.initialize({
		width: $(window).innerWidth(),
		height: $(window).innerHeight(),
		container: '#holder',
		backgroundColor: 'red'
	}).addNode({
		id: 1,
		x: 100,
		y: 100,
		label: 'Mia'
	}).addNode({
		id: 2,
		x: 200,
		y: 200,
		label: 'Baccha'
	}).addNode({
		id: 3,
		x: 300,
		y: 300,
		label: 'Bibi'
	}).addEdge({
		endpointA: 1,
		endpointB: 2
	}).addEdge({
		endpointA: 2,
		endpointB: 3
	}).render()
})