var graph = new (function() {

	var world = null, nodes = [], edges = [], circles = [], lines = [], labels = []
	
	var config = {
		nodeRadius: 50,
		nodeColor: '#fff',
		nodeStrokeColor: 'rgb(220,220,220)',
		nodeStrokeWidth: '10',
		nodeSelectedFillStyle: 'rgb(94,212,255)',
		nodeSelectedStrokeColor: 'rgb(0,176,240)',
		nodeConnectedFillStyle: 'rgb(255,204,0)',
		nodeConnectedStrokeColor: 'rgb(255,174,0)',
		edgeStrokeColor: 'rgb(150,150,150)',
		edgeStrokeWidth: '3'
	}

	var viewBoxHeight, viewBoxWidth, viewBox, zoomX = 1, zoomY = 1, _width, _height, continousLayout = false

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
		    this.data('clicked', true)
		    this.data('moved', false)
		},
		move = function (dx, dy) {
			this.data('moved', true)
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
		    this.data('label').attr({'x': nx, 'y': ny})
		    if (continousLayout) {
			    forceLayout.eachNode(function(n, p) {
			    	if (n.data._id != that.data('id')) return
			    	p.p.x = nx / magicNumber
			    	p.p.y = ny / magicNumber
			    	//p.p.m = 100000
			    })
			    renderer.start()
			}
		}
		var _move = function() {
			var args = arguments
			setTimeout(function() {
				move.apply(c, args)
			}, 0)
		}
		if (window.requestAnimationFrame) {
			_move = function() {
				var args = arguments
				requestAnimationFrame(function() {
					move.apply(c, args)
				})
			}
		}
		_move = _.throttle(move, 10)
		c.drag(_move, start)
		var _mouseMoved = false
		c.mousedown(function() { 
			_mouseMoved = false 
		}).mousemove(function() {
			_mouseMoved = true
		}).mouseup(function() {

			// only is a circle has just been clicked
			if (_mouseMoved == false) {

				this.data('selected', !this.data('selected'))
				var that = this, myNode = nodes.filter(function(n) { return n.id == that.data('id') })[0]

				// reset all circles to initial state
				circles.forEach(function(c) {
					if (c.data('id') == that.data('id')) return
					c.attr({
						'r': config.nodeRadius,
						fill: config.nodeColor,
						stroke: config.nodeStrokeColor
					})
					c.data('selected', false)
				})

				var connectedIds = myNode.connectedEdges.map(function(edge) {
					var otherNode = null
					if (edge.endpointA == myNode.id) {
						otherNode = nodes.filter(function(n) { return n.id == edge.endpointB })[0]
					} else {
						otherNode = nodes.filter(function(n) { return n.id == edge.endpointA })[0]
					}
					return otherNode.id
				})
				var finalAttributes
				if (this.data('selected')) {
					finalAttributes = {
						'r': config.nodeRadius * 2,
						fill: config.nodeSelectedFillStyle,
						stroke: config.nodeSelectedStrokeColor
					}
				}
				else { 
					finalAttributes = { 
						'r': config.nodeRadius,
						fill: config.nodeColor,
						stroke: config.nodeStrokeColor
					}
				}

				// if it has been de-selected, skip
				// else, colors its neighbours
				if (this.data('selected') == true) {
					connectedIds.forEach(function(connectedId) {
						var neighbor = circles.filter(function(c) {
							return c.data('id') == connectedId
						})[0]
						setTimeout(function() {
							neighbor.attr({
								fill: config.nodeConnectedFillStyle,
								stroke: config.nodeConnectedStrokeColor
							})
						}, 0)
					})
				}

				this.animate(finalAttributes, 450, 'bounce')
			}
		})
		c.data('id', node.id)
		c.data('edges', [])
		c.data('selected', false)

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
		a.connectedEdges.push(edge)
		b.connectedEdges.push(edge)
		var unique = []
		a.connectedEdges.forEach(function(cEdge) {
			if (unique.filter(function(uEdge) {
				return uEdge.id == cEdge.id
			}).length > 0) return
			unique.push(cEdge)
		})
		a.connectedEdges = unique
		unique.length = 0
		b.connectedEdges.forEach(function(cEdge) {
			if (unique.filter(function(uEdge) {
				return uEdge.id == cEdge.id
			}).length > 0) return
			unique.push(cEdge)
		})
		b.connectedEdges = unique
		delete(unique)
		//console.log(edge.id + ':' + a.connectedEdges.length + ', ' + unique.length)
		//a.connectedEdges = _.uniq(a.connectedEdges)
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
        var that = this

        var drawNode = function (node, p) {
            var id = node.data._id
            circles.filter(function(c) { return c.data('id') == id })[0].attr({ cx: p.x * magicNumber, cy: p.y * magicNumber})
            var node = nodes.filter(function(n) { return n.id == id })[0]

            node.x = p.x * magicNumber
            node.y = p.y * magicNumber
        }

        renderer = new Renderer(3, forceLayout, render, function(){}, drawNode)
        window.renderer = renderer
        renderer.start()
	}

})()