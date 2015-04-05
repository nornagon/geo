Vect = (@x, @y) ->
v = (x, y) -> new Vect(x, y)
v.sub = ({x:x1,y:y1}, {x:x2,y:y2}) -> v(x1-x2, y1-y2)
v.add = ({x:x1,y:y1}, {x:x2,y:y2}) -> v(x1+x2, y1+y2)
v.len = ({x,y}) -> Math.sqrt x*x+y*y
v.scale = ({x,y},s) -> v(x*s, y*s)
v.norm = (a) -> v.scale a, (1/v.len a)
v.atan2 = (w) -> Math.atan2 w.y, w.x
v.forAngle = (t) -> v(Math.cos(t), Math.sin(t))
v.cross = ({x:x1,y:y1}, {x:x2,y:y2}) -> x1*y2 - x2*y1
v.dot = ({x:x1,y:y1}, {x:x2,y:y2}) -> x1*x2 + y1*y2
v.perp = ({x,y}) -> v(-y, x)
v.neg = ({x,y}) -> v(-x, -y)

module.exports = v
