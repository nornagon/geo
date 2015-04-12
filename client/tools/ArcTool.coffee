v = require('../vector')
Arc = require('../shapes/Arc')

wrappi = (x) ->
  while x < -Math.PI then x += Math.PI*2
  while x > Math.PI then x -= Math.PI*2
  x

class ArcTool
  constructor: (@world) ->
    @state = 'center'
    @center = null
    @radius = null
    @startAngle = null
    @endAngle = null

  move: (pt) ->
    switch @state
      when 'angle'
        @endAngle = v.atan2 v.sub pt, @center

  click: (pt) ->
    switch @state
      when 'center'
        @center = pt
        @state = 'radius'
        @radius = 0
      when 'radius'
        @radius = pt
        @state = 'angle'
        @startAngle = @endAngle = v.atan2 v.sub pt, @center
      when 'angle'
        subtendedAngle = wrappi(@endAngle - @startAngle)
        @world.add new Arc {@center, radius: v.sub(@radius, @center), subtendedAngle}
        @state = 'center'
        @center = pt

  esc: ->
    @state = 'center'

  draw: (ctx, mouse) ->
    return unless mouse?
    ctx.lineWidth = 1
    switch @state
      when 'center'
        ctx.beginPath()
        ctx.arc mouse.x, mouse.y, 4, 0, Math.PI*2
        ctx.stroke()
      when 'radius'
        ctx.beginPath()
        ctx.moveTo @center.x, @center.y
        ctx.lineTo mouse.x, mouse.y
        ctx.stroke()
        ctx.beginPath()
        ctx.arc @center.x, @center.y, v.len(v.sub mouse, @center), 0, Math.PI*2
        ctx.stroke()
      when 'angle'
        subtendedAngle = wrappi(@endAngle - @startAngle)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc @center.x, @center.y,
          v.len(v.sub @radius, @center)
          @startAngle, @endAngle, subtendedAngle < 0
        ctx.stroke()

module.exports = ArcTool
