Point = require('../shapes/Point')

class PointTool
  constructor: (@world) ->

  click: (pt) ->
    @world.add new Point pt

  move: (pt) ->

  draw: (ctx, mouse) ->
    return unless mouse?
    ctx.beginPath()
    ctx.moveTo mouse.x-4, mouse.y-4
    ctx.lineTo mouse.x+4, mouse.y+4
    ctx.moveTo mouse.x+4, mouse.y-4
    ctx.lineTo mouse.x-4, mouse.y+4
    ctx.stroke()

module.exports = PointTool
