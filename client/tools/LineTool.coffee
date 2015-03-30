Line = require('../shapes/Line')

class LineTool
  constructor: (@world) ->
    @root = null
    @tip = null

  click: (pt) ->
    if not @tip
      @tip = pt
    else
      @tip = pt
      @world.add new Line from: @root, to: @tip
      @root = @tip

  move: (pt) ->
    if not @tip
      @root = pt
    else
      @tip = pt

  esc: ->
    @root = @tip = null

  draw: (ctx) ->
    if @tip
      ctx.beginPath()
      ctx.moveTo @root.x, @root.y
      ctx.lineTo @tip.x, @tip.y
      ctx.stroke()
    else if @root
      ctx.beginPath()
      ctx.moveTo @root.x-4, @root.y
      ctx.lineTo @root.x+4, @root.y
      ctx.moveTo @root.x, @root.y-4
      ctx.lineTo @root.x, @root.y+4
      ctx.stroke()

module.exports = LineTool
