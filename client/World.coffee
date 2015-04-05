v = require('./vector')

seg2seg = (o1, o2) ->
  # http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
  q = o1.from
  p = o2.from
  s = v.sub(o1.to, o1.from)
  r = v.sub(o2.to, o2.from)
  x = v.cross(r, s)
  if x == 0  # collinear or parallel (cases 1, 2, 3)
    return []
  t = v.cross(v.sub(q, p), s) / x
  u = v.cross(v.sub(q, p), r) / x
  if 0 <= t <= 1 and 0 <= u <= 1  # intersecting (case 4)
    [v.add p, v.scale r, t]
  else  # not parallel, but not intersecting (case 5)
    []

seg2arc = (seg, arc) ->
  r = v.len arc.radius
  a = seg.from
  b = v.sub seg.to, seg.from
  c = arc.center
  alpha = v.dot b, b
  a_minus_c = v.sub a, c
  beta = 2*v.dot b, a_minus_c
  gamma = v.dot(a_minus_c, a_minus_c) - r*r
  discriminant = beta*beta - 4*alpha*gamma
  if discriminant < 0
    return []  # no intersection
  else
    discriminant = Math.sqrt(discriminant)
    t1 = (-beta - discriminant)/(2*alpha)
    t2 = (-beta + discriminant)/(2*alpha)
    [t1, t2]
      .filter (t) -> 0 <= t <= 1
      .map (t) -> v.add a, v.scale b, t
      # TODO: filter only the intersections that fall within the arc

arc2arc = (a1, a2) ->
  r1 = v.len a1.radius
  r2 = v.len a2.radius

  dv = v.sub a2.center, a1.center
  d = v.len(dv)
  x = (d*d + (r1*r1 - r2*r2)) / (2*d)
  y2 = r1*r1 - x*x
  if y2 >= 0
    y = Math.sqrt(y2)
    dvn = v.norm dv
    [
      v.add(
        v.scale dvn, x
        v.scale v.perp(dvn), y
      )
      v.add(
        v.scale dvn, x
        v.scale v.neg(v.perp dvn), y
      )
    ].map (p) -> v.add a1.center, p
  else []

intersectionTable =
  1:
    1: seg2seg
    2: seg2arc
  2:
    2: arc2arc

class World
  constructor: ->
    @objects = []

  add: (object) ->
    @objects.push object

  remove: (object) ->
    idx = @objects.indexOf object
    if idx >= 0
      @objects.splice idx, 1
    object

  draw: (ctx) ->
    for o in @objects
      ctx.save()
      o.draw(ctx)
      ctx.restore()
    return

  typePriority = {
    'line': 1
    'point': 2
    'intersection': 3
  }
  snapDist = 5

  snap: (pt) ->
    snappableMagnets = @magnetsNear pt
    if snappableMagnets.length
      snappableMagnets[0].magnet.point
    else
      pt

  magnetsNear: (pt) ->
    snappableMagnets = []
    relevantObjects = []
    for o in @objects
      anyRelevantMagnets = false
      for m in o.magnets(pt) when m?.point?
        dist = v.len v.sub pt, m.point
        if dist < snapDist
          anyRelevantMagnets = true
          snappableMagnets.push {object: o, magnet: m, dist}
      if anyRelevantMagnets
        relevantObjects.push o
    for o1,i in relevantObjects when o1.intersectCode?
      for o2,j in relevantObjects when j < i and o2.intersectCode?
        [code1, code2] = [o1.intersectCode, o2.intersectCode]
        if code2 < code1
          [code1, code2] = [code2, code1]
          [o1, o2] = [o2, o1]
        intersections = intersectionTable[code1][code2](o1, o2)
        continue unless intersections?.length
        for intersection in intersections
          dist = v.len v.sub pt, intersection
          if dist < snapDist
            snappableMagnets.push {
              magnet: {point: intersection, type: 'intersection'}
              dist
            }
    snappableMagnets.sort (a, b) ->
      (typePriority[b.magnet.type] - typePriority[a.magnet.type]) or
        (b.dist - a.dist)
    snappableMagnets

  objectsAt: (pt) ->
    @magnetsNear(pt)
      .filter (m) -> m.object?
      .map (m) -> m.object

module.exports = World
