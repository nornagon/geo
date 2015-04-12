World = require('./World')
PointTool = require('./tools/PointTool')
LineTool = require('./tools/LineTool')
ArcTool = require('./tools/ArcTool')
DeleteTool = require('./tools/DeleteTool')

{ButtonBar} = require('./buttons')

assign = (o1, o2) -> o1[k] = v for own k,v of o2

WIDTH = 600
HEIGHT = 600

container = document.body.appendChild document.createElement 'div'
assign container.style,
  position: 'relative'
canvas = container.appendChild document.createElement 'canvas'
canvas.width = WIDTH*devicePixelRatio
canvas.height = HEIGHT*devicePixelRatio

ctx = canvas.getContext '2d'
ctx.scale devicePixelRatio, devicePixelRatio
ctx.lineCap = 'round'

world = new World
currentTool = new ArcTool world
currentMousePos = null

assign canvas.style,
  width: WIDTH+'px'
  height: HEIGHT+'px'
  boxShadow: '0px 0px 4px hsl(0,0%,88%)'
assign document.body.style,
  display: 'flex'
  alignItems: 'center'
  justifyContent: 'center'
  height: '100%'
assign document.documentElement.style,
  height: '100%'

buttons = ->
  point:
    icon: 'fa-times'
    active: currentTool.constructor is PointTool
    click: ->
      currentTool = new PointTool world
      changed()
    hover: -> currentMousePos = null; changed()
  line:
    icon: 'fa-plus'
    active: currentTool.constructor is LineTool
    click: ->
      currentTool = new LineTool world
      changed()
    hover: -> currentMousePos = null; changed()
  arc:
    icon: 'fa-circle-o'
    active: currentTool.constructor is ArcTool
    click: ->
      currentTool = new ArcTool world
      changed()
    hover: -> currentMousePos = null; changed()
  delete:
    icon: 'fa-ban'
    active: currentTool.constructor is DeleteTool
    click: ->
      currentTool = new DeleteTool world
      changed()
    hover: -> currentMousePos = null; changed()

diff = require('virtual-dom/diff')
patch = require('virtual-dom/patch')
createElement = require('virtual-dom/create-element')

$buttonBar = ButtonBar(buttons())
$buttonRoot = createElement($buttonBar)
container.appendChild($buttonRoot)

draw = ->
  ctx.clearRect 0, 0, canvas.width, canvas.height
  ctx.save()
  world.draw ctx
  ctx.restore()
  ctx.save()
  currentTool.draw ctx, currentMousePos
  ctx.restore()

  newBar = ButtonBar(buttons())
  patches = diff($buttonBar, newBar)
  patch($buttonRoot, patches)
  $buttonBar = newBar

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
  currentTool.move? pt
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
      changed() if e.defaultPrevented
