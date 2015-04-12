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

World = require('./World')
PointTool = require('./tools/PointTool')
LineTool = require('./tools/LineTool')
ArcTool = require('./tools/ArcTool')
DeleteTool = require('./tools/DeleteTool')

world = new World
currentTool = new ArcTool world
currentMousePos = null

require('./buttons.scss')

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

buttonSize = 40
buttonBar = container.appendChild document.createElement 'div'
buttonBar.classList.add 'button-bar'
buttons =
  point:
    icon: 'fa-times'
    click: ->
      currentTool = new PointTool world
      document.querySelector('.button.active').classList.remove('active')
      buttonBar.children[0].classList.add('active')
      changed()
  line:
    icon: 'fa-plus'
    click: ->
      currentTool = new LineTool world
      document.querySelector('.button.active').classList.remove('active')
      buttonBar.children[1].classList.add('active')
      changed()
  arc:
    icon: 'fa-circle-o'
    click: ->
      currentTool = new ArcTool world
      document.querySelector('.button.active').classList.remove('active')
      buttonBar.children[2].classList.add('active')
      changed()

  delete:
    icon: 'fa-ban'
    click: ->
      currentTool = new DeleteTool world
      document.querySelector('.button.active').classList.remove('active')
      buttonBar.children[3].classList.add('active')
      changed()

for _,button of buttons
  buttonEl = buttonBar.appendChild document.createElement 'div'
  buttonEl.classList.add 'button'
  content = buttonEl.appendChild document.createElement 'div'
  content.classList.add 'content'
  icon = content.appendChild document.createElement 'i'
  icon.classList.add 'fa'
  icon.classList.add 'fa-fw'
  icon.classList.add button.icon
  buttonEl.onclick = button.click
  buttonEl.classList.add 'active' if button.icon is 'fa-plus'
  buttonEl.onmouseover = ->
    currentMousePos = null
    changed()

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
      buttons.point.click()
    when 'L'.charCodeAt(0)
      e.preventDefault()
      buttons.line.click()
    when 'A'.charCodeAt(0)
      e.preventDefault()
      buttons.arc.click()
    when 'D'.charCodeAt(0)
      e.preventDefault()
      buttons.delete.click()
    else
      currentTool.key? e, currentMousePos
      console.log e.defaultPrevented
      changed() if e.defaultPrevented
