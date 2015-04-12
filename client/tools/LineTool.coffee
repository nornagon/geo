Line = require('../shapes/Line')

class LineTool
  constructor: (@world) ->
    @root = null

  click: (pt) ->
    if not @root
      @root = pt
    else
      @world.add new Line from: @root, to: pt
      @root = pt

  esc: ->
    @root = null

  draw: (ctx, mouse) ->
    return unless mouse?
    if not @root
      ctx.beginPath()
      ctx.moveTo mouse.x-4, mouse.y
      ctx.lineTo mouse.x+4, mouse.y
      ctx.moveTo mouse.x, mouse.y-4
      ctx.lineTo mouse.x, mouse.y+4
      ctx.stroke()
    else
      ctx.beginPath()
      ctx.moveTo @root.x, @root.y
      ctx.lineTo mouse.x, mouse.y
      ctx.stroke()

module.exports = LineTool
