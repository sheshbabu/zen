(() => {
  // dependencies/preact.esm.js
  var Z;
  var p;
  var $t;
  var lt;
  var N;
  var Ht;
  var At;
  var ft;
  var Ft;
  var ht;
  var st;
  var ct;
  var Tt;
  var I = {};
  var Mt = [];
  var le = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var pt = Array.isArray;
  function H(e, t) {
    for (var n in t) e[n] = t[n];
    return e;
  }
  function vt(e) {
    e && e.parentNode && e.parentNode.removeChild(e);
  }
  function dt(e, t, n) {
    var i, _, r, o = {};
    for (r in t) r == "key" ? i = t[r] : r == "ref" ? _ = t[r] : o[r] = t[r];
    if (arguments.length > 2 && (o.children = arguments.length > 3 ? Z.call(arguments, 2) : n), typeof e == "function" && e.defaultProps != null) for (r in e.defaultProps) o[r] === void 0 && (o[r] = e.defaultProps[r]);
    return X(e, o, i, _, null);
  }
  function X(e, t, n, i, _) {
    var r = { type: e, props: t, key: n, ref: i, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: _ ?? ++$t, __i: -1, __u: 0 };
    return _ == null && p.vnode != null && p.vnode(r), r;
  }
  function O(e) {
    return e.children;
  }
  function $(e, t) {
    this.props = e, this.context = t;
  }
  function T(e, t) {
    if (t == null) return e.__ ? T(e.__, e.__i + 1) : null;
    for (var n; t < e.__k.length; t++) if ((n = e.__k[t]) != null && n.__e != null) return n.__e;
    return typeof e.type == "function" ? T(e) : null;
  }
  function Dt(e) {
    var t, n;
    if ((e = e.__) != null && e.__c != null) {
      for (e.__e = e.__c.base = null, t = 0; t < e.__k.length; t++) if ((n = e.__k[t]) != null && n.__e != null) {
        e.__e = e.__c.base = n.__e;
        break;
      }
      return Dt(e);
    }
  }
  function at(e) {
    (!e.__d && (e.__d = true) && N.push(e) && !Y.__r++ || Ht !== p.debounceRendering) && ((Ht = p.debounceRendering) || At)(Y);
  }
  function Y() {
    var e, t, n, i, _, r, o, f;
    for (N.sort(ft); e = N.shift(); ) e.__d && (t = N.length, i = void 0, r = (_ = (n = e).__v).__e, o = [], f = [], n.__P && ((i = H({}, _)).__v = _.__v + 1, p.vnode && p.vnode(i), mt(n.__P, i, _, n.__n, n.__P.namespaceURI, 32 & _.__u ? [r] : null, o, r ?? T(_), !!(32 & _.__u), f), i.__v = _.__v, i.__.__k[i.__i] = i, Rt(o, i, f), i.__e != r && Dt(i)), N.length > t && N.sort(ft));
    Y.__r = 0;
  }
  function Lt(e, t, n, i, _, r, o, f, c, s, l) {
    var u, h, a, w, S, k, m = i && i.__k || Mt, y = t.length;
    for (c = pe(n, t, m, c, y), u = 0; u < y; u++) (a = n.__k[u]) != null && (h = a.__i === -1 ? I : m[a.__i] || I, a.__i = u, k = mt(e, a, h, _, r, o, f, c, s, l), w = a.__e, a.ref && h.ref != a.ref && (h.ref && yt(h.ref, null, a), l.push(a.ref, a.__c || w, a)), S == null && w != null && (S = w), 4 & a.__u || h.__k === a.__k ? c = qt(a, c, e) : typeof a.type == "function" && k !== void 0 ? c = k : w && (c = w.nextSibling), a.__u &= -7);
    return n.__e = S, c;
  }
  function pe(e, t, n, i, _) {
    var r, o, f, c, s, l = n.length, u = l, h = 0;
    for (e.__k = new Array(_), r = 0; r < _; r++) (o = t[r]) != null && typeof o != "boolean" && typeof o != "function" ? (c = r + h, (o = e.__k[r] = typeof o == "string" || typeof o == "number" || typeof o == "bigint" || o.constructor == String ? X(null, o, null, null, null) : pt(o) ? X(O, { children: o }, null, null, null) : o.constructor === void 0 && o.__b > 0 ? X(o.type, o.props, o.key, o.ref ? o.ref : null, o.__v) : o).__ = e, o.__b = e.__b + 1, f = null, (s = o.__i = ve(o, n, c, u)) !== -1 && (u--, (f = n[s]) && (f.__u |= 2)), f == null || f.__v === null ? (s == -1 && h--, typeof o.type != "function" && (o.__u |= 4)) : s != c && (s == c - 1 ? h-- : s == c + 1 ? h++ : (s > c ? h-- : h++, o.__u |= 4))) : e.__k[r] = null;
    if (u) for (r = 0; r < l; r++) (f = n[r]) != null && (2 & f.__u) == 0 && (f.__e == i && (i = T(f)), Wt(f, f));
    return i;
  }
  function qt(e, t, n) {
    var i, _;
    if (typeof e.type == "function") {
      for (i = e.__k, _ = 0; i && _ < i.length; _++) i[_] && (i[_].__ = e, t = qt(i[_], t, n));
      return t;
    }
    e.__e != t && (t && e.type && !n.contains(t) && (t = T(e)), n.insertBefore(e.__e, t || null), t = e.__e);
    do
      t = t && t.nextSibling;
    while (t != null && t.nodeType == 8);
    return t;
  }
  function ve(e, t, n, i) {
    var _, r, o = e.key, f = e.type, c = t[n];
    if (c === null || c && o == c.key && f === c.type && (2 & c.__u) == 0) return n;
    if (i > (c != null && (2 & c.__u) == 0 ? 1 : 0)) for (_ = n - 1, r = n + 1; _ >= 0 || r < t.length; ) {
      if (_ >= 0) {
        if ((c = t[_]) && (2 & c.__u) == 0 && o == c.key && f === c.type) return _;
        _--;
      }
      if (r < t.length) {
        if ((c = t[r]) && (2 & c.__u) == 0 && o == c.key && f === c.type) return r;
        r++;
      }
    }
    return -1;
  }
  function Pt(e, t, n) {
    t[0] == "-" ? e.setProperty(t, n ?? "") : e[t] = n == null ? "" : typeof n != "number" || le.test(t) ? n : n + "px";
  }
  function Q(e, t, n, i, _) {
    var r;
    t: if (t == "style") if (typeof n == "string") e.style.cssText = n;
    else {
      if (typeof i == "string" && (e.style.cssText = i = ""), i) for (t in i) n && t in n || Pt(e.style, t, "");
      if (n) for (t in n) i && n[t] === i[t] || Pt(e.style, t, n[t]);
    }
    else if (t[0] == "o" && t[1] == "n") r = t != (t = t.replace(Ft, "$1")), t = t.toLowerCase() in e || t == "onFocusOut" || t == "onFocusIn" ? t.toLowerCase().slice(2) : t.slice(2), e.l || (e.l = {}), e.l[t + r] = n, n ? i ? n.u = i.u : (n.u = ht, e.addEventListener(t, r ? ct : st, r)) : e.removeEventListener(t, r ? ct : st, r);
    else {
      if (_ == "http://www.w3.org/2000/svg") t = t.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if (t != "width" && t != "height" && t != "href" && t != "list" && t != "form" && t != "tabIndex" && t != "download" && t != "rowSpan" && t != "colSpan" && t != "role" && t != "popover" && t in e) try {
        e[t] = n ?? "";
        break t;
      } catch {
      }
      typeof n == "function" || (n == null || n === false && t[4] != "-" ? e.removeAttribute(t) : e.setAttribute(t, t == "popover" && n == 1 ? "" : n));
    }
  }
  function Nt(e) {
    return function(t) {
      if (this.l) {
        var n = this.l[t.type + e];
        if (t.t == null) t.t = ht++;
        else if (t.t < n.u) return;
        return n(p.event ? p.event(t) : t);
      }
    };
  }
  function mt(e, t, n, i, _, r, o, f, c, s) {
    var l, u, h, a, w, S, k, m, y, q, U, J, R, Ut, K, ot, ut, x = t.type;
    if (t.constructor !== void 0) return null;
    128 & n.__u && (c = !!(32 & n.__u), r = [f = t.__e = n.__e]), (l = p.__b) && l(t);
    t: if (typeof x == "function") try {
      if (m = t.props, y = "prototype" in x && x.prototype.render, q = (l = x.contextType) && i[l.__c], U = l ? q ? q.props.value : l.__ : i, n.__c ? k = (u = t.__c = n.__c).__ = u.__E : (y ? t.__c = u = new x(m, U) : (t.__c = u = new $(m, U), u.constructor = x, u.render = me), q && q.sub(u), u.props = m, u.state || (u.state = {}), u.context = U, u.__n = i, h = u.__d = true, u.__h = [], u._sb = []), y && u.__s == null && (u.__s = u.state), y && x.getDerivedStateFromProps != null && (u.__s == u.state && (u.__s = H({}, u.__s)), H(u.__s, x.getDerivedStateFromProps(m, u.__s))), a = u.props, w = u.state, u.__v = t, h) y && x.getDerivedStateFromProps == null && u.componentWillMount != null && u.componentWillMount(), y && u.componentDidMount != null && u.__h.push(u.componentDidMount);
      else {
        if (y && x.getDerivedStateFromProps == null && m !== a && u.componentWillReceiveProps != null && u.componentWillReceiveProps(m, U), !u.__e && (u.shouldComponentUpdate != null && u.shouldComponentUpdate(m, u.__s, U) === false || t.__v == n.__v)) {
          for (t.__v != n.__v && (u.props = m, u.state = u.__s, u.__d = false), t.__e = n.__e, t.__k = n.__k, t.__k.some(function(W) {
            W && (W.__ = t);
          }), J = 0; J < u._sb.length; J++) u.__h.push(u._sb[J]);
          u._sb = [], u.__h.length && o.push(u);
          break t;
        }
        u.componentWillUpdate != null && u.componentWillUpdate(m, u.__s, U), y && u.componentDidUpdate != null && u.__h.push(function() {
          u.componentDidUpdate(a, w, S);
        });
      }
      if (u.context = U, u.props = m, u.__P = e, u.__e = false, R = p.__r, Ut = 0, y) {
        for (u.state = u.__s, u.__d = false, R && R(t), l = u.render(u.props, u.state, u.context), K = 0; K < u._sb.length; K++) u.__h.push(u._sb[K]);
        u._sb = [];
      } else do
        u.__d = false, R && R(t), l = u.render(u.props, u.state, u.context), u.state = u.__s;
      while (u.__d && ++Ut < 25);
      u.state = u.__s, u.getChildContext != null && (i = H(H({}, i), u.getChildContext())), y && !h && u.getSnapshotBeforeUpdate != null && (S = u.getSnapshotBeforeUpdate(a, w)), f = Lt(e, pt(ot = l != null && l.type === O && l.key == null ? l.props.children : l) ? ot : [ot], t, n, i, _, r, o, f, c, s), u.base = t.__e, t.__u &= -161, u.__h.length && o.push(u), k && (u.__E = u.__ = null);
    } catch (W) {
      if (t.__v = null, c || r != null) if (W.then) {
        for (t.__u |= c ? 160 : 128; f && f.nodeType == 8 && f.nextSibling; ) f = f.nextSibling;
        r[r.indexOf(f)] = null, t.__e = f;
      } else for (ut = r.length; ut--; ) vt(r[ut]);
      else t.__e = n.__e, t.__k = n.__k;
      p.__e(W, t, n);
    }
    else r == null && t.__v == n.__v ? (t.__k = n.__k, t.__e = n.__e) : f = t.__e = de(n.__e, t, n, i, _, r, o, c, s);
    return (l = p.diffed) && l(t), 128 & t.__u ? void 0 : f;
  }
  function Rt(e, t, n) {
    for (var i = 0; i < n.length; i++) yt(n[i], n[++i], n[++i]);
    p.__c && p.__c(t, e), e.some(function(_) {
      try {
        e = _.__h, _.__h = [], e.some(function(r) {
          r.call(_);
        });
      } catch (r) {
        p.__e(r, _.__v);
      }
    });
  }
  function de(e, t, n, i, _, r, o, f, c) {
    var s, l, u, h, a, w, S, k = n.props, m = t.props, y = t.type;
    if (y == "svg" ? _ = "http://www.w3.org/2000/svg" : y == "math" ? _ = "http://www.w3.org/1998/Math/MathML" : _ || (_ = "http://www.w3.org/1999/xhtml"), r != null) {
      for (s = 0; s < r.length; s++) if ((a = r[s]) && "setAttribute" in a == !!y && (y ? a.localName == y : a.nodeType == 3)) {
        e = a, r[s] = null;
        break;
      }
    }
    if (e == null) {
      if (y == null) return document.createTextNode(m);
      e = document.createElementNS(_, y, m.is && m), f && (p.__m && p.__m(t, r), f = false), r = null;
    }
    if (y === null) k === m || f && e.data === m || (e.data = m);
    else {
      if (r = r && Z.call(e.childNodes), k = n.props || I, !f && r != null) for (k = {}, s = 0; s < e.attributes.length; s++) k[(a = e.attributes[s]).name] = a.value;
      for (s in k) if (a = k[s], s != "children") {
        if (s == "dangerouslySetInnerHTML") u = a;
        else if (!(s in m)) {
          if (s == "value" && "defaultValue" in m || s == "checked" && "defaultChecked" in m) continue;
          Q(e, s, null, a, _);
        }
      }
      for (s in m) a = m[s], s == "children" ? h = a : s == "dangerouslySetInnerHTML" ? l = a : s == "value" ? w = a : s == "checked" ? S = a : f && typeof a != "function" || k[s] === a || Q(e, s, a, k[s], _);
      if (l) f || u && (l.__html === u.__html || l.__html === e.innerHTML) || (e.innerHTML = l.__html), t.__k = [];
      else if (u && (e.innerHTML = ""), Lt(e, pt(h) ? h : [h], t, n, i, y == "foreignObject" ? "http://www.w3.org/1999/xhtml" : _, r, o, r ? r[0] : n.__k && T(n, 0), f, c), r != null) for (s = r.length; s--; ) vt(r[s]);
      f || (s = "value", y == "progress" && w == null ? e.removeAttribute("value") : w !== void 0 && (w !== e[s] || y == "progress" && !w || y == "option" && w !== k[s]) && Q(e, s, w, k[s], _), s = "checked", S !== void 0 && S !== e[s] && Q(e, s, S, k[s], _));
    }
    return e;
  }
  function yt(e, t, n) {
    try {
      if (typeof e == "function") {
        var i = typeof e.__u == "function";
        i && e.__u(), i && t == null || (e.__u = e(t));
      } else e.current = t;
    } catch (_) {
      p.__e(_, n);
    }
  }
  function Wt(e, t, n) {
    var i, _;
    if (p.unmount && p.unmount(e), (i = e.ref) && (i.current && i.current !== e.__e || yt(i, null, t)), (i = e.__c) != null) {
      if (i.componentWillUnmount) try {
        i.componentWillUnmount();
      } catch (r) {
        p.__e(r, t);
      }
      i.base = i.__P = null;
    }
    if (i = e.__k) for (_ = 0; _ < i.length; _++) i[_] && Wt(i[_], t, n || typeof e.type != "function");
    n || vt(e.__e), e.__c = e.__ = e.__e = void 0;
  }
  function me(e, t, n) {
    return this.constructor(e, n);
  }
  function ye(e, t, n) {
    var i, _, r, o;
    t == document && (t = document.documentElement), p.__ && p.__(e, t), _ = (i = typeof n == "function") ? null : n && n.__k || t.__k, r = [], o = [], mt(t, e = (!i && n || t).__k = dt(O, null, [e]), _ || I, I, t.namespaceURI, !i && n ? [n] : _ ? null : t.firstChild ? Z.call(t.childNodes) : null, r, !i && n ? n : _ ? _.__e : t.firstChild, i, o), Rt(r, e, o);
  }
  function ge(e, t) {
    var n = { __c: t = "__cC" + Tt++, __: e, Consumer: function(i, _) {
      return i.children(_);
    }, Provider: function(i) {
      var _, r;
      return this.getChildContext || (_ = /* @__PURE__ */ new Set(), (r = {})[t] = this, this.getChildContext = function() {
        return r;
      }, this.componentWillUnmount = function() {
        _ = null;
      }, this.shouldComponentUpdate = function(o) {
        this.props.value !== o.value && _.forEach(function(f) {
          f.__e = true, at(f);
        });
      }, this.sub = function(o) {
        _.add(o);
        var f = o.componentWillUnmount;
        o.componentWillUnmount = function() {
          _ && _.delete(o), f && f.call(o);
        };
      }), i.children;
    } };
    return n.Provider.__ = n.Consumer.contextType = n;
  }
  Z = Mt.slice, p = { __e: function(e, t, n, i) {
    for (var _, r, o; t = t.__; ) if ((_ = t.__c) && !_.__) try {
      if ((r = _.constructor) && r.getDerivedStateFromError != null && (_.setState(r.getDerivedStateFromError(e)), o = _.__d), _.componentDidCatch != null && (_.componentDidCatch(e, i || {}), o = _.__d), o) return _.__E = _;
    } catch (f) {
      e = f;
    }
    throw e;
  } }, $t = 0, lt = function(e) {
    return e != null && e.constructor == null;
  }, $.prototype.setState = function(e, t) {
    var n;
    n = this.__s != null && this.__s !== this.state ? this.__s : this.__s = H({}, this.state), typeof e == "function" && (e = e(H({}, n), this.props)), e && H(n, e), e != null && this.__v && (t && this._sb.push(t), at(this));
  }, $.prototype.forceUpdate = function(e) {
    this.__v && (this.__e = true, e && this.__h.push(e), at(this));
  }, $.prototype.render = O, N = [], At = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, ft = function(e, t) {
    return e.__v.__b - t.__v.__b;
  }, Y.__r = 0, Ft = /(PointerCapture)$|Capture$/i, ht = 0, st = Nt(false), ct = Nt(true), Tt = 0;
  var C;
  var v;
  var gt;
  var It;
  var V = 0;
  var Kt = [];
  var g = p;
  var Ot = g.__b;
  var Vt = g.__r;
  var jt = g.diffed;
  var Bt = g.__c;
  var zt = g.unmount;
  var Gt = g.__;
  function A(e, t) {
    g.__h && g.__h(v, e, V || t), V = 0;
    var n = v.__H || (v.__H = { __: [], __h: [] });
    return e >= n.__.length && n.__.push({}), n.__[e];
  }
  function Qt(e) {
    return V = 1, Xt(Yt, e);
  }
  function Xt(e, t, n) {
    var i = A(C++, 2);
    if (i.t = e, !i.__c && (i.__ = [n ? n(t) : Yt(void 0, t), function(f) {
      var c = i.__N ? i.__N[0] : i.__[0], s = i.t(c, f);
      c !== s && (i.__N = [s, i.__[1]], i.__c.setState({}));
    }], i.__c = v, !v.u)) {
      var _ = function(f, c, s) {
        if (!i.__c.__H) return true;
        var l = i.__c.__H.__.filter(function(h) {
          return !!h.__c;
        });
        if (l.every(function(h) {
          return !h.__N;
        })) return !r || r.call(this, f, c, s);
        var u = i.__c.props !== f;
        return l.forEach(function(h) {
          if (h.__N) {
            var a = h.__[0];
            h.__ = h.__N, h.__N = void 0, a !== h.__[0] && (u = true);
          }
        }), r && r.call(this, f, c, s) || u;
      };
      v.u = true;
      var r = v.shouldComponentUpdate, o = v.componentWillUpdate;
      v.componentWillUpdate = function(f, c, s) {
        if (this.__e) {
          var l = r;
          r = void 0, _(f, c, s), r = l;
        }
        o && o.call(this, f, c, s);
      }, v.shouldComponentUpdate = _;
    }
    return i.__N || i.__;
  }
  function wt(e, t) {
    var n = A(C++, 3);
    !g.__s && kt(n.__H, t) && (n.__ = e, n.i = t, v.__H.__h.push(n));
  }
  function et(e) {
    return V = 5, F(function() {
      return { current: e };
    }, []);
  }
  function F(e, t) {
    var n = A(C++, 7);
    return kt(n.__H, t) && (n.__ = e(), n.__H = t, n.__h = e), n.__;
  }
  function ke(e) {
    var t = v.context[e.__c], n = A(C++, 9);
    return n.c = e, t ? (n.__ == null && (n.__ = true, t.sub(v)), t.props.value) : e.__;
  }
  function Ce() {
    for (var e; e = Kt.shift(); ) if (e.__P && e.__H) try {
      e.__H.__h.forEach(tt), e.__H.__h.forEach(bt), e.__H.__h = [];
    } catch (t) {
      e.__H.__h = [], g.__e(t, e.__v);
    }
  }
  g.__b = function(e) {
    v = null, Ot && Ot(e);
  }, g.__ = function(e, t) {
    e && t.__k && t.__k.__m && (e.__m = t.__k.__m), Gt && Gt(e, t);
  }, g.__r = function(e) {
    Vt && Vt(e), C = 0;
    var t = (v = e.__c).__H;
    t && (gt === v ? (t.__h = [], v.__h = [], t.__.forEach(function(n) {
      n.__N && (n.__ = n.__N), n.i = n.__N = void 0;
    })) : (t.__h.forEach(tt), t.__h.forEach(bt), t.__h = [], C = 0)), gt = v;
  }, g.diffed = function(e) {
    jt && jt(e);
    var t = e.__c;
    t && t.__H && (t.__H.__h.length && (Kt.push(t) !== 1 && It === g.requestAnimationFrame || ((It = g.requestAnimationFrame) || Ee)(Ce)), t.__H.__.forEach(function(n) {
      n.i && (n.__H = n.i), n.i = void 0;
    })), gt = v = null;
  }, g.__c = function(e, t) {
    t.some(function(n) {
      try {
        n.__h.forEach(tt), n.__h = n.__h.filter(function(i) {
          return !i.__ || bt(i);
        });
      } catch (i) {
        t.some(function(_) {
          _.__h && (_.__h = []);
        }), t = [], g.__e(i, n.__v);
      }
    }), Bt && Bt(e, t);
  }, g.unmount = function(e) {
    zt && zt(e);
    var t, n = e.__c;
    n && n.__H && (n.__H.__.forEach(function(i) {
      try {
        tt(i);
      } catch (_) {
        t = _;
      }
    }), n.__H = void 0, t && g.__e(t, n.__v));
  };
  var Jt = typeof requestAnimationFrame == "function";
  function Ee(e) {
    var t, n = function() {
      clearTimeout(i), Jt && cancelAnimationFrame(t), setTimeout(e);
    }, i = setTimeout(n, 100);
    Jt && (t = requestAnimationFrame(n));
  }
  function tt(e) {
    var t = v, n = e.__c;
    typeof n == "function" && (e.__c = void 0, n()), v = t;
  }
  function bt(e) {
    var t = v;
    e.__c = e.__(), v = t;
  }
  function kt(e, t) {
    return !e || e.length !== t.length || t.some(function(n, i) {
      return n !== e[i];
    });
  }
  function Yt(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  var Ue = Symbol.for("preact-signals");
  function it() {
    if (P > 1) P--;
    else {
      for (var e, t = false; j !== void 0; ) {
        var n = j;
        for (j = void 0, St++; n !== void 0; ) {
          var i = n.o;
          if (n.o = void 0, n.f &= -3, !(8 & n.f) && te(n)) try {
            n.c();
          } catch (_) {
            t || (e = _, t = true);
          }
          n = i;
        }
      }
      if (St = 0, P--, t) throw e;
    }
  }
  function B(e) {
    if (P > 0) return e();
    P++;
    try {
      return e();
    } finally {
      it();
    }
  }
  var d = void 0;
  var j = void 0;
  var P = 0;
  var St = 0;
  var nt = 0;
  function Zt(e) {
    if (d !== void 0) {
      var t = e.n;
      if (t === void 0 || t.t !== d) return t = { i: 0, S: e, p: d.s, n: void 0, t: d, e: void 0, x: void 0, r: t }, d.s !== void 0 && (d.s.n = t), d.s = t, e.n = t, 32 & d.f && e.S(t), t;
      if (t.i === -1) return t.i = 0, t.n !== void 0 && (t.n.p = t.p, t.p !== void 0 && (t.p.n = t.n), t.p = d.s, t.n = void 0, d.s.n = t, d.s = t), t;
    }
  }
  function b(e) {
    this.v = e, this.i = 0, this.n = void 0, this.t = void 0;
  }
  b.prototype.brand = Ue;
  b.prototype.h = function() {
    return true;
  };
  b.prototype.S = function(e) {
    this.t !== e && e.e === void 0 && (e.x = this.t, this.t !== void 0 && (this.t.e = e), this.t = e);
  };
  b.prototype.U = function(e) {
    if (this.t !== void 0) {
      var t = e.e, n = e.x;
      t !== void 0 && (t.x = n, e.e = void 0), n !== void 0 && (n.e = t, e.x = void 0), e === this.t && (this.t = n);
    }
  };
  b.prototype.subscribe = function(e) {
    var t = this;
    return E(function() {
      var n = t.value, i = d;
      d = void 0;
      try {
        e(n);
      } finally {
        d = i;
      }
    });
  };
  b.prototype.valueOf = function() {
    return this.value;
  };
  b.prototype.toString = function() {
    return this.value + "";
  };
  b.prototype.toJSON = function() {
    return this.value;
  };
  b.prototype.peek = function() {
    var e = d;
    d = void 0;
    try {
      return this.value;
    } finally {
      d = e;
    }
  };
  Object.defineProperty(b.prototype, "value", { get: function() {
    var e = Zt(this);
    return e !== void 0 && (e.i = this.i), this.v;
  }, set: function(e) {
    if (e !== this.v) {
      if (St > 100) throw new Error("Cycle detected");
      this.v = e, this.i++, nt++, P++;
      try {
        for (var t = this.t; t !== void 0; t = t.x) t.t.N();
      } finally {
        it();
      }
    }
  } });
  function z(e) {
    return new b(e);
  }
  function te(e) {
    for (var t = e.s; t !== void 0; t = t.n) if (t.S.i !== t.i || !t.S.h() || t.S.i !== t.i) return true;
    return false;
  }
  function ee(e) {
    for (var t = e.s; t !== void 0; t = t.n) {
      var n = t.S.n;
      if (n !== void 0 && (t.r = n), t.S.n = t, t.i = -1, t.n === void 0) {
        e.s = t;
        break;
      }
    }
  }
  function ne(e) {
    for (var t = e.s, n = void 0; t !== void 0; ) {
      var i = t.p;
      t.i === -1 ? (t.S.U(t), i !== void 0 && (i.n = t.n), t.n !== void 0 && (t.n.p = i)) : n = t, t.S.n = t.r, t.r !== void 0 && (t.r = void 0), t = i;
    }
    e.s = n;
  }
  function M(e) {
    b.call(this, void 0), this.x = e, this.s = void 0, this.g = nt - 1, this.f = 4;
  }
  (M.prototype = new b()).h = function() {
    if (this.f &= -3, 1 & this.f) return false;
    if ((36 & this.f) == 32 || (this.f &= -5, this.g === nt)) return true;
    if (this.g = nt, this.f |= 1, this.i > 0 && !te(this)) return this.f &= -2, true;
    var e = d;
    try {
      ee(this), d = this;
      var t = this.x();
      (16 & this.f || this.v !== t || this.i === 0) && (this.v = t, this.f &= -17, this.i++);
    } catch (n) {
      this.v = n, this.f |= 16, this.i++;
    }
    return d = e, ne(this), this.f &= -2, true;
  };
  M.prototype.S = function(e) {
    if (this.t === void 0) {
      this.f |= 36;
      for (var t = this.s; t !== void 0; t = t.n) t.S.S(t);
    }
    b.prototype.S.call(this, e);
  };
  M.prototype.U = function(e) {
    if (this.t !== void 0 && (b.prototype.U.call(this, e), this.t === void 0)) {
      this.f &= -33;
      for (var t = this.s; t !== void 0; t = t.n) t.S.U(t);
    }
  };
  M.prototype.N = function() {
    if (!(2 & this.f)) {
      this.f |= 6;
      for (var e = this.t; e !== void 0; e = e.x) e.t.N();
    }
  };
  Object.defineProperty(M.prototype, "value", { get: function() {
    if (1 & this.f) throw new Error("Cycle detected");
    var e = Zt(this);
    if (this.h(), e !== void 0 && (e.i = this.i), 16 & this.f) throw this.v;
    return this.v;
  } });
  function D(e) {
    return new M(e);
  }
  function ie(e) {
    var t = e.u;
    if (e.u = void 0, typeof t == "function") {
      P++;
      var n = d;
      d = void 0;
      try {
        t();
      } catch (i) {
        throw e.f &= -2, e.f |= 8, xt(e), i;
      } finally {
        d = n, it();
      }
    }
  }
  function xt(e) {
    for (var t = e.s; t !== void 0; t = t.n) t.S.U(t);
    e.x = void 0, e.s = void 0, ie(e);
  }
  function He(e) {
    if (d !== this) throw new Error("Out-of-order effect");
    ne(this), d = e, this.f &= -2, 8 & this.f && xt(this), it();
  }
  function G(e) {
    this.x = e, this.u = void 0, this.s = void 0, this.o = void 0, this.f = 32;
  }
  G.prototype.c = function() {
    var e = this.S();
    try {
      if (8 & this.f || this.x === void 0) return;
      var t = this.x();
      typeof t == "function" && (this.u = t);
    } finally {
      e();
    }
  };
  G.prototype.S = function() {
    if (1 & this.f) throw new Error("Cycle detected");
    this.f |= 1, this.f &= -9, ie(this), ee(this), P++;
    var e = d;
    return d = this, He.bind(this, e);
  };
  G.prototype.N = function() {
    2 & this.f || (this.f |= 2, this.o = j, j = this);
  };
  G.prototype.d = function() {
    this.f |= 8, 1 & this.f || xt(this);
  };
  function E(e) {
    var t = new G(e);
    try {
      t.c();
    } catch (n) {
      throw t.d(), n;
    }
    return t.d.bind(t);
  }
  var Et;
  var _t;
  var Ct;
  var _e = [];
  E(function() {
    Et = this.N;
  })();
  function L(e, t) {
    p[e] = t.bind(null, p[e] || function() {
    });
  }
  function rt(e) {
    Ct && Ct(), Ct = e && e.S();
  }
  function oe(e) {
    var t = this, n = e.data, i = ue(n);
    i.value = n;
    var _ = F(function() {
      for (var f = t, c = t.__v; c = c.__; ) if (c.__c) {
        c.__c.__$f |= 4;
        break;
      }
      var s = D(function() {
        var a = i.value.value;
        return a === 0 ? 0 : a === true ? "" : a || "";
      }), l = D(function() {
        return !lt(s.value);
      }), u = E(function() {
        if (this.N = fe, l.value) {
          var a = s.value;
          f.base && f.base.nodeType === 3 && (f.base.data = a);
        }
      }), h = t.__$u.d;
      return t.__$u.d = function() {
        u(), h.call(this);
      }, [l, s];
    }, []), r = _[0], o = _[1];
    return r.value ? o.peek() : o.value;
  }
  oe.displayName = "_st";
  Object.defineProperties(b.prototype, { constructor: { configurable: true, value: void 0 }, type: { configurable: true, value: oe }, props: { configurable: true, get: function() {
    return { data: this };
  } }, __b: { configurable: true, value: 1 } });
  L("__b", function(e, t) {
    if (typeof t.type == "string") {
      var n, i = t.props;
      for (var _ in i) if (_ !== "children") {
        var r = i[_];
        r instanceof b && (n || (t.__np = n = {}), n[_] = r, i[_] = r.peek());
      }
    }
    e(t);
  });
  L("__r", function(e, t) {
    rt();
    var n, i = t.__c;
    i && (i.__$f &= -2, (n = i.__$u) === void 0 && (i.__$u = n = function(_) {
      var r;
      return E(function() {
        r = this;
      }), r.c = function() {
        i.__$f |= 1, i.setState({});
      }, r;
    }())), _t = i, rt(n), e(t);
  });
  L("__e", function(e, t, n, i) {
    rt(), _t = void 0, e(t, n, i);
  });
  L("diffed", function(e, t) {
    rt(), _t = void 0;
    var n;
    if (typeof t.type == "string" && (n = t.__e)) {
      var i = t.__np, _ = t.props;
      if (i) {
        var r = n.U;
        if (r) for (var o in r) {
          var f = r[o];
          f !== void 0 && !(o in i) && (f.d(), r[o] = void 0);
        }
        else r = {}, n.U = r;
        for (var c in i) {
          var s = r[c], l = i[c];
          s === void 0 ? (s = Pe(n, c, l, _), r[c] = s) : s.o(l, _);
        }
      }
    }
    e(t);
  });
  function Pe(e, t, n, i) {
    var _ = t in e && e.ownerSVGElement === void 0, r = z(n);
    return { o: function(o, f) {
      r.value = o, i = f;
    }, d: E(function() {
      this.N = fe;
      var o = r.value.value;
      i[t] !== o && (i[t] = o, _ ? e[t] = o : o ? e.setAttribute(t, o) : e.removeAttribute(t));
    }) };
  }
  L("unmount", function(e, t) {
    if (typeof t.type == "string") {
      var n = t.__e;
      if (n) {
        var i = n.U;
        if (i) {
          n.U = void 0;
          for (var _ in i) {
            var r = i[_];
            r && r.d();
          }
        }
      }
    } else {
      var o = t.__c;
      if (o) {
        var f = o.__$u;
        f && (o.__$u = void 0, f.d());
      }
    }
    e(t);
  });
  L("__h", function(e, t, n, i) {
    (i < 3 || i === 9) && (t.__$f |= 2), e(t, n, i);
  });
  $.prototype.shouldComponentUpdate = function(e, t) {
    var n = this.__$u, i = n && n.s !== void 0;
    for (var _ in t) return true;
    if (this.__f || typeof this.u == "boolean" && this.u === true) {
      var r = 2 & this.__$f;
      if (!(i || r || 4 & this.__$f) || 1 & this.__$f) return true;
    } else if (!(i || 4 & this.__$f) || 3 & this.__$f) return true;
    for (var o in e) if (o !== "__source" && e[o] !== this.props[o]) return true;
    for (var f in this.props) if (!(f in e)) return true;
    return false;
  };
  function ue(e) {
    return F(function() {
      return z(e);
    }, []);
  }
  var Ae = function(e) {
    queueMicrotask(function() {
      queueMicrotask(e);
    });
  };
  function Me() {
    B(function() {
      for (var e; e = _e.shift(); ) Et.call(e);
    });
  }
  function fe() {
    _e.push(this) === 1 && (p.requestAnimationFrame || Ae)(Me);
  }
  var ce = function(e, t, n, i) {
    var _;
    t[0] = 0;
    for (var r = 1; r < t.length; r++) {
      var o = t[r++], f = t[r] ? (t[0] |= o ? 1 : 2, n[t[r++]]) : t[++r];
      o === 3 ? i[0] = f : o === 4 ? i[1] = Object.assign(i[1] || {}, f) : o === 5 ? (i[1] = i[1] || {})[t[++r]] = f : o === 6 ? i[1][t[++r]] += f + "" : o ? (_ = e.apply(f, ce(e, f, n, ["", null])), i.push(_), f[0] ? t[0] |= 2 : (t[r - 2] = 0, t[r] = _)) : i.push(f);
    }
    return i;
  };
  var se = /* @__PURE__ */ new Map();
  function ae(e) {
    var t = se.get(this);
    return t || (t = /* @__PURE__ */ new Map(), se.set(this, t)), (t = ce(this, t.get(e) || (t.set(e, t = function(n) {
      for (var i, _, r = 1, o = "", f = "", c = [0], s = function(h) {
        r === 1 && (h || (o = o.replace(/^\s*\n\s*|\s*\n\s*$/g, ""))) ? c.push(0, h, o) : r === 3 && (h || o) ? (c.push(3, h, o), r = 2) : r === 2 && o === "..." && h ? c.push(4, h, 0) : r === 2 && o && !h ? c.push(5, 0, true, o) : r >= 5 && ((o || !h && r === 5) && (c.push(r, 0, o, _), r = 6), h && (c.push(r, h, 0, _), r = 6)), o = "";
      }, l = 0; l < n.length; l++) {
        l && (r === 1 && s(), s(l));
        for (var u = 0; u < n[l].length; u++) i = n[l][u], r === 1 ? i === "<" ? (s(), c = [c], r = 3) : o += i : r === 4 ? o === "--" && i === ">" ? (r = 1, o = "") : o = i + o[0] : f ? i === f ? f = "" : o += i : i === '"' || i === "'" ? f = i : i === ">" ? (s(), r = 1) : r && (i === "=" ? (r = 5, _ = o, o = "") : i === "/" && (r < 5 || n[l][u + 1] === ">") ? (s(), r === 3 && (c = c[0]), r = c, (c = c[0]).push(2, 0, r), r = 0) : i === " " || i === "	" || i === `
` || i === "\r" ? (s(), r = 2) : o += i), r === 3 && o === "!--" && (r = 4, c = c[0]);
      }
      return s(), c;
    }(e)), t), arguments, [])).length > 1 ? t : t[0];
  }
  var Ye = ae.bind(dt);

  // AppContext.jsx
  var defaultAppContext = {
    focusModes: [],
    tags: [],
    notes: []
  };
  var AppContext = ge(null);
  function AppProvider({ children }) {
    const [appContext, setAppContext] = Qt(defaultAppContext);
    const updateAppContext = (newState) => {
      setAppContext((prevState) => ({
        ...prevState,
        ...newState
      }));
    };
    return /* @__PURE__ */ dt(AppContext.Provider, { value: { appContext, updateAppContext } }, children);
  }
  var useAppContext = () => {
    const context = ke(AppContext);
    if (!context) {
      throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
  };

  // commons/http/ApiClient.js
  async function request(method, url, payload) {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    };
    const response = await fetch(url, options);
    return await response.json();
  }
  async function getAllFocusModes() {
    return await request("GET", "/api/focus");
  }
  async function createFocusMode() {
    return await request("POST", "/api/focus/new");
  }
  async function getAllNotes() {
    return await request("GET", "/api/notes");
  }
  async function getNoteById(noteId) {
    return await request("GET", `/api/notes/${noteId}`);
  }
  async function getNotesByTagId(tagId) {
    return await request("GET", `/api/notes?tag_id=${tagId}`);
  }
  async function createNote(note) {
    return await request("POST", "/api/notes/", note);
  }
  async function updateNote(noteId, note) {
    return await request("PUT", `/api/notes/${noteId}`, note);
  }
  async function getAllTags() {
    return await request("GET", "/api/tags");
  }
  async function searchTags(query) {
    return await request("GET", `/api/tags?query=${query}`);
  }
  async function uploadImage(formData) {
    return await request("POST", "/api/images/", formData);
  }
  var ApiClient_default = {
    request,
    getAllFocusModes,
    createFocusMode,
    getAllNotes,
    getNoteById,
    getNotesByTagId,
    createNote,
    updateNote,
    getAllTags,
    searchTags,
    uploadImage
  };

  // commons/components/Router.jsx
  function Router({ children }) {
    const [currentPath, setCurrentPath] = Qt(window.location.pathname);
    wt(() => {
      function handleLocationChange() {
        setCurrentPath(window.location.pathname);
      }
      window.addEventListener("navigate", handleLocationChange);
      window.addEventListener("popstate", handleLocationChange);
      return () => {
        window.removeEventListener("navigate", handleLocationChange);
        window.removeEventListener("popstate", handleLocationChange);
      };
    }, []);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const { path, component } = child.props;
      if (path.includes(":")) {
        const pathSegments = path.split("/");
        const pathPattern = pathSegments.map((segment) => {
          if (segment.startsWith(":")) {
            const paramName = segment.slice(1);
            return `(?<${paramName}>[^/]+)`;
          }
          return segment;
        }).join("\\/");
        const pattern = new RegExp(`^${pathPattern}$`);
        const match = pattern.exec(currentPath);
        if (match) {
          const params = match.groups;
          return dt(component, { ...params });
        }
      }
      if (currentPath === path) {
        return dt(component, {});
      }
    }
    return null;
  }

  // commons/components/Route.jsx
  function Route() {
    return null;
  }

  // commons/components/Link.jsx
  function Link({ to, children, className }) {
    const handleClick = (event) => {
      event.preventDefault();
      window.history.pushState({}, "", to);
      window.dispatchEvent(new PopStateEvent("navigate"));
    };
    return /* @__PURE__ */ dt("a", { href: to, onClick: handleClick, className }, children);
  }

  // commons/components/SidebarTagsList.jsx
  function SidebarTagsList({ tags = [] }) {
    return /* @__PURE__ */ dt("div", null, /* @__PURE__ */ dt("div", { className: "sidebar-section-title" }, "Tags"), tags.map((tag) => /* @__PURE__ */ dt(Link, { key: tag.tag_id, to: `/?tag_id=${tag.tag_id}` }, tag.name)));
  }
  var SidebarTagsList_default = SidebarTagsList;

  // commons/components/Sidebar.jsx
  function Sidebar() {
    const { appContext } = useAppContext();
    const { focusModes, tags } = appContext;
    return /* @__PURE__ */ dt("div", null, /* @__PURE__ */ dt("div", { className: "sidebar-focus-switcher" }, /* @__PURE__ */ dt("div", { className: "dropdown-button button" }, "All Notes", /* @__PURE__ */ dt(ArrowDownIcon, null)), /* @__PURE__ */ dt("div", { className: "dropdown-container" }, /* @__PURE__ */ dt("ul", { className: "dropdown-menu" }, focusModes?.map((mode) => /* @__PURE__ */ dt("li", { className: "dropdown-option" }, mode.Name)), /* @__PURE__ */ dt("li", { className: "dropdown-option" }, "Add new...")))), /* @__PURE__ */ dt(Link, { className: "sidebar-button", to: "/new" }, /* @__PURE__ */ dt(NewNoteIcon, null), "New"), /* @__PURE__ */ dt(Link, { className: "sidebar-button", to: "/" }, /* @__PURE__ */ dt(NotesIcon, null), "Notes"), /* @__PURE__ */ dt(Link, { className: "sidebar-button", to: "/" }, /* @__PURE__ */ dt(BoardIcon, null), "Boards"), /* @__PURE__ */ dt(Link, { className: "sidebar-button", to: "/" }, /* @__PURE__ */ dt(SearchIcon, null), "Search"), /* @__PURE__ */ dt(Link, { className: "sidebar-button", to: "/" }, /* @__PURE__ */ dt(SettingsIcon, null), "Settings"), /* @__PURE__ */ dt("div", { className: "sidebar-section" }, /* @__PURE__ */ dt(SidebarTagsList_default, { tags })));
  }
  function ArrowDownIcon() {
    return /* @__PURE__ */ dt("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-chevron-down" }, /* @__PURE__ */ dt("path", { d: "m6 9 6 6 6-6" }));
  }
  function NewNoteIcon() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-circle-plus"
      },
      /* @__PURE__ */ dt("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ dt("path", { d: "M8 12h8" }),
      /* @__PURE__ */ dt("path", { d: "M12 8v8" })
    );
  }
  function NotesIcon() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-files"
      },
      /* @__PURE__ */ dt("path", { d: "M20 7h-3a2 2 0 0 1-2-2V2" }),
      /* @__PURE__ */ dt("path", { d: "M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" }),
      /* @__PURE__ */ dt("path", { d: "M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" })
    );
  }
  function BoardIcon() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-layout-dashboard"
      },
      /* @__PURE__ */ dt("rect", { width: "7", height: "9", x: "3", y: "3", rx: "1" }),
      /* @__PURE__ */ dt("rect", { width: "7", height: "5", x: "14", y: "3", rx: "1" }),
      /* @__PURE__ */ dt("rect", { width: "7", height: "9", x: "14", y: "12", rx: "1" }),
      /* @__PURE__ */ dt("rect", { width: "7", height: "5", x: "3", y: "16", rx: "1" })
    );
  }
  function SearchIcon() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-search"
      },
      /* @__PURE__ */ dt("circle", { cx: "11", cy: "11", r: "8" }),
      /* @__PURE__ */ dt("path", { d: "m21 21-4.3-4.3" })
    );
  }
  function SettingsIcon() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-settings"
      },
      /* @__PURE__ */ dt(
        "path",
        {
          d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        }
      ),
      /* @__PURE__ */ dt("circle", { cx: "12", cy: "12", r: "3" })
    );
  }
  var Sidebar_default = Sidebar;

  // commons/components/NotesListToolbar.jsx
  function NotesListToolbar() {
    const setListViewPreference = (view) => {
      document.cookie = `listViewPreference=${view}; path=/; max-age=31536000`;
      if (window.zen) {
        window.zen.setListViewPreference(view);
      }
    };
    return /* @__PURE__ */ dt("div", { className: "notes-list-toolbar" }, /* @__PURE__ */ dt("div", { onClick: () => setListViewPreference("list") }, /* @__PURE__ */ dt(ListViewIcon, null)), /* @__PURE__ */ dt("div", { onClick: () => setListViewPreference("grid") }, /* @__PURE__ */ dt(GridViewIcon, null)));
  }
  function ListViewIcon() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-rows-3"
      },
      /* @__PURE__ */ dt("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
      /* @__PURE__ */ dt("path", { d: "M21 9H3" }),
      /* @__PURE__ */ dt("path", { d: "M21 15H3" })
    );
  }
  function GridViewIcon() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-layout-grid"
      },
      /* @__PURE__ */ dt("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }),
      /* @__PURE__ */ dt("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }),
      /* @__PURE__ */ dt("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }),
      /* @__PURE__ */ dt("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" })
    );
  }
  var NotesListToolbar_default = NotesListToolbar;

  // commons/components/NotesList.jsx
  function NotesList({ notes = [] }) {
    const items = notes.map((note) => /* @__PURE__ */ dt(NotesListItem, { note, key: note.NoteID }));
    return /* @__PURE__ */ dt("div", { className: "notes-list-fragment" }, /* @__PURE__ */ dt(NotesListToolbar_default, null), /* @__PURE__ */ dt("div", { className: "notes-list" }, items, /* @__PURE__ */ dt(EmptyList, { notes })));
  }
  function NotesListItem({ note }) {
    const link = `/${note.NoteID}`;
    const updatedAt = new Date(note.UpdatedAt).toISOString().split("T")[0].replace(/-/g, "/");
    const tags = note.Tags?.map((tag) => /* @__PURE__ */ dt("div", { className: "notes-list-item-subtext", key: tag.name }, tag.name));
    let title = /* @__PURE__ */ dt("div", { className: "notes-list-item-title" }, note.Title);
    if (note.Title === "") {
      title = /* @__PURE__ */ dt("div", { className: "notes-list-item-title untitled" }, "Untitled");
    }
    return /* @__PURE__ */ dt("div", { className: "notes-list-item" }, /* @__PURE__ */ dt(Link, { to: link }, title, /* @__PURE__ */ dt("div", { className: "notes-list-item-subcontainer" }, /* @__PURE__ */ dt("div", { className: "notes-list-item-subtext" }, updatedAt), /* @__PURE__ */ dt("div", { className: "notes-list-item-tags" }, tags))));
  }
  function EmptyList({ notes }) {
    if (notes.length > 0) {
      return null;
    }
    return /* @__PURE__ */ dt("div", { className: "notes-list-empty-text" }, "No notes found");
  }

  // commons/components/NotesEditorTags.jsx
  function NotesEditorTags({ tags, isEditable, onAddTag, onRemoveTag }) {
    const [query, setQuery] = Qt("");
    const [suggestions, setSuggestions] = Qt([]);
    const [selectedTag, setSelectedTag] = Qt(null);
    function handleKeyUp(e) {
      const value = e.target.value;
      setQuery(value);
      if (e.key === "ArrowDown") {
        const nextIndex = suggestions.indexOf(selectedTag) + 1;
        if (nextIndex < suggestions.length) {
          setSelectedTag(suggestions[nextIndex]);
        } else {
          setSelectedTag(suggestions[0]);
        }
        return;
      }
      if (e.key === "ArrowUp") {
        const prevIndex = suggestions.indexOf(selectedTag) - 1;
        if (prevIndex >= 0) {
          setSelectedTag(suggestions[prevIndex]);
        } else {
          setSelectedTag(suggestions[suggestions.length - 1]);
        }
        return;
      }
      if (e.key === "Enter" && selectedTag) {
        if (selectedTag.tag_id === -1) {
          onAddTag({ tag_id: -1, name: value });
        } else {
          onAddTag(selectedTag);
        }
        closeSuggestions(e);
        return;
      }
      if (e.key === "Escape") {
        closeSuggestions(e);
        return;
      }
      if (e.key === "Backspace" && value === "") {
        const lastTag = tags[tags.length - 1];
        if (lastTag) {
          onRemoveTag(lastTag);
        }
        closeSuggestions(e);
        return;
      }
      if (value === "") {
        setSuggestions([]);
        return;
      }
      ApiClient_default.searchTags(value).then((tagSuggestions) => {
        const existingTagIds = tags.map((tag) => tag.tag_id);
        const filteredTags = tagSuggestions.filter((tag) => !existingTagIds.includes(tag.tag_id));
        if (tagSuggestions.length === 0 && value.trim() !== "") {
          filteredTags.push({ tag_id: -1, name: `Add "${value}"` });
        }
        setSuggestions(filteredTags);
        setSelectedTag(filteredTags[0]);
      });
    }
    function handleSuggestionClick(tag) {
      onAddTag(tag);
      closeSuggestions();
    }
    function handleAddNewTagClick() {
      onAddTag({ tag_id: -1, name: query });
      closeSuggestions();
    }
    function closeSuggestions(e) {
      setSuggestions([]);
      setQuery("");
      setSelectedTag(null);
    }
    const tagItems = tags?.map((tag) => /* @__PURE__ */ dt(TagItem, { key: tag.tag_id, tag, onRemoveTag: () => onRemoveTag(tag) }));
    return /* @__PURE__ */ dt("div", { className: "notes-editor-tags" }, tagItems, /* @__PURE__ */ dt(
      TagSearch,
      {
        query,
        isEditable,
        suggestions,
        selectedTag,
        onKeyUp: handleKeyUp,
        onSuggestionClick: handleSuggestionClick,
        onAddNewTagClick: handleAddNewTagClick
      }
    ));
  }
  function TagItem({ tag, onRemoveTag }) {
    return /* @__PURE__ */ dt("div", { className: "tag", key: tag.tag_id }, tag.name, /* @__PURE__ */ dt(RemoveIcon, { onClick: onRemoveTag }));
  }
  function TagSearch({ query, isEditable, suggestions, selectedTag, onKeyUp, onSuggestionClick, onAddNewTagClick }) {
    if (!isEditable) {
      return null;
    }
    const suggestionItems = suggestions.map((suggestion) => {
      const isSelected = suggestion.tag_id === selectedTag?.tag_id;
      const className = isSelected ? "dropdown-option is-selected" : "dropdown-option";
      const handleClick = suggestion.tag_id === -1 ? onAddNewTagClick : onSuggestionClick;
      return /* @__PURE__ */ dt("li", { key: suggestion.tag_id, onClick: () => handleClick(suggestion), className }, /* @__PURE__ */ dt("span", null, suggestion.name));
    });
    return /* @__PURE__ */ dt(O, null, /* @__PURE__ */ dt(
      "input",
      {
        className: "notes-editor-tags-input",
        placeholder: "Add Tags...",
        autoComplete: "off",
        value: query,
        onKeyUp
      }
    ), /* @__PURE__ */ dt("div", { className: `dropdown-container ${suggestions.length ? "open" : ""}` }, /* @__PURE__ */ dt("ul", { className: "dropdown-menu" }, suggestionItems)));
  }
  function RemoveIcon({ onClick }) {
    return /* @__PURE__ */ dt(
      "svg",
      {
        onClick,
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "lucide lucide-circle-minus"
      },
      /* @__PURE__ */ dt("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ dt("path", { d: "M8 12h8" })
    );
  }

  // commons/components/NotesEditor.jsx
  function NotesEditor({ selectedNote, isNewNote }) {
    if (!isNewNote && selectedNote === null) {
      return null;
    }
    const [isEditable, setIsEditable] = Qt(isNewNote);
    const [title, setTitle] = Qt(selectedNote?.Title || "");
    const [content, setContent] = Qt(selectedNote?.Content || "");
    const [tags, setTags] = Qt(selectedNote?.Tags || []);
    const [isDraggingOver, setIsDraggingOver] = Qt(false);
    const [attachments, setAttachments] = Qt([]);
    const titleRef = et(null);
    const textareaRef = et(null);
    let contentArea = null;
    wt(() => {
      if (isNewNote || isEditable && titleRef.current?.textContent === "") {
        titleRef.current.focus();
      }
      function handleKeyDown(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          if (isEditable) {
            handleSaveClick();
          } else {
            handleEditClick();
          }
        }
      }
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, []);
    wt(() => {
      if (textareaRef.current === null) {
        return;
      }
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + 2}px`;
    }, [content, isEditable]);
    function handleSaveClick() {
      const note = {
        Title: title,
        Content: content,
        Tags: tags
      };
      let promise = null;
      if (isNewNote) {
        promise = ApiClient_default.createNote(note);
      } else {
        promise = ApiClient_default.updateNote(selectedNote.NoteID, note);
      }
      promise.then((note2) => {
        setIsEditable(false);
        setAttachments([]);
        if (isNewNote) {
          window.history.pushState({}, "", `/${note2.NoteID}`);
          window.dispatchEvent(new PopStateEvent("navigate"));
        }
      }).catch((e) => {
        console.error("Error saving note:", e);
      });
    }
    function handleEditClick() {
      setIsEditable(true);
    }
    function handleTitleChange(e) {
      const newTitle = e.target.textContent;
      setTitle(newTitle);
    }
    function handleAddTag(tag) {
      setTags((prevTags) => [...prevTags, tag]);
    }
    function handleRemoveTag(tag) {
      setTags((prevTags) => prevTags.filter((t) => t.tag_id !== tag.tag_id));
    }
    function handlePaste(e) {
      const items = e.clipboardData.items;
      if (Array.from(items).every((item) => item.type.indexOf("image") === -1)) {
        return;
      }
      e.preventDefault();
      for (let item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          setAttachments((prevAttachments) => [...prevAttachments, file]);
          uploadImage2(file);
        }
      }
    }
    function handleDragOver(e) {
      e.preventDefault();
      setIsDraggingOver(true);
    }
    function handleDragLeave(e) {
      e.preventDefault();
      setIsDraggingOver(false);
    }
    function handleImageDrop(e) {
      e.preventDefault();
      setIsDraggingOver(false);
      const files = e.dataTransfer.files;
      for (let file of files) {
        if (file.type.startsWith("image/")) {
          setAttachments((prevAttachments) => [...prevAttachments, file]);
          uploadImage2(file);
        }
      }
    }
    function uploadImage2(file) {
      const formData = new FormData();
      formData.append("image", file);
      ApiClient_default.uploadImage(formData).then((result) => {
        const imageUrl = `![](/images/${result.filename})`;
        insertAtCursor(imageUrl);
      }).catch((error) => {
        console.error("Error uploading image:", error);
      });
    }
    function insertAtCursor(text) {
      if (textareaRef.current === null) {
        return;
      }
      const textarea = textareaRef.current;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const beforeText = textarea.value.substring(0, startPos);
      const afterText = textarea.value.substring(endPos);
      setContent(beforeText + text + afterText);
      const newPosition = startPos + text.length;
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
      textarea.focus();
    }
    if (isEditable) {
      contentArea = /* @__PURE__ */ dt(
        "textarea",
        {
          className: "notes-editor-textarea",
          placeholder: "Write here...",
          spellCheck: "false",
          ref: textareaRef,
          value: content,
          onInput: (e) => setContent(e.target.value)
        }
      );
    } else if (title === "" && content === "") {
      contentArea = /* @__PURE__ */ dt("div", { className: "notes-editor-empty-text" }, "Empty note");
    } else {
      contentArea = /* @__PURE__ */ dt("div", { className: "notes-editor-rendered", dangerouslySetInnerHTML: { __html: renderMarkdown(content) } });
    }
    const imagePreviewItems = attachments.map((file, index) => {
      const imageUrl = URL.createObjectURL(file);
      return /* @__PURE__ */ dt("img", { src: imageUrl, alt: `Attachment ${index}` });
    });
    return /* @__PURE__ */ dt("div", { className: `notes-editor ${isEditable ? "is-editable" : ""}`, tabIndex: "0", onPaste: handlePaste }, /* @__PURE__ */ dt("div", { className: "notes-editor-header" }, /* @__PURE__ */ dt("div", { className: "notes-editor-title", contentEditable: isEditable, ref: titleRef, onBlur: handleTitleChange, dangerouslySetInnerHTML: { __html: title } }), /* @__PURE__ */ dt(Toolbar, { isEditable, onSaveClick: handleSaveClick, onEditClick: handleEditClick })), /* @__PURE__ */ dt(NotesEditorTags, { tags, isEditable, onAddTag: handleAddTag, onRemoveTag: handleRemoveTag }), /* @__PURE__ */ dt("div", { className: `notes-editor-image-dropzone ${isDraggingOver ? "dragover" : ""}`, onDrop: handleImageDrop, onDragOver: handleDragOver, onDragLeave: handleDragLeave }, "Drag and drop images here..."), /* @__PURE__ */ dt("div", { className: "notes-editor-image-attachment-preview" }, imagePreviewItems), /* @__PURE__ */ dt("div", { className: "notes-editor-content" }, contentArea));
  }
  function Toolbar({ isEditable, onSaveClick, onEditClick }) {
    if (isEditable) {
      return /* @__PURE__ */ dt("div", { className: "notes-editor-toolbar" }, /* @__PURE__ */ dt(CheckIcon, { className: "notes-editor-toolbar-button-done", onClick: onSaveClick }));
    }
    return /* @__PURE__ */ dt("div", { className: "notes-editor-toolbar" }, /* @__PURE__ */ dt(PencilIcon, { className: "notes-editor-toolbar-button-edit", onClick: onEditClick }));
  }
  function renderMarkdown(text) {
    const md = window.markdownit({
      linkify: true,
      breaks: true,
      highlight: function(str, lang) {
        if (lang && window.hljs.getLanguage(lang)) {
          try {
            return window.hljs.highlight(lang, str).value;
          } catch (__) {
          }
        }
        return "";
      }
    });
    var defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };
    md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
      tokens[idx].attrSet("target", "_blank");
      return defaultRender(tokens, idx, options, env, self);
    };
    return md.render(text);
  }
  var CheckIcon = ({ className, onClick }) => /* @__PURE__ */ dt("svg", { onClick, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: `lucide lucide-file-check ${className}` }, /* @__PURE__ */ dt("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }), /* @__PURE__ */ dt("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }), /* @__PURE__ */ dt("path", { d: "m9 15 2 2 4-4" }));
  var PencilIcon = ({ className, onClick }) => /* @__PURE__ */ dt("svg", { onClick, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: `lucide lucide-pencil-line ${className}` }, /* @__PURE__ */ dt("path", { d: "M12 20h9" }), /* @__PURE__ */ dt("path", { d: "M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" }), /* @__PURE__ */ dt("path", { d: "m15 5 3 3" }));

  // commons/components/MobileNavbar.jsx
  function MobileNavbar() {
    return /* @__PURE__ */ dt("div", { className: "mobile-navbar-container" }, /* @__PURE__ */ dt("div", { className: "mobile-navbar" }, /* @__PURE__ */ dt(Link, { className: "mobile-navbar-button", to: "/" }, /* @__PURE__ */ dt(NotesIcon2, null), "Notes"), /* @__PURE__ */ dt(Link, { className: "mobile-navbar-button", to: "/" }, /* @__PURE__ */ dt(SearchIcon2, null), "Search"), /* @__PURE__ */ dt(Link, { className: "mobile-navbar-button", to: "/new" }, /* @__PURE__ */ dt(NewIcon, null), "New")));
  }
  function NotesIcon2() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-files"
      },
      /* @__PURE__ */ dt("path", { d: "M20 7h-3a2 2 0 0 1-2-2V2" }),
      /* @__PURE__ */ dt("path", { d: "M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" }),
      /* @__PURE__ */ dt("path", { d: "M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" })
    );
  }
  function SearchIcon2() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-search"
      },
      /* @__PURE__ */ dt("circle", { cx: "11", cy: "11", r: "8" }),
      /* @__PURE__ */ dt("path", { d: "m21 21-4.3-4.3" })
    );
  }
  function NewIcon() {
    return /* @__PURE__ */ dt(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "lucide lucide-circle-plus"
      },
      /* @__PURE__ */ dt("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ dt("path", { d: "M8 12h8" }),
      /* @__PURE__ */ dt("path", { d: "M12 8v8" })
    );
  }

  // commons/components/useSearchParams.jsx
  function useSearchParams() {
    const [searchParams, setSearchParams] = Qt(new URLSearchParams(window.location.search));
    wt(() => {
      function handleLocationChange() {
        setSearchParams(new URLSearchParams(window.location.search));
      }
      window.addEventListener("navigate", handleLocationChange);
      window.addEventListener("popstate", handleLocationChange);
      return () => {
        window.removeEventListener("navigate", handleLocationChange);
        window.removeEventListener("popstate", handleLocationChange);
      };
    }, []);
    return searchParams;
  }

  // commons/components/NotesPage.jsx
  function NotesPage({ noteId }) {
    const { appContext } = useAppContext();
    const { focusModes, tags } = appContext;
    const [notes, setNotes] = Qt([]);
    const [selectedNote, setSelectedNote] = Qt(null);
    const searchParams = useSearchParams();
    const selectedTagId = searchParams.get("tag_id");
    const selectedFocusId = searchParams.get("focus_id");
    wt(() => {
      let promise = null;
      if (selectedTagId) {
        promise = ApiClient_default.getNotesByTagId(selectedTagId);
      } else {
        promise = ApiClient_default.getAllNotes();
      }
      promise.then((notes2) => {
        setNotes(notes2);
      }).catch((error) => {
        console.error("Error loading notes:", error);
      });
    }, [selectedTagId, selectedFocusId]);
    wt(() => {
      if (noteId === "new") {
        setSelectedNote(null);
        return;
      }
      if (noteId === void 0 && notes.length > 0) {
        setSelectedNote(notes[0]);
        return;
      }
      if (noteId !== void 0) {
        const selectedNoteId = parseInt(noteId, 10);
        ApiClient_default.getNoteById(selectedNoteId).then((note) => {
          setSelectedNote(note);
        }).catch((error) => {
          console.error("Error loading note:", error);
        });
      }
    }, [noteId, notes]);
    return /* @__PURE__ */ dt("div", { className: "page-container" }, /* @__PURE__ */ dt("div", { className: "sidebar-container" }, /* @__PURE__ */ dt(Sidebar_default, { focusModes, tags })), /* @__PURE__ */ dt("div", { className: "notes-list-container", "data-page": noteId === void 0 ? "notes" : "editor" }, /* @__PURE__ */ dt(NotesList, { notes })), /* @__PURE__ */ dt("div", { className: "notes-editor-container", "data-page": noteId === void 0 ? "notes" : "editor" }, /* @__PURE__ */ dt(NotesEditor, { selectedNote, isNewNote: noteId === "new", key: selectedNote?.NoteID })), /* @__PURE__ */ dt(MobileNavbar, null), /* @__PURE__ */ dt("div", { className: "dialog-container" }));
  }

  // index.js
  document.addEventListener("DOMContentLoaded", () => {
    ye(
      /* @__PURE__ */ dt(AppProvider, null, /* @__PURE__ */ dt(App, null)),
      document.body
    );
  });
  document.addEventListener("keyup", (e) => {
    if (e.ctrlKey && e.key === "n") {
      e.preventDefault();
      window.history.pushState({}, "", "/assets/new");
      window.dispatchEvent(new PopStateEvent("navigate"));
      return;
    }
  });
  function App() {
    const { updateAppContext } = useAppContext();
    wt(() => {
      Promise.all([ApiClient_default.getAllFocusModes(), ApiClient_default.getAllTags()]).then(([focusModes, tags]) => {
        updateAppContext({ focusModes, tags });
      }).catch((error) => {
        console.error("Error loading initial data:", error);
      });
    }, []);
    return /* @__PURE__ */ dt(Router, null, /* @__PURE__ */ dt(Route, { path: "/", component: NotesPage }), /* @__PURE__ */ dt(Route, { path: "/:noteId", component: NotesPage }));
  }
})();
