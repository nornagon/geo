canvas = document.body.appendChild document.createElement 'canvas'
canvas.width = (WIDTH = 600)*devicePixelRatio
canvas.height = (HEIGHT = 600)*devicePixelRatio
canvas.style.width = WIDTH+'px'
canvas.style.height = HEIGHT+'px'
ctx = canvas.getContext '2d'
ctx.scale devicePixelRatio, devicePixelRatio
ctx.lineCap = 'round'

World = require('./World')
PointTool = require('./tools/PointTool')
LineTool = require('./tools/LineTool')
ArcTool = require('./tools/ArcTool')
DeleteTool = require('./tools/DeleteTool')

world = new World
currentTool = new ArcTool world
currentMousePos = null

draw = ->
  ctx.clearRect 0, 0, canvas.width, canvas.height
  ctx.save()
  world.draw ctx
  ctx.restore()
  ctx.save()
  currentTool.draw ctx, currentMousePos
  ctx.restore()

changed = ->
  draw()

canvas.onclick = (e) ->
  [x, y] = [e.offsetX, e.offsetY]
  pt = world.snap {x, y}
  currentMousePos = pt
  currentTool.click pt
  changed()

canvas.onmousemove = (e) ->
  [x, y] = [e.offsetX, e.offsetY]
  pt = world.snap {x, y}
  currentMousePos = pt
  currentTool.move pt
  changed()

window.onkeydown = (e) ->
  switch e.which
    when 27
      e.preventDefault()
      currentTool.esc?()
      changed()
    when 'P'.charCodeAt(0)
      e.preventDefault()
      currentTool = new PointTool world
      changed()
    when 'L'.charCodeAt(0)
      e.preventDefault()
      currentTool = new LineTool world
      changed()
    when 'A'.charCodeAt(0)
      e.preventDefault()
      currentTool = new ArcTool world
      changed()
    when 'D'.charCodeAt(0)
      e.preventDefault()
      currentTool = new DeleteTool world
      changed()
    else
      currentTool.key? e, currentMousePos
      console.log e.defaultPrevented
      changed() if e.defaultPrevented
