v = require('../vector')

isAngleBetween = (a1, a2, a) ->
  if a1 > a2
    [a1, a2] = [a2, a1]
  while a < a1
    a += Math.PI*2
  while a > a2
    a -= Math.PI*2
  a1 <= a <= a2

class Arc
  intersectCode: 2
  constructor: ({@center, @radius, @subtendedAngle}) ->
    @startAngle = v.atan2 @radius
    @endAngle = @startAngle + @subtendedAngle

  draw: (ctx) ->
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc @center.x, @center.y,
      v.len(@radius)
      @startAngle, @endAngle, @subtendedAngle < 0
    ctx.stroke()

  magnets: (pt) ->
    r = v.len @radius
    otherRadius = v.add @center, v.scale v.forAngle(@endAngle), r
    [
      { point: v.add(@center, @radius), type: 'point' }
      { point: otherRadius,             type: 'point' }
      { point: @closestPointTo(pt),     type: 'line' }
    ]

  closestPointTo: (pt) ->
    angle = v.atan2 v.sub pt, @center
    if isAngleBetween @startAngle, @endAngle, angle
      v.add @center, v.scale v.forAngle(angle), v.len(@radius)

module.exports = Arc
