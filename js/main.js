var graph = new (function() {

	var world = null, nodes = [], edges = [], circles = [], lines = [], labels = []
	
	var config = {
		nodeRadius: 30,
		nodeColor: '#eee',
		nodeStrokeColor: '#13f',
		nodeStrokeWidth: '5',
		edgeStrokeColor: '#222',
		edgeStrokeWidth: '3'
	}

	var viewBoxHeight, viewBoxWidth, viewBox, zoomX = 1, zoomY = 1

	function handle(delta) {
		
	}

	this.initialize = function(options) {
		if (!options.container) {
			throw new Error('Must provide container selector!')
		}

		var vx = 0, vy = 0
		viewBoxHeight = options.height
		viewBoxWidth = options.width
		world = Raphael($(options.container).get(0), options.width, options.height)
		viewBox = world.setViewBox(0, 0, viewBoxWidth, viewBoxHeight)
		viewBox.X = 0
		viewBox.Y = 0
		var down = false, _x = 0, _y = 0
		$(options.container).mousedown(function (e) {
			if (e.target.nodeName == 'svg') {
				down = true
				_x = e.screenX
				_y = e.screenY
			}
		}).mouseup(function (e) {
			if (e.target.nodeName == 'svg') {
				down = false
			}
		}).mousemove(function (e) {
			if (down != true || e.target.nodeName != 'svg') return
			var xDiff = (e.screenX - _x) / zoomX, yDiff = (e.screenY - _y) / zoomY
			viewBox.X -= xDiff
			viewBox.Y -= yDiff
			world.setViewBox(viewBox.X,viewBox.Y, viewBoxWidth, viewBoxHeight)
			_x = e.screenX
			_y = e.screenY
		}).mousewheel(function(e, delta) {
			var vBHo = viewBoxHeight;
			var vBWo = viewBoxWidth;
			if (delta < 0) {
				viewBoxWidth *= 0.95;
				viewBoxHeight*= 0.95;
			}
			else {
				viewBoxWidth *= 1.05;
				viewBoxHeight *= 1.05;
			}
			viewBox.X -= (viewBoxWidth - vBWo) / 2;
			viewBox.Y -= (viewBoxHeight - vBHo) / 2;
			world.setViewBox(viewBox.X,viewBox.Y,viewBoxWidth,viewBoxHeight)
			zoomX = options.width / viewBoxWidth
			zoomY = options.height / viewBoxHeight
		})
		return this
	}

	this.addNode = function(node) {
		if (!node.id) node.id = parseInt(Math.random() * 10000)
		node.connectedEdges = []
		nodes.push(node)
		return this
	}

	this.renderNode = function(node) {
		var c = world.circle(node.x, node.y, config.nodeRadius)
			.attr({
				fill: config.nodeColor,
				stroke: config.nodeStrokeColor,
				'stroke-width': config.nodeStrokeWidth
			})
		var start = function () {
		    this._x = this.attr("cx")
		    this._y = this.attr("cy")
		},
		move = function (dx, dy) {
		    var nx = this._x + (dx / zoomX), ny = this._y + (dy / zoomY)
		    this.attr({ cx: nx, cy: ny })
		    var that = this
		    var myNode = nodes.filter(function(n) { return n.id == that.data('id') })[0]
		    myNode.connectedEdges.forEach(function(edge) {
		    	var myPath = lines.filter(function(l) { return l.data('id') == edge.id })[0]
		    	var myOtherCircleId = myPath.data('endpointA') == that.data('id') ? myPath.data('endpointB') : myPath.data('endpointA')
		    	var myOtherCircle = circles.filter(function(c) { return c.data('id') == myOtherCircleId })[0]
				var pos = 'M' + nx + ',' + ny + 'L' + myOtherCircle.attrs.cx + ',' + myOtherCircle.attrs.cy
		    	$(myPath.node).attr('d', pos)
		    })
		    this.data('label').remove()
		    this.data('label', world.text(nx, ny, node.label))
		}
		c.drag(move, start)
		c.data('id', node.id)
		c.data('edges', [])

		var label = world.text(node.x, node.y, node.label)
		c.data('label', label)
		circles.push(c)
	
		return this
	}

	this.addEdge = function(edge) {
		if (!edge.id) edge.id = parseInt(Math.random() * 10000)
		edges.push(edge)

		return this	
	}

	this.renderEdge = function(edge) {
		var a = nodes.filter(function(n) { return n.id == edge.endpointA })[0]
		var b = nodes.filter(function(n) { return n.id == edge.endpointB })[0]
		var pathCommands = ['M',a.x,a.y,'L',b.x,b.y].join(' ')
		var l = world.path(pathCommands)
			.attr({
				stroke: config.edgeStrokeColor,
				'stroke-width': config.edgeStrokeWidth
			})
			.data('id', edge.id)
			.data('endpointB', edge.endpointB)
			.data('endpointA', edge.endpointA)
		lines.push(l)

		// update references in the nodes
		nodes.filter(function(n) { return n.id == edge.endpointA })[0].connectedEdges.push(edge)
		nodes.filter(function(n) { return n.id == edge.endpointB })[0].connectedEdges.push(edge)

		return this
	}

	this.render = function() {
		world.clear()
		edges.forEach(this.renderEdge)
		nodes.forEach(this.renderNode)

		return this
	}

})()