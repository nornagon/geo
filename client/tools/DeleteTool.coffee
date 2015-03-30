class DeleteTool
  constructor: (@world) ->
  move: (pt) ->
    @i = 0
    @shapes = @world.objectsAt(pt)
  shape: ->
    @shapes?[@i % @shapes.length]
  click: (pt) ->
    if @shape()?
      @world.remove @shape()
      @shapes = @world.objectsAt(pt)
  draw: (ctx) ->
    if @shape()?
      ctx.strokeStyle = 'red'
      @shape().draw(ctx)
  esc: ->

  key: (e, mouse) ->
    switch e.which
      when 9  # tab
        e.preventDefault()
        @i += 1
      when 13  # enter
        e.preventDefault()
        @click mouse.x, mouse.y

module.exports = DeleteTool
