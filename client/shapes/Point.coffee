class Point
  constructor: (@point) ->

  draw: (ctx) ->
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo @point.x-4, @point.y-4
    ctx.lineTo @point.x+4, @point.y+4
    ctx.moveTo @point.x+4, @point.y-4
    ctx.lineTo @point.x-4, @point.y+4
    ctx.stroke()

  magnets: (pt) ->
    [
      { type: 'point', point: @point }
    ]

module.exports = Point
