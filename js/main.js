var graph = new (function() {

	var world = null, nodes = [], edges = [], circles = [], lines = [], labels = []
	
	var viewBoxHeight, viewBoxWidth, viewBox, zoomX = 1, zoomY = 1, _width, _height, continousLayout = false

	this.initialize = function(options) {
		if (!options.container) {
			throw new Error('Must provide container selector!')
		}

		_width = options.width, _height = options.height
		viewBoxHeight = options.height
		viewBoxWidth = options.width
		world = Raphael($(options.container).get(0), options.width, options.height)

		// boot up the gpu
		gpu.setWorld(world)
		gpu.setZoom(1, 1)

		viewBox = world.setViewBox(0, 0, viewBoxWidth, viewBoxHeight)
		viewBox.X = 0
		viewBox.Y = 0
		var down = false, _x = 0, _y = 0
		continousLayout = options.alive
		$(options.container).css('background', 'url(http://subtlepatterns.subtlepatterns.netdna-cdn.com/patterns/textured_stripes.png)')
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
		}).mouseleave(function() {
			down = false
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
			gpu.setZoom(zoomX, zoomY)
		})
		return this
	}

	this.addNode = function(node) {
		if (!node.id) node.id = parseInt(Math.random() * 10000)
		node.connectedEdges = []
		nodes.push(node)
		return this
	}

	this.addEdge = function(edge) {
		if (!edge.id) edge.id = parseInt(Math.random() * 10000)
		edges.push(edge)

		return this	
	}

	var renderEdge = function(edge) {
		var a = nodes.filter(function(n) { return n.id == edge.endpointA })[0]
		var b = nodes.filter(function(n) { return n.id == edge.endpointB })[0]

		var _e = gpu.getLineById(edge.id)
		var pathCommands = ['M',a.x,a.y,'L',b.x,b.y].join(' ')		
		$(_e.node).attr('d', pathCommands)
	}

	var render = function() {
		edges.forEach(renderEdge)
	}

	this.dump = function() {
		console.dir(circles)
		console.dir(lines)
		console.dir(edges)
		console.dir(nodes)
	}

	this.go = function() {

		// boot up the gpu
		nodes.forEach(gpu.addCircle)
		edges.forEach(gpu.addLine)

		render()
		layout()
		return this
	}

	var graph = null, forceLayout = null, renderer = null, magicNumber = 75
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

        forceLayout = new Layout.ForceDirected(graph, 400.0, 400.0, 0.3);
        gpu.setForceLayout(forceLayout)
        var that = this

        var drawNode = function (node, p) {
            var id = node.data._id

            gpu.getCircleById(id).attr({ cx: p.x * magicNumber, cy: p.y * magicNumber})
            gpu.getCircleById(id).data('label').attr({ x: p.x * magicNumber, y: p.y * magicNumber})
            //circles.filter(function(c) { return c.data('id') == id })[0].attr({ cx: p.x * magicNumber, cy: p.y * magicNumber})
            var node = nodes.filter(function(n) { return n.id == id })[0]

            node.x = p.x * magicNumber
            node.y = p.y * magicNumber
        }

        renderer = new Renderer(10, forceLayout, render, function(){}, drawNode)
        window.renderer = renderer
        renderer.start()
	}

})()