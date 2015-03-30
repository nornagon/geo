v = require('../vector')

class Line
  intersectCode: 1
  constructor: ({@from, @to}) ->

  draw: (ctx) ->
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo @from.x, @from.y
    ctx.lineTo @to.x, @to.y
    ctx.stroke()

  magnets: (pt) ->
    [
      { type: 'point', point: @from }
      { type: 'point', point: @to }
      { type: 'line',  point: @closestPointTo(pt) }
    ]

  closestPointTo: (pt) ->
    len = v.len v.sub @from, @to
    if len == 0  # from == to
      return @from
    tpx = ((pt.x - @from.x) * (@to.x - @from.x) + (pt.y - @from.y) * (@to.y - @from.y)) / len
    if tpx < 4
      @from
    else if tpx > len-4
      @to
    else
      v.add @from, v.scale (v.sub @to, @from), tpx / len

module.exports = Line
