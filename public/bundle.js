(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var World, arc2arc, intersectionTable, seg2arc, seg2seg, v;

v = require('./vector');

seg2seg = function(o1, o2) {
  var p, q, r, s, t, u, x;
  q = o1.from;
  p = o2.from;
  s = v.sub(o1.to, o1.from);
  r = v.sub(o2.to, o2.from);
  x = v.cross(r, s);
  if (x === 0) {
    return [];
  }
  t = v.cross(v.sub(q, p), s) / x;
  u = v.cross(v.sub(q, p), r) / x;
  if ((0 <= t && t <= 1) && (0 <= u && u <= 1)) {
    return [v.add(p, v.scale(r, t))];
  } else {
    return [];
  }
};

seg2arc = function(seg, arc) {
  var a, a_minus_c, alpha, b, beta, c, discriminant, gamma, r, t1, t2;
  r = v.len(arc.radius);
  a = seg.from;
  b = v.sub(seg.to, seg.from);
  c = arc.center;
  alpha = v.dot(b, b);
  a_minus_c = v.sub(a, c);
  beta = 2 * v.dot(b, a_minus_c);
  gamma = v.dot(a_minus_c, a_minus_c) - r * r;
  discriminant = beta * beta - 4 * alpha * gamma;
  if (discriminant < 0) {
    return [];
  } else {
    discriminant = Math.sqrt(discriminant);
    t1 = (-beta - discriminant) / (2 * alpha);
    t2 = (-beta + discriminant) / (2 * alpha);
    return [t1, t2].filter(function(t) {
      return (0 <= t && t <= 1);
    }).map(function(t) {
      return v.add(a, v.scale(b, t));
    });
  }
};

arc2arc = function(a1, a2) {
  var d, dv, dvn, r1, r2, x, y, y2;
  r1 = v.len(a1.radius);
  r2 = v.len(a2.radius);
  dv = v.sub(a2.center, a1.center);
  d = v.len(dv);
  x = (d * d + (r1 * r1 - r2 * r2)) / (2 * d);
  y2 = r1 * r1 - x * x;
  if (y2 >= 0) {
    y = Math.sqrt(y2);
    dvn = v.norm(dv);
    return [v.add(v.scale(dvn, x), v.scale(v.perp(dvn), y)), v.add(v.scale(dvn, x), v.scale(v.neg(v.perp(dvn)), y))].map(function(p) {
      return v.add(a1.center, p);
    });
  } else {
    return [];
  }
};

intersectionTable = {
  1: {
    1: seg2seg,
    2: seg2arc
  },
  2: {
    2: arc2arc
  }
};

World = (function() {
  var snapDist, typePriority;

  function World() {
    this.objects = [];
  }

  World.prototype.add = function(object) {
    return this.objects.push(object);
  };

  World.prototype.remove = function(object) {
    var idx;
    idx = this.objects.indexOf(object);
    if (idx >= 0) {
      this.objects.splice(idx, 1);
    }
    return object;
  };

  World.prototype.draw = function(ctx) {
    var k, len, o, ref;
    ref = this.objects;
    for (k = 0, len = ref.length; k < len; k++) {
      o = ref[k];
      ctx.save();
      o.draw(ctx);
      ctx.restore();
    }
  };

  typePriority = {
    'line': 1,
    'point': 2,
    'intersection': 3
  };

  snapDist = 5;

  World.prototype.snap = function(pt) {
    var snappableMagnets;
    snappableMagnets = this.magnetsNear(pt);
    if (snappableMagnets.length) {
      return snappableMagnets[0].magnet.point;
    } else {
      return pt;
    }
  };

  World.prototype.magnetsNear = function(pt) {
    var anyRelevantMagnets, code1, code2, dist, i, intersection, intersections, j, k, l, len, len1, len2, len3, len4, m, n, o, o1, o2, ref, ref1, ref2, ref3, ref4, relevantObjects, snappableMagnets, w, z;
    snappableMagnets = [];
    relevantObjects = [];
    ref = this.objects;
    for (k = 0, len = ref.length; k < len; k++) {
      o = ref[k];
      anyRelevantMagnets = false;
      ref1 = o.magnets(pt);
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        m = ref1[l];
        if (!((m != null ? m.point : void 0) != null)) {
          continue;
        }
        dist = v.len(v.sub(pt, m.point));
        if (dist < snapDist) {
          anyRelevantMagnets = true;
          snappableMagnets.push({
            object: o,
            magnet: m,
            dist: dist
          });
        }
      }
      if (anyRelevantMagnets) {
        relevantObjects.push(o);
      }
    }
    for (i = n = 0, len2 = relevantObjects.length; n < len2; i = ++n) {
      o1 = relevantObjects[i];
      if (o1.intersectCode != null) {
        for (j = w = 0, len3 = relevantObjects.length; w < len3; j = ++w) {
          o2 = relevantObjects[j];
          if (!(j < i && (o2.intersectCode != null))) {
            continue;
          }
          ref2 = [o1.intersectCode, o2.intersectCode], code1 = ref2[0], code2 = ref2[1];
          if (code2 < code1) {
            ref3 = [code2, code1], code1 = ref3[0], code2 = ref3[1];
            ref4 = [o2, o1], o1 = ref4[0], o2 = ref4[1];
          }
          intersections = intersectionTable[code1][code2](o1, o2);
          if (!(intersections != null ? intersections.length : void 0)) {
            continue;
          }
          for (z = 0, len4 = intersections.length; z < len4; z++) {
            intersection = intersections[z];
            dist = v.len(v.sub(pt, intersection));
            if (dist < snapDist) {
              snappableMagnets.push({
                magnet: {
                  point: intersection,
                  type: 'intersection'
                },
                dist: dist
              });
            }
          }
        }
      }
    }
    snappableMagnets.sort(function(a, b) {
      return (typePriority[b.magnet.type] - typePriority[a.magnet.type]) || (b.dist - a.dist);
    });
    return snappableMagnets;
  };

  World.prototype.objectsAt = function(pt) {
    return this.magnetsNear(pt).filter(function(m) {
      return m.object != null;
    }).map(function(m) {
      return m.object;
    });
  };

  return World;

})();

module.exports = World;



},{"./vector":12}],2:[function(require,module,exports){
var ButtonBar, classNames, h;

h = require('virtual-dom/h');

classNames = require('classnames');

require('./buttons.scss');

ButtonBar = function(buttons) {
  var b, k;
  return h('div', {
    className: 'button-bar'
  }, (function() {
    var results;
    results = [];
    for (k in buttons) {
      b = buttons[k];
      results.push(h('div', {
        key: k,
        className: classNames('button', {
          active: b.active
        }),
        onclick: b.click,
        onmouseover: b.hover
      }, [
        h('div', {
          className: 'content'
        }, [
          h('i', {
            className: "fa fa-fw " + b.icon
          })
        ])
      ]));
    }
    return results;
  })());
};

module.exports = {
  ButtonBar: ButtonBar
};



},{"./buttons.scss":3,"classnames":15,"virtual-dom/h":25}],3:[function(require,module,exports){
module.exports = require('sassify').byUrl('data:text/css;base64,LmJ1dHRvbi1iYXIgewogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICBkaXNwbGF5OiBmbGV4OwogIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgdG9wOiAxNXB4OwogIGxlZnQ6IC0xNXB4OwogIG1hcmdpbjogLTVweDsgfQoKLmJ1dHRvbiB7CiAgd2lkdGg6IDI2cHg7CiAgaGVpZ2h0OiAyNnB4OwogIHBvc2l0aW9uOiByZWxhdGl2ZTsKICBsZWZ0OiAycHg7CiAgdG9wOiAycHg7CiAgbWFyZ2luOiA1cHg7CiAgdHJhbnNpdGlvbjogMTUwbXM7CiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApOwogIGJvcmRlci1yYWRpdXM6IDE1cHg7CiAgYm94LXNoYWRvdzogMHB4IDJweCA3cHggI2E2YTZhNjsgfQogIC5idXR0b24gLmNvbnRlbnQgewogICAgYmFja2dyb3VuZDogd2hpdGU7CiAgICB3aWR0aDogMzBweDsKICAgIGhlaWdodDogMzBweDsKICAgIGJvcmRlci1yYWRpdXM6IDE1cHg7CiAgICB0cmFuc2l0aW9uOiAxNTBtczsKICAgIHBvc2l0aW9uOiByZWxhdGl2ZTsKICAgIHRvcDogLTJweDsKICAgIGxlZnQ6IC0ycHg7CiAgICBkaXNwbGF5OiBmbGV4OwogICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICAgIGp1c3RpZnktY29udGVudDogY2VudGVyOwogICAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7CiAgICBjb2xvcjogd2hpdGVzbW9rZTsKICAgIHRleHQtc2hhZG93OiAtMC41cHggLTAuNXB4IDBweCAjZDlkOWQ5OyB9CiAgLmJ1dHRvbi5hY3RpdmUgLmNvbnRlbnQgewogICAgYmFja2dyb3VuZDogYnVybHl3b29kOwogICAgY29sb3I6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC40MSk7CiAgICB0ZXh0LXNoYWRvdzogLTAuNXB4IC0wLjVweCAwIHJnYmEoMCwgMCwgMCwgMC4xKTsKICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwcHgpOyB9CiAgLmJ1dHRvbi5hY3RpdmU6aG92ZXIgLmNvbnRlbnQgewogICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDBweCk7IH0KICAuYnV0dG9uOmhvdmVyIHsKICAgIGN1cnNvcjogcG9pbnRlcjsKICAgIGJveC1zaGFkb3c6IDAgMnB4IDEwcHggI2JkYmRiZDsgfQogICAgLmJ1dHRvbjpob3ZlciAuY29udGVudCB7CiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtMnB4KTsgfQogIC5idXR0b246YWN0aXZlIHsKICAgIHRyYW5zaXRpb246IDkwbXM7CiAgICBib3gtc2hhZG93OiAwIDFweCA2cHggIzllOWU5ZTsgfQogICAgLmJ1dHRvbjphY3RpdmUgLmNvbnRlbnQgewogICAgICB0cmFuc2l0aW9uOiA5MG1zOwogICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMXB4KTsgfQoKLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxld29KSW5abGNuTnBiMjRpT2lBekxBb0pJbVpwYkdVaU9pQWlZblYwZEc5dWN5NXpZM056SWl3S0NTSnpiM1Z5WTJWeklqb2dXd29KQ1NKaWRYUjBiMjV6TG5OamMzTWlDZ2xkTEFvSkluTnZkWEpqWlhORGIyNTBaVzUwSWpvZ1d3b0pDU0lrWW5WMGRHOXVVMmw2WlRvZ016QndlRHRjYmx4dUxtSjFkSFJ2YmkxaVlYSWdlMXh1SUNCd2IzTnBkR2x2YmpvZ1lXSnpiMngxZEdVN1hHNGdJR1JwYzNCc1lYazZJR1pzWlhnN1hHNGdJR1pzWlhndFpHbHlaV04wYVc5dU9pQmpiMngxYlc0N1hHNGdJSFJ2Y0RvZ0pHSjFkSFJ2YmxOcGVtVXZNanRjYmlBZ2JHVm1kRG9nTFNSaWRYUjBiMjVUYVhwbEx6STdYRzRnSUcxaGNtZHBiam9nTFRWd2VEdGNibjFjYmx4dUxtSjFkSFJ2YmlCN1hHNGdJSGRwWkhSb09pQWtZblYwZEc5dVUybDZaU0F0SURSd2VEdGNiaUFnYUdWcFoyaDBPaUFrWW5WMGRHOXVVMmw2WlNBdElEUndlRHRjYmlBZ2NHOXphWFJwYjI0NklISmxiR0YwYVhabE8xeHVJQ0JzWldaME9pQXljSGc3WEc0Z0lIUnZjRG9nTW5CNE8xeHVJQ0J0WVhKbmFXNDZJRFZ3ZUR0Y2JseHVJQ0IwY21GdWMybDBhVzl1T2lBeE5UQnRjenRjYmlBZ2RISmhibk5tYjNKdE9pQjBjbUZ1YzJ4aGRHVlpLREFwTzF4dUlDQmliM0prWlhJdGNtRmthWFZ6T2lBa1luVjBkRzl1VTJsNlpTOHlPMXh1WEc0Z0lHSnZlQzF6YUdGa2IzYzZJREJ3ZUNBeWNIZ2dOM0I0SUdoemJDZ3dMREFsTERZMUpTazdYRzVjYmlBZ0xtTnZiblJsYm5RZ2UxeHVJQ0FnSUdKaFkydG5jbTkxYm1RNklIZG9hWFJsTzF4dUlDQWdJSGRwWkhSb09pQWtZblYwZEc5dVUybDZaVHRjYmlBZ0lDQm9aV2xuYUhRNklDUmlkWFIwYjI1VGFYcGxPMXh1SUNBZ0lHSnZjbVJsY2kxeVlXUnBkWE02SUNSaWRYUjBiMjVUYVhwbEx6STdYRzRnSUNBZ2RISmhibk5wZEdsdmJqb2dNVFV3YlhNN1hHNGdJQ0FnY0c5emFYUnBiMjQ2SUhKbGJHRjBhWFpsTzF4dUlDQWdJSFJ2Y0RvZ0xUSndlRHRjYmlBZ0lDQnNaV1owT2lBdE1uQjRPMXh1WEc0Z0lDQWdaR2x6Y0d4aGVUb2dabXhsZUR0Y2JpQWdJQ0JoYkdsbmJpMXBkR1Z0Y3pvZ1kyVnVkR1Z5TzF4dUlDQWdJR3AxYzNScFpua3RZMjl1ZEdWdWREb2dZMlZ1ZEdWeU8xeHVJQ0FnSUdadmJuUXRabUZ0YVd4NU9pQnpZVzV6TFhObGNtbG1PMXh1SUNBZ0lHTnZiRzl5T2lCb2Myd29NQ3dnTUNVc0lEazJKU2s3WEc0Z0lDQWdkR1Y0ZEMxemFHRmtiM2M2SUMwd0xqVndlQ0F0TUM0MWNIZ2dNSEI0SUdoemJDZ3dMQ0F3SlN3Z09EVWxLVHRjYmlBZ2ZWeHVJQ0FtTG1GamRHbDJaU0I3WEc0Z0lDQWdMbU52Ym5SbGJuUWdlMXh1SUNBZ0lDQWdZbUZqYTJkeWIzVnVaRG9nYUhOc0tETTBMQ0ExTnlVc0lEY3dKU2s3WEc0Z0lDQWdJQ0JqYjJ4dmNqb2dhSE5zWVNnd0xDQXhNREFsTENBeE1EQWxMQ0F3TGpReEtUdGNiaUFnSUNBZ0lIUmxlSFF0YzJoaFpHOTNPaUF0TUM0MWNIZ2dMVEF1TlhCNElEQWdhSE5zWVNnd0xDQXdKU3dnTUNVc0lEQXVNU2s3WEc0Z0lDQWdJQ0IwY21GdWMyWnZjbTA2SUhSeVlXNXpiR0YwWlZrb01IQjRLVHRjYmlBZ0lDQjlYRzRnSUNBZ0pqcG9iM1psY2lBdVkyOXVkR1Z1ZENCN1hHNGdJQ0FnSUNCMGNtRnVjMlp2Y20wNklIUnlZVzV6YkdGMFpWa29NSEI0S1R0Y2JpQWdJQ0I5WEc0Z0lIMWNiaUFnSmpwb2IzWmxjaUI3WEc0Z0lDQWdZM1Z5YzI5eU9pQndiMmx1ZEdWeU8xeHVYRzRnSUNBZ1ltOTRMWE5vWVdSdmR6b2dNQ0F5Y0hnZ01UQndlQ0JvYzJ3b01Dd3dKU3czTkNVcE8xeHVJQ0FnSUM1amIyNTBaVzUwSUh0Y2JpQWdJQ0FnSUhSeVlXNXpabTl5YlRvZ2RISmhibk5zWVhSbFdTZ3RNbkI0S1R0Y2JpQWdJQ0I5WEc0Z0lIMWNiaUFnSmpwaFkzUnBkbVVnZTF4dUlDQWdJSFJ5WVc1emFYUnBiMjQ2SURrd2JYTTdYRzRnSUNBZ1ltOTRMWE5vWVdSdmR6b2dNQ0F4Y0hnZ05uQjRJR2h6YkNnd0xEQWxMRFl5SlNrN1hHNGdJQ0FnTG1OdmJuUmxiblFnZTF4dUlDQWdJQ0FnZEhKaGJuTnBkR2x2YmpvZ09UQnRjenRjYmlBZ0lDQWdJSFJ5WVc1elptOXliVG9nZEhKaGJuTnNZWFJsV1NneGNIZ3BPMXh1SUNBZ0lIMWNiaUFnZlZ4dWZWeHVJZ29KWFN3S0NTSnRZWEJ3YVc1bmN5STZJQ0pCUVVWQkxGZEJRVmNzUTBGQlF6dEZRVU5XTEZGQlFWRXNSVUZCUlN4UlFVRlRPMFZCUTI1Q0xFOUJRVThzUlVGQlJTeEpRVUZMTzBWQlEyUXNZMEZCWXl4RlFVRkZMRTFCUVU4N1JVRkRka0lzUjBGQlJ5eEZRVUZGTEVsQlFWYzdSVUZEYUVJc1NVRkJTU3hGUVVGRkxFdEJRVU03UlVGRFVDeE5RVUZOTEVWQlFVVXNTVUZCU3l4SFFVTmtPenRCUVVWRUxFOUJRVThzUTBGQlF6dEZRVU5PTEV0QlFVc3NSVUZCUlN4SlFVRlhPMFZCUTJ4Q0xFMUJRVTBzUlVGQlJTeEpRVUZYTzBWQlEyNUNMRkZCUVZFc1JVRkJSU3hSUVVGVE8wVkJRMjVDTEVsQlFVa3NSVUZCUlN4SFFVRkpPMFZCUTFZc1IwRkJSeXhGUVVGRkxFZEJRVWs3UlVGRFZDeE5RVUZOTEVWQlFVVXNSMEZCU1R0RlFVVmFMRlZCUVZVc1JVRkJSU3hMUVVGTk8wVkJRMnhDTEZOQlFWTXNSVUZCUlN4aFFVRlZPMFZCUTNKQ0xHRkJRV0VzUlVGQlJTeEpRVUZYTzBWQlJURkNMRlZCUVZVc1JVRkJSU3hIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4UFFVRkhMRWRCT0VNMVFqdEZRVEZFUkN4UFFVRlBMRU5CWTB3c1VVRkJVU3hEUVVGRE8wbEJRMUFzVlVGQlZTeEZRVUZGTEV0QlFVMDdTVUZEYkVJc1MwRkJTeXhGUVROQ1NTeEpRVUZKTzBsQk5FSmlMRTFCUVUwc1JVRTFRa2NzU1VGQlNUdEpRVFpDWWl4aFFVRmhMRVZCUVVVc1NVRkJWenRKUVVNeFFpeFZRVUZWTEVWQlFVVXNTMEZCVFR0SlFVTnNRaXhSUVVGUkxFVkJRVVVzVVVGQlV6dEpRVU51UWl4SFFVRkhMRVZCUVVVc1NVRkJTenRKUVVOV0xFbEJRVWtzUlVGQlJTeEpRVUZMTzBsQlJWZ3NUMEZCVHl4RlFVRkZMRWxCUVVzN1NVRkRaQ3hYUVVGWExFVkJRVVVzVFVGQlR6dEpRVU53UWl4bFFVRmxMRVZCUVVVc1RVRkJUenRKUVVONFFpeFhRVUZYTEVWQlFVVXNWVUZCVnp0SlFVTjRRaXhMUVVGTExFVkJRVVVzVlVGQlJ6dEpRVU5XTEZkQlFWY3NSVUZCUnl4TlFVRkxMRU5CUVVVc1RVRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eFBRVUZITEVkQlEyNURPMFZCT1VKSUxFOUJRVThzUVVFclFrb3NUMEZCVHl4RFFVTk9MRkZCUVZFc1EwRkJRenRKUVVOUUxGVkJRVlVzUlVGQlJTeFRRVUZITzBsQlEyWXNTMEZCU3l4RlFVRkZMSGxDUVVGSk8wbEJRMWdzVjBGQlZ5eEZRVUZITEUxQlFVc3NRMEZCUlN4TlFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExHdENRVUZKTzBsQlEycERMRk5CUVZNc1JVRkJSU3hsUVVGVkxFZEJRM1JDTzBWQmNrTk1MRTlCUVU4c1FVRXJRa29zVDBGQlR5eEJRVTlNTEUxQlFVMHNRMEZCUXl4UlFVRlJMRU5CUVVNN1NVRkRaaXhUUVVGVExFVkJRVVVzWlVGQlZTeEhRVU4wUWp0RlFYaERUQ3hQUVVGUExFRkJNRU5LTEUxQlFVMHNRMEZCUXp0SlFVTk9MRTFCUVUwc1JVRkJSU3hQUVVGUk8wbEJSV2hDTEZWQlFWVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZITEVkQlNUTkNPMGxCYWtSSUxFOUJRVThzUVVFd1Ewb3NUVUZCVFN4RFFVbE1MRkZCUVZFc1EwRkJRenROUVVOUUxGTkJRVk1zUlVGQlJTeG5Ra0ZCVlN4SFFVTjBRanRGUVdoRVRDeFBRVUZQTEVGQmEwUktMRTlCUVU4c1EwRkJRenRKUVVOUUxGVkJRVlVzUlVGQlJTeEpRVUZMTzBsQlEycENMRlZCUVZVc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4UFFVRkhMRWRCU3pGQ08wbEJla1JJTEU5QlFVOHNRVUZyUkVvc1QwRkJUeXhEUVVkT0xGRkJRVkVzUTBGQlF6dE5RVU5RTEZWQlFWVXNSVUZCUlN4SlFVRkxPMDFCUTJwQ0xGTkJRVk1zUlVGQlJTeGxRVUZWTEVkQlEzUkNJaXdLQ1NKdVlXMWxjeUk2SUZ0ZENuMD0gKi8=');;
},{"sassify":22}],4:[function(require,module,exports){
var $buttonBar, $buttonRoot, ArcTool, ButtonBar, DeleteTool, HEIGHT, LineTool, PointTool, WIDTH, World, assign, buttons, canvas, changed, container, createElement, ctx, currentMousePos, currentTool, diff, draw, patch, world,
  hasProp = {}.hasOwnProperty;

World = require('./World');

PointTool = require('./tools/PointTool');

LineTool = require('./tools/LineTool');

ArcTool = require('./tools/ArcTool');

DeleteTool = require('./tools/DeleteTool');

ButtonBar = require('./buttons').ButtonBar;

assign = function(o1, o2) {
  var k, results, v;
  results = [];
  for (k in o2) {
    if (!hasProp.call(o2, k)) continue;
    v = o2[k];
    results.push(o1[k] = v);
  }
  return results;
};

WIDTH = 600;

HEIGHT = 600;

container = document.body.appendChild(document.createElement('div'));

assign(container.style, {
  position: 'relative'
});

canvas = container.appendChild(document.createElement('canvas'));

canvas.width = WIDTH * devicePixelRatio;

canvas.height = HEIGHT * devicePixelRatio;

ctx = canvas.getContext('2d');

ctx.scale(devicePixelRatio, devicePixelRatio);

ctx.lineCap = 'round';

world = new World;

currentTool = new ArcTool(world);

currentMousePos = null;

assign(canvas.style, {
  width: WIDTH + 'px',
  height: HEIGHT + 'px',
  boxShadow: '0px 0px 4px hsl(0,0%,88%)'
});

assign(document.body.style, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%'
});

assign(document.documentElement.style, {
  height: '100%'
});

buttons = function() {
  return {
    point: {
      icon: 'fa-times',
      active: currentTool.constructor === PointTool,
      click: function() {
        currentTool = new PointTool(world);
        return changed();
      },
      hover: function() {
        currentMousePos = null;
        return changed();
      }
    },
    line: {
      icon: 'fa-plus',
      active: currentTool.constructor === LineTool,
      click: function() {
        currentTool = new LineTool(world);
        return changed();
      },
      hover: function() {
        currentMousePos = null;
        return changed();
      }
    },
    arc: {
      icon: 'fa-circle-o',
      active: currentTool.constructor === ArcTool,
      click: function() {
        currentTool = new ArcTool(world);
        return changed();
      },
      hover: function() {
        currentMousePos = null;
        return changed();
      }
    },
    "delete": {
      icon: 'fa-ban',
      active: currentTool.constructor === DeleteTool,
      click: function() {
        currentTool = new DeleteTool(world);
        return changed();
      },
      hover: function() {
        currentMousePos = null;
        return changed();
      }
    }
  };
};

diff = require('virtual-dom/diff');

patch = require('virtual-dom/patch');

createElement = require('virtual-dom/create-element');

$buttonBar = ButtonBar(buttons());

$buttonRoot = createElement($buttonBar);

container.appendChild($buttonRoot);

draw = function() {
  var newBar, patches;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  world.draw(ctx);
  ctx.restore();
  ctx.save();
  currentTool.draw(ctx, currentMousePos);
  ctx.restore();
  newBar = ButtonBar(buttons());
  patches = diff($buttonBar, newBar);
  patch($buttonRoot, patches);
  return $buttonBar = newBar;
};

changed = function() {
  return draw();
};

canvas.onclick = function(e) {
  var pt, ref, x, y;
  ref = [e.offsetX, e.offsetY], x = ref[0], y = ref[1];
  pt = world.snap({
    x: x,
    y: y
  });
  currentMousePos = pt;
  currentTool.click(pt);
  return changed();
};

canvas.onmousemove = function(e) {
  var pt, ref, x, y;
  ref = [e.offsetX, e.offsetY], x = ref[0], y = ref[1];
  pt = world.snap({
    x: x,
    y: y
  });
  currentMousePos = pt;
  if (typeof currentTool.move === "function") {
    currentTool.move(pt);
  }
  return changed();
};

window.onkeydown = function(e) {
  switch (e.which) {
    case 27:
      e.preventDefault();
      if (typeof currentTool.esc === "function") {
        currentTool.esc();
      }
      return changed();
    case 'P'.charCodeAt(0):
      e.preventDefault();
      currentTool = new PointTool(world);
      return changed();
    case 'L'.charCodeAt(0):
      e.preventDefault();
      currentTool = new LineTool(world);
      return changed();
    case 'A'.charCodeAt(0):
      e.preventDefault();
      currentTool = new ArcTool(world);
      return changed();
    case 'D'.charCodeAt(0):
      e.preventDefault();
      currentTool = new DeleteTool(world);
      return changed();
    default:
      if (typeof currentTool.key === "function") {
        currentTool.key(e, currentMousePos);
      }
      if (e.defaultPrevented) {
        return changed();
      }
  }
};



},{"./World":1,"./buttons":2,"./tools/ArcTool":8,"./tools/DeleteTool":9,"./tools/LineTool":10,"./tools/PointTool":11,"virtual-dom/create-element":23,"virtual-dom/diff":24,"virtual-dom/patch":26}],5:[function(require,module,exports){
var Arc, isAngleBetween, v;

v = require('../vector');

isAngleBetween = function(a1, a2, a) {
  var ref;
  if (a1 > a2) {
    ref = [a2, a1], a1 = ref[0], a2 = ref[1];
  }
  while (a < a1) {
    a += Math.PI * 2;
  }
  while (a > a2) {
    a -= Math.PI * 2;
  }
  return (a1 <= a && a <= a2);
};

Arc = (function() {
  Arc.prototype.intersectCode = 2;

  function Arc(arg) {
    this.center = arg.center, this.radius = arg.radius, this.subtendedAngle = arg.subtendedAngle;
    this.startAngle = v.atan2(this.radius);
    this.endAngle = this.startAngle + this.subtendedAngle;
  }

  Arc.prototype.draw = function(ctx) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, v.len(this.radius), this.startAngle, this.endAngle, this.subtendedAngle < 0);
    return ctx.stroke();
  };

  Arc.prototype.magnets = function(pt) {
    var otherRadius, r;
    r = v.len(this.radius);
    otherRadius = v.add(this.center, v.scale(v.forAngle(this.endAngle), r));
    return [
      {
        point: v.add(this.center, this.radius),
        type: 'point'
      }, {
        point: otherRadius,
        type: 'point'
      }, {
        point: this.closestPointTo(pt),
        type: 'line'
      }
    ];
  };

  Arc.prototype.closestPointTo = function(pt) {
    var angle;
    angle = v.atan2(v.sub(pt, this.center));
    if (isAngleBetween(this.startAngle, this.endAngle, angle)) {
      return v.add(this.center, v.scale(v.forAngle(angle), v.len(this.radius)));
    }
  };

  return Arc;

})();

module.exports = Arc;



},{"../vector":12}],6:[function(require,module,exports){
var Line, v;

v = require('../vector');

Line = (function() {
  Line.prototype.intersectCode = 1;

  function Line(arg) {
    this.from = arg.from, this.to = arg.to;
  }

  Line.prototype.draw = function(ctx) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.from.x, this.from.y);
    ctx.lineTo(this.to.x, this.to.y);
    return ctx.stroke();
  };

  Line.prototype.magnets = function(pt) {
    return [
      {
        type: 'point',
        point: this.from
      }, {
        type: 'point',
        point: this.to
      }, {
        type: 'line',
        point: this.closestPointTo(pt)
      }
    ];
  };

  Line.prototype.closestPointTo = function(pt) {
    var len, tpx;
    len = v.len(v.sub(this.from, this.to));
    if (len === 0) {
      return this.from;
    }
    tpx = ((pt.x - this.from.x) * (this.to.x - this.from.x) + (pt.y - this.from.y) * (this.to.y - this.from.y)) / len;
    if (tpx < 4) {
      return this.from;
    } else if (tpx > len - 4) {
      return this.to;
    } else {
      return v.add(this.from, v.scale(v.sub(this.to, this.from), tpx / len));
    }
  };

  return Line;

})();

module.exports = Line;



},{"../vector":12}],7:[function(require,module,exports){
var Point;

Point = (function() {
  function Point(point) {
    this.point = point;
  }

  Point.prototype.draw = function(ctx) {
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(this.point.x - 4, this.point.y - 4);
    ctx.lineTo(this.point.x + 4, this.point.y + 4);
    ctx.moveTo(this.point.x + 4, this.point.y - 4);
    ctx.lineTo(this.point.x - 4, this.point.y + 4);
    return ctx.stroke();
  };

  Point.prototype.magnets = function(pt) {
    return [
      {
        type: 'point',
        point: this.point
      }
    ];
  };

  return Point;

})();

module.exports = Point;



},{}],8:[function(require,module,exports){
var Arc, ArcTool, v, wrappi;

v = require('../vector');

Arc = require('../shapes/Arc');

wrappi = function(x) {
  while (x < -Math.PI) {
    x += Math.PI * 2;
  }
  while (x > Math.PI) {
    x -= Math.PI * 2;
  }
  return x;
};

ArcTool = (function() {
  function ArcTool(world) {
    this.world = world;
    this.state = 'center';
    this.center = null;
    this.radius = null;
    this.startAngle = null;
    this.endAngle = null;
  }

  ArcTool.prototype.move = function(pt) {
    switch (this.state) {
      case 'angle':
        return this.endAngle = v.atan2(v.sub(pt, this.center));
    }
  };

  ArcTool.prototype.click = function(pt) {
    var subtendedAngle;
    switch (this.state) {
      case 'center':
        this.center = pt;
        this.state = 'radius';
        return this.radius = 0;
      case 'radius':
        this.radius = pt;
        this.state = 'angle';
        return this.startAngle = this.endAngle = v.atan2(v.sub(pt, this.center));
      case 'angle':
        subtendedAngle = wrappi(this.endAngle - this.startAngle);
        this.world.add(new Arc({
          center: this.center,
          radius: v.sub(this.radius, this.center),
          subtendedAngle: subtendedAngle
        }));
        this.state = 'center';
        return this.center = pt;
    }
  };

  ArcTool.prototype.esc = function() {
    return this.state = 'center';
  };

  ArcTool.prototype.draw = function(ctx, mouse) {
    var subtendedAngle;
    if (mouse == null) {
      return;
    }
    ctx.lineWidth = 1;
    switch (this.state) {
      case 'center':
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        return ctx.stroke();
      case 'radius':
        ctx.beginPath();
        ctx.moveTo(this.center.x, this.center.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, v.len(v.sub(mouse, this.center)), 0, Math.PI * 2);
        return ctx.stroke();
      case 'angle':
        subtendedAngle = wrappi(this.endAngle - this.startAngle);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, v.len(v.sub(this.radius, this.center)), this.startAngle, this.endAngle, subtendedAngle < 0);
        return ctx.stroke();
    }
  };

  return ArcTool;

})();

module.exports = ArcTool;



},{"../shapes/Arc":5,"../vector":12}],9:[function(require,module,exports){
var DeleteTool;

DeleteTool = (function() {
  function DeleteTool(world) {
    this.world = world;
  }

  DeleteTool.prototype.move = function(pt) {
    this.i = 0;
    return this.shapes = this.world.objectsAt(pt);
  };

  DeleteTool.prototype.shape = function() {
    var ref;
    return (ref = this.shapes) != null ? ref[this.i % this.shapes.length] : void 0;
  };

  DeleteTool.prototype.click = function(pt) {
    if (this.shape() != null) {
      this.world.remove(this.shape());
      return this.shapes = this.world.objectsAt(pt);
    }
  };

  DeleteTool.prototype.draw = function(ctx) {
    if (this.shape() != null) {
      ctx.strokeStyle = 'red';
      return this.shape().draw(ctx);
    }
  };

  DeleteTool.prototype.esc = function() {};

  DeleteTool.prototype.key = function(e, mouse) {
    switch (e.which) {
      case 9:
        e.preventDefault();
        return this.i += 1;
      case 13:
        e.preventDefault();
        return this.click(mouse.x, mouse.y);
    }
  };

  return DeleteTool;

})();

module.exports = DeleteTool;



},{}],10:[function(require,module,exports){
var Line, LineTool;

Line = require('../shapes/Line');

LineTool = (function() {
  function LineTool(world) {
    this.world = world;
    this.root = null;
  }

  LineTool.prototype.click = function(pt) {
    if (!this.root) {
      return this.root = pt;
    } else {
      this.world.add(new Line({
        from: this.root,
        to: pt
      }));
      return this.root = pt;
    }
  };

  LineTool.prototype.esc = function() {
    return this.root = null;
  };

  LineTool.prototype.draw = function(ctx, mouse) {
    if (mouse == null) {
      return;
    }
    if (!this.root) {
      ctx.beginPath();
      ctx.moveTo(mouse.x - 4, mouse.y);
      ctx.lineTo(mouse.x + 4, mouse.y);
      ctx.moveTo(mouse.x, mouse.y - 4);
      ctx.lineTo(mouse.x, mouse.y + 4);
      return ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(this.root.x, this.root.y);
      ctx.lineTo(mouse.x, mouse.y);
      return ctx.stroke();
    }
  };

  return LineTool;

})();

module.exports = LineTool;



},{"../shapes/Line":6}],11:[function(require,module,exports){
var Point, PointTool;

Point = require('../shapes/Point');

PointTool = (function() {
  function PointTool(world) {
    this.world = world;
  }

  PointTool.prototype.click = function(pt) {
    return this.world.add(new Point(pt));
  };

  PointTool.prototype.move = function(pt) {};

  PointTool.prototype.draw = function(ctx, mouse) {
    if (mouse == null) {
      return;
    }
    ctx.beginPath();
    ctx.moveTo(mouse.x - 4, mouse.y - 4);
    ctx.lineTo(mouse.x + 4, mouse.y + 4);
    ctx.moveTo(mouse.x + 4, mouse.y - 4);
    ctx.lineTo(mouse.x - 4, mouse.y + 4);
    return ctx.stroke();
  };

  return PointTool;

})();

module.exports = PointTool;



},{"../shapes/Point":7}],12:[function(require,module,exports){
var Vect, v;

Vect = function(x3, y3) {
  this.x = x3;
  this.y = y3;
};

v = function(x, y) {
  return new Vect(x, y);
};

v.sub = function(arg, arg1) {
  var x1, x2, y1, y2;
  x1 = arg.x, y1 = arg.y;
  x2 = arg1.x, y2 = arg1.y;
  return v(x1 - x2, y1 - y2);
};

v.add = function(arg, arg1) {
  var x1, x2, y1, y2;
  x1 = arg.x, y1 = arg.y;
  x2 = arg1.x, y2 = arg1.y;
  return v(x1 + x2, y1 + y2);
};

v.len = function(arg) {
  var x, y;
  x = arg.x, y = arg.y;
  return Math.sqrt(x * x + y * y);
};

v.scale = function(arg, s) {
  var x, y;
  x = arg.x, y = arg.y;
  return v(x * s, y * s);
};

v.norm = function(a) {
  return v.scale(a, 1 / v.len(a));
};

v.atan2 = function(w) {
  return Math.atan2(w.y, w.x);
};

v.forAngle = function(t) {
  return v(Math.cos(t), Math.sin(t));
};

v.cross = function(arg, arg1) {
  var x1, x2, y1, y2;
  x1 = arg.x, y1 = arg.y;
  x2 = arg1.x, y2 = arg1.y;
  return x1 * y2 - x2 * y1;
};

v.dot = function(arg, arg1) {
  var x1, x2, y1, y2;
  x1 = arg.x, y1 = arg.y;
  x2 = arg1.x, y2 = arg1.y;
  return x1 * x2 + y1 * y2;
};

v.perp = function(arg) {
  var x, y;
  x = arg.x, y = arg.y;
  return v(-y, x);
};

v.neg = function(arg) {
  var x, y;
  x = arg.x, y = arg.y;
  return v(-x, -y);
};

module.exports = v;



},{}],13:[function(require,module,exports){

},{}],14:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],15:[function(require,module,exports){
/*!
  Copyright (c) 2015 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/

function classNames() {
	var classes = '';
	var arg;

	for (var i = 0; i < arguments.length; i++) {
		arg = arguments[i];
		if (!arg) {
			continue;
		}

		if ('string' === typeof arg || 'number' === typeof arg) {
			classes += ' ' + arg;
		} else if (Object.prototype.toString.call(arg) === '[object Array]') {
			classes += ' ' + classNames.apply(null, arg);
		} else if ('object' === typeof arg) {
			for (var key in arg) {
				if (!arg.hasOwnProperty(key) || !arg[key]) {
					continue;
				}
				classes += ' ' + key;
			}
		}
	}
	return classes.substr(1);
}

// safely export classNames for node / browserify
if (typeof module !== 'undefined' && module.exports) {
	module.exports = classNames;
}

// safely export classNames for RequireJS
if (typeof define !== 'undefined' && define.amd) {
	define('classnames', [], function() {
		return classNames;
	});
}

},{}],16:[function(require,module,exports){
module.exports = function (css, customDocument) {
  var doc = customDocument || document;
  if (doc.createStyleSheet) {
    var sheet = doc.createStyleSheet()
    sheet.cssText = css;
    return sheet.ownerNode;
  } else {
    var head = doc.getElementsByTagName('head')[0],
        style = doc.createElement('style');

    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(doc.createTextNode(css));
    }

    head.appendChild(style);
    return style;
  }
};

module.exports.byUrl = function(url) {
  if (document.createStyleSheet) {
    return document.createStyleSheet(url).ownerNode;
  } else {
    var head = document.getElementsByTagName('head')[0],
        link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = url;

    head.appendChild(link);
    return link;
  }
};

},{}],17:[function(require,module,exports){
'use strict';

var OneVersionConstraint = require('individual/one-version');

var MY_VERSION = '7';
OneVersionConstraint('ev-store', MY_VERSION);

var hashKey = '__EV_STORE_KEY@' + MY_VERSION;

module.exports = EvStore;

function EvStore(elem) {
    var hash = elem[hashKey];

    if (!hash) {
        hash = elem[hashKey] = {};
    }

    return hash;
}

},{"individual/one-version":20}],18:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9nbG9iYWwvZG9jdW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgdG9wTGV2ZWwgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6XG4gICAgdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB7fVxudmFyIG1pbkRvYyA9IHJlcXVpcmUoJ21pbi1kb2N1bWVudCcpO1xuXG5pZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQ7XG59IGVsc2Uge1xuICAgIHZhciBkb2NjeSA9IHRvcExldmVsWydfX0dMT0JBTF9ET0NVTUVOVF9DQUNIRUA0J107XG5cbiAgICBpZiAoIWRvY2N5KSB7XG4gICAgICAgIGRvY2N5ID0gdG9wTGV2ZWxbJ19fR0xPQkFMX0RPQ1VNRU5UX0NBQ0hFQDQnXSA9IG1pbkRvYztcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGRvY2N5O1xufVxuIl19
},{"min-document":13}],19:[function(require,module,exports){
(function (global){
'use strict';

/*global window, global*/

var root = typeof window !== 'undefined' ?
    window : typeof global !== 'undefined' ?
    global : {};

module.exports = Individual;

function Individual(key, value) {
    if (key in root) {
        return root[key];
    }

    root[key] = value;

    return value;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9pbmRpdmlkdWFsL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbi8qZ2xvYmFsIHdpbmRvdywgZ2xvYmFsKi9cblxudmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/XG4gICAgd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgP1xuICAgIGdsb2JhbCA6IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEluZGl2aWR1YWw7XG5cbmZ1bmN0aW9uIEluZGl2aWR1YWwoa2V5LCB2YWx1ZSkge1xuICAgIGlmIChrZXkgaW4gcm9vdCkge1xuICAgICAgICByZXR1cm4gcm9vdFtrZXldO1xuICAgIH1cblxuICAgIHJvb3Rba2V5XSA9IHZhbHVlO1xuXG4gICAgcmV0dXJuIHZhbHVlO1xufVxuIl19
},{}],20:[function(require,module,exports){
'use strict';

var Individual = require('./index.js');

module.exports = OneVersion;

function OneVersion(moduleName, version, defaultValue) {
    var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
    var enforceKey = key + '_ENFORCE_SINGLETON';

    var versionValue = Individual(enforceKey, version);

    if (versionValue !== version) {
        throw new Error('Can only have one copy of ' +
            moduleName + '.\n' +
            'You already have version ' + versionValue +
            ' installed.\n' +
            'This means you cannot install version ' + version);
    }

    return Individual(key, defaultValue);
}

},{"./index.js":19}],21:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],22:[function(require,module,exports){
module.exports = require('cssify');
},{"cssify":16}],23:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":28}],24:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":48}],25:[function(require,module,exports){
var h = require("./virtual-hyperscript/index.js")

module.exports = h

},{"./virtual-hyperscript/index.js":35}],26:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":31}],27:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":39,"is-object":21}],28:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":37,"../vnode/is-vnode.js":40,"../vnode/is-vtext.js":41,"../vnode/is-widget.js":42,"./apply-properties":27,"global/document":18}],29:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],30:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":42,"../vnode/vpatch.js":45,"./apply-properties":27,"./update-widget":32}],31:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":28,"./dom-index":29,"./patch-op":30,"global/document":18,"x-is-array":49}],32:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":42}],33:[function(require,module,exports){
'use strict';

var EvStore = require('ev-store');

module.exports = EvHook;

function EvHook(value) {
    if (!(this instanceof EvHook)) {
        return new EvHook(value);
    }

    this.value = value;
}

EvHook.prototype.hook = function (node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = this.value;
};

EvHook.prototype.unhook = function(node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = undefined;
};

},{"ev-store":17}],34:[function(require,module,exports){
'use strict';

module.exports = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

},{}],35:[function(require,module,exports){
'use strict';

var isArray = require('x-is-array');

var VNode = require('../vnode/vnode.js');
var VText = require('../vnode/vtext.js');
var isVNode = require('../vnode/is-vnode');
var isVText = require('../vnode/is-vtext');
var isWidget = require('../vnode/is-widget');
var isHook = require('../vnode/is-vhook');
var isVThunk = require('../vnode/is-thunk');

var parseTag = require('./parse-tag.js');
var softSetHook = require('./hooks/soft-set-hook.js');
var evHook = require('./hooks/ev-hook.js');

module.exports = h;

function h(tagName, properties, children) {
    var childNodes = [];
    var tag, props, key, namespace;

    if (!children && isChildren(properties)) {
        children = properties;
        props = {};
    }

    props = props || properties || {};
    tag = parseTag(tagName, props);

    // support keys
    if (props.hasOwnProperty('key')) {
        key = props.key;
        props.key = undefined;
    }

    // support namespace
    if (props.hasOwnProperty('namespace')) {
        namespace = props.namespace;
        props.namespace = undefined;
    }

    // fix cursor bug
    if (tag === 'INPUT' &&
        !namespace &&
        props.hasOwnProperty('value') &&
        props.value !== undefined &&
        !isHook(props.value)
    ) {
        props.value = softSetHook(props.value);
    }

    transformProperties(props);

    if (children !== undefined && children !== null) {
        addChild(children, childNodes, tag, props);
    }


    return new VNode(tag, props, childNodes, key, namespace);
}

function addChild(c, childNodes, tag, props) {
    if (typeof c === 'string') {
        childNodes.push(new VText(c));
    } else if (typeof c === 'number') {
        childNodes.push(new VText(String(c)));
    } else if (isChild(c)) {
        childNodes.push(c);
    } else if (isArray(c)) {
        for (var i = 0; i < c.length; i++) {
            addChild(c[i], childNodes, tag, props);
        }
    } else if (c === null || c === undefined) {
        return;
    } else {
        throw UnexpectedVirtualElement({
            foreignObject: c,
            parentVnode: {
                tagName: tag,
                properties: props
            }
        });
    }
}

function transformProperties(props) {
    for (var propName in props) {
        if (props.hasOwnProperty(propName)) {
            var value = props[propName];

            if (isHook(value)) {
                continue;
            }

            if (propName.substr(0, 3) === 'ev-') {
                // add ev-foo support
                props[propName] = evHook(value);
            }
        }
    }
}

function isChild(x) {
    return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
}

function isChildren(x) {
    return typeof x === 'string' || isArray(x) || isChild(x);
}

function UnexpectedVirtualElement(data) {
    var err = new Error();

    err.type = 'virtual-hyperscript.unexpected.virtual-element';
    err.message = 'Unexpected virtual child passed to h().\n' +
        'Expected a VNode / Vthunk / VWidget / string but:\n' +
        'got:\n' +
        errorString(data.foreignObject) +
        '.\n' +
        'The parent vnode is:\n' +
        errorString(data.parentVnode)
        '\n' +
        'Suggested fix: change your `h(..., [ ... ])` callsite.';
    err.foreignObject = data.foreignObject;
    err.parentVnode = data.parentVnode;

    return err;
}

function errorString(obj) {
    try {
        return JSON.stringify(obj, null, '    ');
    } catch (e) {
        return String(obj);
    }
}

},{"../vnode/is-thunk":38,"../vnode/is-vhook":39,"../vnode/is-vnode":40,"../vnode/is-vtext":41,"../vnode/is-widget":42,"../vnode/vnode.js":44,"../vnode/vtext.js":46,"./hooks/ev-hook.js":33,"./hooks/soft-set-hook.js":34,"./parse-tag.js":36,"x-is-array":49}],36:[function(require,module,exports){
'use strict';

var split = require('browser-split');

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

module.exports = parseTag;

function parseTag(tag, props) {
    if (!tag) {
        return 'DIV';
    }

    var noId = !(props.hasOwnProperty('id'));

    var tagParts = split(tag, classIdSplit);
    var tagName = null;

    if (notClassId.test(tagParts[1])) {
        tagName = 'DIV';
    }

    var classes, part, type, i;

    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i];

        if (!part) {
            continue;
        }

        type = part.charAt(0);

        if (!tagName) {
            tagName = part;
        } else if (type === '.') {
            classes = classes || [];
            classes.push(part.substring(1, part.length));
        } else if (type === '#' && noId) {
            props.id = part.substring(1, part.length);
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className);
        }

        props.className = classes.join(' ');
    }

    return props.namespace ? tagName : tagName.toUpperCase();
}

},{"browser-split":14}],37:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":38,"./is-vnode":40,"./is-vtext":41,"./is-widget":42}],38:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],39:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],40:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":43}],41:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":43}],42:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],43:[function(require,module,exports){
module.exports = "2"

},{}],44:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":38,"./is-vhook":39,"./is-vnode":40,"./is-widget":42,"./version":43}],45:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":43}],46:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":43}],47:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":39,"is-object":21}],48:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":37,"../vnode/is-thunk":38,"../vnode/is-vnode":40,"../vnode/is-vtext":41,"../vnode/is-widget":42,"../vnode/vpatch":45,"./diff-props":47,"x-is-array":49}],49:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL25vcm5hZ29uL1NvdXJjZS9BcmNoaXZlcy9nZW8vY2xpZW50L1dvcmxkLmNvZmZlZSIsIi9Vc2Vycy9ub3JuYWdvbi9Tb3VyY2UvQXJjaGl2ZXMvZ2VvL2NsaWVudC9idXR0b25zLmNvZmZlZSIsImNsaWVudC9idXR0b25zLnNjc3MiLCIvVXNlcnMvbm9ybmFnb24vU291cmNlL0FyY2hpdmVzL2dlby9jbGllbnQvaW5kZXguY29mZmVlIiwiL1VzZXJzL25vcm5hZ29uL1NvdXJjZS9BcmNoaXZlcy9nZW8vY2xpZW50L3NoYXBlcy9BcmMuY29mZmVlIiwiL1VzZXJzL25vcm5hZ29uL1NvdXJjZS9BcmNoaXZlcy9nZW8vY2xpZW50L3NoYXBlcy9MaW5lLmNvZmZlZSIsIi9Vc2Vycy9ub3JuYWdvbi9Tb3VyY2UvQXJjaGl2ZXMvZ2VvL2NsaWVudC9zaGFwZXMvUG9pbnQuY29mZmVlIiwiL1VzZXJzL25vcm5hZ29uL1NvdXJjZS9BcmNoaXZlcy9nZW8vY2xpZW50L3Rvb2xzL0FyY1Rvb2wuY29mZmVlIiwiL1VzZXJzL25vcm5hZ29uL1NvdXJjZS9BcmNoaXZlcy9nZW8vY2xpZW50L3Rvb2xzL0RlbGV0ZVRvb2wuY29mZmVlIiwiL1VzZXJzL25vcm5hZ29uL1NvdXJjZS9BcmNoaXZlcy9nZW8vY2xpZW50L3Rvb2xzL0xpbmVUb29sLmNvZmZlZSIsIi9Vc2Vycy9ub3JuYWdvbi9Tb3VyY2UvQXJjaGl2ZXMvZ2VvL2NsaWVudC90b29scy9Qb2ludFRvb2wuY29mZmVlIiwiL1VzZXJzL25vcm5hZ29uL1NvdXJjZS9BcmNoaXZlcy9nZW8vY2xpZW50L3ZlY3Rvci5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXItc3BsaXQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2xhc3NuYW1lcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jc3NpZnkvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9ldi1zdG9yZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbG9iYWwvZG9jdW1lbnQuanMiLCJub2RlX21vZHVsZXMvaW5kaXZpZHVhbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRpdmlkdWFsL29uZS12ZXJzaW9uLmpzIiwibm9kZV9tb2R1bGVzL2lzLW9iamVjdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zYXNzaWZ5L2xpYi9zYXNzaWZ5LWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vY3JlYXRlLWVsZW1lbnQuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vZGlmZi5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS9oLmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3BhdGNoLmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3Zkb20vYXBwbHktcHJvcGVydGllcy5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92ZG9tL2NyZWF0ZS1lbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3Zkb20vZG9tLWluZGV4LmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3Zkb20vcGF0Y2gtb3AuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdmRvbS9wYXRjaC5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92ZG9tL3VwZGF0ZS13aWRnZXQuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdmlydHVhbC1oeXBlcnNjcmlwdC9ob29rcy9ldi1ob29rLmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3ZpcnR1YWwtaHlwZXJzY3JpcHQvaG9va3Mvc29mdC1zZXQtaG9vay5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92aXJ0dWFsLWh5cGVyc2NyaXB0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3ZpcnR1YWwtaHlwZXJzY3JpcHQvcGFyc2UtdGFnLmpzIiwibm9kZV9tb2R1bGVzL3ZpcnR1YWwtZG9tL3Zub2RlL2hhbmRsZS10aHVuay5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92bm9kZS9pcy10aHVuay5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92bm9kZS9pcy12aG9vay5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92bm9kZS9pcy12bm9kZS5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92bm9kZS9pcy12dGV4dC5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92bm9kZS9pcy13aWRnZXQuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdm5vZGUvdmVyc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92bm9kZS92bm9kZS5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92bm9kZS92cGF0Y2guanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdm5vZGUvdnRleHQuanMiLCJub2RlX21vZHVsZXMvdmlydHVhbC1kb20vdnRyZWUvZGlmZi1wcm9wcy5qcyIsIm5vZGVfbW9kdWxlcy92aXJ0dWFsLWRvbS92dHJlZS9kaWZmLmpzIiwibm9kZV9tb2R1bGVzL3gtaXMtYXJyYXkvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsVUFBUjs7QUFFSixPQUFBLEdBQVUsU0FBQyxFQUFELEVBQUssRUFBTDtBQUVSLE1BQUE7RUFBQSxDQUFBLEdBQUksRUFBRSxDQUFDO0VBQ1AsQ0FBQSxHQUFJLEVBQUUsQ0FBQztFQUNQLENBQUEsR0FBSSxDQUFDLENBQUMsR0FBRixDQUFNLEVBQUUsQ0FBQyxFQUFULEVBQWEsRUFBRSxDQUFDLElBQWhCO0VBQ0osQ0FBQSxHQUFJLENBQUMsQ0FBQyxHQUFGLENBQU0sRUFBRSxDQUFDLEVBQVQsRUFBYSxFQUFFLENBQUMsSUFBaEI7RUFDSixDQUFBLEdBQUksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxDQUFSLEVBQVcsQ0FBWDtFQUNKLElBQUcsQ0FBQSxLQUFLLENBQVI7QUFDRSxXQUFPLEdBRFQ7O0VBRUEsQ0FBQSxHQUFJLENBQUMsQ0FBQyxLQUFGLENBQVEsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxDQUFOLEVBQVMsQ0FBVCxDQUFSLEVBQXFCLENBQXJCLENBQUEsR0FBMEI7RUFDOUIsQ0FBQSxHQUFJLENBQUMsQ0FBQyxLQUFGLENBQVEsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxDQUFOLEVBQVMsQ0FBVCxDQUFSLEVBQXFCLENBQXJCLENBQUEsR0FBMEI7RUFDOUIsSUFBRyxDQUFBLENBQUEsSUFBSyxDQUFMLElBQUssQ0FBTCxJQUFVLENBQVYsQ0FBQSxJQUFnQixDQUFBLENBQUEsSUFBSyxDQUFMLElBQUssQ0FBTCxJQUFVLENBQVYsQ0FBbkI7V0FDRSxDQUFDLENBQUMsQ0FBQyxHQUFGLENBQU0sQ0FBTixFQUFTLENBQUMsQ0FBQyxLQUFGLENBQVEsQ0FBUixFQUFXLENBQVgsQ0FBVCxDQUFELEVBREY7R0FBQSxNQUFBO1dBR0UsR0FIRjs7QUFYUTs7QUFnQlYsT0FBQSxHQUFVLFNBQUMsR0FBRCxFQUFNLEdBQU47QUFDUixNQUFBO0VBQUEsQ0FBQSxHQUFJLENBQUMsQ0FBQyxHQUFGLENBQU0sR0FBRyxDQUFDLE1BQVY7RUFDSixDQUFBLEdBQUksR0FBRyxDQUFDO0VBQ1IsQ0FBQSxHQUFJLENBQUMsQ0FBQyxHQUFGLENBQU0sR0FBRyxDQUFDLEVBQVYsRUFBYyxHQUFHLENBQUMsSUFBbEI7RUFDSixDQUFBLEdBQUksR0FBRyxDQUFDO0VBQ1IsS0FBQSxHQUFRLENBQUMsQ0FBQyxHQUFGLENBQU0sQ0FBTixFQUFTLENBQVQ7RUFDUixTQUFBLEdBQVksQ0FBQyxDQUFDLEdBQUYsQ0FBTSxDQUFOLEVBQVMsQ0FBVDtFQUNaLElBQUEsR0FBTyxDQUFBLEdBQUUsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxDQUFOLEVBQVMsU0FBVDtFQUNULEtBQUEsR0FBUSxDQUFDLENBQUMsR0FBRixDQUFNLFNBQU4sRUFBaUIsU0FBakIsQ0FBQSxHQUE4QixDQUFBLEdBQUU7RUFDeEMsWUFBQSxHQUFlLElBQUEsR0FBSyxJQUFMLEdBQVksQ0FBQSxHQUFFLEtBQUYsR0FBUTtFQUNuQyxJQUFHLFlBQUEsR0FBZSxDQUFsQjtBQUNFLFdBQU8sR0FEVDtHQUFBLE1BQUE7SUFHRSxZQUFBLEdBQWUsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWO0lBQ2YsRUFBQSxHQUFLLENBQUMsQ0FBQyxJQUFELEdBQVEsWUFBVCxDQUFBLEdBQXVCLENBQUMsQ0FBQSxHQUFFLEtBQUg7SUFDNUIsRUFBQSxHQUFLLENBQUMsQ0FBQyxJQUFELEdBQVEsWUFBVCxDQUFBLEdBQXVCLENBQUMsQ0FBQSxHQUFFLEtBQUg7V0FDNUIsQ0FBQyxFQUFELEVBQUssRUFBTCxDQUNFLENBQUMsTUFESCxDQUNVLFNBQUMsQ0FBRDthQUFPLENBQUEsQ0FBQSxJQUFLLENBQUwsSUFBSyxDQUFMLElBQVUsQ0FBVjtJQUFQLENBRFYsQ0FFRSxDQUFDLEdBRkgsQ0FFTyxTQUFDLENBQUQ7YUFBTyxDQUFDLENBQUMsR0FBRixDQUFNLENBQU4sRUFBUyxDQUFDLENBQUMsS0FBRixDQUFRLENBQVIsRUFBVyxDQUFYLENBQVQ7SUFBUCxDQUZQLEVBTkY7O0FBVlE7O0FBcUJWLE9BQUEsR0FBVSxTQUFDLEVBQUQsRUFBSyxFQUFMO0FBQ1IsTUFBQTtFQUFBLEVBQUEsR0FBSyxDQUFDLENBQUMsR0FBRixDQUFNLEVBQUUsQ0FBQyxNQUFUO0VBQ0wsRUFBQSxHQUFLLENBQUMsQ0FBQyxHQUFGLENBQU0sRUFBRSxDQUFDLE1BQVQ7RUFFTCxFQUFBLEdBQUssQ0FBQyxDQUFDLEdBQUYsQ0FBTSxFQUFFLENBQUMsTUFBVCxFQUFpQixFQUFFLENBQUMsTUFBcEI7RUFDTCxDQUFBLEdBQUksQ0FBQyxDQUFDLEdBQUYsQ0FBTSxFQUFOO0VBQ0osQ0FBQSxHQUFJLENBQUMsQ0FBQSxHQUFFLENBQUYsR0FBTSxDQUFDLEVBQUEsR0FBRyxFQUFILEdBQVEsRUFBQSxHQUFHLEVBQVosQ0FBUCxDQUFBLEdBQTBCLENBQUMsQ0FBQSxHQUFFLENBQUg7RUFDOUIsRUFBQSxHQUFLLEVBQUEsR0FBRyxFQUFILEdBQVEsQ0FBQSxHQUFFO0VBQ2YsSUFBRyxFQUFBLElBQU0sQ0FBVDtJQUNFLENBQUEsR0FBSSxJQUFJLENBQUMsSUFBTCxDQUFVLEVBQVY7SUFDSixHQUFBLEdBQU0sQ0FBQyxDQUFDLElBQUYsQ0FBTyxFQUFQO1dBQ04sQ0FDRSxDQUFDLENBQUMsR0FBRixDQUNFLENBQUMsQ0FBQyxLQUFGLENBQVEsR0FBUixFQUFhLENBQWIsQ0FERixFQUVFLENBQUMsQ0FBQyxLQUFGLENBQVEsQ0FBQyxDQUFDLElBQUYsQ0FBTyxHQUFQLENBQVIsRUFBcUIsQ0FBckIsQ0FGRixDQURGLEVBS0UsQ0FBQyxDQUFDLEdBQUYsQ0FDRSxDQUFDLENBQUMsS0FBRixDQUFRLEdBQVIsRUFBYSxDQUFiLENBREYsRUFFRSxDQUFDLENBQUMsS0FBRixDQUFRLENBQUMsQ0FBQyxHQUFGLENBQU0sQ0FBQyxDQUFDLElBQUYsQ0FBTyxHQUFQLENBQU4sQ0FBUixFQUEyQixDQUEzQixDQUZGLENBTEYsQ0FTQyxDQUFDLEdBVEYsQ0FTTSxTQUFDLENBQUQ7YUFBTyxDQUFDLENBQUMsR0FBRixDQUFNLEVBQUUsQ0FBQyxNQUFULEVBQWlCLENBQWpCO0lBQVAsQ0FUTixFQUhGO0dBQUEsTUFBQTtXQWFLLEdBYkw7O0FBUlE7O0FBdUJWLGlCQUFBLEdBQ0U7RUFBQSxDQUFBLEVBQ0U7SUFBQSxDQUFBLEVBQUcsT0FBSDtJQUNBLENBQUEsRUFBRyxPQURIO0dBREY7RUFHQSxDQUFBLEVBQ0U7SUFBQSxDQUFBLEVBQUcsT0FBSDtHQUpGOzs7QUFNSTtBQUNKLE1BQUE7O0VBQWEsZUFBQTtJQUNYLElBQUMsQ0FBQSxPQUFELEdBQVc7RUFEQTs7a0JBR2IsR0FBQSxHQUFLLFNBQUMsTUFBRDtXQUNILElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLE1BQWQ7RUFERzs7a0JBR0wsTUFBQSxHQUFRLFNBQUMsTUFBRDtBQUNOLFFBQUE7SUFBQSxHQUFBLEdBQU0sSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQWlCLE1BQWpCO0lBQ04sSUFBRyxHQUFBLElBQU8sQ0FBVjtNQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixHQUFoQixFQUFxQixDQUFyQixFQURGOztXQUVBO0VBSk07O2tCQU1SLElBQUEsR0FBTSxTQUFDLEdBQUQ7QUFDSixRQUFBO0FBQUE7QUFBQSxTQUFBLHFDQUFBOztNQUNFLEdBQUcsQ0FBQyxJQUFKLENBQUE7TUFDQSxDQUFDLENBQUMsSUFBRixDQUFPLEdBQVA7TUFDQSxHQUFHLENBQUMsT0FBSixDQUFBO0FBSEY7RUFESTs7RUFPTixZQUFBLEdBQWU7SUFDYixNQUFBLEVBQVEsQ0FESztJQUViLE9BQUEsRUFBUyxDQUZJO0lBR2IsY0FBQSxFQUFnQixDQUhIOzs7RUFLZixRQUFBLEdBQVc7O2tCQUVYLElBQUEsR0FBTSxTQUFDLEVBQUQ7QUFDSixRQUFBO0lBQUEsZ0JBQUEsR0FBbUIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxFQUFiO0lBQ25CLElBQUcsZ0JBQWdCLENBQUMsTUFBcEI7YUFDRSxnQkFBaUIsQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUFNLENBQUMsTUFEN0I7S0FBQSxNQUFBO2FBR0UsR0FIRjs7RUFGSTs7a0JBT04sV0FBQSxHQUFhLFNBQUMsRUFBRDtBQUNYLFFBQUE7SUFBQSxnQkFBQSxHQUFtQjtJQUNuQixlQUFBLEdBQWtCO0FBQ2xCO0FBQUEsU0FBQSxxQ0FBQTs7TUFDRSxrQkFBQSxHQUFxQjtBQUNyQjtBQUFBLFdBQUEsd0NBQUE7O2NBQTRCOzs7UUFDMUIsSUFBQSxHQUFPLENBQUMsQ0FBQyxHQUFGLENBQU0sQ0FBQyxDQUFDLEdBQUYsQ0FBTSxFQUFOLEVBQVUsQ0FBQyxDQUFDLEtBQVosQ0FBTjtRQUNQLElBQUcsSUFBQSxHQUFPLFFBQVY7VUFDRSxrQkFBQSxHQUFxQjtVQUNyQixnQkFBZ0IsQ0FBQyxJQUFqQixDQUFzQjtZQUFDLE1BQUEsRUFBUSxDQUFUO1lBQVksTUFBQSxFQUFRLENBQXBCO1lBQXVCLE1BQUEsSUFBdkI7V0FBdEIsRUFGRjs7QUFGRjtNQUtBLElBQUcsa0JBQUg7UUFDRSxlQUFlLENBQUMsSUFBaEIsQ0FBcUIsQ0FBckIsRUFERjs7QUFQRjtBQVNBLFNBQUEsMkRBQUE7O1VBQWlDO0FBQy9CLGFBQUEsMkRBQUE7O2dCQUFpQyxDQUFBLEdBQUksQ0FBSixJQUFVOzs7VUFDekMsT0FBaUIsQ0FBQyxFQUFFLENBQUMsYUFBSixFQUFtQixFQUFFLENBQUMsYUFBdEIsQ0FBakIsRUFBQyxlQUFELEVBQVE7VUFDUixJQUFHLEtBQUEsR0FBUSxLQUFYO1lBQ0UsT0FBaUIsQ0FBQyxLQUFELEVBQVEsS0FBUixDQUFqQixFQUFDLGVBQUQsRUFBUTtZQUNSLE9BQVcsQ0FBQyxFQUFELEVBQUssRUFBTCxDQUFYLEVBQUMsWUFBRCxFQUFLLGFBRlA7O1VBR0EsYUFBQSxHQUFnQixpQkFBa0IsQ0FBQSxLQUFBLENBQU8sQ0FBQSxLQUFBLENBQXpCLENBQWdDLEVBQWhDLEVBQW9DLEVBQXBDO1VBQ2hCLElBQUEsMEJBQWdCLGFBQWEsQ0FBRSxnQkFBL0I7QUFBQSxxQkFBQTs7QUFDQSxlQUFBLGlEQUFBOztZQUNFLElBQUEsR0FBTyxDQUFDLENBQUMsR0FBRixDQUFNLENBQUMsQ0FBQyxHQUFGLENBQU0sRUFBTixFQUFVLFlBQVYsQ0FBTjtZQUNQLElBQUcsSUFBQSxHQUFPLFFBQVY7Y0FDRSxnQkFBZ0IsQ0FBQyxJQUFqQixDQUFzQjtnQkFDcEIsTUFBQSxFQUFRO2tCQUFDLEtBQUEsRUFBTyxZQUFSO2tCQUFzQixJQUFBLEVBQU0sY0FBNUI7aUJBRFk7Z0JBRXBCLE1BQUEsSUFGb0I7ZUFBdEIsRUFERjs7QUFGRjtBQVBGOztBQURGO0lBZUEsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsU0FBQyxDQUFELEVBQUksQ0FBSjthQUNwQixDQUFDLFlBQWEsQ0FBQSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQVQsQ0FBYixHQUE4QixZQUFhLENBQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFULENBQTVDLENBQUEsSUFDRSxDQUFDLENBQUMsQ0FBQyxJQUFGLEdBQVMsQ0FBQyxDQUFDLElBQVo7SUFGa0IsQ0FBdEI7V0FHQTtFQTlCVzs7a0JBZ0NiLFNBQUEsR0FBVyxTQUFDLEVBQUQ7V0FDVCxJQUFDLENBQUEsV0FBRCxDQUFhLEVBQWIsQ0FDRSxDQUFDLE1BREgsQ0FDVSxTQUFDLENBQUQ7YUFBTztJQUFQLENBRFYsQ0FFRSxDQUFDLEdBRkgsQ0FFTyxTQUFDLENBQUQ7YUFBTyxDQUFDLENBQUM7SUFBVCxDQUZQO0VBRFM7Ozs7OztBQUtiLE1BQU0sQ0FBQyxPQUFQLEdBQWlCOzs7OztBQzVJakIsSUFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGVBQVI7O0FBQ0osVUFBQSxHQUFhLE9BQUEsQ0FBUSxZQUFSOztBQUViLE9BQUEsQ0FBUSxnQkFBUjs7QUFFQSxTQUFBLEdBQVksU0FBQyxPQUFEO0FBQ1YsTUFBQTtTQUFBLENBQUEsQ0FBRSxLQUFGLEVBQ0U7SUFBQSxTQUFBLEVBQVcsWUFBWDtHQURGOztBQUVFO1NBQUEsWUFBQTs7bUJBQ0UsQ0FBQSxDQUFFLEtBQUYsRUFDRTtRQUFBLEdBQUEsRUFBSyxDQUFMO1FBQ0EsU0FBQSxFQUFXLFVBQUEsQ0FDVCxRQURTLEVBRVQ7VUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFDLE1BQVY7U0FGUyxDQURYO1FBS0EsT0FBQSxFQUFTLENBQUMsQ0FBQyxLQUxYO1FBTUEsV0FBQSxFQUFhLENBQUMsQ0FBQyxLQU5mO09BREYsRUFRRTtRQUNFLENBQUEsQ0FBRSxLQUFGLEVBQ0U7VUFBQSxTQUFBLEVBQVcsU0FBWDtTQURGLEVBRUU7VUFDRSxDQUFBLENBQUUsR0FBRixFQUNFO1lBQUEsU0FBQSxFQUFXLFdBQUEsR0FBWSxDQUFDLENBQUMsSUFBekI7V0FERixDQURGO1NBRkYsQ0FERjtPQVJGO0FBREY7O01BRkY7QUFEVTs7QUFxQlosTUFBTSxDQUFDLE9BQVAsR0FBaUI7RUFDZixXQUFBLFNBRGU7Ozs7OztBQzFCakI7O0FDQUEsSUFBQSwyTkFBQTtFQUFBOztBQUFBLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7QUFDUixTQUFBLEdBQVksT0FBQSxDQUFRLG1CQUFSOztBQUNaLFFBQUEsR0FBVyxPQUFBLENBQVEsa0JBQVI7O0FBQ1gsT0FBQSxHQUFVLE9BQUEsQ0FBUSxpQkFBUjs7QUFDVixVQUFBLEdBQWEsT0FBQSxDQUFRLG9CQUFSOztBQUVaLFlBQWEsT0FBQSxDQUFRLFdBQVIsRUFBYjs7QUFFRCxNQUFBLEdBQVMsU0FBQyxFQUFELEVBQUssRUFBTDtBQUFZLE1BQUE7QUFBQTtPQUFBLE9BQUE7OztpQkFBQSxFQUFHLENBQUEsQ0FBQSxDQUFILEdBQVE7QUFBUjs7QUFBWjs7QUFFVCxLQUFBLEdBQVE7O0FBQ1IsTUFBQSxHQUFTOztBQUVULFNBQUEsR0FBWSxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQWQsQ0FBMEIsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBMUI7O0FBQ1osTUFBQSxDQUFPLFNBQVMsQ0FBQyxLQUFqQixFQUNFO0VBQUEsUUFBQSxFQUFVLFVBQVY7Q0FERjs7QUFFQSxNQUFBLEdBQVMsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBdEI7O0FBQ1QsTUFBTSxDQUFDLEtBQVAsR0FBZSxLQUFBLEdBQU07O0FBQ3JCLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLE1BQUEsR0FBTzs7QUFFdkIsR0FBQSxHQUFNLE1BQU0sQ0FBQyxVQUFQLENBQWtCLElBQWxCOztBQUNOLEdBQUcsQ0FBQyxLQUFKLENBQVUsZ0JBQVYsRUFBNEIsZ0JBQTVCOztBQUNBLEdBQUcsQ0FBQyxPQUFKLEdBQWM7O0FBRWQsS0FBQSxHQUFRLElBQUk7O0FBQ1osV0FBQSxHQUFrQixJQUFBLE9BQUEsQ0FBUSxLQUFSOztBQUNsQixlQUFBLEdBQWtCOztBQUVsQixNQUFBLENBQU8sTUFBTSxDQUFDLEtBQWQsRUFDRTtFQUFBLEtBQUEsRUFBTyxLQUFBLEdBQU0sSUFBYjtFQUNBLE1BQUEsRUFBUSxNQUFBLEdBQU8sSUFEZjtFQUVBLFNBQUEsRUFBVywyQkFGWDtDQURGOztBQUlBLE1BQUEsQ0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQXJCLEVBQ0U7RUFBQSxPQUFBLEVBQVMsTUFBVDtFQUNBLFVBQUEsRUFBWSxRQURaO0VBRUEsY0FBQSxFQUFnQixRQUZoQjtFQUdBLE1BQUEsRUFBUSxNQUhSO0NBREY7O0FBS0EsTUFBQSxDQUFPLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBaEMsRUFDRTtFQUFBLE1BQUEsRUFBUSxNQUFSO0NBREY7O0FBR0EsT0FBQSxHQUFVLFNBQUE7U0FDUjtJQUFBLEtBQUEsRUFDRTtNQUFBLElBQUEsRUFBTSxVQUFOO01BQ0EsTUFBQSxFQUFRLFdBQVcsQ0FBQyxXQUFaLEtBQTJCLFNBRG5DO01BRUEsS0FBQSxFQUFPLFNBQUE7UUFDTCxXQUFBLEdBQWtCLElBQUEsU0FBQSxDQUFVLEtBQVY7ZUFDbEIsT0FBQSxDQUFBO01BRkssQ0FGUDtNQUtBLEtBQUEsRUFBTyxTQUFBO1FBQUcsZUFBQSxHQUFrQjtlQUFNLE9BQUEsQ0FBQTtNQUEzQixDQUxQO0tBREY7SUFPQSxJQUFBLEVBQ0U7TUFBQSxJQUFBLEVBQU0sU0FBTjtNQUNBLE1BQUEsRUFBUSxXQUFXLENBQUMsV0FBWixLQUEyQixRQURuQztNQUVBLEtBQUEsRUFBTyxTQUFBO1FBQ0wsV0FBQSxHQUFrQixJQUFBLFFBQUEsQ0FBUyxLQUFUO2VBQ2xCLE9BQUEsQ0FBQTtNQUZLLENBRlA7TUFLQSxLQUFBLEVBQU8sU0FBQTtRQUFHLGVBQUEsR0FBa0I7ZUFBTSxPQUFBLENBQUE7TUFBM0IsQ0FMUDtLQVJGO0lBY0EsR0FBQSxFQUNFO01BQUEsSUFBQSxFQUFNLGFBQU47TUFDQSxNQUFBLEVBQVEsV0FBVyxDQUFDLFdBQVosS0FBMkIsT0FEbkM7TUFFQSxLQUFBLEVBQU8sU0FBQTtRQUNMLFdBQUEsR0FBa0IsSUFBQSxPQUFBLENBQVEsS0FBUjtlQUNsQixPQUFBLENBQUE7TUFGSyxDQUZQO01BS0EsS0FBQSxFQUFPLFNBQUE7UUFBRyxlQUFBLEdBQWtCO2VBQU0sT0FBQSxDQUFBO01BQTNCLENBTFA7S0FmRjtJQXFCQSxRQUFBLEVBQ0U7TUFBQSxJQUFBLEVBQU0sUUFBTjtNQUNBLE1BQUEsRUFBUSxXQUFXLENBQUMsV0FBWixLQUEyQixVQURuQztNQUVBLEtBQUEsRUFBTyxTQUFBO1FBQ0wsV0FBQSxHQUFrQixJQUFBLFVBQUEsQ0FBVyxLQUFYO2VBQ2xCLE9BQUEsQ0FBQTtNQUZLLENBRlA7TUFLQSxLQUFBLEVBQU8sU0FBQTtRQUFHLGVBQUEsR0FBa0I7ZUFBTSxPQUFBLENBQUE7TUFBM0IsQ0FMUDtLQXRCRjs7QUFEUTs7QUE4QlYsSUFBQSxHQUFPLE9BQUEsQ0FBUSxrQkFBUjs7QUFDUCxLQUFBLEdBQVEsT0FBQSxDQUFRLG1CQUFSOztBQUNSLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLDRCQUFSOztBQUVoQixVQUFBLEdBQWEsU0FBQSxDQUFVLE9BQUEsQ0FBQSxDQUFWOztBQUNiLFdBQUEsR0FBYyxhQUFBLENBQWMsVUFBZDs7QUFDZCxTQUFTLENBQUMsV0FBVixDQUFzQixXQUF0Qjs7QUFFQSxJQUFBLEdBQU8sU0FBQTtBQUNMLE1BQUE7RUFBQSxHQUFHLENBQUMsU0FBSixDQUFjLENBQWQsRUFBaUIsQ0FBakIsRUFBb0IsTUFBTSxDQUFDLEtBQTNCLEVBQWtDLE1BQU0sQ0FBQyxNQUF6QztFQUNBLEdBQUcsQ0FBQyxJQUFKLENBQUE7RUFDQSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7RUFDQSxHQUFHLENBQUMsT0FBSixDQUFBO0VBQ0EsR0FBRyxDQUFDLElBQUosQ0FBQTtFQUNBLFdBQVcsQ0FBQyxJQUFaLENBQWlCLEdBQWpCLEVBQXNCLGVBQXRCO0VBQ0EsR0FBRyxDQUFDLE9BQUosQ0FBQTtFQUVBLE1BQUEsR0FBUyxTQUFBLENBQVUsT0FBQSxDQUFBLENBQVY7RUFDVCxPQUFBLEdBQVUsSUFBQSxDQUFLLFVBQUwsRUFBaUIsTUFBakI7RUFDVixLQUFBLENBQU0sV0FBTixFQUFtQixPQUFuQjtTQUNBLFVBQUEsR0FBYTtBQVpSOztBQWNQLE9BQUEsR0FBVSxTQUFBO1NBQ1IsSUFBQSxDQUFBO0FBRFE7O0FBR1YsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxDQUFEO0FBQ2YsTUFBQTtFQUFBLE1BQVMsQ0FBQyxDQUFDLENBQUMsT0FBSCxFQUFZLENBQUMsQ0FBQyxPQUFkLENBQVQsRUFBQyxVQUFELEVBQUk7RUFDSixFQUFBLEdBQUssS0FBSyxDQUFDLElBQU4sQ0FBVztJQUFDLEdBQUEsQ0FBRDtJQUFJLEdBQUEsQ0FBSjtHQUFYO0VBQ0wsZUFBQSxHQUFrQjtFQUNsQixXQUFXLENBQUMsS0FBWixDQUFrQixFQUFsQjtTQUNBLE9BQUEsQ0FBQTtBQUxlOztBQU9qQixNQUFNLENBQUMsV0FBUCxHQUFxQixTQUFDLENBQUQ7QUFDbkIsTUFBQTtFQUFBLE1BQVMsQ0FBQyxDQUFDLENBQUMsT0FBSCxFQUFZLENBQUMsQ0FBQyxPQUFkLENBQVQsRUFBQyxVQUFELEVBQUk7RUFDSixFQUFBLEdBQUssS0FBSyxDQUFDLElBQU4sQ0FBVztJQUFDLEdBQUEsQ0FBRDtJQUFJLEdBQUEsQ0FBSjtHQUFYO0VBQ0wsZUFBQSxHQUFrQjs7SUFDbEIsV0FBVyxDQUFDLEtBQU07O1NBQ2xCLE9BQUEsQ0FBQTtBQUxtQjs7QUFPckIsTUFBTSxDQUFDLFNBQVAsR0FBbUIsU0FBQyxDQUFEO0FBQ2pCLFVBQU8sQ0FBQyxDQUFDLEtBQVQ7QUFBQSxTQUNPLEVBRFA7TUFFSSxDQUFDLENBQUMsY0FBRixDQUFBOztRQUNBLFdBQVcsQ0FBQzs7YUFDWixPQUFBLENBQUE7QUFKSixTQUtPLEdBQUcsQ0FBQyxVQUFKLENBQWUsQ0FBZixDQUxQO01BTUksQ0FBQyxDQUFDLGNBQUYsQ0FBQTtNQUNBLFdBQUEsR0FBa0IsSUFBQSxTQUFBLENBQVUsS0FBVjthQUNsQixPQUFBLENBQUE7QUFSSixTQVNPLEdBQUcsQ0FBQyxVQUFKLENBQWUsQ0FBZixDQVRQO01BVUksQ0FBQyxDQUFDLGNBQUYsQ0FBQTtNQUNBLFdBQUEsR0FBa0IsSUFBQSxRQUFBLENBQVMsS0FBVDthQUNsQixPQUFBLENBQUE7QUFaSixTQWFPLEdBQUcsQ0FBQyxVQUFKLENBQWUsQ0FBZixDQWJQO01BY0ksQ0FBQyxDQUFDLGNBQUYsQ0FBQTtNQUNBLFdBQUEsR0FBa0IsSUFBQSxPQUFBLENBQVEsS0FBUjthQUNsQixPQUFBLENBQUE7QUFoQkosU0FpQk8sR0FBRyxDQUFDLFVBQUosQ0FBZSxDQUFmLENBakJQO01Ba0JJLENBQUMsQ0FBQyxjQUFGLENBQUE7TUFDQSxXQUFBLEdBQWtCLElBQUEsVUFBQSxDQUFXLEtBQVg7YUFDbEIsT0FBQSxDQUFBO0FBcEJKOztRQXNCSSxXQUFXLENBQUMsSUFBSyxHQUFHOztNQUNwQixJQUFhLENBQUMsQ0FBQyxnQkFBZjtlQUFBLE9BQUEsQ0FBQSxFQUFBOztBQXZCSjtBQURpQjs7Ozs7QUM3R25CLElBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxXQUFSOztBQUVKLGNBQUEsR0FBaUIsU0FBQyxFQUFELEVBQUssRUFBTCxFQUFTLENBQVQ7QUFDZixNQUFBO0VBQUEsSUFBRyxFQUFBLEdBQUssRUFBUjtJQUNFLE1BQVcsQ0FBQyxFQUFELEVBQUssRUFBTCxDQUFYLEVBQUMsV0FBRCxFQUFLLFlBRFA7O0FBRUEsU0FBTSxDQUFBLEdBQUksRUFBVjtJQUNFLENBQUEsSUFBSyxJQUFJLENBQUMsRUFBTCxHQUFRO0VBRGY7QUFFQSxTQUFNLENBQUEsR0FBSSxFQUFWO0lBQ0UsQ0FBQSxJQUFLLElBQUksQ0FBQyxFQUFMLEdBQVE7RUFEZjtTQUVBLENBQUEsRUFBQSxJQUFNLENBQU4sSUFBTSxDQUFOLElBQVcsRUFBWDtBQVBlOztBQVNYO2dCQUNKLGFBQUEsR0FBZTs7RUFDRixhQUFDLEdBQUQ7SUFBRSxJQUFDLENBQUEsYUFBQSxRQUFRLElBQUMsQ0FBQSxhQUFBLFFBQVEsSUFBQyxDQUFBLHFCQUFBO0lBQ2hDLElBQUMsQ0FBQSxVQUFELEdBQWMsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUEsTUFBVDtJQUNkLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUE7RUFGaEI7O2dCQUliLElBQUEsR0FBTSxTQUFDLEdBQUQ7SUFDSixHQUFHLENBQUMsU0FBSixHQUFnQjtJQUNoQixHQUFHLENBQUMsU0FBSixDQUFBO0lBQ0EsR0FBRyxDQUFDLEdBQUosQ0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLENBQWhCLEVBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsQ0FBM0IsRUFDRSxDQUFDLENBQUMsR0FBRixDQUFNLElBQUMsQ0FBQSxNQUFQLENBREYsRUFFRSxJQUFDLENBQUEsVUFGSCxFQUVlLElBQUMsQ0FBQSxRQUZoQixFQUUwQixJQUFDLENBQUEsY0FBRCxHQUFrQixDQUY1QztXQUdBLEdBQUcsQ0FBQyxNQUFKLENBQUE7RUFOSTs7Z0JBUU4sT0FBQSxHQUFTLFNBQUMsRUFBRDtBQUNQLFFBQUE7SUFBQSxDQUFBLEdBQUksQ0FBQyxDQUFDLEdBQUYsQ0FBTSxJQUFDLENBQUEsTUFBUDtJQUNKLFdBQUEsR0FBYyxDQUFDLENBQUMsR0FBRixDQUFNLElBQUMsQ0FBQSxNQUFQLEVBQWUsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxDQUFDLENBQUMsUUFBRixDQUFXLElBQUMsQ0FBQSxRQUFaLENBQVIsRUFBK0IsQ0FBL0IsQ0FBZjtXQUNkO01BQ0U7UUFBRSxLQUFBLEVBQU8sQ0FBQyxDQUFDLEdBQUYsQ0FBTSxJQUFDLENBQUEsTUFBUCxFQUFlLElBQUMsQ0FBQSxNQUFoQixDQUFUO1FBQWtDLElBQUEsRUFBTSxPQUF4QztPQURGLEVBRUU7UUFBRSxLQUFBLEVBQU8sV0FBVDtRQUFrQyxJQUFBLEVBQU0sT0FBeEM7T0FGRixFQUdFO1FBQUUsS0FBQSxFQUFPLElBQUMsQ0FBQSxjQUFELENBQWdCLEVBQWhCLENBQVQ7UUFBa0MsSUFBQSxFQUFNLE1BQXhDO09BSEY7O0VBSE87O2dCQVNULGNBQUEsR0FBZ0IsU0FBQyxFQUFEO0FBQ2QsUUFBQTtJQUFBLEtBQUEsR0FBUSxDQUFDLENBQUMsS0FBRixDQUFRLENBQUMsQ0FBQyxHQUFGLENBQU0sRUFBTixFQUFVLElBQUMsQ0FBQSxNQUFYLENBQVI7SUFDUixJQUFHLGNBQUEsQ0FBZSxJQUFDLENBQUEsVUFBaEIsRUFBNEIsSUFBQyxDQUFBLFFBQTdCLEVBQXVDLEtBQXZDLENBQUg7YUFDRSxDQUFDLENBQUMsR0FBRixDQUFNLElBQUMsQ0FBQSxNQUFQLEVBQWUsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxDQUFDLENBQUMsUUFBRixDQUFXLEtBQVgsQ0FBUixFQUEyQixDQUFDLENBQUMsR0FBRixDQUFNLElBQUMsQ0FBQSxNQUFQLENBQTNCLENBQWYsRUFERjs7RUFGYzs7Ozs7O0FBS2xCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCOzs7OztBQ3ZDakIsSUFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFdBQVI7O0FBRUU7aUJBQ0osYUFBQSxHQUFlOztFQUNGLGNBQUMsR0FBRDtJQUFFLElBQUMsQ0FBQSxXQUFBLE1BQU0sSUFBQyxDQUFBLFNBQUE7RUFBVjs7aUJBRWIsSUFBQSxHQUFNLFNBQUMsR0FBRDtJQUNKLEdBQUcsQ0FBQyxTQUFKLEdBQWdCO0lBQ2hCLEdBQUcsQ0FBQyxTQUFKLENBQUE7SUFDQSxHQUFHLENBQUMsTUFBSixDQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsQ0FBakIsRUFBb0IsSUFBQyxDQUFBLElBQUksQ0FBQyxDQUExQjtJQUNBLEdBQUcsQ0FBQyxNQUFKLENBQVcsSUFBQyxDQUFBLEVBQUUsQ0FBQyxDQUFmLEVBQWtCLElBQUMsQ0FBQSxFQUFFLENBQUMsQ0FBdEI7V0FDQSxHQUFHLENBQUMsTUFBSixDQUFBO0VBTEk7O2lCQU9OLE9BQUEsR0FBUyxTQUFDLEVBQUQ7V0FDUDtNQUNFO1FBQUUsSUFBQSxFQUFNLE9BQVI7UUFBaUIsS0FBQSxFQUFPLElBQUMsQ0FBQSxJQUF6QjtPQURGLEVBRUU7UUFBRSxJQUFBLEVBQU0sT0FBUjtRQUFpQixLQUFBLEVBQU8sSUFBQyxDQUFBLEVBQXpCO09BRkYsRUFHRTtRQUFFLElBQUEsRUFBTSxNQUFSO1FBQWlCLEtBQUEsRUFBTyxJQUFDLENBQUEsY0FBRCxDQUFnQixFQUFoQixDQUF4QjtPQUhGOztFQURPOztpQkFPVCxjQUFBLEdBQWdCLFNBQUMsRUFBRDtBQUNkLFFBQUE7SUFBQSxHQUFBLEdBQU0sQ0FBQyxDQUFDLEdBQUYsQ0FBTSxDQUFDLENBQUMsR0FBRixDQUFNLElBQUMsQ0FBQSxJQUFQLEVBQWEsSUFBQyxDQUFBLEVBQWQsQ0FBTjtJQUNOLElBQUcsR0FBQSxLQUFPLENBQVY7QUFDRSxhQUFPLElBQUMsQ0FBQSxLQURWOztJQUVBLEdBQUEsR0FBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUgsR0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLENBQWQsQ0FBQSxHQUFtQixDQUFDLElBQUMsQ0FBQSxFQUFFLENBQUMsQ0FBSixHQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsQ0FBZixDQUFuQixHQUF1QyxDQUFDLEVBQUUsQ0FBQyxDQUFILEdBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxDQUFkLENBQUEsR0FBbUIsQ0FBQyxJQUFDLENBQUEsRUFBRSxDQUFDLENBQUosR0FBUSxJQUFDLENBQUEsSUFBSSxDQUFDLENBQWYsQ0FBM0QsQ0FBQSxHQUFnRjtJQUN0RixJQUFHLEdBQUEsR0FBTSxDQUFUO2FBQ0UsSUFBQyxDQUFBLEtBREg7S0FBQSxNQUVLLElBQUcsR0FBQSxHQUFNLEdBQUEsR0FBSSxDQUFiO2FBQ0gsSUFBQyxDQUFBLEdBREU7S0FBQSxNQUFBO2FBR0gsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxJQUFDLENBQUEsSUFBUCxFQUFhLENBQUMsQ0FBQyxLQUFGLENBQVMsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxJQUFDLENBQUEsRUFBUCxFQUFXLElBQUMsQ0FBQSxJQUFaLENBQVQsRUFBNEIsR0FBQSxHQUFNLEdBQWxDLENBQWIsRUFIRzs7RUFQUzs7Ozs7O0FBWWxCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCOzs7OztBQ2hDakIsSUFBQTs7QUFBTTtFQUNTLGVBQUMsS0FBRDtJQUFDLElBQUMsQ0FBQSxRQUFEO0VBQUQ7O2tCQUViLElBQUEsR0FBTSxTQUFDLEdBQUQ7SUFDSixHQUFHLENBQUMsU0FBSixHQUFnQjtJQUNoQixHQUFHLENBQUMsU0FBSixDQUFBO0lBQ0EsR0FBRyxDQUFDLE1BQUosQ0FBVyxJQUFDLENBQUEsS0FBSyxDQUFDLENBQVAsR0FBUyxDQUFwQixFQUF1QixJQUFDLENBQUEsS0FBSyxDQUFDLENBQVAsR0FBUyxDQUFoQztJQUNBLEdBQUcsQ0FBQyxNQUFKLENBQVcsSUFBQyxDQUFBLEtBQUssQ0FBQyxDQUFQLEdBQVMsQ0FBcEIsRUFBdUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxDQUFQLEdBQVMsQ0FBaEM7SUFDQSxHQUFHLENBQUMsTUFBSixDQUFXLElBQUMsQ0FBQSxLQUFLLENBQUMsQ0FBUCxHQUFTLENBQXBCLEVBQXVCLElBQUMsQ0FBQSxLQUFLLENBQUMsQ0FBUCxHQUFTLENBQWhDO0lBQ0EsR0FBRyxDQUFDLE1BQUosQ0FBVyxJQUFDLENBQUEsS0FBSyxDQUFDLENBQVAsR0FBUyxDQUFwQixFQUF1QixJQUFDLENBQUEsS0FBSyxDQUFDLENBQVAsR0FBUyxDQUFoQztXQUNBLEdBQUcsQ0FBQyxNQUFKLENBQUE7RUFQSTs7a0JBU04sT0FBQSxHQUFTLFNBQUMsRUFBRDtXQUNQO01BQ0U7UUFBRSxJQUFBLEVBQU0sT0FBUjtRQUFpQixLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQXpCO09BREY7O0VBRE87Ozs7OztBQUtYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCOzs7OztBQ2pCakIsSUFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFdBQVI7O0FBQ0osR0FBQSxHQUFNLE9BQUEsQ0FBUSxlQUFSOztBQUVOLE1BQUEsR0FBUyxTQUFDLENBQUQ7QUFDUCxTQUFNLENBQUEsR0FBSSxDQUFDLElBQUksQ0FBQyxFQUFoQjtJQUF3QixDQUFBLElBQUssSUFBSSxDQUFDLEVBQUwsR0FBUTtFQUFyQztBQUNBLFNBQU0sQ0FBQSxHQUFJLElBQUksQ0FBQyxFQUFmO0lBQXVCLENBQUEsSUFBSyxJQUFJLENBQUMsRUFBTCxHQUFRO0VBQXBDO1NBQ0E7QUFITzs7QUFLSDtFQUNTLGlCQUFDLEtBQUQ7SUFBQyxJQUFDLENBQUEsUUFBRDtJQUNaLElBQUMsQ0FBQSxLQUFELEdBQVM7SUFDVCxJQUFDLENBQUEsTUFBRCxHQUFVO0lBQ1YsSUFBQyxDQUFBLE1BQUQsR0FBVTtJQUNWLElBQUMsQ0FBQSxVQUFELEdBQWM7SUFDZCxJQUFDLENBQUEsUUFBRCxHQUFZO0VBTEQ7O29CQU9iLElBQUEsR0FBTSxTQUFDLEVBQUQ7QUFDSixZQUFPLElBQUMsQ0FBQSxLQUFSO0FBQUEsV0FDTyxPQURQO2VBRUksSUFBQyxDQUFBLFFBQUQsR0FBWSxDQUFDLENBQUMsS0FBRixDQUFRLENBQUMsQ0FBQyxHQUFGLENBQU0sRUFBTixFQUFVLElBQUMsQ0FBQSxNQUFYLENBQVI7QUFGaEI7RUFESTs7b0JBS04sS0FBQSxHQUFPLFNBQUMsRUFBRDtBQUNMLFFBQUE7QUFBQSxZQUFPLElBQUMsQ0FBQSxLQUFSO0FBQUEsV0FDTyxRQURQO1FBRUksSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVM7ZUFDVCxJQUFDLENBQUEsTUFBRCxHQUFVO0FBSmQsV0FLTyxRQUxQO1FBTUksSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxLQUFELEdBQVM7ZUFDVCxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxRQUFELEdBQVksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxDQUFDLENBQUMsR0FBRixDQUFNLEVBQU4sRUFBVSxJQUFDLENBQUEsTUFBWCxDQUFSO0FBUjlCLFdBU08sT0FUUDtRQVVJLGNBQUEsR0FBaUIsTUFBQSxDQUFPLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLFVBQXBCO1FBQ2pCLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBUCxDQUFlLElBQUEsR0FBQSxDQUFJO1VBQUUsUUFBRCxJQUFDLENBQUEsTUFBRjtVQUFVLE1BQUEsRUFBUSxDQUFDLENBQUMsR0FBRixDQUFNLElBQUMsQ0FBQSxNQUFQLEVBQWUsSUFBQyxDQUFBLE1BQWhCLENBQWxCO1VBQTJDLGdCQUFBLGNBQTNDO1NBQUosQ0FBZjtRQUNBLElBQUMsQ0FBQSxLQUFELEdBQVM7ZUFDVCxJQUFDLENBQUEsTUFBRCxHQUFVO0FBYmQ7RUFESzs7b0JBZ0JQLEdBQUEsR0FBSyxTQUFBO1dBQ0gsSUFBQyxDQUFBLEtBQUQsR0FBUztFQUROOztvQkFHTCxJQUFBLEdBQU0sU0FBQyxHQUFELEVBQU0sS0FBTjtBQUNKLFFBQUE7SUFBQSxJQUFjLGFBQWQ7QUFBQSxhQUFBOztJQUNBLEdBQUcsQ0FBQyxTQUFKLEdBQWdCO0FBQ2hCLFlBQU8sSUFBQyxDQUFBLEtBQVI7QUFBQSxXQUNPLFFBRFA7UUFFSSxHQUFHLENBQUMsU0FBSixDQUFBO1FBQ0EsR0FBRyxDQUFDLEdBQUosQ0FBUSxLQUFLLENBQUMsQ0FBZCxFQUFpQixLQUFLLENBQUMsQ0FBdkIsRUFBMEIsQ0FBMUIsRUFBNkIsQ0FBN0IsRUFBZ0MsSUFBSSxDQUFDLEVBQUwsR0FBUSxDQUF4QztlQUNBLEdBQUcsQ0FBQyxNQUFKLENBQUE7QUFKSixXQUtPLFFBTFA7UUFNSSxHQUFHLENBQUMsU0FBSixDQUFBO1FBQ0EsR0FBRyxDQUFDLE1BQUosQ0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDLENBQW5CLEVBQXNCLElBQUMsQ0FBQSxNQUFNLENBQUMsQ0FBOUI7UUFDQSxHQUFHLENBQUMsTUFBSixDQUFXLEtBQUssQ0FBQyxDQUFqQixFQUFvQixLQUFLLENBQUMsQ0FBMUI7UUFDQSxHQUFHLENBQUMsTUFBSixDQUFBO1FBQ0EsR0FBRyxDQUFDLFNBQUosQ0FBQTtRQUNBLEdBQUcsQ0FBQyxHQUFKLENBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxDQUFoQixFQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLENBQTNCLEVBQThCLENBQUMsQ0FBQyxHQUFGLENBQU0sQ0FBQyxDQUFDLEdBQUYsQ0FBTSxLQUFOLEVBQWEsSUFBQyxDQUFBLE1BQWQsQ0FBTixDQUE5QixFQUEyRCxDQUEzRCxFQUE4RCxJQUFJLENBQUMsRUFBTCxHQUFRLENBQXRFO2VBQ0EsR0FBRyxDQUFDLE1BQUosQ0FBQTtBQVpKLFdBYU8sT0FiUDtRQWNJLGNBQUEsR0FBaUIsTUFBQSxDQUFPLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLFVBQXBCO1FBQ2pCLEdBQUcsQ0FBQyxTQUFKLEdBQWdCO1FBQ2hCLEdBQUcsQ0FBQyxTQUFKLENBQUE7UUFDQSxHQUFHLENBQUMsR0FBSixDQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsQ0FBaEIsRUFBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxDQUEzQixFQUNFLENBQUMsQ0FBQyxHQUFGLENBQU0sQ0FBQyxDQUFDLEdBQUYsQ0FBTSxJQUFDLENBQUEsTUFBUCxFQUFlLElBQUMsQ0FBQSxNQUFoQixDQUFOLENBREYsRUFFRSxJQUFDLENBQUEsVUFGSCxFQUVlLElBQUMsQ0FBQSxRQUZoQixFQUUwQixjQUFBLEdBQWlCLENBRjNDO2VBR0EsR0FBRyxDQUFDLE1BQUosQ0FBQTtBQXBCSjtFQUhJOzs7Ozs7QUF5QlIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7Ozs7O0FDakVqQixJQUFBOztBQUFNO0VBQ1Msb0JBQUMsS0FBRDtJQUFDLElBQUMsQ0FBQSxRQUFEO0VBQUQ7O3VCQUNiLElBQUEsR0FBTSxTQUFDLEVBQUQ7SUFDSixJQUFDLENBQUEsQ0FBRCxHQUFLO1dBQ0wsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVAsQ0FBaUIsRUFBakI7RUFGTjs7dUJBR04sS0FBQSxHQUFPLFNBQUE7QUFDTCxRQUFBOzRDQUFTLENBQUEsSUFBQyxDQUFBLENBQUQsR0FBSyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQWI7RUFESjs7dUJBRVAsS0FBQSxHQUFPLFNBQUMsRUFBRDtJQUNMLElBQUcsb0JBQUg7TUFDRSxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsQ0FBYyxJQUFDLENBQUEsS0FBRCxDQUFBLENBQWQ7YUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxDQUFpQixFQUFqQixFQUZaOztFQURLOzt1QkFJUCxJQUFBLEdBQU0sU0FBQyxHQUFEO0lBQ0osSUFBRyxvQkFBSDtNQUNFLEdBQUcsQ0FBQyxXQUFKLEdBQWtCO2FBQ2xCLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBUSxDQUFDLElBQVQsQ0FBYyxHQUFkLEVBRkY7O0VBREk7O3VCQUlOLEdBQUEsR0FBSyxTQUFBLEdBQUE7O3VCQUVMLEdBQUEsR0FBSyxTQUFDLENBQUQsRUFBSSxLQUFKO0FBQ0gsWUFBTyxDQUFDLENBQUMsS0FBVDtBQUFBLFdBQ08sQ0FEUDtRQUVJLENBQUMsQ0FBQyxjQUFGLENBQUE7ZUFDQSxJQUFDLENBQUEsQ0FBRCxJQUFNO0FBSFYsV0FJTyxFQUpQO1FBS0ksQ0FBQyxDQUFDLGNBQUYsQ0FBQTtlQUNBLElBQUMsQ0FBQSxLQUFELENBQU8sS0FBSyxDQUFDLENBQWIsRUFBZ0IsS0FBSyxDQUFDLENBQXRCO0FBTko7RUFERzs7Ozs7O0FBU1AsTUFBTSxDQUFDLE9BQVAsR0FBaUI7Ozs7O0FDMUJqQixJQUFBOztBQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsZ0JBQVI7O0FBRUQ7RUFDUyxrQkFBQyxLQUFEO0lBQUMsSUFBQyxDQUFBLFFBQUQ7SUFDWixJQUFDLENBQUEsSUFBRCxHQUFRO0VBREc7O3FCQUdiLEtBQUEsR0FBTyxTQUFDLEVBQUQ7SUFDTCxJQUFHLENBQUksSUFBQyxDQUFBLElBQVI7YUFDRSxJQUFDLENBQUEsSUFBRCxHQUFRLEdBRFY7S0FBQSxNQUFBO01BR0UsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQWUsSUFBQSxJQUFBLENBQUs7UUFBQSxJQUFBLEVBQU0sSUFBQyxDQUFBLElBQVA7UUFBYSxFQUFBLEVBQUksRUFBakI7T0FBTCxDQUFmO2FBQ0EsSUFBQyxDQUFBLElBQUQsR0FBUSxHQUpWOztFQURLOztxQkFPUCxHQUFBLEdBQUssU0FBQTtXQUNILElBQUMsQ0FBQSxJQUFELEdBQVE7RUFETDs7cUJBR0wsSUFBQSxHQUFNLFNBQUMsR0FBRCxFQUFNLEtBQU47SUFDSixJQUFjLGFBQWQ7QUFBQSxhQUFBOztJQUNBLElBQUcsQ0FBSSxJQUFDLENBQUEsSUFBUjtNQUNFLEdBQUcsQ0FBQyxTQUFKLENBQUE7TUFDQSxHQUFHLENBQUMsTUFBSixDQUFXLEtBQUssQ0FBQyxDQUFOLEdBQVEsQ0FBbkIsRUFBc0IsS0FBSyxDQUFDLENBQTVCO01BQ0EsR0FBRyxDQUFDLE1BQUosQ0FBVyxLQUFLLENBQUMsQ0FBTixHQUFRLENBQW5CLEVBQXNCLEtBQUssQ0FBQyxDQUE1QjtNQUNBLEdBQUcsQ0FBQyxNQUFKLENBQVcsS0FBSyxDQUFDLENBQWpCLEVBQW9CLEtBQUssQ0FBQyxDQUFOLEdBQVEsQ0FBNUI7TUFDQSxHQUFHLENBQUMsTUFBSixDQUFXLEtBQUssQ0FBQyxDQUFqQixFQUFvQixLQUFLLENBQUMsQ0FBTixHQUFRLENBQTVCO2FBQ0EsR0FBRyxDQUFDLE1BQUosQ0FBQSxFQU5GO0tBQUEsTUFBQTtNQVFFLEdBQUcsQ0FBQyxTQUFKLENBQUE7TUFDQSxHQUFHLENBQUMsTUFBSixDQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsQ0FBakIsRUFBb0IsSUFBQyxDQUFBLElBQUksQ0FBQyxDQUExQjtNQUNBLEdBQUcsQ0FBQyxNQUFKLENBQVcsS0FBSyxDQUFDLENBQWpCLEVBQW9CLEtBQUssQ0FBQyxDQUExQjthQUNBLEdBQUcsQ0FBQyxNQUFKLENBQUEsRUFYRjs7RUFGSTs7Ozs7O0FBZVIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7Ozs7O0FDL0JqQixJQUFBOztBQUFBLEtBQUEsR0FBUSxPQUFBLENBQVEsaUJBQVI7O0FBRUY7RUFDUyxtQkFBQyxLQUFEO0lBQUMsSUFBQyxDQUFBLFFBQUQ7RUFBRDs7c0JBRWIsS0FBQSxHQUFPLFNBQUMsRUFBRDtXQUNMLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBUCxDQUFlLElBQUEsS0FBQSxDQUFNLEVBQU4sQ0FBZjtFQURLOztzQkFHUCxJQUFBLEdBQU0sU0FBQyxFQUFELEdBQUE7O3NCQUVOLElBQUEsR0FBTSxTQUFDLEdBQUQsRUFBTSxLQUFOO0lBQ0osSUFBYyxhQUFkO0FBQUEsYUFBQTs7SUFDQSxHQUFHLENBQUMsU0FBSixDQUFBO0lBQ0EsR0FBRyxDQUFDLE1BQUosQ0FBVyxLQUFLLENBQUMsQ0FBTixHQUFRLENBQW5CLEVBQXNCLEtBQUssQ0FBQyxDQUFOLEdBQVEsQ0FBOUI7SUFDQSxHQUFHLENBQUMsTUFBSixDQUFXLEtBQUssQ0FBQyxDQUFOLEdBQVEsQ0FBbkIsRUFBc0IsS0FBSyxDQUFDLENBQU4sR0FBUSxDQUE5QjtJQUNBLEdBQUcsQ0FBQyxNQUFKLENBQVcsS0FBSyxDQUFDLENBQU4sR0FBUSxDQUFuQixFQUFzQixLQUFLLENBQUMsQ0FBTixHQUFRLENBQTlCO0lBQ0EsR0FBRyxDQUFDLE1BQUosQ0FBVyxLQUFLLENBQUMsQ0FBTixHQUFRLENBQW5CLEVBQXNCLEtBQUssQ0FBQyxDQUFOLEdBQVEsQ0FBOUI7V0FDQSxHQUFHLENBQUMsTUFBSixDQUFBO0VBUEk7Ozs7OztBQVNSLE1BQU0sQ0FBQyxPQUFQLEdBQWlCOzs7OztBQ25CakIsSUFBQTs7QUFBQSxJQUFBLEdBQU8sU0FBQyxFQUFELEVBQUssRUFBTDtFQUFDLElBQUMsQ0FBQSxJQUFEO0VBQUksSUFBQyxDQUFBLElBQUQ7QUFBTDs7QUFDUCxDQUFBLEdBQUksU0FBQyxDQUFELEVBQUksQ0FBSjtTQUFjLElBQUEsSUFBQSxDQUFLLENBQUwsRUFBUSxDQUFSO0FBQWQ7O0FBQ0osQ0FBQyxDQUFDLEdBQUYsR0FBUSxTQUFDLEdBQUQsRUFBYyxJQUFkO0FBQThCLE1BQUE7RUFBMUIsU0FBRixHQUFPLFNBQUY7RUFBVSxVQUFGLEdBQU8sVUFBRjtTQUFVLENBQUEsQ0FBRSxFQUFBLEdBQUcsRUFBTCxFQUFTLEVBQUEsR0FBRyxFQUFaO0FBQTlCOztBQUNSLENBQUMsQ0FBQyxHQUFGLEdBQVEsU0FBQyxHQUFELEVBQWMsSUFBZDtBQUE4QixNQUFBO0VBQTFCLFNBQUYsR0FBTyxTQUFGO0VBQVUsVUFBRixHQUFPLFVBQUY7U0FBVSxDQUFBLENBQUUsRUFBQSxHQUFHLEVBQUwsRUFBUyxFQUFBLEdBQUcsRUFBWjtBQUE5Qjs7QUFDUixDQUFDLENBQUMsR0FBRixHQUFRLFNBQUMsR0FBRDtBQUFXLE1BQUE7RUFBVCxRQUFBLEdBQUUsUUFBQTtTQUFPLElBQUksQ0FBQyxJQUFMLENBQVUsQ0FBQSxHQUFFLENBQUYsR0FBSSxDQUFBLEdBQUUsQ0FBaEI7QUFBWDs7QUFDUixDQUFDLENBQUMsS0FBRixHQUFVLFNBQUMsR0FBRCxFQUFPLENBQVA7QUFBYSxNQUFBO0VBQVgsUUFBQSxHQUFFLFFBQUE7U0FBUyxDQUFBLENBQUUsQ0FBQSxHQUFFLENBQUosRUFBTyxDQUFBLEdBQUUsQ0FBVDtBQUFiOztBQUNWLENBQUMsQ0FBQyxJQUFGLEdBQVMsU0FBQyxDQUFEO1NBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxDQUFSLEVBQVksQ0FBQSxHQUFFLENBQUMsQ0FBQyxHQUFGLENBQU0sQ0FBTixDQUFkO0FBQVA7O0FBQ1QsQ0FBQyxDQUFDLEtBQUYsR0FBVSxTQUFDLENBQUQ7U0FBTyxJQUFJLENBQUMsS0FBTCxDQUFXLENBQUMsQ0FBQyxDQUFiLEVBQWdCLENBQUMsQ0FBQyxDQUFsQjtBQUFQOztBQUNWLENBQUMsQ0FBQyxRQUFGLEdBQWEsU0FBQyxDQUFEO1NBQU8sQ0FBQSxDQUFFLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxDQUFGLEVBQWUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULENBQWY7QUFBUDs7QUFDYixDQUFDLENBQUMsS0FBRixHQUFVLFNBQUMsR0FBRCxFQUFjLElBQWQ7QUFBOEIsTUFBQTtFQUExQixTQUFGLEdBQU8sU0FBRjtFQUFVLFVBQUYsR0FBTyxVQUFGO1NBQVUsRUFBQSxHQUFHLEVBQUgsR0FBUSxFQUFBLEdBQUc7QUFBekM7O0FBQ1YsQ0FBQyxDQUFDLEdBQUYsR0FBUSxTQUFDLEdBQUQsRUFBYyxJQUFkO0FBQThCLE1BQUE7RUFBMUIsU0FBRixHQUFPLFNBQUY7RUFBVSxVQUFGLEdBQU8sVUFBRjtTQUFVLEVBQUEsR0FBRyxFQUFILEdBQVEsRUFBQSxHQUFHO0FBQXpDOztBQUNSLENBQUMsQ0FBQyxJQUFGLEdBQVMsU0FBQyxHQUFEO0FBQVcsTUFBQTtFQUFULFFBQUEsR0FBRSxRQUFBO1NBQU8sQ0FBQSxDQUFFLENBQUMsQ0FBSCxFQUFNLENBQU47QUFBWDs7QUFDVCxDQUFDLENBQUMsR0FBRixHQUFRLFNBQUMsR0FBRDtBQUFXLE1BQUE7RUFBVCxRQUFBLEdBQUUsUUFBQTtTQUFPLENBQUEsQ0FBRSxDQUFDLENBQUgsRUFBTSxDQUFDLENBQVA7QUFBWDs7QUFFUixNQUFNLENBQUMsT0FBUCxHQUFpQjs7Ozs7QUNkakI7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2ID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuXG5zZWcyc2VnID0gKG8xLCBvMikgLT5cbiAgIyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU2MzE5OC9ob3ctZG8teW91LWRldGVjdC13aGVyZS10d28tbGluZS1zZWdtZW50cy1pbnRlcnNlY3RcbiAgcSA9IG8xLmZyb21cbiAgcCA9IG8yLmZyb21cbiAgcyA9IHYuc3ViKG8xLnRvLCBvMS5mcm9tKVxuICByID0gdi5zdWIobzIudG8sIG8yLmZyb20pXG4gIHggPSB2LmNyb3NzKHIsIHMpXG4gIGlmIHggPT0gMCAgIyBjb2xsaW5lYXIgb3IgcGFyYWxsZWwgKGNhc2VzIDEsIDIsIDMpXG4gICAgcmV0dXJuIFtdXG4gIHQgPSB2LmNyb3NzKHYuc3ViKHEsIHApLCBzKSAvIHhcbiAgdSA9IHYuY3Jvc3Modi5zdWIocSwgcCksIHIpIC8geFxuICBpZiAwIDw9IHQgPD0gMSBhbmQgMCA8PSB1IDw9IDEgICMgaW50ZXJzZWN0aW5nIChjYXNlIDQpXG4gICAgW3YuYWRkIHAsIHYuc2NhbGUgciwgdF1cbiAgZWxzZSAgIyBub3QgcGFyYWxsZWwsIGJ1dCBub3QgaW50ZXJzZWN0aW5nIChjYXNlIDUpXG4gICAgW11cblxuc2VnMmFyYyA9IChzZWcsIGFyYykgLT5cbiAgciA9IHYubGVuIGFyYy5yYWRpdXNcbiAgYSA9IHNlZy5mcm9tXG4gIGIgPSB2LnN1YiBzZWcudG8sIHNlZy5mcm9tXG4gIGMgPSBhcmMuY2VudGVyXG4gIGFscGhhID0gdi5kb3QgYiwgYlxuICBhX21pbnVzX2MgPSB2LnN1YiBhLCBjXG4gIGJldGEgPSAyKnYuZG90IGIsIGFfbWludXNfY1xuICBnYW1tYSA9IHYuZG90KGFfbWludXNfYywgYV9taW51c19jKSAtIHIqclxuICBkaXNjcmltaW5hbnQgPSBiZXRhKmJldGEgLSA0KmFscGhhKmdhbW1hXG4gIGlmIGRpc2NyaW1pbmFudCA8IDBcbiAgICByZXR1cm4gW10gICMgbm8gaW50ZXJzZWN0aW9uXG4gIGVsc2VcbiAgICBkaXNjcmltaW5hbnQgPSBNYXRoLnNxcnQoZGlzY3JpbWluYW50KVxuICAgIHQxID0gKC1iZXRhIC0gZGlzY3JpbWluYW50KS8oMiphbHBoYSlcbiAgICB0MiA9ICgtYmV0YSArIGRpc2NyaW1pbmFudCkvKDIqYWxwaGEpXG4gICAgW3QxLCB0Ml1cbiAgICAgIC5maWx0ZXIgKHQpIC0+IDAgPD0gdCA8PSAxXG4gICAgICAubWFwICh0KSAtPiB2LmFkZCBhLCB2LnNjYWxlIGIsIHRcbiAgICAgICMgVE9ETzogZmlsdGVyIG9ubHkgdGhlIGludGVyc2VjdGlvbnMgdGhhdCBmYWxsIHdpdGhpbiB0aGUgYXJjXG5cbmFyYzJhcmMgPSAoYTEsIGEyKSAtPlxuICByMSA9IHYubGVuIGExLnJhZGl1c1xuICByMiA9IHYubGVuIGEyLnJhZGl1c1xuXG4gIGR2ID0gdi5zdWIgYTIuY2VudGVyLCBhMS5jZW50ZXJcbiAgZCA9IHYubGVuKGR2KVxuICB4ID0gKGQqZCArIChyMSpyMSAtIHIyKnIyKSkgLyAoMipkKVxuICB5MiA9IHIxKnIxIC0geCp4XG4gIGlmIHkyID49IDBcbiAgICB5ID0gTWF0aC5zcXJ0KHkyKVxuICAgIGR2biA9IHYubm9ybSBkdlxuICAgIFtcbiAgICAgIHYuYWRkKFxuICAgICAgICB2LnNjYWxlIGR2biwgeFxuICAgICAgICB2LnNjYWxlIHYucGVycChkdm4pLCB5XG4gICAgICApXG4gICAgICB2LmFkZChcbiAgICAgICAgdi5zY2FsZSBkdm4sIHhcbiAgICAgICAgdi5zY2FsZSB2Lm5lZyh2LnBlcnAgZHZuKSwgeVxuICAgICAgKVxuICAgIF0ubWFwIChwKSAtPiB2LmFkZCBhMS5jZW50ZXIsIHBcbiAgZWxzZSBbXVxuXG5pbnRlcnNlY3Rpb25UYWJsZSA9XG4gIDE6XG4gICAgMTogc2VnMnNlZ1xuICAgIDI6IHNlZzJhcmNcbiAgMjpcbiAgICAyOiBhcmMyYXJjXG5cbmNsYXNzIFdvcmxkXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBvYmplY3RzID0gW11cblxuICBhZGQ6IChvYmplY3QpIC0+XG4gICAgQG9iamVjdHMucHVzaCBvYmplY3RcblxuICByZW1vdmU6IChvYmplY3QpIC0+XG4gICAgaWR4ID0gQG9iamVjdHMuaW5kZXhPZiBvYmplY3RcbiAgICBpZiBpZHggPj0gMFxuICAgICAgQG9iamVjdHMuc3BsaWNlIGlkeCwgMVxuICAgIG9iamVjdFxuXG4gIGRyYXc6IChjdHgpIC0+XG4gICAgZm9yIG8gaW4gQG9iamVjdHNcbiAgICAgIGN0eC5zYXZlKClcbiAgICAgIG8uZHJhdyhjdHgpXG4gICAgICBjdHgucmVzdG9yZSgpXG4gICAgcmV0dXJuXG5cbiAgdHlwZVByaW9yaXR5ID0ge1xuICAgICdsaW5lJzogMVxuICAgICdwb2ludCc6IDJcbiAgICAnaW50ZXJzZWN0aW9uJzogM1xuICB9XG4gIHNuYXBEaXN0ID0gNVxuXG4gIHNuYXA6IChwdCkgLT5cbiAgICBzbmFwcGFibGVNYWduZXRzID0gQG1hZ25ldHNOZWFyIHB0XG4gICAgaWYgc25hcHBhYmxlTWFnbmV0cy5sZW5ndGhcbiAgICAgIHNuYXBwYWJsZU1hZ25ldHNbMF0ubWFnbmV0LnBvaW50XG4gICAgZWxzZVxuICAgICAgcHRcblxuICBtYWduZXRzTmVhcjogKHB0KSAtPlxuICAgIHNuYXBwYWJsZU1hZ25ldHMgPSBbXVxuICAgIHJlbGV2YW50T2JqZWN0cyA9IFtdXG4gICAgZm9yIG8gaW4gQG9iamVjdHNcbiAgICAgIGFueVJlbGV2YW50TWFnbmV0cyA9IGZhbHNlXG4gICAgICBmb3IgbSBpbiBvLm1hZ25ldHMocHQpIHdoZW4gbT8ucG9pbnQ/XG4gICAgICAgIGRpc3QgPSB2LmxlbiB2LnN1YiBwdCwgbS5wb2ludFxuICAgICAgICBpZiBkaXN0IDwgc25hcERpc3RcbiAgICAgICAgICBhbnlSZWxldmFudE1hZ25ldHMgPSB0cnVlXG4gICAgICAgICAgc25hcHBhYmxlTWFnbmV0cy5wdXNoIHtvYmplY3Q6IG8sIG1hZ25ldDogbSwgZGlzdH1cbiAgICAgIGlmIGFueVJlbGV2YW50TWFnbmV0c1xuICAgICAgICByZWxldmFudE9iamVjdHMucHVzaCBvXG4gICAgZm9yIG8xLGkgaW4gcmVsZXZhbnRPYmplY3RzIHdoZW4gbzEuaW50ZXJzZWN0Q29kZT9cbiAgICAgIGZvciBvMixqIGluIHJlbGV2YW50T2JqZWN0cyB3aGVuIGogPCBpIGFuZCBvMi5pbnRlcnNlY3RDb2RlP1xuICAgICAgICBbY29kZTEsIGNvZGUyXSA9IFtvMS5pbnRlcnNlY3RDb2RlLCBvMi5pbnRlcnNlY3RDb2RlXVxuICAgICAgICBpZiBjb2RlMiA8IGNvZGUxXG4gICAgICAgICAgW2NvZGUxLCBjb2RlMl0gPSBbY29kZTIsIGNvZGUxXVxuICAgICAgICAgIFtvMSwgbzJdID0gW28yLCBvMV1cbiAgICAgICAgaW50ZXJzZWN0aW9ucyA9IGludGVyc2VjdGlvblRhYmxlW2NvZGUxXVtjb2RlMl0obzEsIG8yKVxuICAgICAgICBjb250aW51ZSB1bmxlc3MgaW50ZXJzZWN0aW9ucz8ubGVuZ3RoXG4gICAgICAgIGZvciBpbnRlcnNlY3Rpb24gaW4gaW50ZXJzZWN0aW9uc1xuICAgICAgICAgIGRpc3QgPSB2LmxlbiB2LnN1YiBwdCwgaW50ZXJzZWN0aW9uXG4gICAgICAgICAgaWYgZGlzdCA8IHNuYXBEaXN0XG4gICAgICAgICAgICBzbmFwcGFibGVNYWduZXRzLnB1c2gge1xuICAgICAgICAgICAgICBtYWduZXQ6IHtwb2ludDogaW50ZXJzZWN0aW9uLCB0eXBlOiAnaW50ZXJzZWN0aW9uJ31cbiAgICAgICAgICAgICAgZGlzdFxuICAgICAgICAgICAgfVxuICAgIHNuYXBwYWJsZU1hZ25ldHMuc29ydCAoYSwgYikgLT5cbiAgICAgICh0eXBlUHJpb3JpdHlbYi5tYWduZXQudHlwZV0gLSB0eXBlUHJpb3JpdHlbYS5tYWduZXQudHlwZV0pIG9yXG4gICAgICAgIChiLmRpc3QgLSBhLmRpc3QpXG4gICAgc25hcHBhYmxlTWFnbmV0c1xuXG4gIG9iamVjdHNBdDogKHB0KSAtPlxuICAgIEBtYWduZXRzTmVhcihwdClcbiAgICAgIC5maWx0ZXIgKG0pIC0+IG0ub2JqZWN0P1xuICAgICAgLm1hcCAobSkgLT4gbS5vYmplY3RcblxubW9kdWxlLmV4cG9ydHMgPSBXb3JsZFxuIiwiaCA9IHJlcXVpcmUgJ3ZpcnR1YWwtZG9tL2gnXG5jbGFzc05hbWVzID0gcmVxdWlyZSAnY2xhc3NuYW1lcydcblxucmVxdWlyZSgnLi9idXR0b25zLnNjc3MnKVxuXG5CdXR0b25CYXIgPSAoYnV0dG9ucykgLT5cbiAgaCAnZGl2JyxcbiAgICBjbGFzc05hbWU6ICdidXR0b24tYmFyJ1xuICAgIGZvciBrLGIgb2YgYnV0dG9uc1xuICAgICAgaCAnZGl2JyxcbiAgICAgICAga2V5OiBrXG4gICAgICAgIGNsYXNzTmFtZTogY2xhc3NOYW1lcyhcbiAgICAgICAgICAnYnV0dG9uJ1xuICAgICAgICAgIGFjdGl2ZTogYi5hY3RpdmVcbiAgICAgICAgKVxuICAgICAgICBvbmNsaWNrOiBiLmNsaWNrXG4gICAgICAgIG9ubW91c2VvdmVyOiBiLmhvdmVyXG4gICAgICAgIFtcbiAgICAgICAgICBoICdkaXYnLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnY29udGVudCdcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgaCAnaScsXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImZhIGZhLWZ3ICN7Yi5pY29ufVwiXG4gICAgICAgICAgICBdXG4gICAgICAgIF1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEJ1dHRvbkJhclxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdzYXNzaWZ5JykuYnlVcmwoJ2RhdGE6dGV4dC9jc3M7YmFzZTY0LExtSjFkSFJ2YmkxaVlYSWdld29nSUhCdmMybDBhVzl1T2lCaFluTnZiSFYwWlRzS0lDQmthWE53YkdGNU9pQm1iR1Y0T3dvZ0lHWnNaWGd0WkdseVpXTjBhVzl1T2lCamIyeDFiVzQ3Q2lBZ2RHOXdPaUF4TlhCNE93b2dJR3hsWm5RNklDMHhOWEI0T3dvZ0lHMWhjbWRwYmpvZ0xUVndlRHNnZlFvS0xtSjFkSFJ2YmlCN0NpQWdkMmxrZEdnNklESTJjSGc3Q2lBZ2FHVnBaMmgwT2lBeU5uQjRPd29nSUhCdmMybDBhVzl1T2lCeVpXeGhkR2wyWlRzS0lDQnNaV1owT2lBeWNIZzdDaUFnZEc5d09pQXljSGc3Q2lBZ2JXRnlaMmx1T2lBMWNIZzdDaUFnZEhKaGJuTnBkR2x2YmpvZ01UVXdiWE03Q2lBZ2RISmhibk5tYjNKdE9pQjBjbUZ1YzJ4aGRHVlpLREFwT3dvZ0lHSnZjbVJsY2kxeVlXUnBkWE02SURFMWNIZzdDaUFnWW05NExYTm9ZV1J2ZHpvZ01IQjRJREp3ZUNBM2NIZ2dJMkUyWVRaaE5qc2dmUW9nSUM1aWRYUjBiMjRnTG1OdmJuUmxiblFnZXdvZ0lDQWdZbUZqYTJkeWIzVnVaRG9nZDJocGRHVTdDaUFnSUNCM2FXUjBhRG9nTXpCd2VEc0tJQ0FnSUdobGFXZG9kRG9nTXpCd2VEc0tJQ0FnSUdKdmNtUmxjaTF5WVdScGRYTTZJREUxY0hnN0NpQWdJQ0IwY21GdWMybDBhVzl1T2lBeE5UQnRjenNLSUNBZ0lIQnZjMmwwYVc5dU9pQnlaV3hoZEdsMlpUc0tJQ0FnSUhSdmNEb2dMVEp3ZURzS0lDQWdJR3hsWm5RNklDMHljSGc3Q2lBZ0lDQmthWE53YkdGNU9pQm1iR1Y0T3dvZ0lDQWdZV3hwWjI0dGFYUmxiWE02SUdObGJuUmxjanNLSUNBZ0lHcDFjM1JwWm5rdFkyOXVkR1Z1ZERvZ1kyVnVkR1Z5T3dvZ0lDQWdabTl1ZEMxbVlXMXBiSGs2SUhOaGJuTXRjMlZ5YVdZN0NpQWdJQ0JqYjJ4dmNqb2dkMmhwZEdWemJXOXJaVHNLSUNBZ0lIUmxlSFF0YzJoaFpHOTNPaUF0TUM0MWNIZ2dMVEF1TlhCNElEQndlQ0FqWkRsa09XUTVPeUI5Q2lBZ0xtSjFkSFJ2Ymk1aFkzUnBkbVVnTG1OdmJuUmxiblFnZXdvZ0lDQWdZbUZqYTJkeWIzVnVaRG9nWW5WeWJIbDNiMjlrT3dvZ0lDQWdZMjlzYjNJNklISm5ZbUVvTWpVMUxDQXlOVFVzSURJMU5Td2dNQzQwTVNrN0NpQWdJQ0IwWlhoMExYTm9ZV1J2ZHpvZ0xUQXVOWEI0SUMwd0xqVndlQ0F3SUhKblltRW9NQ3dnTUN3Z01Dd2dNQzR4S1RzS0lDQWdJSFJ5WVc1elptOXliVG9nZEhKaGJuTnNZWFJsV1Nnd2NIZ3BPeUI5Q2lBZ0xtSjFkSFJ2Ymk1aFkzUnBkbVU2YUc5MlpYSWdMbU52Ym5SbGJuUWdld29nSUNBZ2RISmhibk5tYjNKdE9pQjBjbUZ1YzJ4aGRHVlpLREJ3ZUNrN0lIMEtJQ0F1WW5WMGRHOXVPbWh2ZG1WeUlIc0tJQ0FnSUdOMWNuTnZjam9nY0c5cGJuUmxjanNLSUNBZ0lHSnZlQzF6YUdGa2IzYzZJREFnTW5CNElERXdjSGdnSTJKa1ltUmlaRHNnZlFvZ0lDQWdMbUoxZEhSdmJqcG9iM1psY2lBdVkyOXVkR1Z1ZENCN0NpQWdJQ0FnSUhSeVlXNXpabTl5YlRvZ2RISmhibk5zWVhSbFdTZ3RNbkI0S1RzZ2ZRb2dJQzVpZFhSMGIyNDZZV04wYVhabElIc0tJQ0FnSUhSeVlXNXphWFJwYjI0NklEa3diWE03Q2lBZ0lDQmliM2d0YzJoaFpHOTNPaUF3SURGd2VDQTJjSGdnSXpsbE9XVTVaVHNnZlFvZ0lDQWdMbUoxZEhSdmJqcGhZM1JwZG1VZ0xtTnZiblJsYm5RZ2V3b2dJQ0FnSUNCMGNtRnVjMmwwYVc5dU9pQTVNRzF6T3dvZ0lDQWdJQ0IwY21GdWMyWnZjbTA2SUhSeVlXNXpiR0YwWlZrb01YQjRLVHNnZlFvS0x5b2pJSE52ZFhKalpVMWhjSEJwYm1kVlVrdzlaR0YwWVRwaGNIQnNhV05oZEdsdmJpOXFjMjl1TzJKaGMyVTJOQ3hsZDI5S1NXNWFiR051VG5CaU1qUnBUMmxCZWt4QmIwcEpiVnB3WWtkVmFVOXBRV2xaYmxZd1pFYzVkV041TlhwWk0wNTZTV2wzUzBOVFNucGlNMVo1V1RKV2VrbHFiMmRYZDI5S1ExTkthV1JZVWpCaU1qVjZURzVPYW1NelRXbERaMnhrVEVGdlNrbHVUblprV0VwcVdsaE9SR0l5TlRCYVZ6VXdTV3B2WjFkM2IwcERVMGxyV1c1V01HUkhPWFZWTW13MldsUnZaMDE2UW5kbFJIUmpZbXg0ZFV4dFNqRmtTRkoyWW1reGFWbFlTV2RsTVhoMVNVTkNkMkl6VG5Ca1IyeDJZbXB2WjFsWFNucGlNbmd4WkVkVk4xaEhOR2RKUjFKd1l6TkNjMWxZYXpaSlIxcHpXbGhuTjFoSE5HZEpSMXB6V2xobmRGcEhiSGxhVjA0d1lWYzVkVTlwUW1waU1uZ3hZbGMwTjFoSE5HZEpTRkoyWTBSdlowcEhTakZrU0ZKMllteE9jR1Z0VlhaTmFuUmpZbWxCWjJKSFZtMWtSRzluVEZOU2FXUllVakJpTWpWVVlWaHdiRXg2U1RkWVJ6Um5TVWN4YUdOdFpIQmlhbTluVEZSV2QyVkVkR05pYmpGallteDRkVXh0U2pGa1NGSjJZbWxDTjFoSE5HZEpTR1J3V2toU2IwOXBRV3RaYmxZd1pFYzVkVlV5YkRaYVUwRjBTVVJTZDJWRWRHTmlhVUZuWVVkV2NGb3lhREJQYVVGcldXNVdNR1JIT1hWVk1tdzJXbE5CZEVsRVVuZGxSSFJqWW1sQloyTkhPWHBoV0ZKd1lqSTBOa2xJU214aVIwWXdZVmhhYkU4eGVIVkpRMEp6V2xkYU1FOXBRWGxqU0djM1dFYzBaMGxJVW5aalJHOW5UVzVDTkU4eGVIVkpRMEowV1ZoS2JtRlhORFpKUkZaM1pVUjBZMkpzZUhWSlEwSXdZMjFHZFdNeWJEQmhWemwxVDJsQmVFNVVRblJqZW5SalltbEJaMlJJU21oaWJrNXRZak5LZEU5cFFqQmpiVVoxWXpKNGFHUkhWbHBMUkVGd1R6RjRkVWxEUW1saU0wcHJXbGhKZEdOdFJtdGhXRlo2VDJsQmExbHVWakJrUnpsMVZUSnNObHBUT0hsUE1YaDFXRWMwWjBsSFNuWmxRekY2WVVkR2EySXpZelpKUkVKM1pVTkJlV05JWjJkT00wSTBTVWRvZW1KRFozZE1SRUZzVEVSWk1VcFRhemRZUnpWalltbEJaMHh0VG5aaWJsSnNZbTVSWjJVeGVIVkpRMEZuU1VkS2FGa3lkRzVqYlRreFltMVJOa2xJWkc5aFdGSnNUekY0ZFVsRFFXZEpTR1J3V2toU2IwOXBRV3RaYmxZd1pFYzVkVlV5YkRaYVZIUmpZbWxCWjBsRFFtOWFWMnh1WVVoUk5rbERVbWxrV0ZJd1lqSTFWR0ZZY0d4UE1YaDFTVU5CWjBsSFNuWmpiVkpzWTJreGVWbFhVbkJrV0UwMlNVTlNhV1JZVWpCaU1qVlVZVmh3YkV4NlNUZFlSelJuU1VOQloyUklTbWhpYms1d1pFZHNkbUpxYjJkTlZGVjNZbGhOTjFoSE5HZEpRMEZuWTBjNWVtRllVbkJpTWpRMlNVaEtiR0pIUmpCaFdGcHNUekY0ZFVsRFFXZEpTRkoyWTBSdloweFVTbmRsUkhSalltbEJaMGxEUW5OYVYxb3dUMmxCZEUxdVFqUlBNWGgxV0VjMFowbERRV2RhUjJ4NlkwZDRhR1ZVYjJkYWJYaHNaVVIwWTJKcFFXZEpRMEpvWWtkc2JtSnBNWEJrUjFaMFkzcHZaMWt5Vm5Wa1IxWjVUekY0ZFVsRFFXZEpSM0F4WXpOU2NGcHVhM1JaTWpsMVpFZFdkV1JFYjJkWk1sWjFaRWRXZVU4eGVIVkpRMEZuU1VkYWRtSnVVWFJhYlVaMFlWZDROVTlwUW5wWlZ6VjZURmhPYkdOdGJHMVBNWGgxU1VOQlowbEhUblppUnpsNVQybENiMk15ZDI5TlEzZG5UVU5WYzBsRWF6SktVMnMzV0VjMFowbERRV2RrUjFZMFpFTXhlbUZIUm10aU0yTTJTVU13ZDB4cVZuZGxRMEYwVFVNME1XTklaMmROU0VJMFNVZG9lbUpEWjNkTVEwRjNTbE4zWjA5RVZXeExWSFJqWW1sQloyWldlSFZKUTBGdFRHMUdhbVJIYkRKYVUwSTNXRWMwWjBsRFFXZE1iVTUyWW01U2JHSnVVV2RsTVhoMVNVTkJaMGxEUVdkWmJVWnFZVEprZVdJelZuVmFSRzluWVVoT2MwdEVUVEJNUTBFeFRubFZjMGxFWTNkS1UyczNXRWMwWjBsRFFXZEpRMEpxWWpKNGRtTnFiMmRoU0U1eldWTm5kMHhEUVhoTlJFRnNURU5CZUUxRVFXeE1RMEYzVEdwUmVFdFVkR05pYVVGblNVTkJaMGxJVW14bFNGRjBZekpvYUZwSE9UTlBhVUYwVFVNME1XTklaMmRNVkVGMVRsaENORWxFUVdkaFNFNXpXVk5uZDB4RFFYZEtVM2RuVFVOVmMwbEVRWFZOVTJzM1dFYzBaMGxEUVdkSlEwSXdZMjFHZFdNeVduWmpiVEEyU1VoU2VWbFhOWHBpUjBZd1dsWnJiMDFJUWpSTFZIUmpZbWxCWjBsRFFqbFlSelJuU1VOQlowcHFjRzlpTTFwc1kybEJkVmt5T1hWa1IxWjFaRU5DTjFoSE5HZEpRMEZuU1VOQ01HTnRSblZqTWxwMlkyMHdOa2xJVW5sWlZ6VjZZa2RHTUZwV2EyOU5TRUkwUzFSMFkySnBRV2RKUTBJNVdFYzBaMGxJTVdOaWFVRm5TbXB3YjJJeldteGphVUkzV0VjMFowbERRV2RaTTFaNVl6STVlVTlwUW5kaU1teDFaRWRXZVU4eGVIVllSelJuU1VOQloxbHRPVFJNV0U1dldWZFNkbVI2YjJkTlEwRjVZMGhuWjAxVVFuZGxRMEp2WXpKM2IwMURkM2RLVTNjelRrTlZjRTh4ZUhWSlEwRm5TVU0xYW1JeU5UQmFWelV3U1VoMFkySnBRV2RKUTBGblNVaFNlVmxYTlhwYWJUbDVZbFJ2WjJSSVNtaGliazV6V1ZoU2JGZFRaM1JOYmtJMFMxUjBZMkpwUVdkSlEwSTVXRWMwWjBsSU1XTmlhVUZuU21wd2FGa3pVbkJrYlZWblpURjRkVWxEUVdkSlNGSjVXVmMxZW1GWVVuQmlNalEyU1VScmQySllUVGRZUnpSblNVTkJaMWx0T1RSTVdFNXZXVmRTZG1SNmIyZE5RMEY0WTBoblowNXVRalJKUjJoNllrTm5kMHhFUVd4TVJGbDVTbE5yTjFoSE5HZEpRMEZuVEcxT2RtSnVVbXhpYmxGblpURjRkVWxEUVdkSlEwRm5aRWhLYUdKdVRuQmtSMngyWW1wdlowOVVRblJqZW5SalltbEJaMGxEUVdkSlNGSjVXVmMxZWxwdE9YbGlWRzluWkVoS2FHSnVUbk5aV0ZKc1YxTm5lR05JWjNCUE1YaDFTVU5CWjBsSU1XTmlhVUZuWmxaNGRXWldlSFZKWjI5S1dGTjNTME5UU25SWldFSjNZVmMxYm1ONVNUWkpRMHBDVVZWV1FreEdaRUpSVm1OelVUQkdRbEY2ZEVaUlZVNVhURVpHUWxGV1JYTlNWVVpDVWxONFVsRlZSbFJQTUZaQ1VUSTFRMHhGT1VKUlZUaHpVbFZHUWxKVGVFcFJWVVpNVHpCV1FsRXlVWE5aTUVaQ1dYbDRSbEZWUmtaTVJURkNVVlU0TjFKVlJrUmthMGx6VWpCR1FsSjVlRVpSVlVaR1RFVnNRbEZXWXpkU1ZVWkVZVVZKYzFOVlJrSlRVM2hHVVZWR1JreEZkRUpSVlUwM1VsVkdSRlZEZUU1UlZVWk9URVZXUWxGVlZYTlRWVVpDVTNsNFNGRlZUbXRQZW5SQ1VWVldSVXhGT1VKUlZUaHpVVEJHUWxGNmRFWlJWVTVQVEVWMFFsRlZjM05TVlVaQ1VsTjRTbEZWUmxoUE1GWkNVVEo0UTB4Rk1VSlJWVEJ6VWxWR1FsSlRlRXBSVlVaWVR6QldRbEV5TlVOTVJrWkNVVlpGYzFKVlJrSlNVM2hTVVZWR1ZFOHdWa0pSTWpWRFRFVnNRbEZWYTNOU1ZVWkNVbE40U0ZGVlJrcFBNRlpDVVRGWmMxSXdSa0pTZVhoR1VWVkdSa3hGWkVKUlZXczNVbFZHUkZaRGVFNVJWVVpPVEVWV1FsRlZWWE5TTUVaQ1UxUjBSbEZWVm1GTVJsWkNVVlpWYzFKVlJrSlNVM2hNVVZWR1RrOHdWa0pSTW5oRFRFWk9RbEZXVFhOU1ZVWkNVbE40YUZGVlJsWlBNRlpDVVROS1EweEhSa0pSVjBWelVsVkdRbEpUZUVwUlZVWllUekJXUWxKVVJrTk1SbFpDVVZaVmMxSlZSa0pTVTNoSVVWVkdTRXhGVGtKUlZVMXpVakJHUWxKNWVFUlJWVVpFVEVWa1FsRlZZM05STUVaQ1VYbDRVRkZWUmtoTVJXUkNUMFZOTVZGcWRFWlJWRVpGVWtONFVGRlZSbEJNUlU1Q1dUQjNjMVZWUmtKVlUzaEVVVlZHUkU4d2JFSlJNVUZ6VmxWR1FsWlRlRVpSVlVaR1RFVjBRbEZWTURkVFZVWkVZa1ZKYzFNd1JrSlRlWGhHVVZST1ExTlRlRXBSVlVaS1R6QnNRazVGU21sTVJURkNVVlV3YzFKVlJURlJhMk56VTFWR1FsTlVkRXBSVkZwRFdXbDRhRkZWUm1oTVJWWkNVVlZWYzFOVlJrSldlblJLVVZWTmVGRnBlRlpSVlVaV1RFVldRbEZWVlhOVE1FWkNWRlIwU2xGVlRuTlJhWGhTVVZWR1VreEZWa0pSVlZWelZWVkdRbFY2ZEVwUlZVNTFVV2w0U0ZGVlJraE1SVlpDVVZWVmMxTlZSa0pUZW5SS1VWVk9WMHhGYkVKUlZXdHpVbFZHUWxKVGVFcFJWVVpNVHpCc1FsSldaM05VTUVaQ1ZIbDRSbEZWUmtaTVJXeENVVlZ6TjFOVlJrUmFRM2hZVVZWR1dFeEZWa0pSVlZWelZGVkdRbFI2ZEVwUlZVNTNVV2w0YkZGVlJteE1SVlpDVVZWVmMxUlZSa0pVZW5SS1VWVk9ORkZwZUZoUlZVWllURVZXUWxGVlZYTldWVVpDVm5wMFNsRlZUalJSYVhoTVVWVkdURXhGVmtKUlZWVnpWbFZHUWxKNmRFcFJWVTVYVEVaa1FsRldZM05TVlVaQ1VubDRUbEZWUmt4TVJVNUNVVlZWYzFSVlJrSlRlWGhFVVZWR1JFeEZaRUpSVldOelVUQkdRbEY1ZUZCUlZVWklURVZrUWxFeU5VUlBNRlpDVDFWS1NVeEZPVUpSVlRoelVWVkZjbEZyYjNOVU1FWkNWSGw0UkZGVlRrOU1Sa1pDVVZaRmMxRXdSa0pSZW5SS1VWVk9VVXhHVmtKUlZsVnpVbFZHUWxKVGVGUlJWVVpJVHpCc1FsRXlXWE5UTUVaQ1UzbDRSbEZWUmtaTVNHeERVVlZHU2s4d2JFSlJNV2R6VmpCR1FsWjVlRVpSVlVaSVRFVXhRbEZWYzNOUk1FWkNVbE40VGxGVlJreE1SVTVDVVZWTmMxRXdSa0pSZVhoRVVWVkdSRXhIZEVOUlZVWktUekJzUWxFeWNFUk1SazVDVVZaTmMxSlZSa0pTVTNoc1VWVkdWa3hGWkVKUk0xSkRUekJXUW1OclRrMU1SVGxDVVZVNGMxRlZSWEpSYTI5elZEQkdRbFI1ZUVKUlZUbE5URVV4UWxGVk1ITlJNRVpDVVhsNFVsRlZSbEpNUlU1Q1VWVk5OMU5WUmtSYWFYaFVVVlZHVkV4RlZrSlJWVlZ6V2xWR1FsWlRlRWhSVlU0d1VXcDBSbEZZYUVSVVEzaFFVVlZHVUV4RlJrSk5SVTVMVEVVeFFsRlZNSE5STUVaQ1VYcDBTbEZWVGs5TVJURkNVVlV3YzFKVlJrSlNVM2hRVVZWR1VrOHdiRUpTVjJoRFRFWldRbEZXVlhOU1ZVWkNVbE40UkZGVlJrUk1SVTVDVVZWTmMxSXdSa0pTZVhoRVVWVkdSRXhGYkVKUlZXdHpVVEJHUWxGNWVGQlJWVVpJVEVWa1FsTlVUa05QTUd4Q1lXdFNTVXhGT1VKUlZUaHpVVlZGZDFFd2IzTlVWVVpDVkZONFJGRlZiRTFNUmtaQ1VWWkZjMUV3UmtKUmVuUk9VVlZPVVV4R1RrSlJWazF6VWxWR1FsSlRlRzVSYTBaQ1ZsTjRTRkZWVGpCUmFuUkdVVmRvUlZSRGVGQlJWVVpRVEVWR1FtRXdVa3RNUlRsQ1VWVTRjMUV3UmtKUmVuUktVVlZPVVV4R1ZrSlJWbFZ6VWxWR1FsSlRlRXBSVlVaTVR6QnNRbEV5Y0VOTVJsWkNVVlpWYzFKVlJrSlNVM2hFVVZWR1JFeEZUa0pSVlUxelVqQkdRbEo1ZUVSUlZVWkVURVZrUWxGVlkzTlJNRVpDVVhsNFVGRlZSa2hNUldSQ1UzcEdRMDh3YkVKbGExSkpURVU1UWxGVk9ITlJWVVp5VWtWdmMxUXdSa0pVZVhoRVVWVmtUMHhHUmtKUlZrVnpVVEJHUWxGNmRFNVJWVTVSVEVaV1FsRldWWE5TVlVaQ1VsTjRTbEZWUmt4UE1ERkNVVEp3UTB4R1RrSlJWazF6VWxWR1FsSlRlR3hSVlVaV1RFVmtRbEV6VWtOSmFYZExRMU5LZFZsWE1XeGplVWsyU1VaMFpFTnVNRDBnS2k4PScpOzsiLCJXb3JsZCA9IHJlcXVpcmUoJy4vV29ybGQnKVxuUG9pbnRUb29sID0gcmVxdWlyZSgnLi90b29scy9Qb2ludFRvb2wnKVxuTGluZVRvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL0xpbmVUb29sJylcbkFyY1Rvb2wgPSByZXF1aXJlKCcuL3Rvb2xzL0FyY1Rvb2wnKVxuRGVsZXRlVG9vbCA9IHJlcXVpcmUoJy4vdG9vbHMvRGVsZXRlVG9vbCcpXG5cbntCdXR0b25CYXJ9ID0gcmVxdWlyZSgnLi9idXR0b25zJylcblxuYXNzaWduID0gKG8xLCBvMikgLT4gbzFba10gPSB2IGZvciBvd24gayx2IG9mIG8yXG5cbldJRFRIID0gNjAwXG5IRUlHSFQgPSA2MDBcblxuY29udGFpbmVyID0gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5hc3NpZ24gY29udGFpbmVyLnN0eWxlLFxuICBwb3NpdGlvbjogJ3JlbGF0aXZlJ1xuY2FudmFzID0gY29udGFpbmVyLmFwcGVuZENoaWxkIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2NhbnZhcydcbmNhbnZhcy53aWR0aCA9IFdJRFRIKmRldmljZVBpeGVsUmF0aW9cbmNhbnZhcy5oZWlnaHQgPSBIRUlHSFQqZGV2aWNlUGl4ZWxSYXRpb1xuXG5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCAnMmQnXG5jdHguc2NhbGUgZGV2aWNlUGl4ZWxSYXRpbywgZGV2aWNlUGl4ZWxSYXRpb1xuY3R4LmxpbmVDYXAgPSAncm91bmQnXG5cbndvcmxkID0gbmV3IFdvcmxkXG5jdXJyZW50VG9vbCA9IG5ldyBBcmNUb29sIHdvcmxkXG5jdXJyZW50TW91c2VQb3MgPSBudWxsXG5cbmFzc2lnbiBjYW52YXMuc3R5bGUsXG4gIHdpZHRoOiBXSURUSCsncHgnXG4gIGhlaWdodDogSEVJR0hUKydweCdcbiAgYm94U2hhZG93OiAnMHB4IDBweCA0cHggaHNsKDAsMCUsODglKSdcbmFzc2lnbiBkb2N1bWVudC5ib2R5LnN0eWxlLFxuICBkaXNwbGF5OiAnZmxleCdcbiAgYWxpZ25JdGVtczogJ2NlbnRlcidcbiAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInXG4gIGhlaWdodDogJzEwMCUnXG5hc3NpZ24gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLFxuICBoZWlnaHQ6ICcxMDAlJ1xuXG5idXR0b25zID0gLT5cbiAgcG9pbnQ6XG4gICAgaWNvbjogJ2ZhLXRpbWVzJ1xuICAgIGFjdGl2ZTogY3VycmVudFRvb2wuY29uc3RydWN0b3IgaXMgUG9pbnRUb29sXG4gICAgY2xpY2s6IC0+XG4gICAgICBjdXJyZW50VG9vbCA9IG5ldyBQb2ludFRvb2wgd29ybGRcbiAgICAgIGNoYW5nZWQoKVxuICAgIGhvdmVyOiAtPiBjdXJyZW50TW91c2VQb3MgPSBudWxsOyBjaGFuZ2VkKClcbiAgbGluZTpcbiAgICBpY29uOiAnZmEtcGx1cydcbiAgICBhY3RpdmU6IGN1cnJlbnRUb29sLmNvbnN0cnVjdG9yIGlzIExpbmVUb29sXG4gICAgY2xpY2s6IC0+XG4gICAgICBjdXJyZW50VG9vbCA9IG5ldyBMaW5lVG9vbCB3b3JsZFxuICAgICAgY2hhbmdlZCgpXG4gICAgaG92ZXI6IC0+IGN1cnJlbnRNb3VzZVBvcyA9IG51bGw7IGNoYW5nZWQoKVxuICBhcmM6XG4gICAgaWNvbjogJ2ZhLWNpcmNsZS1vJ1xuICAgIGFjdGl2ZTogY3VycmVudFRvb2wuY29uc3RydWN0b3IgaXMgQXJjVG9vbFxuICAgIGNsaWNrOiAtPlxuICAgICAgY3VycmVudFRvb2wgPSBuZXcgQXJjVG9vbCB3b3JsZFxuICAgICAgY2hhbmdlZCgpXG4gICAgaG92ZXI6IC0+IGN1cnJlbnRNb3VzZVBvcyA9IG51bGw7IGNoYW5nZWQoKVxuICBkZWxldGU6XG4gICAgaWNvbjogJ2ZhLWJhbidcbiAgICBhY3RpdmU6IGN1cnJlbnRUb29sLmNvbnN0cnVjdG9yIGlzIERlbGV0ZVRvb2xcbiAgICBjbGljazogLT5cbiAgICAgIGN1cnJlbnRUb29sID0gbmV3IERlbGV0ZVRvb2wgd29ybGRcbiAgICAgIGNoYW5nZWQoKVxuICAgIGhvdmVyOiAtPiBjdXJyZW50TW91c2VQb3MgPSBudWxsOyBjaGFuZ2VkKClcblxuZGlmZiA9IHJlcXVpcmUoJ3ZpcnR1YWwtZG9tL2RpZmYnKVxucGF0Y2ggPSByZXF1aXJlKCd2aXJ0dWFsLWRvbS9wYXRjaCcpXG5jcmVhdGVFbGVtZW50ID0gcmVxdWlyZSgndmlydHVhbC1kb20vY3JlYXRlLWVsZW1lbnQnKVxuXG4kYnV0dG9uQmFyID0gQnV0dG9uQmFyKGJ1dHRvbnMoKSlcbiRidXR0b25Sb290ID0gY3JlYXRlRWxlbWVudCgkYnV0dG9uQmFyKVxuY29udGFpbmVyLmFwcGVuZENoaWxkKCRidXR0b25Sb290KVxuXG5kcmF3ID0gLT5cbiAgY3R4LmNsZWFyUmVjdCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHRcbiAgY3R4LnNhdmUoKVxuICB3b3JsZC5kcmF3IGN0eFxuICBjdHgucmVzdG9yZSgpXG4gIGN0eC5zYXZlKClcbiAgY3VycmVudFRvb2wuZHJhdyBjdHgsIGN1cnJlbnRNb3VzZVBvc1xuICBjdHgucmVzdG9yZSgpXG5cbiAgbmV3QmFyID0gQnV0dG9uQmFyKGJ1dHRvbnMoKSlcbiAgcGF0Y2hlcyA9IGRpZmYoJGJ1dHRvbkJhciwgbmV3QmFyKVxuICBwYXRjaCgkYnV0dG9uUm9vdCwgcGF0Y2hlcylcbiAgJGJ1dHRvbkJhciA9IG5ld0JhclxuXG5jaGFuZ2VkID0gLT5cbiAgZHJhdygpXG5cbmNhbnZhcy5vbmNsaWNrID0gKGUpIC0+XG4gIFt4LCB5XSA9IFtlLm9mZnNldFgsIGUub2Zmc2V0WV1cbiAgcHQgPSB3b3JsZC5zbmFwIHt4LCB5fVxuICBjdXJyZW50TW91c2VQb3MgPSBwdFxuICBjdXJyZW50VG9vbC5jbGljayBwdFxuICBjaGFuZ2VkKClcblxuY2FudmFzLm9ubW91c2Vtb3ZlID0gKGUpIC0+XG4gIFt4LCB5XSA9IFtlLm9mZnNldFgsIGUub2Zmc2V0WV1cbiAgcHQgPSB3b3JsZC5zbmFwIHt4LCB5fVxuICBjdXJyZW50TW91c2VQb3MgPSBwdFxuICBjdXJyZW50VG9vbC5tb3ZlPyBwdFxuICBjaGFuZ2VkKClcblxud2luZG93Lm9ua2V5ZG93biA9IChlKSAtPlxuICBzd2l0Y2ggZS53aGljaFxuICAgIHdoZW4gMjdcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgY3VycmVudFRvb2wuZXNjPygpXG4gICAgICBjaGFuZ2VkKClcbiAgICB3aGVuICdQJy5jaGFyQ29kZUF0KDApXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGN1cnJlbnRUb29sID0gbmV3IFBvaW50VG9vbCB3b3JsZFxuICAgICAgY2hhbmdlZCgpXG4gICAgd2hlbiAnTCcuY2hhckNvZGVBdCgwKVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBjdXJyZW50VG9vbCA9IG5ldyBMaW5lVG9vbCB3b3JsZFxuICAgICAgY2hhbmdlZCgpXG4gICAgd2hlbiAnQScuY2hhckNvZGVBdCgwKVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBjdXJyZW50VG9vbCA9IG5ldyBBcmNUb29sIHdvcmxkXG4gICAgICBjaGFuZ2VkKClcbiAgICB3aGVuICdEJy5jaGFyQ29kZUF0KDApXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGN1cnJlbnRUb29sID0gbmV3IERlbGV0ZVRvb2wgd29ybGRcbiAgICAgIGNoYW5nZWQoKVxuICAgIGVsc2VcbiAgICAgIGN1cnJlbnRUb29sLmtleT8gZSwgY3VycmVudE1vdXNlUG9zXG4gICAgICBjaGFuZ2VkKCkgaWYgZS5kZWZhdWx0UHJldmVudGVkXG4iLCJ2ID0gcmVxdWlyZSgnLi4vdmVjdG9yJylcblxuaXNBbmdsZUJldHdlZW4gPSAoYTEsIGEyLCBhKSAtPlxuICBpZiBhMSA+IGEyXG4gICAgW2ExLCBhMl0gPSBbYTIsIGExXVxuICB3aGlsZSBhIDwgYTFcbiAgICBhICs9IE1hdGguUEkqMlxuICB3aGlsZSBhID4gYTJcbiAgICBhIC09IE1hdGguUEkqMlxuICBhMSA8PSBhIDw9IGEyXG5cbmNsYXNzIEFyY1xuICBpbnRlcnNlY3RDb2RlOiAyXG4gIGNvbnN0cnVjdG9yOiAoe0BjZW50ZXIsIEByYWRpdXMsIEBzdWJ0ZW5kZWRBbmdsZX0pIC0+XG4gICAgQHN0YXJ0QW5nbGUgPSB2LmF0YW4yIEByYWRpdXNcbiAgICBAZW5kQW5nbGUgPSBAc3RhcnRBbmdsZSArIEBzdWJ0ZW5kZWRBbmdsZVxuXG4gIGRyYXc6IChjdHgpIC0+XG4gICAgY3R4LmxpbmVXaWR0aCA9IDJcbiAgICBjdHguYmVnaW5QYXRoKClcbiAgICBjdHguYXJjIEBjZW50ZXIueCwgQGNlbnRlci55LFxuICAgICAgdi5sZW4oQHJhZGl1cylcbiAgICAgIEBzdGFydEFuZ2xlLCBAZW5kQW5nbGUsIEBzdWJ0ZW5kZWRBbmdsZSA8IDBcbiAgICBjdHguc3Ryb2tlKClcblxuICBtYWduZXRzOiAocHQpIC0+XG4gICAgciA9IHYubGVuIEByYWRpdXNcbiAgICBvdGhlclJhZGl1cyA9IHYuYWRkIEBjZW50ZXIsIHYuc2NhbGUgdi5mb3JBbmdsZShAZW5kQW5nbGUpLCByXG4gICAgW1xuICAgICAgeyBwb2ludDogdi5hZGQoQGNlbnRlciwgQHJhZGl1cyksIHR5cGU6ICdwb2ludCcgfVxuICAgICAgeyBwb2ludDogb3RoZXJSYWRpdXMsICAgICAgICAgICAgIHR5cGU6ICdwb2ludCcgfVxuICAgICAgeyBwb2ludDogQGNsb3Nlc3RQb2ludFRvKHB0KSwgICAgIHR5cGU6ICdsaW5lJyB9XG4gICAgXVxuXG4gIGNsb3Nlc3RQb2ludFRvOiAocHQpIC0+XG4gICAgYW5nbGUgPSB2LmF0YW4yIHYuc3ViIHB0LCBAY2VudGVyXG4gICAgaWYgaXNBbmdsZUJldHdlZW4gQHN0YXJ0QW5nbGUsIEBlbmRBbmdsZSwgYW5nbGVcbiAgICAgIHYuYWRkIEBjZW50ZXIsIHYuc2NhbGUgdi5mb3JBbmdsZShhbmdsZSksIHYubGVuKEByYWRpdXMpXG5cbm1vZHVsZS5leHBvcnRzID0gQXJjXG4iLCJ2ID0gcmVxdWlyZSgnLi4vdmVjdG9yJylcblxuY2xhc3MgTGluZVxuICBpbnRlcnNlY3RDb2RlOiAxXG4gIGNvbnN0cnVjdG9yOiAoe0Bmcm9tLCBAdG99KSAtPlxuXG4gIGRyYXc6IChjdHgpIC0+XG4gICAgY3R4LmxpbmVXaWR0aCA9IDJcbiAgICBjdHguYmVnaW5QYXRoKClcbiAgICBjdHgubW92ZVRvIEBmcm9tLngsIEBmcm9tLnlcbiAgICBjdHgubGluZVRvIEB0by54LCBAdG8ueVxuICAgIGN0eC5zdHJva2UoKVxuXG4gIG1hZ25ldHM6IChwdCkgLT5cbiAgICBbXG4gICAgICB7IHR5cGU6ICdwb2ludCcsIHBvaW50OiBAZnJvbSB9XG4gICAgICB7IHR5cGU6ICdwb2ludCcsIHBvaW50OiBAdG8gfVxuICAgICAgeyB0eXBlOiAnbGluZScsICBwb2ludDogQGNsb3Nlc3RQb2ludFRvKHB0KSB9XG4gICAgXVxuXG4gIGNsb3Nlc3RQb2ludFRvOiAocHQpIC0+XG4gICAgbGVuID0gdi5sZW4gdi5zdWIgQGZyb20sIEB0b1xuICAgIGlmIGxlbiA9PSAwICAjIGZyb20gPT0gdG9cbiAgICAgIHJldHVybiBAZnJvbVxuICAgIHRweCA9ICgocHQueCAtIEBmcm9tLngpICogKEB0by54IC0gQGZyb20ueCkgKyAocHQueSAtIEBmcm9tLnkpICogKEB0by55IC0gQGZyb20ueSkpIC8gbGVuXG4gICAgaWYgdHB4IDwgNFxuICAgICAgQGZyb21cbiAgICBlbHNlIGlmIHRweCA+IGxlbi00XG4gICAgICBAdG9cbiAgICBlbHNlXG4gICAgICB2LmFkZCBAZnJvbSwgdi5zY2FsZSAodi5zdWIgQHRvLCBAZnJvbSksIHRweCAvIGxlblxuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmVcbiIsImNsYXNzIFBvaW50XG4gIGNvbnN0cnVjdG9yOiAoQHBvaW50KSAtPlxuXG4gIGRyYXc6IChjdHgpIC0+XG4gICAgY3R4LmxpbmVXaWR0aCA9IDAuNVxuICAgIGN0eC5iZWdpblBhdGgoKVxuICAgIGN0eC5tb3ZlVG8gQHBvaW50LngtNCwgQHBvaW50LnktNFxuICAgIGN0eC5saW5lVG8gQHBvaW50LngrNCwgQHBvaW50LnkrNFxuICAgIGN0eC5tb3ZlVG8gQHBvaW50LngrNCwgQHBvaW50LnktNFxuICAgIGN0eC5saW5lVG8gQHBvaW50LngtNCwgQHBvaW50LnkrNFxuICAgIGN0eC5zdHJva2UoKVxuXG4gIG1hZ25ldHM6IChwdCkgLT5cbiAgICBbXG4gICAgICB7IHR5cGU6ICdwb2ludCcsIHBvaW50OiBAcG9pbnQgfVxuICAgIF1cblxubW9kdWxlLmV4cG9ydHMgPSBQb2ludFxuIiwidiA9IHJlcXVpcmUoJy4uL3ZlY3RvcicpXG5BcmMgPSByZXF1aXJlKCcuLi9zaGFwZXMvQXJjJylcblxud3JhcHBpID0gKHgpIC0+XG4gIHdoaWxlIHggPCAtTWF0aC5QSSB0aGVuIHggKz0gTWF0aC5QSSoyXG4gIHdoaWxlIHggPiBNYXRoLlBJIHRoZW4geCAtPSBNYXRoLlBJKjJcbiAgeFxuXG5jbGFzcyBBcmNUb29sXG4gIGNvbnN0cnVjdG9yOiAoQHdvcmxkKSAtPlxuICAgIEBzdGF0ZSA9ICdjZW50ZXInXG4gICAgQGNlbnRlciA9IG51bGxcbiAgICBAcmFkaXVzID0gbnVsbFxuICAgIEBzdGFydEFuZ2xlID0gbnVsbFxuICAgIEBlbmRBbmdsZSA9IG51bGxcblxuICBtb3ZlOiAocHQpIC0+XG4gICAgc3dpdGNoIEBzdGF0ZVxuICAgICAgd2hlbiAnYW5nbGUnXG4gICAgICAgIEBlbmRBbmdsZSA9IHYuYXRhbjIgdi5zdWIgcHQsIEBjZW50ZXJcblxuICBjbGljazogKHB0KSAtPlxuICAgIHN3aXRjaCBAc3RhdGVcbiAgICAgIHdoZW4gJ2NlbnRlcidcbiAgICAgICAgQGNlbnRlciA9IHB0XG4gICAgICAgIEBzdGF0ZSA9ICdyYWRpdXMnXG4gICAgICAgIEByYWRpdXMgPSAwXG4gICAgICB3aGVuICdyYWRpdXMnXG4gICAgICAgIEByYWRpdXMgPSBwdFxuICAgICAgICBAc3RhdGUgPSAnYW5nbGUnXG4gICAgICAgIEBzdGFydEFuZ2xlID0gQGVuZEFuZ2xlID0gdi5hdGFuMiB2LnN1YiBwdCwgQGNlbnRlclxuICAgICAgd2hlbiAnYW5nbGUnXG4gICAgICAgIHN1YnRlbmRlZEFuZ2xlID0gd3JhcHBpKEBlbmRBbmdsZSAtIEBzdGFydEFuZ2xlKVxuICAgICAgICBAd29ybGQuYWRkIG5ldyBBcmMge0BjZW50ZXIsIHJhZGl1czogdi5zdWIoQHJhZGl1cywgQGNlbnRlciksIHN1YnRlbmRlZEFuZ2xlfVxuICAgICAgICBAc3RhdGUgPSAnY2VudGVyJ1xuICAgICAgICBAY2VudGVyID0gcHRcblxuICBlc2M6IC0+XG4gICAgQHN0YXRlID0gJ2NlbnRlcidcblxuICBkcmF3OiAoY3R4LCBtb3VzZSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIG1vdXNlP1xuICAgIGN0eC5saW5lV2lkdGggPSAxXG4gICAgc3dpdGNoIEBzdGF0ZVxuICAgICAgd2hlbiAnY2VudGVyJ1xuICAgICAgICBjdHguYmVnaW5QYXRoKClcbiAgICAgICAgY3R4LmFyYyBtb3VzZS54LCBtb3VzZS55LCA0LCAwLCBNYXRoLlBJKjJcbiAgICAgICAgY3R4LnN0cm9rZSgpXG4gICAgICB3aGVuICdyYWRpdXMnXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKVxuICAgICAgICBjdHgubW92ZVRvIEBjZW50ZXIueCwgQGNlbnRlci55XG4gICAgICAgIGN0eC5saW5lVG8gbW91c2UueCwgbW91c2UueVxuICAgICAgICBjdHguc3Ryb2tlKClcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgICAgIGN0eC5hcmMgQGNlbnRlci54LCBAY2VudGVyLnksIHYubGVuKHYuc3ViIG1vdXNlLCBAY2VudGVyKSwgMCwgTWF0aC5QSSoyXG4gICAgICAgIGN0eC5zdHJva2UoKVxuICAgICAgd2hlbiAnYW5nbGUnXG4gICAgICAgIHN1YnRlbmRlZEFuZ2xlID0gd3JhcHBpKEBlbmRBbmdsZSAtIEBzdGFydEFuZ2xlKVxuICAgICAgICBjdHgubGluZVdpZHRoID0gMlxuICAgICAgICBjdHguYmVnaW5QYXRoKClcbiAgICAgICAgY3R4LmFyYyBAY2VudGVyLngsIEBjZW50ZXIueSxcbiAgICAgICAgICB2Lmxlbih2LnN1YiBAcmFkaXVzLCBAY2VudGVyKVxuICAgICAgICAgIEBzdGFydEFuZ2xlLCBAZW5kQW5nbGUsIHN1YnRlbmRlZEFuZ2xlIDwgMFxuICAgICAgICBjdHguc3Ryb2tlKClcblxubW9kdWxlLmV4cG9ydHMgPSBBcmNUb29sXG4iLCJjbGFzcyBEZWxldGVUb29sXG4gIGNvbnN0cnVjdG9yOiAoQHdvcmxkKSAtPlxuICBtb3ZlOiAocHQpIC0+XG4gICAgQGkgPSAwXG4gICAgQHNoYXBlcyA9IEB3b3JsZC5vYmplY3RzQXQocHQpXG4gIHNoYXBlOiAtPlxuICAgIEBzaGFwZXM/W0BpICUgQHNoYXBlcy5sZW5ndGhdXG4gIGNsaWNrOiAocHQpIC0+XG4gICAgaWYgQHNoYXBlKCk/XG4gICAgICBAd29ybGQucmVtb3ZlIEBzaGFwZSgpXG4gICAgICBAc2hhcGVzID0gQHdvcmxkLm9iamVjdHNBdChwdClcbiAgZHJhdzogKGN0eCkgLT5cbiAgICBpZiBAc2hhcGUoKT9cbiAgICAgIGN0eC5zdHJva2VTdHlsZSA9ICdyZWQnXG4gICAgICBAc2hhcGUoKS5kcmF3KGN0eClcbiAgZXNjOiAtPlxuXG4gIGtleTogKGUsIG1vdXNlKSAtPlxuICAgIHN3aXRjaCBlLndoaWNoXG4gICAgICB3aGVuIDkgICMgdGFiXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBAaSArPSAxXG4gICAgICB3aGVuIDEzICAjIGVudGVyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBAY2xpY2sgbW91c2UueCwgbW91c2UueVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlbGV0ZVRvb2xcbiIsIkxpbmUgPSByZXF1aXJlKCcuLi9zaGFwZXMvTGluZScpXG5cbmNsYXNzIExpbmVUb29sXG4gIGNvbnN0cnVjdG9yOiAoQHdvcmxkKSAtPlxuICAgIEByb290ID0gbnVsbFxuXG4gIGNsaWNrOiAocHQpIC0+XG4gICAgaWYgbm90IEByb290XG4gICAgICBAcm9vdCA9IHB0XG4gICAgZWxzZVxuICAgICAgQHdvcmxkLmFkZCBuZXcgTGluZSBmcm9tOiBAcm9vdCwgdG86IHB0XG4gICAgICBAcm9vdCA9IHB0XG5cbiAgZXNjOiAtPlxuICAgIEByb290ID0gbnVsbFxuXG4gIGRyYXc6IChjdHgsIG1vdXNlKSAtPlxuICAgIHJldHVybiB1bmxlc3MgbW91c2U/XG4gICAgaWYgbm90IEByb290XG4gICAgICBjdHguYmVnaW5QYXRoKClcbiAgICAgIGN0eC5tb3ZlVG8gbW91c2UueC00LCBtb3VzZS55XG4gICAgICBjdHgubGluZVRvIG1vdXNlLngrNCwgbW91c2UueVxuICAgICAgY3R4Lm1vdmVUbyBtb3VzZS54LCBtb3VzZS55LTRcbiAgICAgIGN0eC5saW5lVG8gbW91c2UueCwgbW91c2UueSs0XG4gICAgICBjdHguc3Ryb2tlKClcbiAgICBlbHNlXG4gICAgICBjdHguYmVnaW5QYXRoKClcbiAgICAgIGN0eC5tb3ZlVG8gQHJvb3QueCwgQHJvb3QueVxuICAgICAgY3R4LmxpbmVUbyBtb3VzZS54LCBtb3VzZS55XG4gICAgICBjdHguc3Ryb2tlKClcblxubW9kdWxlLmV4cG9ydHMgPSBMaW5lVG9vbFxuIiwiUG9pbnQgPSByZXF1aXJlKCcuLi9zaGFwZXMvUG9pbnQnKVxuXG5jbGFzcyBQb2ludFRvb2xcbiAgY29uc3RydWN0b3I6IChAd29ybGQpIC0+XG5cbiAgY2xpY2s6IChwdCkgLT5cbiAgICBAd29ybGQuYWRkIG5ldyBQb2ludCBwdFxuXG4gIG1vdmU6IChwdCkgLT5cblxuICBkcmF3OiAoY3R4LCBtb3VzZSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIG1vdXNlP1xuICAgIGN0eC5iZWdpblBhdGgoKVxuICAgIGN0eC5tb3ZlVG8gbW91c2UueC00LCBtb3VzZS55LTRcbiAgICBjdHgubGluZVRvIG1vdXNlLngrNCwgbW91c2UueSs0XG4gICAgY3R4Lm1vdmVUbyBtb3VzZS54KzQsIG1vdXNlLnktNFxuICAgIGN0eC5saW5lVG8gbW91c2UueC00LCBtb3VzZS55KzRcbiAgICBjdHguc3Ryb2tlKClcblxubW9kdWxlLmV4cG9ydHMgPSBQb2ludFRvb2xcbiIsIlZlY3QgPSAoQHgsIEB5KSAtPlxudiA9ICh4LCB5KSAtPiBuZXcgVmVjdCh4LCB5KVxudi5zdWIgPSAoe3g6eDEseTp5MX0sIHt4OngyLHk6eTJ9KSAtPiB2KHgxLXgyLCB5MS15MilcbnYuYWRkID0gKHt4OngxLHk6eTF9LCB7eDp4Mix5OnkyfSkgLT4gdih4MSt4MiwgeTEreTIpXG52LmxlbiA9ICh7eCx5fSkgLT4gTWF0aC5zcXJ0IHgqeCt5KnlcbnYuc2NhbGUgPSAoe3gseX0scykgLT4gdih4KnMsIHkqcylcbnYubm9ybSA9IChhKSAtPiB2LnNjYWxlIGEsICgxL3YubGVuIGEpXG52LmF0YW4yID0gKHcpIC0+IE1hdGguYXRhbjIgdy55LCB3LnhcbnYuZm9yQW5nbGUgPSAodCkgLT4gdihNYXRoLmNvcyh0KSwgTWF0aC5zaW4odCkpXG52LmNyb3NzID0gKHt4OngxLHk6eTF9LCB7eDp4Mix5OnkyfSkgLT4geDEqeTIgLSB4Mip5MVxudi5kb3QgPSAoe3g6eDEseTp5MX0sIHt4OngyLHk6eTJ9KSAtPiB4MSp4MiArIHkxKnkyXG52LnBlcnAgPSAoe3gseX0pIC0+IHYoLXksIHgpXG52Lm5lZyA9ICh7eCx5fSkgLT4gdigteCwgLXkpXG5cbm1vZHVsZS5leHBvcnRzID0gdlxuIixudWxsLCIvKiFcbiAqIENyb3NzLUJyb3dzZXIgU3BsaXQgMS4xLjFcbiAqIENvcHlyaWdodCAyMDA3LTIwMTIgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+XG4gKiBBdmFpbGFibGUgdW5kZXIgdGhlIE1JVCBMaWNlbnNlXG4gKiBFQ01BU2NyaXB0IGNvbXBsaWFudCwgdW5pZm9ybSBjcm9zcy1icm93c2VyIHNwbGl0IG1ldGhvZFxuICovXG5cbi8qKlxuICogU3BsaXRzIGEgc3RyaW5nIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncyB1c2luZyBhIHJlZ2V4IG9yIHN0cmluZyBzZXBhcmF0b3IuIE1hdGNoZXMgb2YgdGhlXG4gKiBzZXBhcmF0b3IgYXJlIG5vdCBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0IGFycmF5LiBIb3dldmVyLCBpZiBgc2VwYXJhdG9yYCBpcyBhIHJlZ2V4IHRoYXQgY29udGFpbnNcbiAqIGNhcHR1cmluZyBncm91cHMsIGJhY2tyZWZlcmVuY2VzIGFyZSBzcGxpY2VkIGludG8gdGhlIHJlc3VsdCBlYWNoIHRpbWUgYHNlcGFyYXRvcmAgaXMgbWF0Y2hlZC5cbiAqIEZpeGVzIGJyb3dzZXIgYnVncyBjb21wYXJlZCB0byB0aGUgbmF0aXZlIGBTdHJpbmcucHJvdG90eXBlLnNwbGl0YCBhbmQgY2FuIGJlIHVzZWQgcmVsaWFibHlcbiAqIGNyb3NzLWJyb3dzZXIuXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFN0cmluZyB0byBzcGxpdC5cbiAqIEBwYXJhbSB7UmVnRXhwfFN0cmluZ30gc2VwYXJhdG9yIFJlZ2V4IG9yIHN0cmluZyB0byB1c2UgZm9yIHNlcGFyYXRpbmcgdGhlIHN0cmluZy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbbGltaXRdIE1heGltdW0gbnVtYmVyIG9mIGl0ZW1zIHRvIGluY2x1ZGUgaW4gdGhlIHJlc3VsdCBhcnJheS5cbiAqIEByZXR1cm5zIHtBcnJheX0gQXJyYXkgb2Ygc3Vic3RyaW5ncy5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQmFzaWMgdXNlXG4gKiBzcGxpdCgnYSBiIGMgZCcsICcgJyk7XG4gKiAvLyAtPiBbJ2EnLCAnYicsICdjJywgJ2QnXVxuICpcbiAqIC8vIFdpdGggbGltaXRcbiAqIHNwbGl0KCdhIGIgYyBkJywgJyAnLCAyKTtcbiAqIC8vIC0+IFsnYScsICdiJ11cbiAqXG4gKiAvLyBCYWNrcmVmZXJlbmNlcyBpbiByZXN1bHQgYXJyYXlcbiAqIHNwbGl0KCcuLndvcmQxIHdvcmQyLi4nLCAvKFthLXpdKykoXFxkKykvaSk7XG4gKiAvLyAtPiBbJy4uJywgJ3dvcmQnLCAnMScsICcgJywgJ3dvcmQnLCAnMicsICcuLiddXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uIHNwbGl0KHVuZGVmKSB7XG5cbiAgdmFyIG5hdGl2ZVNwbGl0ID0gU3RyaW5nLnByb3RvdHlwZS5zcGxpdCxcbiAgICBjb21wbGlhbnRFeGVjTnBjZyA9IC8oKT8/Ly5leGVjKFwiXCIpWzFdID09PSB1bmRlZixcbiAgICAvLyBOUENHOiBub25wYXJ0aWNpcGF0aW5nIGNhcHR1cmluZyBncm91cFxuICAgIHNlbGY7XG5cbiAgc2VsZiA9IGZ1bmN0aW9uKHN0ciwgc2VwYXJhdG9yLCBsaW1pdCkge1xuICAgIC8vIElmIGBzZXBhcmF0b3JgIGlzIG5vdCBhIHJlZ2V4LCB1c2UgYG5hdGl2ZVNwbGl0YFxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc2VwYXJhdG9yKSAhPT0gXCJbb2JqZWN0IFJlZ0V4cF1cIikge1xuICAgICAgcmV0dXJuIG5hdGl2ZVNwbGl0LmNhbGwoc3RyLCBzZXBhcmF0b3IsIGxpbWl0KTtcbiAgICB9XG4gICAgdmFyIG91dHB1dCA9IFtdLFxuICAgICAgZmxhZ3MgPSAoc2VwYXJhdG9yLmlnbm9yZUNhc2UgPyBcImlcIiA6IFwiXCIpICsgKHNlcGFyYXRvci5tdWx0aWxpbmUgPyBcIm1cIiA6IFwiXCIpICsgKHNlcGFyYXRvci5leHRlbmRlZCA/IFwieFwiIDogXCJcIikgKyAvLyBQcm9wb3NlZCBmb3IgRVM2XG4gICAgICAoc2VwYXJhdG9yLnN0aWNreSA/IFwieVwiIDogXCJcIiksXG4gICAgICAvLyBGaXJlZm94IDMrXG4gICAgICBsYXN0TGFzdEluZGV4ID0gMCxcbiAgICAgIC8vIE1ha2UgYGdsb2JhbGAgYW5kIGF2b2lkIGBsYXN0SW5kZXhgIGlzc3VlcyBieSB3b3JraW5nIHdpdGggYSBjb3B5XG4gICAgICBzZXBhcmF0b3IgPSBuZXcgUmVnRXhwKHNlcGFyYXRvci5zb3VyY2UsIGZsYWdzICsgXCJnXCIpLFxuICAgICAgc2VwYXJhdG9yMiwgbWF0Y2gsIGxhc3RJbmRleCwgbGFzdExlbmd0aDtcbiAgICBzdHIgKz0gXCJcIjsgLy8gVHlwZS1jb252ZXJ0XG4gICAgaWYgKCFjb21wbGlhbnRFeGVjTnBjZykge1xuICAgICAgLy8gRG9lc24ndCBuZWVkIGZsYWdzIGd5LCBidXQgdGhleSBkb24ndCBodXJ0XG4gICAgICBzZXBhcmF0b3IyID0gbmV3IFJlZ0V4cChcIl5cIiArIHNlcGFyYXRvci5zb3VyY2UgKyBcIiQoPyFcXFxccylcIiwgZmxhZ3MpO1xuICAgIH1cbiAgICAvKiBWYWx1ZXMgZm9yIGBsaW1pdGAsIHBlciB0aGUgc3BlYzpcbiAgICAgKiBJZiB1bmRlZmluZWQ6IDQyOTQ5NjcyOTUgLy8gTWF0aC5wb3coMiwgMzIpIC0gMVxuICAgICAqIElmIDAsIEluZmluaXR5LCBvciBOYU46IDBcbiAgICAgKiBJZiBwb3NpdGl2ZSBudW1iZXI6IGxpbWl0ID0gTWF0aC5mbG9vcihsaW1pdCk7IGlmIChsaW1pdCA+IDQyOTQ5NjcyOTUpIGxpbWl0IC09IDQyOTQ5NjcyOTY7XG4gICAgICogSWYgbmVnYXRpdmUgbnVtYmVyOiA0Mjk0OTY3Mjk2IC0gTWF0aC5mbG9vcihNYXRoLmFicyhsaW1pdCkpXG4gICAgICogSWYgb3RoZXI6IFR5cGUtY29udmVydCwgdGhlbiB1c2UgdGhlIGFib3ZlIHJ1bGVzXG4gICAgICovXG4gICAgbGltaXQgPSBsaW1pdCA9PT0gdW5kZWYgPyAtMSA+Pj4gMCA6IC8vIE1hdGgucG93KDIsIDMyKSAtIDFcbiAgICBsaW1pdCA+Pj4gMDsgLy8gVG9VaW50MzIobGltaXQpXG4gICAgd2hpbGUgKG1hdGNoID0gc2VwYXJhdG9yLmV4ZWMoc3RyKSkge1xuICAgICAgLy8gYHNlcGFyYXRvci5sYXN0SW5kZXhgIGlzIG5vdCByZWxpYWJsZSBjcm9zcy1icm93c2VyXG4gICAgICBsYXN0SW5kZXggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIGlmIChsYXN0SW5kZXggPiBsYXN0TGFzdEluZGV4KSB7XG4gICAgICAgIG91dHB1dC5wdXNoKHN0ci5zbGljZShsYXN0TGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgICAgICAvLyBGaXggYnJvd3NlcnMgd2hvc2UgYGV4ZWNgIG1ldGhvZHMgZG9uJ3QgY29uc2lzdGVudGx5IHJldHVybiBgdW5kZWZpbmVkYCBmb3JcbiAgICAgICAgLy8gbm9ucGFydGljaXBhdGluZyBjYXB0dXJpbmcgZ3JvdXBzXG4gICAgICAgIGlmICghY29tcGxpYW50RXhlY05wY2cgJiYgbWF0Y2gubGVuZ3RoID4gMSkge1xuICAgICAgICAgIG1hdGNoWzBdLnJlcGxhY2Uoc2VwYXJhdG9yMiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAyOyBpKyspIHtcbiAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1tpXSA9PT0gdW5kZWYpIHtcbiAgICAgICAgICAgICAgICBtYXRjaFtpXSA9IHVuZGVmO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoLmxlbmd0aCA+IDEgJiYgbWF0Y2guaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkob3V0cHV0LCBtYXRjaC5zbGljZSgxKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdExlbmd0aCA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgbGFzdExhc3RJbmRleCA9IGxhc3RJbmRleDtcbiAgICAgICAgaWYgKG91dHB1dC5sZW5ndGggPj0gbGltaXQpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNlcGFyYXRvci5sYXN0SW5kZXggPT09IG1hdGNoLmluZGV4KSB7XG4gICAgICAgIHNlcGFyYXRvci5sYXN0SW5kZXgrKzsgLy8gQXZvaWQgYW4gaW5maW5pdGUgbG9vcFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAobGFzdExhc3RJbmRleCA9PT0gc3RyLmxlbmd0aCkge1xuICAgICAgaWYgKGxhc3RMZW5ndGggfHwgIXNlcGFyYXRvci50ZXN0KFwiXCIpKSB7XG4gICAgICAgIG91dHB1dC5wdXNoKFwiXCIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaChzdHIuc2xpY2UobGFzdExhc3RJbmRleCkpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0Lmxlbmd0aCA+IGxpbWl0ID8gb3V0cHV0LnNsaWNlKDAsIGxpbWl0KSA6IG91dHB1dDtcbiAgfTtcblxuICByZXR1cm4gc2VsZjtcbn0pKCk7XG4iLCIvKiFcbiAgQ29weXJpZ2h0IChjKSAyMDE1IEplZCBXYXRzb24uXG4gIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZSAoTUlUKSwgc2VlXG4gIGh0dHA6Ly9qZWR3YXRzb24uZ2l0aHViLmlvL2NsYXNzbmFtZXNcbiovXG5cbmZ1bmN0aW9uIGNsYXNzTmFtZXMoKSB7XG5cdHZhciBjbGFzc2VzID0gJyc7XG5cdHZhciBhcmc7XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0aWYgKCFhcmcpIHtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGFyZyB8fCAnbnVtYmVyJyA9PT0gdHlwZW9mIGFyZykge1xuXHRcdFx0Y2xhc3NlcyArPSAnICcgKyBhcmc7XG5cdFx0fSBlbHNlIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJnKSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuXHRcdFx0Y2xhc3NlcyArPSAnICcgKyBjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZyk7XG5cdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PT0gdHlwZW9mIGFyZykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIGFyZykge1xuXHRcdFx0XHRpZiAoIWFyZy5oYXNPd25Qcm9wZXJ0eShrZXkpIHx8ICFhcmdba2V5XSkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsga2V5O1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gY2xhc3Nlcy5zdWJzdHIoMSk7XG59XG5cbi8vIHNhZmVseSBleHBvcnQgY2xhc3NOYW1lcyBmb3Igbm9kZSAvIGJyb3dzZXJpZnlcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXM7XG59XG5cbi8vIHNhZmVseSBleHBvcnQgY2xhc3NOYW1lcyBmb3IgUmVxdWlyZUpTXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkge1xuXHRkZWZpbmUoJ2NsYXNzbmFtZXMnLCBbXSwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGNsYXNzTmFtZXM7XG5cdH0pO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3NzLCBjdXN0b21Eb2N1bWVudCkge1xuICB2YXIgZG9jID0gY3VzdG9tRG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gIGlmIChkb2MuY3JlYXRlU3R5bGVTaGVldCkge1xuICAgIHZhciBzaGVldCA9IGRvYy5jcmVhdGVTdHlsZVNoZWV0KClcbiAgICBzaGVldC5jc3NUZXh0ID0gY3NzO1xuICAgIHJldHVybiBzaGVldC5vd25lck5vZGU7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGhlYWQgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcbiAgICAgICAgc3R5bGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcblxuICAgIHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xuXG4gICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jLmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICAgIH1cblxuICAgIGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgIHJldHVybiBzdHlsZTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMuYnlVcmwgPSBmdW5jdGlvbih1cmwpIHtcbiAgaWYgKGRvY3VtZW50LmNyZWF0ZVN0eWxlU2hlZXQpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlU3R5bGVTaGVldCh1cmwpLm93bmVyTm9kZTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgICAgIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG5cbiAgICBsaW5rLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICBsaW5rLmhyZWYgPSB1cmw7XG5cbiAgICBoZWFkLmFwcGVuZENoaWxkKGxpbmspO1xuICAgIHJldHVybiBsaW5rO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgT25lVmVyc2lvbkNvbnN0cmFpbnQgPSByZXF1aXJlKCdpbmRpdmlkdWFsL29uZS12ZXJzaW9uJyk7XG5cbnZhciBNWV9WRVJTSU9OID0gJzcnO1xuT25lVmVyc2lvbkNvbnN0cmFpbnQoJ2V2LXN0b3JlJywgTVlfVkVSU0lPTik7XG5cbnZhciBoYXNoS2V5ID0gJ19fRVZfU1RPUkVfS0VZQCcgKyBNWV9WRVJTSU9OO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2U3RvcmU7XG5cbmZ1bmN0aW9uIEV2U3RvcmUoZWxlbSkge1xuICAgIHZhciBoYXNoID0gZWxlbVtoYXNoS2V5XTtcblxuICAgIGlmICghaGFzaCkge1xuICAgICAgICBoYXNoID0gZWxlbVtoYXNoS2V5XSA9IHt9O1xuICAgIH1cblxuICAgIHJldHVybiBoYXNoO1xufVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIHRvcExldmVsID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOlxuICAgIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDoge31cbnZhciBtaW5Eb2MgPSByZXF1aXJlKCdtaW4tZG9jdW1lbnQnKTtcblxuaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50O1xufSBlbHNlIHtcbiAgICB2YXIgZG9jY3kgPSB0b3BMZXZlbFsnX19HTE9CQUxfRE9DVU1FTlRfQ0FDSEVANCddO1xuXG4gICAgaWYgKCFkb2NjeSkge1xuICAgICAgICBkb2NjeSA9IHRvcExldmVsWydfX0dMT0JBTF9ET0NVTUVOVF9DQUNIRUA0J10gPSBtaW5Eb2M7XG4gICAgfVxuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkb2NjeTtcbn1cblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbTV2WkdWZmJXOWtkV3hsY3k5bmJHOWlZV3d2Wkc5amRXMWxiblF1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SjJZWElnZEc5d1RHVjJaV3dnUFNCMGVYQmxiMllnWjJ4dlltRnNJQ0U5UFNBbmRXNWtaV1pwYm1Wa0p5QS9JR2RzYjJKaGJDQTZYRzRnSUNBZ2RIbHdaVzltSUhkcGJtUnZkeUFoUFQwZ0ozVnVaR1ZtYVc1bFpDY2dQeUIzYVc1a2IzY2dPaUI3ZlZ4dWRtRnlJRzFwYmtSdll5QTlJSEpsY1hWcGNtVW9KMjFwYmkxa2IyTjFiV1Z1ZENjcE8xeHVYRzVwWmlBb2RIbHdaVzltSUdSdlkzVnRaVzUwSUNFOVBTQW5kVzVrWldacGJtVmtKeWtnZTF4dUlDQWdJRzF2WkhWc1pTNWxlSEJ2Y25SeklEMGdaRzlqZFcxbGJuUTdYRzU5SUdWc2MyVWdlMXh1SUNBZ0lIWmhjaUJrYjJOamVTQTlJSFJ2Y0V4bGRtVnNXeWRmWDBkTVQwSkJURjlFVDBOVlRVVk9WRjlEUVVOSVJVQTBKMTA3WEc1Y2JpQWdJQ0JwWmlBb0lXUnZZMk41S1NCN1hHNGdJQ0FnSUNBZ0lHUnZZMk41SUQwZ2RHOXdUR1YyWld4YkoxOWZSMHhQUWtGTVgwUlBRMVZOUlU1VVgwTkJRMGhGUURRblhTQTlJRzFwYmtSdll6dGNiaUFnSUNCOVhHNWNiaUFnSUNCdGIyUjFiR1V1Wlhod2IzSjBjeUE5SUdSdlkyTjVPMXh1ZlZ4dUlsMTkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbi8qZ2xvYmFsIHdpbmRvdywgZ2xvYmFsKi9cblxudmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/XG4gICAgd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgP1xuICAgIGdsb2JhbCA6IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEluZGl2aWR1YWw7XG5cbmZ1bmN0aW9uIEluZGl2aWR1YWwoa2V5LCB2YWx1ZSkge1xuICAgIGlmIChrZXkgaW4gcm9vdCkge1xuICAgICAgICByZXR1cm4gcm9vdFtrZXldO1xuICAgIH1cblxuICAgIHJvb3Rba2V5XSA9IHZhbHVlO1xuXG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltNXZaR1ZmYlc5a2RXeGxjeTlwYm1ScGRtbGtkV0ZzTDJsdVpHVjRMbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3UVVGQlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SW5kWE5sSUhOMGNtbGpkQ2M3WEc1Y2JpOHFaMnh2WW1Gc0lIZHBibVJ2ZHl3Z1oyeHZZbUZzS2k5Y2JseHVkbUZ5SUhKdmIzUWdQU0IwZVhCbGIyWWdkMmx1Wkc5M0lDRTlQU0FuZFc1a1pXWnBibVZrSnlBL1hHNGdJQ0FnZDJsdVpHOTNJRG9nZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnSjNWdVpHVm1hVzVsWkNjZ1AxeHVJQ0FnSUdkc2IySmhiQ0E2SUh0OU8xeHVYRzV0YjJSMWJHVXVaWGh3YjNKMGN5QTlJRWx1WkdsMmFXUjFZV3c3WEc1Y2JtWjFibU4wYVc5dUlFbHVaR2wyYVdSMVlXd29hMlY1TENCMllXeDFaU2tnZTF4dUlDQWdJR2xtSUNoclpYa2dhVzRnY205dmRDa2dlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbTl2ZEZ0clpYbGRPMXh1SUNBZ0lIMWNibHh1SUNBZ0lISnZiM1JiYTJWNVhTQTlJSFpoYkhWbE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUhaaGJIVmxPMXh1ZlZ4dUlsMTkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBJbmRpdmlkdWFsID0gcmVxdWlyZSgnLi9pbmRleC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE9uZVZlcnNpb247XG5cbmZ1bmN0aW9uIE9uZVZlcnNpb24obW9kdWxlTmFtZSwgdmVyc2lvbiwgZGVmYXVsdFZhbHVlKSB7XG4gICAgdmFyIGtleSA9ICdfX0lORElWSURVQUxfT05FX1ZFUlNJT05fJyArIG1vZHVsZU5hbWU7XG4gICAgdmFyIGVuZm9yY2VLZXkgPSBrZXkgKyAnX0VORk9SQ0VfU0lOR0xFVE9OJztcblxuICAgIHZhciB2ZXJzaW9uVmFsdWUgPSBJbmRpdmlkdWFsKGVuZm9yY2VLZXksIHZlcnNpb24pO1xuXG4gICAgaWYgKHZlcnNpb25WYWx1ZSAhPT0gdmVyc2lvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBvbmx5IGhhdmUgb25lIGNvcHkgb2YgJyArXG4gICAgICAgICAgICBtb2R1bGVOYW1lICsgJy5cXG4nICtcbiAgICAgICAgICAgICdZb3UgYWxyZWFkeSBoYXZlIHZlcnNpb24gJyArIHZlcnNpb25WYWx1ZSArXG4gICAgICAgICAgICAnIGluc3RhbGxlZC5cXG4nICtcbiAgICAgICAgICAgICdUaGlzIG1lYW5zIHlvdSBjYW5ub3QgaW5zdGFsbCB2ZXJzaW9uICcgKyB2ZXJzaW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gSW5kaXZpZHVhbChrZXksIGRlZmF1bHRWYWx1ZSk7XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc09iamVjdCh4KSB7XG5cdHJldHVybiB0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiAmJiB4ICE9PSBudWxsO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnY3NzaWZ5Jyk7IiwidmFyIGNyZWF0ZUVsZW1lbnQgPSByZXF1aXJlKFwiLi92ZG9tL2NyZWF0ZS1lbGVtZW50LmpzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlRWxlbWVudFxuIiwidmFyIGRpZmYgPSByZXF1aXJlKFwiLi92dHJlZS9kaWZmLmpzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gZGlmZlxuIiwidmFyIGggPSByZXF1aXJlKFwiLi92aXJ0dWFsLWh5cGVyc2NyaXB0L2luZGV4LmpzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gaFxuIiwidmFyIHBhdGNoID0gcmVxdWlyZShcIi4vdmRvbS9wYXRjaC5qc1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGNoXG4iLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKFwiaXMtb2JqZWN0XCIpXG52YXIgaXNIb29rID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZob29rLmpzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gYXBwbHlQcm9wZXJ0aWVzXG5cbmZ1bmN0aW9uIGFwcGx5UHJvcGVydGllcyhub2RlLCBwcm9wcywgcHJldmlvdXMpIHtcbiAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wcykge1xuICAgICAgICB2YXIgcHJvcFZhbHVlID0gcHJvcHNbcHJvcE5hbWVdXG5cbiAgICAgICAgaWYgKHByb3BWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZW1vdmVQcm9wZXJ0eShub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlLCBwcmV2aW91cyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNIb29rKHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJlbW92ZVByb3BlcnR5KG5vZGUsIHByb3BOYW1lLCBwcm9wVmFsdWUsIHByZXZpb3VzKVxuICAgICAgICAgICAgaWYgKHByb3BWYWx1ZS5ob29rKSB7XG4gICAgICAgICAgICAgICAgcHJvcFZhbHVlLmhvb2sobm9kZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvcE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzID8gcHJldmlvdXNbcHJvcE5hbWVdIDogdW5kZWZpbmVkKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBwYXRjaE9iamVjdChub2RlLCBwcm9wcywgcHJldmlvdXMsIHByb3BOYW1lLCBwcm9wVmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9IHByb3BWYWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVQcm9wZXJ0eShub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlLCBwcmV2aW91cykge1xuICAgIGlmIChwcmV2aW91cykge1xuICAgICAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IHByZXZpb3VzW3Byb3BOYW1lXVxuXG4gICAgICAgIGlmICghaXNIb29rKHByZXZpb3VzVmFsdWUpKSB7XG4gICAgICAgICAgICBpZiAocHJvcE5hbWUgPT09IFwiYXR0cmlidXRlc1wiKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYXR0ck5hbWUgaW4gcHJldmlvdXNWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BOYW1lID09PSBcInN0eWxlXCIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHByZXZpb3VzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zdHlsZVtpXSA9IFwiXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcmV2aW91c1ZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSBcIlwiXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0gbnVsbFxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHByZXZpb3VzVmFsdWUudW5ob29rKSB7XG4gICAgICAgICAgICBwcmV2aW91c1ZhbHVlLnVuaG9vayhub2RlLCBwcm9wTmFtZSwgcHJvcFZhbHVlKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYXRjaE9iamVjdChub2RlLCBwcm9wcywgcHJldmlvdXMsIHByb3BOYW1lLCBwcm9wVmFsdWUpIHtcbiAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IHByZXZpb3VzID8gcHJldmlvdXNbcHJvcE5hbWVdIDogdW5kZWZpbmVkXG5cbiAgICAvLyBTZXQgYXR0cmlidXRlc1xuICAgIGlmIChwcm9wTmFtZSA9PT0gXCJhdHRyaWJ1dGVzXCIpIHtcbiAgICAgICAgZm9yICh2YXIgYXR0ck5hbWUgaW4gcHJvcFZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgYXR0clZhbHVlID0gcHJvcFZhbHVlW2F0dHJOYW1lXVxuXG4gICAgICAgICAgICBpZiAoYXR0clZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJWYWx1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmKHByZXZpb3VzVmFsdWUgJiYgaXNPYmplY3QocHJldmlvdXNWYWx1ZSkgJiZcbiAgICAgICAgZ2V0UHJvdG90eXBlKHByZXZpb3VzVmFsdWUpICE9PSBnZXRQcm90b3R5cGUocHJvcFZhbHVlKSkge1xuICAgICAgICBub2RlW3Byb3BOYW1lXSA9IHByb3BWYWx1ZVxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoIWlzT2JqZWN0KG5vZGVbcHJvcE5hbWVdKSkge1xuICAgICAgICBub2RlW3Byb3BOYW1lXSA9IHt9XG4gICAgfVxuXG4gICAgdmFyIHJlcGxhY2VyID0gcHJvcE5hbWUgPT09IFwic3R5bGVcIiA/IFwiXCIgOiB1bmRlZmluZWRcblxuICAgIGZvciAodmFyIGsgaW4gcHJvcFZhbHVlKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHByb3BWYWx1ZVtrXVxuICAgICAgICBub2RlW3Byb3BOYW1lXVtrXSA9ICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSA/IHJlcGxhY2VyIDogdmFsdWVcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFByb3RvdHlwZSh2YWx1ZSkge1xuICAgIGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSlcbiAgICB9IGVsc2UgaWYgKHZhbHVlLl9fcHJvdG9fXykge1xuICAgICAgICByZXR1cm4gdmFsdWUuX19wcm90b19fXG4gICAgfSBlbHNlIGlmICh2YWx1ZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICByZXR1cm4gdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlXG4gICAgfVxufVxuIiwidmFyIGRvY3VtZW50ID0gcmVxdWlyZShcImdsb2JhbC9kb2N1bWVudFwiKVxuXG52YXIgYXBwbHlQcm9wZXJ0aWVzID0gcmVxdWlyZShcIi4vYXBwbHktcHJvcGVydGllc1wiKVxuXG52YXIgaXNWTm9kZSA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12bm9kZS5qc1wiKVxudmFyIGlzVlRleHQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdnRleHQuanNcIilcbnZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIilcbnZhciBoYW5kbGVUaHVuayA9IHJlcXVpcmUoXCIuLi92bm9kZS9oYW5kbGUtdGh1bmsuanNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVFbGVtZW50XG5cbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodm5vZGUsIG9wdHMpIHtcbiAgICB2YXIgZG9jID0gb3B0cyA/IG9wdHMuZG9jdW1lbnQgfHwgZG9jdW1lbnQgOiBkb2N1bWVudFxuICAgIHZhciB3YXJuID0gb3B0cyA/IG9wdHMud2FybiA6IG51bGxcblxuICAgIHZub2RlID0gaGFuZGxlVGh1bmsodm5vZGUpLmFcblxuICAgIGlmIChpc1dpZGdldCh2bm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHZub2RlLmluaXQoKVxuICAgIH0gZWxzZSBpZiAoaXNWVGV4dCh2bm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIGRvYy5jcmVhdGVUZXh0Tm9kZSh2bm9kZS50ZXh0KVxuICAgIH0gZWxzZSBpZiAoIWlzVk5vZGUodm5vZGUpKSB7XG4gICAgICAgIGlmICh3YXJuKSB7XG4gICAgICAgICAgICB3YXJuKFwiSXRlbSBpcyBub3QgYSB2YWxpZCB2aXJ0dWFsIGRvbSBub2RlXCIsIHZub2RlKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgdmFyIG5vZGUgPSAodm5vZGUubmFtZXNwYWNlID09PSBudWxsKSA/XG4gICAgICAgIGRvYy5jcmVhdGVFbGVtZW50KHZub2RlLnRhZ05hbWUpIDpcbiAgICAgICAgZG9jLmNyZWF0ZUVsZW1lbnROUyh2bm9kZS5uYW1lc3BhY2UsIHZub2RlLnRhZ05hbWUpXG5cbiAgICB2YXIgcHJvcHMgPSB2bm9kZS5wcm9wZXJ0aWVzXG4gICAgYXBwbHlQcm9wZXJ0aWVzKG5vZGUsIHByb3BzKVxuXG4gICAgdmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW5cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkTm9kZSA9IGNyZWF0ZUVsZW1lbnQoY2hpbGRyZW5baV0sIG9wdHMpXG4gICAgICAgIGlmIChjaGlsZE5vZGUpIHtcbiAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoY2hpbGROb2RlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGVcbn1cbiIsIi8vIE1hcHMgYSB2aXJ0dWFsIERPTSB0cmVlIG9udG8gYSByZWFsIERPTSB0cmVlIGluIGFuIGVmZmljaWVudCBtYW5uZXIuXG4vLyBXZSBkb24ndCB3YW50IHRvIHJlYWQgYWxsIG9mIHRoZSBET00gbm9kZXMgaW4gdGhlIHRyZWUgc28gd2UgdXNlXG4vLyB0aGUgaW4tb3JkZXIgdHJlZSBpbmRleGluZyB0byBlbGltaW5hdGUgcmVjdXJzaW9uIGRvd24gY2VydGFpbiBicmFuY2hlcy5cbi8vIFdlIG9ubHkgcmVjdXJzZSBpbnRvIGEgRE9NIG5vZGUgaWYgd2Uga25vdyB0aGF0IGl0IGNvbnRhaW5zIGEgY2hpbGQgb2Zcbi8vIGludGVyZXN0LlxuXG52YXIgbm9DaGlsZCA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gZG9tSW5kZXhcblxuZnVuY3Rpb24gZG9tSW5kZXgocm9vdE5vZGUsIHRyZWUsIGluZGljZXMsIG5vZGVzKSB7XG4gICAgaWYgKCFpbmRpY2VzIHx8IGluZGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB7fVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGljZXMuc29ydChhc2NlbmRpbmcpXG4gICAgICAgIHJldHVybiByZWN1cnNlKHJvb3ROb2RlLCB0cmVlLCBpbmRpY2VzLCBub2RlcywgMClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlY3Vyc2Uocm9vdE5vZGUsIHRyZWUsIGluZGljZXMsIG5vZGVzLCByb290SW5kZXgpIHtcbiAgICBub2RlcyA9IG5vZGVzIHx8IHt9XG5cblxuICAgIGlmIChyb290Tm9kZSkge1xuICAgICAgICBpZiAoaW5kZXhJblJhbmdlKGluZGljZXMsIHJvb3RJbmRleCwgcm9vdEluZGV4KSkge1xuICAgICAgICAgICAgbm9kZXNbcm9vdEluZGV4XSA9IHJvb3ROb2RlXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdkNoaWxkcmVuID0gdHJlZS5jaGlsZHJlblxuXG4gICAgICAgIGlmICh2Q2hpbGRyZW4pIHtcblxuICAgICAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSByb290Tm9kZS5jaGlsZE5vZGVzXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJlZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHJvb3RJbmRleCArPSAxXG5cbiAgICAgICAgICAgICAgICB2YXIgdkNoaWxkID0gdkNoaWxkcmVuW2ldIHx8IG5vQ2hpbGRcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEluZGV4ID0gcm9vdEluZGV4ICsgKHZDaGlsZC5jb3VudCB8fCAwKVxuXG4gICAgICAgICAgICAgICAgLy8gc2tpcCByZWN1cnNpb24gZG93biB0aGUgdHJlZSBpZiB0aGVyZSBhcmUgbm8gbm9kZXMgZG93biBoZXJlXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4SW5SYW5nZShpbmRpY2VzLCByb290SW5kZXgsIG5leHRJbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzZShjaGlsZE5vZGVzW2ldLCB2Q2hpbGQsIGluZGljZXMsIG5vZGVzLCByb290SW5kZXgpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcm9vdEluZGV4ID0gbmV4dEluZGV4XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZXNcbn1cblxuLy8gQmluYXJ5IHNlYXJjaCBmb3IgYW4gaW5kZXggaW4gdGhlIGludGVydmFsIFtsZWZ0LCByaWdodF1cbmZ1bmN0aW9uIGluZGV4SW5SYW5nZShpbmRpY2VzLCBsZWZ0LCByaWdodCkge1xuICAgIGlmIChpbmRpY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB2YXIgbWluSW5kZXggPSAwXG4gICAgdmFyIG1heEluZGV4ID0gaW5kaWNlcy5sZW5ndGggLSAxXG4gICAgdmFyIGN1cnJlbnRJbmRleFxuICAgIHZhciBjdXJyZW50SXRlbVxuXG4gICAgd2hpbGUgKG1pbkluZGV4IDw9IG1heEluZGV4KSB7XG4gICAgICAgIGN1cnJlbnRJbmRleCA9ICgobWF4SW5kZXggKyBtaW5JbmRleCkgLyAyKSA+PiAwXG4gICAgICAgIGN1cnJlbnRJdGVtID0gaW5kaWNlc1tjdXJyZW50SW5kZXhdXG5cbiAgICAgICAgaWYgKG1pbkluZGV4ID09PSBtYXhJbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRJdGVtID49IGxlZnQgJiYgY3VycmVudEl0ZW0gPD0gcmlnaHRcbiAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SXRlbSA8IGxlZnQpIHtcbiAgICAgICAgICAgIG1pbkluZGV4ID0gY3VycmVudEluZGV4ICsgMVxuICAgICAgICB9IGVsc2UgIGlmIChjdXJyZW50SXRlbSA+IHJpZ2h0KSB7XG4gICAgICAgICAgICBtYXhJbmRleCA9IGN1cnJlbnRJbmRleCAtIDFcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFzY2VuZGluZyhhLCBiKSB7XG4gICAgcmV0dXJuIGEgPiBiID8gMSA6IC0xXG59XG4iLCJ2YXIgYXBwbHlQcm9wZXJ0aWVzID0gcmVxdWlyZShcIi4vYXBwbHktcHJvcGVydGllc1wiKVxuXG52YXIgaXNXaWRnZXQgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtd2lkZ2V0LmpzXCIpXG52YXIgVlBhdGNoID0gcmVxdWlyZShcIi4uL3Zub2RlL3ZwYXRjaC5qc1wiKVxuXG52YXIgdXBkYXRlV2lkZ2V0ID0gcmVxdWlyZShcIi4vdXBkYXRlLXdpZGdldFwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFwcGx5UGF0Y2hcblxuZnVuY3Rpb24gYXBwbHlQYXRjaCh2cGF0Y2gsIGRvbU5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgdHlwZSA9IHZwYXRjaC50eXBlXG4gICAgdmFyIHZOb2RlID0gdnBhdGNoLnZOb2RlXG4gICAgdmFyIHBhdGNoID0gdnBhdGNoLnBhdGNoXG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBWUGF0Y2guUkVNT1ZFOlxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZU5vZGUoZG9tTm9kZSwgdk5vZGUpXG4gICAgICAgIGNhc2UgVlBhdGNoLklOU0VSVDpcbiAgICAgICAgICAgIHJldHVybiBpbnNlcnROb2RlKGRvbU5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKVxuICAgICAgICBjYXNlIFZQYXRjaC5WVEVYVDpcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmdQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgIGNhc2UgVlBhdGNoLldJREdFVDpcbiAgICAgICAgICAgIHJldHVybiB3aWRnZXRQYXRjaChkb21Ob2RlLCB2Tm9kZSwgcGF0Y2gsIHJlbmRlck9wdGlvbnMpXG4gICAgICAgIGNhc2UgVlBhdGNoLlZOT0RFOlxuICAgICAgICAgICAgcmV0dXJuIHZOb2RlUGF0Y2goZG9tTm9kZSwgdk5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKVxuICAgICAgICBjYXNlIFZQYXRjaC5PUkRFUjpcbiAgICAgICAgICAgIHJlb3JkZXJDaGlsZHJlbihkb21Ob2RlLCBwYXRjaClcbiAgICAgICAgICAgIHJldHVybiBkb21Ob2RlXG4gICAgICAgIGNhc2UgVlBhdGNoLlBST1BTOlxuICAgICAgICAgICAgYXBwbHlQcm9wZXJ0aWVzKGRvbU5vZGUsIHBhdGNoLCB2Tm9kZS5wcm9wZXJ0aWVzKVxuICAgICAgICAgICAgcmV0dXJuIGRvbU5vZGVcbiAgICAgICAgY2FzZSBWUGF0Y2guVEhVTks6XG4gICAgICAgICAgICByZXR1cm4gcmVwbGFjZVJvb3QoZG9tTm9kZSxcbiAgICAgICAgICAgICAgICByZW5kZXJPcHRpb25zLnBhdGNoKGRvbU5vZGUsIHBhdGNoLCByZW5kZXJPcHRpb25zKSlcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBkb21Ob2RlXG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVOb2RlKGRvbU5vZGUsIHZOb2RlKSB7XG4gICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGVcblxuICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZG9tTm9kZSlcbiAgICB9XG5cbiAgICBkZXN0cm95V2lkZ2V0KGRvbU5vZGUsIHZOb2RlKTtcblxuICAgIHJldHVybiBudWxsXG59XG5cbmZ1bmN0aW9uIGluc2VydE5vZGUocGFyZW50Tm9kZSwgdk5vZGUsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHZOb2RlLCByZW5kZXJPcHRpb25zKVxuXG4gICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgcGFyZW50Tm9kZS5hcHBlbmRDaGlsZChuZXdOb2RlKVxuICAgIH1cblxuICAgIHJldHVybiBwYXJlbnROb2RlXG59XG5cbmZ1bmN0aW9uIHN0cmluZ1BhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgdlRleHQsIHJlbmRlck9wdGlvbnMpIHtcbiAgICB2YXIgbmV3Tm9kZVxuXG4gICAgaWYgKGRvbU5vZGUubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgZG9tTm9kZS5yZXBsYWNlRGF0YSgwLCBkb21Ob2RlLmxlbmd0aCwgdlRleHQudGV4dClcbiAgICAgICAgbmV3Tm9kZSA9IGRvbU5vZGVcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZVxuICAgICAgICBuZXdOb2RlID0gcmVuZGVyT3B0aW9ucy5yZW5kZXIodlRleHQsIHJlbmRlck9wdGlvbnMpXG5cbiAgICAgICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgZG9tTm9kZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXdOb2RlXG59XG5cbmZ1bmN0aW9uIHdpZGdldFBhdGNoKGRvbU5vZGUsIGxlZnRWTm9kZSwgd2lkZ2V0LCByZW5kZXJPcHRpb25zKSB7XG4gICAgdmFyIHVwZGF0aW5nID0gdXBkYXRlV2lkZ2V0KGxlZnRWTm9kZSwgd2lkZ2V0KVxuICAgIHZhciBuZXdOb2RlXG5cbiAgICBpZiAodXBkYXRpbmcpIHtcbiAgICAgICAgbmV3Tm9kZSA9IHdpZGdldC51cGRhdGUobGVmdFZOb2RlLCBkb21Ob2RlKSB8fCBkb21Ob2RlXG4gICAgfSBlbHNlIHtcbiAgICAgICAgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHdpZGdldCwgcmVuZGVyT3B0aW9ucylcbiAgICB9XG5cbiAgICB2YXIgcGFyZW50Tm9kZSA9IGRvbU5vZGUucGFyZW50Tm9kZVxuXG4gICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBkb21Ob2RlKVxuICAgIH1cblxuICAgIGlmICghdXBkYXRpbmcpIHtcbiAgICAgICAgZGVzdHJveVdpZGdldChkb21Ob2RlLCBsZWZ0Vk5vZGUpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld05vZGVcbn1cblxuZnVuY3Rpb24gdk5vZGVQYXRjaChkb21Ob2RlLCBsZWZ0Vk5vZGUsIHZOb2RlLCByZW5kZXJPcHRpb25zKSB7XG4gICAgdmFyIHBhcmVudE5vZGUgPSBkb21Ob2RlLnBhcmVudE5vZGVcbiAgICB2YXIgbmV3Tm9kZSA9IHJlbmRlck9wdGlvbnMucmVuZGVyKHZOb2RlLCByZW5kZXJPcHRpb25zKVxuXG4gICAgaWYgKHBhcmVudE5vZGUgJiYgbmV3Tm9kZSAhPT0gZG9tTm9kZSkge1xuICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdOb2RlLCBkb21Ob2RlKVxuICAgIH1cblxuICAgIHJldHVybiBuZXdOb2RlXG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lXaWRnZXQoZG9tTm9kZSwgdykge1xuICAgIGlmICh0eXBlb2Ygdy5kZXN0cm95ID09PSBcImZ1bmN0aW9uXCIgJiYgaXNXaWRnZXQodykpIHtcbiAgICAgICAgdy5kZXN0cm95KGRvbU5vZGUpXG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW9yZGVyQ2hpbGRyZW4oZG9tTm9kZSwgbW92ZXMpIHtcbiAgICB2YXIgY2hpbGROb2RlcyA9IGRvbU5vZGUuY2hpbGROb2Rlc1xuICAgIHZhciBrZXlNYXAgPSB7fVxuICAgIHZhciBub2RlXG4gICAgdmFyIHJlbW92ZVxuICAgIHZhciBpbnNlcnRcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW92ZXMucmVtb3Zlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZW1vdmUgPSBtb3Zlcy5yZW1vdmVzW2ldXG4gICAgICAgIG5vZGUgPSBjaGlsZE5vZGVzW3JlbW92ZS5mcm9tXVxuICAgICAgICBpZiAocmVtb3ZlLmtleSkge1xuICAgICAgICAgICAga2V5TWFwW3JlbW92ZS5rZXldID0gbm9kZVxuICAgICAgICB9XG4gICAgICAgIGRvbU5vZGUucmVtb3ZlQ2hpbGQobm9kZSlcbiAgICB9XG5cbiAgICB2YXIgbGVuZ3RoID0gY2hpbGROb2Rlcy5sZW5ndGhcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1vdmVzLmluc2VydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaW5zZXJ0ID0gbW92ZXMuaW5zZXJ0c1tqXVxuICAgICAgICBub2RlID0ga2V5TWFwW2luc2VydC5rZXldXG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIHdlaXJkZXN0IGJ1ZyBpJ3ZlIGV2ZXIgc2VlbiBpbiB3ZWJraXRcbiAgICAgICAgZG9tTm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgaW5zZXJ0LnRvID49IGxlbmd0aCsrID8gbnVsbCA6IGNoaWxkTm9kZXNbaW5zZXJ0LnRvXSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VSb290KG9sZFJvb3QsIG5ld1Jvb3QpIHtcbiAgICBpZiAob2xkUm9vdCAmJiBuZXdSb290ICYmIG9sZFJvb3QgIT09IG5ld1Jvb3QgJiYgb2xkUm9vdC5wYXJlbnROb2RlKSB7XG4gICAgICAgIG9sZFJvb3QucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Um9vdCwgb2xkUm9vdClcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Um9vdDtcbn1cbiIsInZhciBkb2N1bWVudCA9IHJlcXVpcmUoXCJnbG9iYWwvZG9jdW1lbnRcIilcbnZhciBpc0FycmF5ID0gcmVxdWlyZShcIngtaXMtYXJyYXlcIilcblxudmFyIHJlbmRlciA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1lbGVtZW50XCIpXG52YXIgZG9tSW5kZXggPSByZXF1aXJlKFwiLi9kb20taW5kZXhcIilcbnZhciBwYXRjaE9wID0gcmVxdWlyZShcIi4vcGF0Y2gtb3BcIilcbm1vZHVsZS5leHBvcnRzID0gcGF0Y2hcblxuZnVuY3Rpb24gcGF0Y2gocm9vdE5vZGUsIHBhdGNoZXMsIHJlbmRlck9wdGlvbnMpIHtcbiAgICByZW5kZXJPcHRpb25zID0gcmVuZGVyT3B0aW9ucyB8fCB7fVxuICAgIHJlbmRlck9wdGlvbnMucGF0Y2ggPSByZW5kZXJPcHRpb25zLnBhdGNoICYmIHJlbmRlck9wdGlvbnMucGF0Y2ggIT09IHBhdGNoXG4gICAgICAgID8gcmVuZGVyT3B0aW9ucy5wYXRjaFxuICAgICAgICA6IHBhdGNoUmVjdXJzaXZlXG4gICAgcmVuZGVyT3B0aW9ucy5yZW5kZXIgPSByZW5kZXJPcHRpb25zLnJlbmRlciB8fCByZW5kZXJcblxuICAgIHJldHVybiByZW5kZXJPcHRpb25zLnBhdGNoKHJvb3ROb2RlLCBwYXRjaGVzLCByZW5kZXJPcHRpb25zKVxufVxuXG5mdW5jdGlvbiBwYXRjaFJlY3Vyc2l2ZShyb290Tm9kZSwgcGF0Y2hlcywgcmVuZGVyT3B0aW9ucykge1xuICAgIHZhciBpbmRpY2VzID0gcGF0Y2hJbmRpY2VzKHBhdGNoZXMpXG5cbiAgICBpZiAoaW5kaWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHJvb3ROb2RlXG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gZG9tSW5kZXgocm9vdE5vZGUsIHBhdGNoZXMuYSwgaW5kaWNlcylcbiAgICB2YXIgb3duZXJEb2N1bWVudCA9IHJvb3ROb2RlLm93bmVyRG9jdW1lbnRcblxuICAgIGlmICghcmVuZGVyT3B0aW9ucy5kb2N1bWVudCAmJiBvd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgICAgICByZW5kZXJPcHRpb25zLmRvY3VtZW50ID0gb3duZXJEb2N1bWVudFxuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm9kZUluZGV4ID0gaW5kaWNlc1tpXVxuICAgICAgICByb290Tm9kZSA9IGFwcGx5UGF0Y2gocm9vdE5vZGUsXG4gICAgICAgICAgICBpbmRleFtub2RlSW5kZXhdLFxuICAgICAgICAgICAgcGF0Y2hlc1tub2RlSW5kZXhdLFxuICAgICAgICAgICAgcmVuZGVyT3B0aW9ucylcbiAgICB9XG5cbiAgICByZXR1cm4gcm9vdE5vZGVcbn1cblxuZnVuY3Rpb24gYXBwbHlQYXRjaChyb290Tm9kZSwgZG9tTm9kZSwgcGF0Y2hMaXN0LCByZW5kZXJPcHRpb25zKSB7XG4gICAgaWYgKCFkb21Ob2RlKSB7XG4gICAgICAgIHJldHVybiByb290Tm9kZVxuICAgIH1cblxuICAgIHZhciBuZXdOb2RlXG5cbiAgICBpZiAoaXNBcnJheShwYXRjaExpc3QpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0Y2hMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuZXdOb2RlID0gcGF0Y2hPcChwYXRjaExpc3RbaV0sIGRvbU5vZGUsIHJlbmRlck9wdGlvbnMpXG5cbiAgICAgICAgICAgIGlmIChkb21Ob2RlID09PSByb290Tm9kZSkge1xuICAgICAgICAgICAgICAgIHJvb3ROb2RlID0gbmV3Tm9kZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbmV3Tm9kZSA9IHBhdGNoT3AocGF0Y2hMaXN0LCBkb21Ob2RlLCByZW5kZXJPcHRpb25zKVxuXG4gICAgICAgIGlmIChkb21Ob2RlID09PSByb290Tm9kZSkge1xuICAgICAgICAgICAgcm9vdE5vZGUgPSBuZXdOb2RlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcm9vdE5vZGVcbn1cblxuZnVuY3Rpb24gcGF0Y2hJbmRpY2VzKHBhdGNoZXMpIHtcbiAgICB2YXIgaW5kaWNlcyA9IFtdXG5cbiAgICBmb3IgKHZhciBrZXkgaW4gcGF0Y2hlcykge1xuICAgICAgICBpZiAoa2V5ICE9PSBcImFcIikge1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKE51bWJlcihrZXkpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGljZXNcbn1cbiIsInZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy13aWRnZXQuanNcIilcblxubW9kdWxlLmV4cG9ydHMgPSB1cGRhdGVXaWRnZXRcblxuZnVuY3Rpb24gdXBkYXRlV2lkZ2V0KGEsIGIpIHtcbiAgICBpZiAoaXNXaWRnZXQoYSkgJiYgaXNXaWRnZXQoYikpIHtcbiAgICAgICAgaWYgKFwibmFtZVwiIGluIGEgJiYgXCJuYW1lXCIgaW4gYikge1xuICAgICAgICAgICAgcmV0dXJuIGEuaWQgPT09IGIuaWRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBhLmluaXQgPT09IGIuaW5pdFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBFdlN0b3JlID0gcmVxdWlyZSgnZXYtc3RvcmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdkhvb2s7XG5cbmZ1bmN0aW9uIEV2SG9vayh2YWx1ZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBFdkhvb2spKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXZIb29rKHZhbHVlKTtcbiAgICB9XG5cbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG59XG5cbkV2SG9vay5wcm90b3R5cGUuaG9vayA9IGZ1bmN0aW9uIChub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICB2YXIgZXMgPSBFdlN0b3JlKG5vZGUpO1xuICAgIHZhciBwcm9wTmFtZSA9IHByb3BlcnR5TmFtZS5zdWJzdHIoMyk7XG5cbiAgICBlc1twcm9wTmFtZV0gPSB0aGlzLnZhbHVlO1xufTtcblxuRXZIb29rLnByb3RvdHlwZS51bmhvb2sgPSBmdW5jdGlvbihub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICB2YXIgZXMgPSBFdlN0b3JlKG5vZGUpO1xuICAgIHZhciBwcm9wTmFtZSA9IHByb3BlcnR5TmFtZS5zdWJzdHIoMyk7XG5cbiAgICBlc1twcm9wTmFtZV0gPSB1bmRlZmluZWQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNvZnRTZXRIb29rO1xuXG5mdW5jdGlvbiBTb2Z0U2V0SG9vayh2YWx1ZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTb2Z0U2V0SG9vaykpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTb2Z0U2V0SG9vayh2YWx1ZSk7XG4gICAgfVxuXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufVxuXG5Tb2Z0U2V0SG9vay5wcm90b3R5cGUuaG9vayA9IGZ1bmN0aW9uIChub2RlLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICBpZiAobm9kZVtwcm9wZXJ0eU5hbWVdICE9PSB0aGlzLnZhbHVlKSB7XG4gICAgICAgIG5vZGVbcHJvcGVydHlOYW1lXSA9IHRoaXMudmFsdWU7XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCd4LWlzLWFycmF5Jyk7XG5cbnZhciBWTm9kZSA9IHJlcXVpcmUoJy4uL3Zub2RlL3Zub2RlLmpzJyk7XG52YXIgVlRleHQgPSByZXF1aXJlKCcuLi92bm9kZS92dGV4dC5qcycpO1xudmFyIGlzVk5vZGUgPSByZXF1aXJlKCcuLi92bm9kZS9pcy12bm9kZScpO1xudmFyIGlzVlRleHQgPSByZXF1aXJlKCcuLi92bm9kZS9pcy12dGV4dCcpO1xudmFyIGlzV2lkZ2V0ID0gcmVxdWlyZSgnLi4vdm5vZGUvaXMtd2lkZ2V0Jyk7XG52YXIgaXNIb29rID0gcmVxdWlyZSgnLi4vdm5vZGUvaXMtdmhvb2snKTtcbnZhciBpc1ZUaHVuayA9IHJlcXVpcmUoJy4uL3Zub2RlL2lzLXRodW5rJyk7XG5cbnZhciBwYXJzZVRhZyA9IHJlcXVpcmUoJy4vcGFyc2UtdGFnLmpzJyk7XG52YXIgc29mdFNldEhvb2sgPSByZXF1aXJlKCcuL2hvb2tzL3NvZnQtc2V0LWhvb2suanMnKTtcbnZhciBldkhvb2sgPSByZXF1aXJlKCcuL2hvb2tzL2V2LWhvb2suanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBoO1xuXG5mdW5jdGlvbiBoKHRhZ05hbWUsIHByb3BlcnRpZXMsIGNoaWxkcmVuKSB7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSBbXTtcbiAgICB2YXIgdGFnLCBwcm9wcywga2V5LCBuYW1lc3BhY2U7XG5cbiAgICBpZiAoIWNoaWxkcmVuICYmIGlzQ2hpbGRyZW4ocHJvcGVydGllcykpIHtcbiAgICAgICAgY2hpbGRyZW4gPSBwcm9wZXJ0aWVzO1xuICAgICAgICBwcm9wcyA9IHt9O1xuICAgIH1cblxuICAgIHByb3BzID0gcHJvcHMgfHwgcHJvcGVydGllcyB8fCB7fTtcbiAgICB0YWcgPSBwYXJzZVRhZyh0YWdOYW1lLCBwcm9wcyk7XG5cbiAgICAvLyBzdXBwb3J0IGtleXNcbiAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkoJ2tleScpKSB7XG4gICAgICAgIGtleSA9IHByb3BzLmtleTtcbiAgICAgICAgcHJvcHMua2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIHN1cHBvcnQgbmFtZXNwYWNlXG4gICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KCduYW1lc3BhY2UnKSkge1xuICAgICAgICBuYW1lc3BhY2UgPSBwcm9wcy5uYW1lc3BhY2U7XG4gICAgICAgIHByb3BzLm5hbWVzcGFjZSA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBmaXggY3Vyc29yIGJ1Z1xuICAgIGlmICh0YWcgPT09ICdJTlBVVCcgJiZcbiAgICAgICAgIW5hbWVzcGFjZSAmJlxuICAgICAgICBwcm9wcy5oYXNPd25Qcm9wZXJ0eSgndmFsdWUnKSAmJlxuICAgICAgICBwcm9wcy52YWx1ZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICFpc0hvb2socHJvcHMudmFsdWUpXG4gICAgKSB7XG4gICAgICAgIHByb3BzLnZhbHVlID0gc29mdFNldEhvb2socHJvcHMudmFsdWUpO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybVByb3BlcnRpZXMocHJvcHMpO1xuXG4gICAgaWYgKGNoaWxkcmVuICE9PSB1bmRlZmluZWQgJiYgY2hpbGRyZW4gIT09IG51bGwpIHtcbiAgICAgICAgYWRkQ2hpbGQoY2hpbGRyZW4sIGNoaWxkTm9kZXMsIHRhZywgcHJvcHMpO1xuICAgIH1cblxuXG4gICAgcmV0dXJuIG5ldyBWTm9kZSh0YWcsIHByb3BzLCBjaGlsZE5vZGVzLCBrZXksIG5hbWVzcGFjZSk7XG59XG5cbmZ1bmN0aW9uIGFkZENoaWxkKGMsIGNoaWxkTm9kZXMsIHRhZywgcHJvcHMpIHtcbiAgICBpZiAodHlwZW9mIGMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNoaWxkTm9kZXMucHVzaChuZXcgVlRleHQoYykpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGMgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGNoaWxkTm9kZXMucHVzaChuZXcgVlRleHQoU3RyaW5nKGMpKSk7XG4gICAgfSBlbHNlIGlmIChpc0NoaWxkKGMpKSB7XG4gICAgICAgIGNoaWxkTm9kZXMucHVzaChjKTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoYykpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhZGRDaGlsZChjW2ldLCBjaGlsZE5vZGVzLCB0YWcsIHByb3BzKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYyA9PT0gbnVsbCB8fCBjID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFVuZXhwZWN0ZWRWaXJ0dWFsRWxlbWVudCh7XG4gICAgICAgICAgICBmb3JlaWduT2JqZWN0OiBjLFxuICAgICAgICAgICAgcGFyZW50Vm5vZGU6IHtcbiAgICAgICAgICAgICAgICB0YWdOYW1lOiB0YWcsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogcHJvcHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFuc2Zvcm1Qcm9wZXJ0aWVzKHByb3BzKSB7XG4gICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gcHJvcHMpIHtcbiAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuXG4gICAgICAgICAgICBpZiAoaXNIb29rKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocHJvcE5hbWUuc3Vic3RyKDAsIDMpID09PSAnZXYtJykge1xuICAgICAgICAgICAgICAgIC8vIGFkZCBldi1mb28gc3VwcG9ydFxuICAgICAgICAgICAgICAgIHByb3BzW3Byb3BOYW1lXSA9IGV2SG9vayh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzQ2hpbGQoeCkge1xuICAgIHJldHVybiBpc1ZOb2RlKHgpIHx8IGlzVlRleHQoeCkgfHwgaXNXaWRnZXQoeCkgfHwgaXNWVGh1bmsoeCk7XG59XG5cbmZ1bmN0aW9uIGlzQ2hpbGRyZW4oeCkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ3N0cmluZycgfHwgaXNBcnJheSh4KSB8fCBpc0NoaWxkKHgpO1xufVxuXG5mdW5jdGlvbiBVbmV4cGVjdGVkVmlydHVhbEVsZW1lbnQoZGF0YSkge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcblxuICAgIGVyci50eXBlID0gJ3ZpcnR1YWwtaHlwZXJzY3JpcHQudW5leHBlY3RlZC52aXJ0dWFsLWVsZW1lbnQnO1xuICAgIGVyci5tZXNzYWdlID0gJ1VuZXhwZWN0ZWQgdmlydHVhbCBjaGlsZCBwYXNzZWQgdG8gaCgpLlxcbicgK1xuICAgICAgICAnRXhwZWN0ZWQgYSBWTm9kZSAvIFZ0aHVuayAvIFZXaWRnZXQgLyBzdHJpbmcgYnV0OlxcbicgK1xuICAgICAgICAnZ290OlxcbicgK1xuICAgICAgICBlcnJvclN0cmluZyhkYXRhLmZvcmVpZ25PYmplY3QpICtcbiAgICAgICAgJy5cXG4nICtcbiAgICAgICAgJ1RoZSBwYXJlbnQgdm5vZGUgaXM6XFxuJyArXG4gICAgICAgIGVycm9yU3RyaW5nKGRhdGEucGFyZW50Vm5vZGUpXG4gICAgICAgICdcXG4nICtcbiAgICAgICAgJ1N1Z2dlc3RlZCBmaXg6IGNoYW5nZSB5b3VyIGBoKC4uLiwgWyAuLi4gXSlgIGNhbGxzaXRlLic7XG4gICAgZXJyLmZvcmVpZ25PYmplY3QgPSBkYXRhLmZvcmVpZ25PYmplY3Q7XG4gICAgZXJyLnBhcmVudFZub2RlID0gZGF0YS5wYXJlbnRWbm9kZTtcblxuICAgIHJldHVybiBlcnI7XG59XG5cbmZ1bmN0aW9uIGVycm9yU3RyaW5nKG9iaikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsICcgICAgJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gU3RyaW5nKG9iaik7XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3BsaXQgPSByZXF1aXJlKCdicm93c2VyLXNwbGl0Jyk7XG5cbnZhciBjbGFzc0lkU3BsaXQgPSAvKFtcXC4jXT9bYS16QS1aMC05XFx1MDA3Ri1cXHVGRkZGXzotXSspLztcbnZhciBub3RDbGFzc0lkID0gL15cXC58Iy87XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2VUYWc7XG5cbmZ1bmN0aW9uIHBhcnNlVGFnKHRhZywgcHJvcHMpIHtcbiAgICBpZiAoIXRhZykge1xuICAgICAgICByZXR1cm4gJ0RJVic7XG4gICAgfVxuXG4gICAgdmFyIG5vSWQgPSAhKHByb3BzLmhhc093blByb3BlcnR5KCdpZCcpKTtcblxuICAgIHZhciB0YWdQYXJ0cyA9IHNwbGl0KHRhZywgY2xhc3NJZFNwbGl0KTtcbiAgICB2YXIgdGFnTmFtZSA9IG51bGw7XG5cbiAgICBpZiAobm90Q2xhc3NJZC50ZXN0KHRhZ1BhcnRzWzFdKSkge1xuICAgICAgICB0YWdOYW1lID0gJ0RJVic7XG4gICAgfVxuXG4gICAgdmFyIGNsYXNzZXMsIHBhcnQsIHR5cGUsIGk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgdGFnUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcGFydCA9IHRhZ1BhcnRzW2ldO1xuXG4gICAgICAgIGlmICghcGFydCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB0eXBlID0gcGFydC5jaGFyQXQoMCk7XG5cbiAgICAgICAgaWYgKCF0YWdOYW1lKSB7XG4gICAgICAgICAgICB0YWdOYW1lID0gcGFydDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnLicpIHtcbiAgICAgICAgICAgIGNsYXNzZXMgPSBjbGFzc2VzIHx8IFtdO1xuICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKHBhcnQuc3Vic3RyaW5nKDEsIHBhcnQubGVuZ3RoKSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJyMnICYmIG5vSWQpIHtcbiAgICAgICAgICAgIHByb3BzLmlkID0gcGFydC5zdWJzdHJpbmcoMSwgcGFydC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNsYXNzZXMpIHtcbiAgICAgICAgaWYgKHByb3BzLmNsYXNzTmFtZSkge1xuICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKHByb3BzLmNsYXNzTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9wcy5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvcHMubmFtZXNwYWNlID8gdGFnTmFtZSA6IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbn1cbiIsInZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4vaXMtdm5vZGVcIilcbnZhciBpc1ZUZXh0ID0gcmVxdWlyZShcIi4vaXMtdnRleHRcIilcbnZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuL2lzLXdpZGdldFwiKVxudmFyIGlzVGh1bmsgPSByZXF1aXJlKFwiLi9pcy10aHVua1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhhbmRsZVRodW5rXG5cbmZ1bmN0aW9uIGhhbmRsZVRodW5rKGEsIGIpIHtcbiAgICB2YXIgcmVuZGVyZWRBID0gYVxuICAgIHZhciByZW5kZXJlZEIgPSBiXG5cbiAgICBpZiAoaXNUaHVuayhiKSkge1xuICAgICAgICByZW5kZXJlZEIgPSByZW5kZXJUaHVuayhiLCBhKVxuICAgIH1cblxuICAgIGlmIChpc1RodW5rKGEpKSB7XG4gICAgICAgIHJlbmRlcmVkQSA9IHJlbmRlclRodW5rKGEsIG51bGwpXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYTogcmVuZGVyZWRBLFxuICAgICAgICBiOiByZW5kZXJlZEJcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlclRodW5rKHRodW5rLCBwcmV2aW91cykge1xuICAgIHZhciByZW5kZXJlZFRodW5rID0gdGh1bmsudm5vZGVcblxuICAgIGlmICghcmVuZGVyZWRUaHVuaykge1xuICAgICAgICByZW5kZXJlZFRodW5rID0gdGh1bmsudm5vZGUgPSB0aHVuay5yZW5kZXIocHJldmlvdXMpXG4gICAgfVxuXG4gICAgaWYgKCEoaXNWTm9kZShyZW5kZXJlZFRodW5rKSB8fFxuICAgICAgICAgICAgaXNWVGV4dChyZW5kZXJlZFRodW5rKSB8fFxuICAgICAgICAgICAgaXNXaWRnZXQocmVuZGVyZWRUaHVuaykpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInRodW5rIGRpZCBub3QgcmV0dXJuIGEgdmFsaWQgbm9kZVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVuZGVyZWRUaHVua1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBpc1RodW5rXHJcblxyXG5mdW5jdGlvbiBpc1RodW5rKHQpIHtcclxuICAgIHJldHVybiB0ICYmIHQudHlwZSA9PT0gXCJUaHVua1wiXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBpc0hvb2tcblxuZnVuY3Rpb24gaXNIb29rKGhvb2spIHtcbiAgICByZXR1cm4gaG9vayAmJlxuICAgICAgKHR5cGVvZiBob29rLmhvb2sgPT09IFwiZnVuY3Rpb25cIiAmJiAhaG9vay5oYXNPd25Qcm9wZXJ0eShcImhvb2tcIikgfHxcbiAgICAgICB0eXBlb2YgaG9vay51bmhvb2sgPT09IFwiZnVuY3Rpb25cIiAmJiAhaG9vay5oYXNPd25Qcm9wZXJ0eShcInVuaG9va1wiKSlcbn1cbiIsInZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVmlydHVhbE5vZGVcblxuZnVuY3Rpb24gaXNWaXJ0dWFsTm9kZSh4KSB7XG4gICAgcmV0dXJuIHggJiYgeC50eXBlID09PSBcIlZpcnR1YWxOb2RlXCIgJiYgeC52ZXJzaW9uID09PSB2ZXJzaW9uXG59XG4iLCJ2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIilcblxubW9kdWxlLmV4cG9ydHMgPSBpc1ZpcnR1YWxUZXh0XG5cbmZ1bmN0aW9uIGlzVmlydHVhbFRleHQoeCkge1xuICAgIHJldHVybiB4ICYmIHgudHlwZSA9PT0gXCJWaXJ0dWFsVGV4dFwiICYmIHgudmVyc2lvbiA9PT0gdmVyc2lvblxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBpc1dpZGdldFxuXG5mdW5jdGlvbiBpc1dpZGdldCh3KSB7XG4gICAgcmV0dXJuIHcgJiYgdy50eXBlID09PSBcIldpZGdldFwiXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFwiMlwiXG4iLCJ2YXIgdmVyc2lvbiA9IHJlcXVpcmUoXCIuL3ZlcnNpb25cIilcbnZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4vaXMtdm5vZGVcIilcbnZhciBpc1dpZGdldCA9IHJlcXVpcmUoXCIuL2lzLXdpZGdldFwiKVxudmFyIGlzVGh1bmsgPSByZXF1aXJlKFwiLi9pcy10aHVua1wiKVxudmFyIGlzVkhvb2sgPSByZXF1aXJlKFwiLi9pcy12aG9va1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpcnR1YWxOb2RlXG5cbnZhciBub1Byb3BlcnRpZXMgPSB7fVxudmFyIG5vQ2hpbGRyZW4gPSBbXVxuXG5mdW5jdGlvbiBWaXJ0dWFsTm9kZSh0YWdOYW1lLCBwcm9wZXJ0aWVzLCBjaGlsZHJlbiwga2V5LCBuYW1lc3BhY2UpIHtcbiAgICB0aGlzLnRhZ05hbWUgPSB0YWdOYW1lXG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gcHJvcGVydGllcyB8fCBub1Byb3BlcnRpZXNcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW4gfHwgbm9DaGlsZHJlblxuICAgIHRoaXMua2V5ID0ga2V5ICE9IG51bGwgPyBTdHJpbmcoa2V5KSA6IHVuZGVmaW5lZFxuICAgIHRoaXMubmFtZXNwYWNlID0gKHR5cGVvZiBuYW1lc3BhY2UgPT09IFwic3RyaW5nXCIpID8gbmFtZXNwYWNlIDogbnVsbFxuXG4gICAgdmFyIGNvdW50ID0gKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkgfHwgMFxuICAgIHZhciBkZXNjZW5kYW50cyA9IDBcbiAgICB2YXIgaGFzV2lkZ2V0cyA9IGZhbHNlXG4gICAgdmFyIGhhc1RodW5rcyA9IGZhbHNlXG4gICAgdmFyIGRlc2NlbmRhbnRIb29rcyA9IGZhbHNlXG4gICAgdmFyIGhvb2tzXG5cbiAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSkge1xuICAgICAgICAgICAgdmFyIHByb3BlcnR5ID0gcHJvcGVydGllc1twcm9wTmFtZV1cbiAgICAgICAgICAgIGlmIChpc1ZIb29rKHByb3BlcnR5KSAmJiBwcm9wZXJ0eS51bmhvb2spIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhvb2tzKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvb2tzID0ge31cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBob29rc1twcm9wTmFtZV0gPSBwcm9wZXJ0eVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICAgIGlmIChpc1ZOb2RlKGNoaWxkKSkge1xuICAgICAgICAgICAgZGVzY2VuZGFudHMgKz0gY2hpbGQuY291bnQgfHwgMFxuXG4gICAgICAgICAgICBpZiAoIWhhc1dpZGdldHMgJiYgY2hpbGQuaGFzV2lkZ2V0cykge1xuICAgICAgICAgICAgICAgIGhhc1dpZGdldHMgPSB0cnVlXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaGFzVGh1bmtzICYmIGNoaWxkLmhhc1RodW5rcykge1xuICAgICAgICAgICAgICAgIGhhc1RodW5rcyA9IHRydWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFkZXNjZW5kYW50SG9va3MgJiYgKGNoaWxkLmhvb2tzIHx8IGNoaWxkLmRlc2NlbmRhbnRIb29rcykpIHtcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50SG9va3MgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWhhc1dpZGdldHMgJiYgaXNXaWRnZXQoY2hpbGQpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoaWxkLmRlc3Ryb3kgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGhhc1dpZGdldHMgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWhhc1RodW5rcyAmJiBpc1RodW5rKGNoaWxkKSkge1xuICAgICAgICAgICAgaGFzVGh1bmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY291bnQgPSBjb3VudCArIGRlc2NlbmRhbnRzXG4gICAgdGhpcy5oYXNXaWRnZXRzID0gaGFzV2lkZ2V0c1xuICAgIHRoaXMuaGFzVGh1bmtzID0gaGFzVGh1bmtzXG4gICAgdGhpcy5ob29rcyA9IGhvb2tzXG4gICAgdGhpcy5kZXNjZW5kYW50SG9va3MgPSBkZXNjZW5kYW50SG9va3Ncbn1cblxuVmlydHVhbE5vZGUucHJvdG90eXBlLnZlcnNpb24gPSB2ZXJzaW9uXG5WaXJ0dWFsTm9kZS5wcm90b3R5cGUudHlwZSA9IFwiVmlydHVhbE5vZGVcIlxuIiwidmFyIHZlcnNpb24gPSByZXF1aXJlKFwiLi92ZXJzaW9uXCIpXG5cblZpcnR1YWxQYXRjaC5OT05FID0gMFxuVmlydHVhbFBhdGNoLlZURVhUID0gMVxuVmlydHVhbFBhdGNoLlZOT0RFID0gMlxuVmlydHVhbFBhdGNoLldJREdFVCA9IDNcblZpcnR1YWxQYXRjaC5QUk9QUyA9IDRcblZpcnR1YWxQYXRjaC5PUkRFUiA9IDVcblZpcnR1YWxQYXRjaC5JTlNFUlQgPSA2XG5WaXJ0dWFsUGF0Y2guUkVNT1ZFID0gN1xuVmlydHVhbFBhdGNoLlRIVU5LID0gOFxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpcnR1YWxQYXRjaFxuXG5mdW5jdGlvbiBWaXJ0dWFsUGF0Y2godHlwZSwgdk5vZGUsIHBhdGNoKSB7XG4gICAgdGhpcy50eXBlID0gTnVtYmVyKHR5cGUpXG4gICAgdGhpcy52Tm9kZSA9IHZOb2RlXG4gICAgdGhpcy5wYXRjaCA9IHBhdGNoXG59XG5cblZpcnR1YWxQYXRjaC5wcm90b3R5cGUudmVyc2lvbiA9IHZlcnNpb25cblZpcnR1YWxQYXRjaC5wcm90b3R5cGUudHlwZSA9IFwiVmlydHVhbFBhdGNoXCJcbiIsInZhciB2ZXJzaW9uID0gcmVxdWlyZShcIi4vdmVyc2lvblwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpcnR1YWxUZXh0XG5cbmZ1bmN0aW9uIFZpcnR1YWxUZXh0KHRleHQpIHtcbiAgICB0aGlzLnRleHQgPSBTdHJpbmcodGV4dClcbn1cblxuVmlydHVhbFRleHQucHJvdG90eXBlLnZlcnNpb24gPSB2ZXJzaW9uXG5WaXJ0dWFsVGV4dC5wcm90b3R5cGUudHlwZSA9IFwiVmlydHVhbFRleHRcIlxuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZShcImlzLW9iamVjdFwiKVxudmFyIGlzSG9vayA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12aG9va1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRpZmZQcm9wc1xuXG5mdW5jdGlvbiBkaWZmUHJvcHMoYSwgYikge1xuICAgIHZhciBkaWZmXG5cbiAgICBmb3IgKHZhciBhS2V5IGluIGEpIHtcbiAgICAgICAgaWYgKCEoYUtleSBpbiBiKSkge1xuICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge31cbiAgICAgICAgICAgIGRpZmZbYUtleV0gPSB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhVmFsdWUgPSBhW2FLZXldXG4gICAgICAgIHZhciBiVmFsdWUgPSBiW2FLZXldXG5cbiAgICAgICAgaWYgKGFWYWx1ZSA9PT0gYlZhbHVlKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KGFWYWx1ZSkgJiYgaXNPYmplY3QoYlZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKGdldFByb3RvdHlwZShiVmFsdWUpICE9PSBnZXRQcm90b3R5cGUoYVZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9XG4gICAgICAgICAgICAgICAgZGlmZlthS2V5XSA9IGJWYWx1ZVxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0hvb2soYlZhbHVlKSkge1xuICAgICAgICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fVxuICAgICAgICAgICAgICAgICBkaWZmW2FLZXldID0gYlZhbHVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBvYmplY3REaWZmID0gZGlmZlByb3BzKGFWYWx1ZSwgYlZhbHVlKVxuICAgICAgICAgICAgICAgIGlmIChvYmplY3REaWZmKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPSBkaWZmIHx8IHt9XG4gICAgICAgICAgICAgICAgICAgIGRpZmZbYUtleV0gPSBvYmplY3REaWZmXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlmZiA9IGRpZmYgfHwge31cbiAgICAgICAgICAgIGRpZmZbYUtleV0gPSBiVmFsdWVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGJLZXkgaW4gYikge1xuICAgICAgICBpZiAoIShiS2V5IGluIGEpKSB7XG4gICAgICAgICAgICBkaWZmID0gZGlmZiB8fCB7fVxuICAgICAgICAgICAgZGlmZltiS2V5XSA9IGJbYktleV1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkaWZmXG59XG5cbmZ1bmN0aW9uIGdldFByb3RvdHlwZSh2YWx1ZSkge1xuICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKSB7XG4gICAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSlcbiAgfSBlbHNlIGlmICh2YWx1ZS5fX3Byb3RvX18pIHtcbiAgICByZXR1cm4gdmFsdWUuX19wcm90b19fXG4gIH0gZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlXG4gIH1cbn1cbiIsInZhciBpc0FycmF5ID0gcmVxdWlyZShcIngtaXMtYXJyYXlcIilcblxudmFyIFZQYXRjaCA9IHJlcXVpcmUoXCIuLi92bm9kZS92cGF0Y2hcIilcbnZhciBpc1ZOb2RlID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXZub2RlXCIpXG52YXIgaXNWVGV4dCA9IHJlcXVpcmUoXCIuLi92bm9kZS9pcy12dGV4dFwiKVxudmFyIGlzV2lkZ2V0ID0gcmVxdWlyZShcIi4uL3Zub2RlL2lzLXdpZGdldFwiKVxudmFyIGlzVGh1bmsgPSByZXF1aXJlKFwiLi4vdm5vZGUvaXMtdGh1bmtcIilcbnZhciBoYW5kbGVUaHVuayA9IHJlcXVpcmUoXCIuLi92bm9kZS9oYW5kbGUtdGh1bmtcIilcblxudmFyIGRpZmZQcm9wcyA9IHJlcXVpcmUoXCIuL2RpZmYtcHJvcHNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBkaWZmXG5cbmZ1bmN0aW9uIGRpZmYoYSwgYikge1xuICAgIHZhciBwYXRjaCA9IHsgYTogYSB9XG4gICAgd2FsayhhLCBiLCBwYXRjaCwgMClcbiAgICByZXR1cm4gcGF0Y2hcbn1cblxuZnVuY3Rpb24gd2FsayhhLCBiLCBwYXRjaCwgaW5kZXgpIHtcbiAgICBpZiAoYSA9PT0gYikge1xuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB2YXIgYXBwbHkgPSBwYXRjaFtpbmRleF1cbiAgICB2YXIgYXBwbHlDbGVhciA9IGZhbHNlXG5cbiAgICBpZiAoaXNUaHVuayhhKSB8fCBpc1RodW5rKGIpKSB7XG4gICAgICAgIHRodW5rcyhhLCBiLCBwYXRjaCwgaW5kZXgpXG4gICAgfSBlbHNlIGlmIChiID09IG51bGwpIHtcblxuICAgICAgICAvLyBJZiBhIGlzIGEgd2lkZ2V0IHdlIHdpbGwgYWRkIGEgcmVtb3ZlIHBhdGNoIGZvciBpdFxuICAgICAgICAvLyBPdGhlcndpc2UgYW55IGNoaWxkIHdpZGdldHMvaG9va3MgbXVzdCBiZSBkZXN0cm95ZWQuXG4gICAgICAgIC8vIFRoaXMgcHJldmVudHMgYWRkaW5nIHR3byByZW1vdmUgcGF0Y2hlcyBmb3IgYSB3aWRnZXQuXG4gICAgICAgIGlmICghaXNXaWRnZXQoYSkpIHtcbiAgICAgICAgICAgIGNsZWFyU3RhdGUoYSwgcGF0Y2gsIGluZGV4KVxuICAgICAgICAgICAgYXBwbHkgPSBwYXRjaFtpbmRleF1cbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlJFTU9WRSwgYSwgYikpXG4gICAgfSBlbHNlIGlmIChpc1ZOb2RlKGIpKSB7XG4gICAgICAgIGlmIChpc1ZOb2RlKGEpKSB7XG4gICAgICAgICAgICBpZiAoYS50YWdOYW1lID09PSBiLnRhZ05hbWUgJiZcbiAgICAgICAgICAgICAgICBhLm5hbWVzcGFjZSA9PT0gYi5uYW1lc3BhY2UgJiZcbiAgICAgICAgICAgICAgICBhLmtleSA9PT0gYi5rZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcHNQYXRjaCA9IGRpZmZQcm9wcyhhLnByb3BlcnRpZXMsIGIucHJvcGVydGllcylcbiAgICAgICAgICAgICAgICBpZiAocHJvcHNQYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFZQYXRjaChWUGF0Y2guUFJPUFMsIGEsIHByb3BzUGF0Y2gpKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhcHBseSA9IGRpZmZDaGlsZHJlbihhLCBiLCBwYXRjaCwgYXBwbHksIGluZGV4KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5WTk9ERSwgYSwgYikpXG4gICAgICAgICAgICAgICAgYXBwbHlDbGVhciA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goVlBhdGNoLlZOT0RFLCBhLCBiKSlcbiAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlXG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzVlRleHQoYikpIHtcbiAgICAgICAgaWYgKCFpc1ZUZXh0KGEpKSB7XG4gICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5WVEVYVCwgYSwgYikpXG4gICAgICAgICAgICBhcHBseUNsZWFyID0gdHJ1ZVxuICAgICAgICB9IGVsc2UgaWYgKGEudGV4dCAhPT0gYi50ZXh0KSB7XG4gICAgICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5WVEVYVCwgYSwgYikpXG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzV2lkZ2V0KGIpKSB7XG4gICAgICAgIGlmICghaXNXaWRnZXQoYSkpIHtcbiAgICAgICAgICAgIGFwcGx5Q2xlYXIgPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBhcHBseSA9IGFwcGVuZFBhdGNoKGFwcGx5LCBuZXcgVlBhdGNoKFZQYXRjaC5XSURHRVQsIGEsIGIpKVxuICAgIH1cblxuICAgIGlmIChhcHBseSkge1xuICAgICAgICBwYXRjaFtpbmRleF0gPSBhcHBseVxuICAgIH1cblxuICAgIGlmIChhcHBseUNsZWFyKSB7XG4gICAgICAgIGNsZWFyU3RhdGUoYSwgcGF0Y2gsIGluZGV4KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlmZkNoaWxkcmVuKGEsIGIsIHBhdGNoLCBhcHBseSwgaW5kZXgpIHtcbiAgICB2YXIgYUNoaWxkcmVuID0gYS5jaGlsZHJlblxuICAgIHZhciBvcmRlcmVkU2V0ID0gcmVvcmRlcihhQ2hpbGRyZW4sIGIuY2hpbGRyZW4pXG4gICAgdmFyIGJDaGlsZHJlbiA9IG9yZGVyZWRTZXQuY2hpbGRyZW5cblxuICAgIHZhciBhTGVuID0gYUNoaWxkcmVuLmxlbmd0aFxuICAgIHZhciBiTGVuID0gYkNoaWxkcmVuLmxlbmd0aFxuICAgIHZhciBsZW4gPSBhTGVuID4gYkxlbiA/IGFMZW4gOiBiTGVuXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBsZWZ0Tm9kZSA9IGFDaGlsZHJlbltpXVxuICAgICAgICB2YXIgcmlnaHROb2RlID0gYkNoaWxkcmVuW2ldXG4gICAgICAgIGluZGV4ICs9IDFcblxuICAgICAgICBpZiAoIWxlZnROb2RlKSB7XG4gICAgICAgICAgICBpZiAocmlnaHROb2RlKSB7XG4gICAgICAgICAgICAgICAgLy8gRXhjZXNzIG5vZGVzIGluIGIgbmVlZCB0byBiZSBhZGRlZFxuICAgICAgICAgICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBWUGF0Y2goVlBhdGNoLklOU0VSVCwgbnVsbCwgcmlnaHROb2RlKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdhbGsobGVmdE5vZGUsIHJpZ2h0Tm9kZSwgcGF0Y2gsIGluZGV4KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzVk5vZGUobGVmdE5vZGUpICYmIGxlZnROb2RlLmNvdW50KSB7XG4gICAgICAgICAgICBpbmRleCArPSBsZWZ0Tm9kZS5jb3VudFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9yZGVyZWRTZXQubW92ZXMpIHtcbiAgICAgICAgLy8gUmVvcmRlciBub2RlcyBsYXN0XG4gICAgICAgIGFwcGx5ID0gYXBwZW5kUGF0Y2goYXBwbHksIG5ldyBWUGF0Y2goXG4gICAgICAgICAgICBWUGF0Y2guT1JERVIsXG4gICAgICAgICAgICBhLFxuICAgICAgICAgICAgb3JkZXJlZFNldC5tb3Zlc1xuICAgICAgICApKVxuICAgIH1cblxuICAgIHJldHVybiBhcHBseVxufVxuXG5mdW5jdGlvbiBjbGVhclN0YXRlKHZOb2RlLCBwYXRjaCwgaW5kZXgpIHtcbiAgICAvLyBUT0RPOiBNYWtlIHRoaXMgYSBzaW5nbGUgd2Fsaywgbm90IHR3b1xuICAgIHVuaG9vayh2Tm9kZSwgcGF0Y2gsIGluZGV4KVxuICAgIGRlc3Ryb3lXaWRnZXRzKHZOb2RlLCBwYXRjaCwgaW5kZXgpXG59XG5cbi8vIFBhdGNoIHJlY29yZHMgZm9yIGFsbCBkZXN0cm95ZWQgd2lkZ2V0cyBtdXN0IGJlIGFkZGVkIGJlY2F1c2Ugd2UgbmVlZFxuLy8gYSBET00gbm9kZSByZWZlcmVuY2UgZm9yIHRoZSBkZXN0cm95IGZ1bmN0aW9uXG5mdW5jdGlvbiBkZXN0cm95V2lkZ2V0cyh2Tm9kZSwgcGF0Y2gsIGluZGV4KSB7XG4gICAgaWYgKGlzV2lkZ2V0KHZOb2RlKSkge1xuICAgICAgICBpZiAodHlwZW9mIHZOb2RlLmRlc3Ryb3kgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcGF0Y2hbaW5kZXhdID0gYXBwZW5kUGF0Y2goXG4gICAgICAgICAgICAgICAgcGF0Y2hbaW5kZXhdLFxuICAgICAgICAgICAgICAgIG5ldyBWUGF0Y2goVlBhdGNoLlJFTU9WRSwgdk5vZGUsIG51bGwpXG4gICAgICAgICAgICApXG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzVk5vZGUodk5vZGUpICYmICh2Tm9kZS5oYXNXaWRnZXRzIHx8IHZOb2RlLmhhc1RodW5rcykpIHtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdk5vZGUuY2hpbGRyZW5cbiAgICAgICAgdmFyIGxlbiA9IGNoaWxkcmVuLmxlbmd0aFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuICAgICAgICAgICAgaW5kZXggKz0gMVxuXG4gICAgICAgICAgICBkZXN0cm95V2lkZ2V0cyhjaGlsZCwgcGF0Y2gsIGluZGV4KVxuXG4gICAgICAgICAgICBpZiAoaXNWTm9kZShjaGlsZCkgJiYgY2hpbGQuY291bnQpIHtcbiAgICAgICAgICAgICAgICBpbmRleCArPSBjaGlsZC5jb3VudFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1RodW5rKHZOb2RlKSkge1xuICAgICAgICB0aHVua3Modk5vZGUsIG51bGwsIHBhdGNoLCBpbmRleClcbiAgICB9XG59XG5cbi8vIENyZWF0ZSBhIHN1Yi1wYXRjaCBmb3IgdGh1bmtzXG5mdW5jdGlvbiB0aHVua3MoYSwgYiwgcGF0Y2gsIGluZGV4KSB7XG4gICAgdmFyIG5vZGVzID0gaGFuZGxlVGh1bmsoYSwgYilcbiAgICB2YXIgdGh1bmtQYXRjaCA9IGRpZmYobm9kZXMuYSwgbm9kZXMuYilcbiAgICBpZiAoaGFzUGF0Y2hlcyh0aHVua1BhdGNoKSkge1xuICAgICAgICBwYXRjaFtpbmRleF0gPSBuZXcgVlBhdGNoKFZQYXRjaC5USFVOSywgbnVsbCwgdGh1bmtQYXRjaClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc1BhdGNoZXMocGF0Y2gpIHtcbiAgICBmb3IgKHZhciBpbmRleCBpbiBwYXRjaCkge1xuICAgICAgICBpZiAoaW5kZXggIT09IFwiYVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG59XG5cbi8vIEV4ZWN1dGUgaG9va3Mgd2hlbiB0d28gbm9kZXMgYXJlIGlkZW50aWNhbFxuZnVuY3Rpb24gdW5ob29rKHZOb2RlLCBwYXRjaCwgaW5kZXgpIHtcbiAgICBpZiAoaXNWTm9kZSh2Tm9kZSkpIHtcbiAgICAgICAgaWYgKHZOb2RlLmhvb2tzKSB7XG4gICAgICAgICAgICBwYXRjaFtpbmRleF0gPSBhcHBlbmRQYXRjaChcbiAgICAgICAgICAgICAgICBwYXRjaFtpbmRleF0sXG4gICAgICAgICAgICAgICAgbmV3IFZQYXRjaChcbiAgICAgICAgICAgICAgICAgICAgVlBhdGNoLlBST1BTLFxuICAgICAgICAgICAgICAgICAgICB2Tm9kZSxcbiAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkS2V5cyh2Tm9kZS5ob29rcylcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodk5vZGUuZGVzY2VuZGFudEhvb2tzIHx8IHZOb2RlLmhhc1RodW5rcykge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdk5vZGUuY2hpbGRyZW5cbiAgICAgICAgICAgIHZhciBsZW4gPSBjaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuICAgICAgICAgICAgICAgIGluZGV4ICs9IDFcblxuICAgICAgICAgICAgICAgIHVuaG9vayhjaGlsZCwgcGF0Y2gsIGluZGV4KVxuXG4gICAgICAgICAgICAgICAgaWYgKGlzVk5vZGUoY2hpbGQpICYmIGNoaWxkLmNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IGNoaWxkLmNvdW50XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1RodW5rKHZOb2RlKSkge1xuICAgICAgICB0aHVua3Modk5vZGUsIG51bGwsIHBhdGNoLCBpbmRleClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVuZGVmaW5lZEtleXMob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxufVxuXG4vLyBMaXN0IGRpZmYsIG5haXZlIGxlZnQgdG8gcmlnaHQgcmVvcmRlcmluZ1xuZnVuY3Rpb24gcmVvcmRlcihhQ2hpbGRyZW4sIGJDaGlsZHJlbikge1xuICAgIC8vIE8oTSkgdGltZSwgTyhNKSBtZW1vcnlcbiAgICB2YXIgYkNoaWxkSW5kZXggPSBrZXlJbmRleChiQ2hpbGRyZW4pXG4gICAgdmFyIGJLZXlzID0gYkNoaWxkSW5kZXgua2V5c1xuICAgIHZhciBiRnJlZSA9IGJDaGlsZEluZGV4LmZyZWVcblxuICAgIGlmIChiRnJlZS5sZW5ndGggPT09IGJDaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNoaWxkcmVuOiBiQ2hpbGRyZW4sXG4gICAgICAgICAgICBtb3ZlczogbnVsbFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTyhOKSB0aW1lLCBPKE4pIG1lbW9yeVxuICAgIHZhciBhQ2hpbGRJbmRleCA9IGtleUluZGV4KGFDaGlsZHJlbilcbiAgICB2YXIgYUtleXMgPSBhQ2hpbGRJbmRleC5rZXlzXG4gICAgdmFyIGFGcmVlID0gYUNoaWxkSW5kZXguZnJlZVxuXG4gICAgaWYgKGFGcmVlLmxlbmd0aCA9PT0gYUNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2hpbGRyZW46IGJDaGlsZHJlbixcbiAgICAgICAgICAgIG1vdmVzOiBudWxsXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPKE1BWChOLCBNKSkgbWVtb3J5XG4gICAgdmFyIG5ld0NoaWxkcmVuID0gW11cblxuICAgIHZhciBmcmVlSW5kZXggPSAwXG4gICAgdmFyIGZyZWVDb3VudCA9IGJGcmVlLmxlbmd0aFxuICAgIHZhciBkZWxldGVkSXRlbXMgPSAwXG5cbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggYSBhbmQgbWF0Y2ggYSBub2RlIGluIGJcbiAgICAvLyBPKE4pIHRpbWUsXG4gICAgZm9yICh2YXIgaSA9IDAgOyBpIDwgYUNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhSXRlbSA9IGFDaGlsZHJlbltpXVxuICAgICAgICB2YXIgaXRlbUluZGV4XG5cbiAgICAgICAgaWYgKGFJdGVtLmtleSkge1xuICAgICAgICAgICAgaWYgKGJLZXlzLmhhc093blByb3BlcnR5KGFJdGVtLmtleSkpIHtcbiAgICAgICAgICAgICAgICAvLyBNYXRjaCB1cCB0aGUgb2xkIGtleXNcbiAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBiS2V5c1thSXRlbS5rZXldXG4gICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChiQ2hpbGRyZW5baXRlbUluZGV4XSlcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgb2xkIGtleWVkIGl0ZW1zXG4gICAgICAgICAgICAgICAgaXRlbUluZGV4ID0gaSAtIGRlbGV0ZWRJdGVtcysrXG4gICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChudWxsKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTWF0Y2ggdGhlIGl0ZW0gaW4gYSB3aXRoIHRoZSBuZXh0IGZyZWUgaXRlbSBpbiBiXG4gICAgICAgICAgICBpZiAoZnJlZUluZGV4IDwgZnJlZUNvdW50KSB7XG4gICAgICAgICAgICAgICAgaXRlbUluZGV4ID0gYkZyZWVbZnJlZUluZGV4KytdXG4gICAgICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChiQ2hpbGRyZW5baXRlbUluZGV4XSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgYXJlIG5vIGZyZWUgaXRlbXMgaW4gYiB0byBtYXRjaCB3aXRoXG4gICAgICAgICAgICAgICAgLy8gdGhlIGZyZWUgaXRlbXMgaW4gYSwgc28gdGhlIGV4dHJhIGZyZWUgbm9kZXNcbiAgICAgICAgICAgICAgICAvLyBhcmUgZGVsZXRlZC5cbiAgICAgICAgICAgICAgICBpdGVtSW5kZXggPSBpIC0gZGVsZXRlZEl0ZW1zKytcbiAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG51bGwpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGFzdEZyZWVJbmRleCA9IGZyZWVJbmRleCA+PSBiRnJlZS5sZW5ndGggP1xuICAgICAgICBiQ2hpbGRyZW4ubGVuZ3RoIDpcbiAgICAgICAgYkZyZWVbZnJlZUluZGV4XVxuXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGIgYW5kIGFwcGVuZCBhbnkgbmV3IGtleXNcbiAgICAvLyBPKE0pIHRpbWVcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGJDaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgbmV3SXRlbSA9IGJDaGlsZHJlbltqXVxuXG4gICAgICAgIGlmIChuZXdJdGVtLmtleSkge1xuICAgICAgICAgICAgaWYgKCFhS2V5cy5oYXNPd25Qcm9wZXJ0eShuZXdJdGVtLmtleSkpIHtcbiAgICAgICAgICAgICAgICAvLyBBZGQgYW55IG5ldyBrZXllZCBpdGVtc1xuICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBhZGRpbmcgbmV3IGl0ZW1zIHRvIHRoZSBlbmQgYW5kIHRoZW4gc29ydGluZyB0aGVtXG4gICAgICAgICAgICAgICAgLy8gaW4gcGxhY2UuIEluIGZ1dHVyZSB3ZSBzaG91bGQgaW5zZXJ0IG5ldyBpdGVtcyBpbiBwbGFjZS5cbiAgICAgICAgICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKG5ld0l0ZW0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoaiA+PSBsYXN0RnJlZUluZGV4KSB7XG4gICAgICAgICAgICAvLyBBZGQgYW55IGxlZnRvdmVyIG5vbi1rZXllZCBpdGVtc1xuICAgICAgICAgICAgbmV3Q2hpbGRyZW4ucHVzaChuZXdJdGVtKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHNpbXVsYXRlID0gbmV3Q2hpbGRyZW4uc2xpY2UoKVxuICAgIHZhciBzaW11bGF0ZUluZGV4ID0gMFxuICAgIHZhciByZW1vdmVzID0gW11cbiAgICB2YXIgaW5zZXJ0cyA9IFtdXG4gICAgdmFyIHNpbXVsYXRlSXRlbVxuXG4gICAgZm9yICh2YXIgayA9IDA7IGsgPCBiQ2hpbGRyZW4ubGVuZ3RoOykge1xuICAgICAgICB2YXIgd2FudGVkSXRlbSA9IGJDaGlsZHJlbltrXVxuICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XVxuXG4gICAgICAgIC8vIHJlbW92ZSBpdGVtc1xuICAgICAgICB3aGlsZSAoc2ltdWxhdGVJdGVtID09PSBudWxsICYmIHNpbXVsYXRlLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVtb3Zlcy5wdXNoKHJlbW92ZShzaW11bGF0ZSwgc2ltdWxhdGVJbmRleCwgbnVsbCkpXG4gICAgICAgICAgICBzaW11bGF0ZUl0ZW0gPSBzaW11bGF0ZVtzaW11bGF0ZUluZGV4XVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzaW11bGF0ZUl0ZW0gfHwgc2ltdWxhdGVJdGVtLmtleSAhPT0gd2FudGVkSXRlbS5rZXkpIHtcbiAgICAgICAgICAgIC8vIGlmIHdlIG5lZWQgYSBrZXkgaW4gdGhpcyBwb3NpdGlvbi4uLlxuICAgICAgICAgICAgaWYgKHdhbnRlZEl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpbXVsYXRlSXRlbSAmJiBzaW11bGF0ZUl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGFuIGluc2VydCBkb2Vzbid0IHB1dCB0aGlzIGtleSBpbiBwbGFjZSwgaXQgbmVlZHMgdG8gbW92ZVxuICAgICAgICAgICAgICAgICAgICBpZiAoYktleXNbc2ltdWxhdGVJdGVtLmtleV0gIT09IGsgKyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBzaW11bGF0ZUl0ZW0ua2V5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbXVsYXRlSXRlbSA9IHNpbXVsYXRlW3NpbXVsYXRlSW5kZXhdXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgcmVtb3ZlIGRpZG4ndCBwdXQgdGhlIHdhbnRlZCBpdGVtIGluIHBsYWNlLCB3ZSBuZWVkIHRvIGluc2VydCBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzaW11bGF0ZUl0ZW0gfHwgc2ltdWxhdGVJdGVtLmtleSAhPT0gd2FudGVkSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goe2tleTogd2FudGVkSXRlbS5rZXksIHRvOiBrfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0ZW1zIGFyZSBtYXRjaGluZywgc28gc2tpcCBhaGVhZFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2ltdWxhdGVJbmRleCsrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRzLnB1c2goe2tleTogd2FudGVkSXRlbS5rZXksIHRvOiBrfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0cy5wdXNoKHtrZXk6IHdhbnRlZEl0ZW0ua2V5LCB0bzoga30pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGsrK1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gYSBrZXkgaW4gc2ltdWxhdGUgaGFzIG5vIG1hdGNoaW5nIHdhbnRlZCBrZXksIHJlbW92ZSBpdFxuICAgICAgICAgICAgZWxzZSBpZiAoc2ltdWxhdGVJdGVtICYmIHNpbXVsYXRlSXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVzLnB1c2gocmVtb3ZlKHNpbXVsYXRlLCBzaW11bGF0ZUluZGV4LCBzaW11bGF0ZUl0ZW0ua2V5KSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNpbXVsYXRlSW5kZXgrK1xuICAgICAgICAgICAgaysrXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZW1vdmUgYWxsIHRoZSByZW1haW5pbmcgbm9kZXMgZnJvbSBzaW11bGF0ZVxuICAgIHdoaWxlKHNpbXVsYXRlSW5kZXggPCBzaW11bGF0ZS5sZW5ndGgpIHtcbiAgICAgICAgc2ltdWxhdGVJdGVtID0gc2ltdWxhdGVbc2ltdWxhdGVJbmRleF1cbiAgICAgICAgcmVtb3Zlcy5wdXNoKHJlbW92ZShzaW11bGF0ZSwgc2ltdWxhdGVJbmRleCwgc2ltdWxhdGVJdGVtICYmIHNpbXVsYXRlSXRlbS5rZXkpKVxuICAgIH1cblxuICAgIC8vIElmIHRoZSBvbmx5IG1vdmVzIHdlIGhhdmUgYXJlIGRlbGV0ZXMgdGhlbiB3ZSBjYW4ganVzdFxuICAgIC8vIGxldCB0aGUgZGVsZXRlIHBhdGNoIHJlbW92ZSB0aGVzZSBpdGVtcy5cbiAgICBpZiAocmVtb3Zlcy5sZW5ndGggPT09IGRlbGV0ZWRJdGVtcyAmJiAhaW5zZXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNoaWxkcmVuOiBuZXdDaGlsZHJlbixcbiAgICAgICAgICAgIG1vdmVzOiBudWxsXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjaGlsZHJlbjogbmV3Q2hpbGRyZW4sXG4gICAgICAgIG1vdmVzOiB7XG4gICAgICAgICAgICByZW1vdmVzOiByZW1vdmVzLFxuICAgICAgICAgICAgaW5zZXJ0czogaW5zZXJ0c1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmUoYXJyLCBpbmRleCwga2V5KSB7XG4gICAgYXJyLnNwbGljZShpbmRleCwgMSlcblxuICAgIHJldHVybiB7XG4gICAgICAgIGZyb206IGluZGV4LFxuICAgICAgICBrZXk6IGtleVxuICAgIH1cbn1cblxuZnVuY3Rpb24ga2V5SW5kZXgoY2hpbGRyZW4pIHtcbiAgICB2YXIga2V5cyA9IHt9XG4gICAgdmFyIGZyZWUgPSBbXVxuICAgIHZhciBsZW5ndGggPSBjaGlsZHJlbi5sZW5ndGhcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cblxuICAgICAgICBpZiAoY2hpbGQua2V5KSB7XG4gICAgICAgICAgICBrZXlzW2NoaWxkLmtleV0gPSBpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcmVlLnB1c2goaSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGtleXM6IGtleXMsICAgICAvLyBBIGhhc2ggb2Yga2V5IG5hbWUgdG8gaW5kZXhcbiAgICAgICAgZnJlZTogZnJlZSAgICAgIC8vIEFuIGFycmF5IG9mIHVua2V5ZWQgaXRlbSBpbmRpY2VzXG4gICAgfVxufVxuXG5mdW5jdGlvbiBhcHBlbmRQYXRjaChhcHBseSwgcGF0Y2gpIHtcbiAgICBpZiAoYXBwbHkpIHtcbiAgICAgICAgaWYgKGlzQXJyYXkoYXBwbHkpKSB7XG4gICAgICAgICAgICBhcHBseS5wdXNoKHBhdGNoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXBwbHkgPSBbYXBwbHksIHBhdGNoXVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFwcGx5XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHBhdGNoXG4gICAgfVxufVxuIiwidmFyIG5hdGl2ZUlzQXJyYXkgPSBBcnJheS5pc0FycmF5XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG5cbm1vZHVsZS5leHBvcnRzID0gbmF0aXZlSXNBcnJheSB8fCBpc0FycmF5XG5cbmZ1bmN0aW9uIGlzQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiXG59XG4iXX0=
