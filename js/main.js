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

	var viewBoxHeight, viewBoxWidth, viewBox, zoomX = 1, zoomY = 1, _width, _height, continousLayout = false

	function handle(delta) {
		
	}

	this.initialize = function(options) {
		if (!options.container) {
			throw new Error('Must provide container selector!')
		}

		_width = options.width, _height = options.height
		viewBoxHeight = options.height
		viewBoxWidth = options.width
		world = Raphael($(options.container).get(0), options.width, options.height)
		viewBox = world.setViewBox(0, 0, viewBoxWidth, viewBoxHeight)
		viewBox.X = 0
		viewBox.Y = 0
		var down = false, _x = 0, _y = 0
		continousLayout = options.alive

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
			var vBHo = viewBoxHeight
			var vBWo = viewBoxWidth
			if (delta < 0) {
				viewBoxWidth *= 0.95
				viewBoxHeight*= 0.95
			}
			else {
				viewBoxWidth *= 1.05
				viewBoxHeight *= 1.05
			}
			viewBox.X -= (viewBoxWidth - vBWo) / 2
			viewBox.Y -= (viewBoxHeight - vBHo) / 2
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

	var renderNode = function(node) {
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
		    
		    if (continousLayout) {
			    forceLayout.eachNode(function(n, p) {
			    	if (n.data._id != that.data('id')) return
			    	p.p.x = nx / magicNumber
			    	p.p.y = ny / magicNumber
			    	p.p.m = 10000
			    })
			    renderer.start()
			}
		}
		c.drag(move, start)
		c.data('id', node.id)
		c.data('edges', [])

		var label = world.text(node.x, node.y, node.label)
		c.data('label', label)
		circles.push(c)
	}

	this.addEdge = function(edge) {
		if (!edge.id) edge.id = parseInt(Math.random() * 10000)
		edges.push(edge)

		return this	
	}

	var renderEdge = function(edge) {
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
	}

	var render = function() {
		world.clear()
		circles.length = 0
		lines.length = 0
		edges.forEach(renderEdge)
		nodes.forEach(renderNode)
	}
	this.go = function() {
		render()
		layout()
		return this
	}

	var graph = null, forceLayout = null, renderer = null, magicNumber = 50
	var layout = function() {
		graph = new Graph(), map = { }
		for (var i = 0; i < nodes.length; i = i + 1) {
            var addedNode = graph.newNode({ label: nodes[i].id, _id: nodes[i].id })
            map[nodes[i].id] = addedNode
        }

        for (var i = 0; i < edges.length; i = i + 1) {
            var node1 = map[edges[i].endpointA]
            var node2 = map[edges[i].endpointB]

            if (node1.id != node2.id) {
                graph.newEdge(node1, node2, { _id: edges[i].id })
            }
        }

        forceLayout = new Layout.ForceDirected(graph, 100.0, 300.0, 0.3);
        var that = this

        toScreen = function(p) {
        	var currentBB = forceLayout.getBoundingBox();
			var size = currentBB.topright.subtract(currentBB.bottomleft);
			var sx = p.subtract(currentBB.bottomleft).divide(size.x).x * _width * 2;
			var sy = p.subtract(currentBB.bottomleft).divide(size.y).y * _height * 2;
			return new Vector(sx, sy);
		};

        var drawNode = function (node, p) {
            var id = node.data._id
            circles.filter(function(c) { return c.data('id') == id })[0].attr({ cx: p.x * magicNumber, cy: p.y * magicNumber})
            var node = nodes.filter(function(n) { return n.id == id })[0]
			//p = toScreen(p)

            node.x = p.x * magicNumber
            node.y = p.y * magicNumber
        }

        renderer = new Renderer(13, forceLayout, render, function(){}, drawNode)
        renderer.start()
	}

})()