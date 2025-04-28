const H = "village-data-url", j = "village-module", X = {
  SYNC: "sync",
  SEARCH: "search"
};
function Se({
  token: t,
  partnerKey: e,
  userReference: n,
  url: r,
  module: s,
  config: i
}) {
  const o = new URLSearchParams();
  t && o.append("token", t), r && o.append("url", encodeURIComponent(r)), e && o.append("partnerKey", e), n && o.append("userReference", n), s && o.append("module", s);
  const a = JSON.stringify(i.paths_cta), u = encodeURIComponent(a);
  return o.append("paths_cta", u), `http://localhost:3000/widget?${o.toString()}`;
}
function mt(t, e) {
  t.innerHTML = "";
  const n = document.createElement("iframe");
  return n.src = Se({ ...e, module: "search" }), n.style.width = "100%", n.style.height = "100%", n.style.border = "none", n.style.display = "block", t.appendChild(n), n;
}
class yt {
  constructor() {
    this.element = document.createElement("iframe"), this.element.className = "village-iframe village-hidden", this.spinner = document.createElement("div"), this.spinner.className = "village-iframe village-hidden village-loading", this.spinner.innerHTML = '<div class="village-spinner"></div>';
  }
  // Update method uses the utility function to set src, but keeps class logic
  update(e) {
    this.element.src = Se(e);
    const n = e.url || e.module;
    this.element.className = n ? "village-iframe" : "village-iframe village-hidden", this.spinner.className = n ? "village-iframe village-loading" : "village-iframe village-hidden village-loading";
  }
  // Keep original render method
  render(e) {
    this.element.parentNode || (e.appendChild(this.spinner), e.appendChild(this.element));
  }
  // Keep original hideSpinner method
  hideSpinner() {
    this.spinner.className = "village-iframe village-hidden village-loading";
  }
}
/*! js-cookie v3.0.5 | MIT */
function G(t) {
  for (var e = 1; e < arguments.length; e++) {
    var n = arguments[e];
    for (var r in n)
      t[r] = n[r];
  }
  return t;
}
var gt = {
  read: function(t) {
    return t[0] === '"' && (t = t.slice(1, -1)), t.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
  },
  write: function(t) {
    return encodeURIComponent(t).replace(
      /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
      decodeURIComponent
    );
  }
};
function pe(t, e) {
  function n(s, i, o) {
    if (!(typeof document > "u")) {
      o = G({}, e, o), typeof o.expires == "number" && (o.expires = new Date(Date.now() + o.expires * 864e5)), o.expires && (o.expires = o.expires.toUTCString()), s = encodeURIComponent(s).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      var a = "";
      for (var u in o)
        o[u] && (a += "; " + u, o[u] !== !0 && (a += "=" + o[u].split(";")[0]));
      return document.cookie = s + "=" + t.write(i, s) + a;
    }
  }
  function r(s) {
    if (!(typeof document > "u" || arguments.length && !s)) {
      for (var i = document.cookie ? document.cookie.split("; ") : [], o = {}, a = 0; a < i.length; a++) {
        var u = i[a].split("="), c = u.slice(1).join("=");
        try {
          var d = decodeURIComponent(u[0]);
          if (o[d] = t.read(c, d), s === d)
            break;
        } catch {
        }
      }
      return s ? o[s] : o;
    }
  }
  return Object.create(
    {
      set: n,
      get: r,
      remove: function(s, i) {
        n(
          s,
          "",
          G({}, i, {
            expires: -1
          })
        );
      },
      withAttributes: function(s) {
        return pe(this.converter, G({}, this.attributes, s));
      },
      withConverter: function(s) {
        return pe(G({}, this.converter, s), this.attributes);
      }
    },
    {
      attributes: { value: Object.freeze(e) },
      converter: { value: Object.freeze(t) }
    }
  );
}
var I = pe(gt, { path: "/" });
class Et {
  constructor(e) {
    this.app = e, this.handlers = {
      VILLAGE_OAUTH_REQUEST: this.handleOAuthRequest.bind(this),
      VILLAGE_OAUTH_SUCCESS: this.handleOAuthSuccess.bind(this),
      VILLAGE_OAUTH_ERROR: this.handleOAuthError.bind(this),
      VILLAGE_REMOVE_IFRAME: this.handleRemoveIframe.bind(this),
      VILLAGE_IFRAME_LOADED: this.handleIframeLoaded.bind(this),
      VILLAGE_COPY_TO_CLIPBOARD: this.handleCopyToClipboard.bind(this)
    }, this.app.oauthPopupRef = null;
  }
  handle(e) {
    if (!e.data.type || !e.data.type.startsWith("VILLAGE_")) return;
    const n = this.handlers[e.data.type];
    if (n) {
      if ((e.data.type === "VILLAGE_OAUTH_SUCCESS" || e.data.type === "VILLAGE_OAUTH_ERROR") && e.source !== this.app.oauthPopupRef) {
        this.app.oauthPopupRef && this.app.oauthPopupRef.closed && (this.app.oauthPopupRef = null);
        return;
      }
      n(e.data, e.source);
    }
  }
  handleOAuthRequest(e) {
    const { isAuthorizationFlow: n } = e, r = `http://localhost:3000/widget/${n ? "resolve-auth" : "oauth"}`, s = new URLSearchParams();
    this.app.partnerKey && s.append("partnerKey", this.app.partnerKey), this.app.userReference && s.append("userReference", this.app.userReference);
    const i = s.toString() ? `${r}?${s.toString()}` : r;
    this.app.oauthPopupRef = window.open(
      i,
      "paas-oauth",
      "popup=true,width=500,height=600"
    );
    const o = setInterval(() => {
      this.app.oauthPopupRef && this.app.oauthPopupRef.closed ? (clearInterval(o), this.app.oauthPopupRef = null) : this.app.oauthPopupRef || clearInterval(o);
    }, 1e3);
  }
  handleOAuthSuccess(e) {
    I.set("village.token", e.token, { secure: !0, expires: 60 }), this.app.handleOAuthSuccess(e), this.app.oauthPopupRef && !this.app.oauthPopupRef.closed ? (this.app.oauthPopupRef.postMessage(
      { type: "VILLAGE_OAUTH_ACKNOWLEDGED" },
      "http://localhost:3000"
    ), this.app.oauthPopupRef = null) : this.app.oauthPopupRef = null;
  }
  handleOAuthError(e) {
    alert(
      `Sorry, something went wrong during authentication: ${(e == null ? void 0 : e.error) || "Unknown error"}`
    ), this.app.oauthPopupRef && (this.app.oauthPopupRef = null);
  }
  handleRemoveIframe() {
    this.app.url = null, this.app.module = null, this.app.renderIframe();
  }
  handleIframeLoaded() {
    this.app.iframe.hideSpinner();
  }
  handleCopyToClipboard(e) {
    navigator.clipboard.writeText(e.text);
  }
}
const bt = `
background: linear-gradient(90deg, rgba(255, 0, 0, 1) 0%, rgba(255, 165, 0, 1) 100%);
color: white;
font-weight: bold;
padding: 8px 12px;
font-size: 16px;
border-radius: 4px;
display: inline-block;
`, _e = `
font-size: 18px;
color: #ff4500;
margin: 8px 0;
font-weight: bold;
text-align: center;
`;
function $e(t, e = {}) {
  console.log("%cVILLAGE-PAAS ERROR", bt), console.log("%c────────────────────────", _e);
  const n = [
    {
      label: "ERROR MESSAGE",
      value: t.message
    },
    {
      label: "STACK TRACE",
      value: t.stack
    },
    {
      label: "CONTEXT",
      value: JSON.stringify(e, null, 2)
    }
  ];
  for (const { label: r, value: s } of n)
    console.log("%c" + r, "padding: 4px; font-weight: bold;"), console.log("%c" + s, "padding: 4px;");
  console.log("%c────────────────────────", _e);
}
const A = [];
for (let t = 0; t < 256; ++t)
  A.push((t + 256).toString(16).slice(1));
function wt(t, e = 0) {
  return (A[t[e + 0]] + A[t[e + 1]] + A[t[e + 2]] + A[t[e + 3]] + "-" + A[t[e + 4]] + A[t[e + 5]] + "-" + A[t[e + 6]] + A[t[e + 7]] + "-" + A[t[e + 8]] + A[t[e + 9]] + "-" + A[t[e + 10]] + A[t[e + 11]] + A[t[e + 12]] + A[t[e + 13]] + A[t[e + 14]] + A[t[e + 15]]).toLowerCase();
}
let ce;
const Rt = new Uint8Array(16);
function St() {
  if (!ce) {
    if (typeof crypto > "u" || !crypto.getRandomValues)
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    ce = crypto.getRandomValues.bind(crypto);
  }
  return ce(Rt);
}
const At = typeof crypto < "u" && crypto.randomUUID && crypto.randomUUID.bind(crypto), xe = { randomUUID: At };
function Tt(t, e, n) {
  var s;
  if (xe.randomUUID && !t)
    return xe.randomUUID();
  t = t || {};
  const r = t.random ?? ((s = t.rng) == null ? void 0 : s.call(t)) ?? St();
  if (r.length < 16)
    throw new Error("Random bytes length must be >= 16");
  return r[6] = r[6] & 15 | 64, r[8] = r[8] & 63 | 128, wt(r);
}
function Ke(t, e) {
  return function() {
    return t.apply(e, arguments);
  };
}
const { toString: Ot } = Object.prototype, { getPrototypeOf: Ae } = Object, re = /* @__PURE__ */ ((t) => (e) => {
  const n = Ot.call(e);
  return t[n] || (t[n] = n.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null)), x = (t) => (t = t.toLowerCase(), (e) => re(e) === t), se = (t) => (e) => typeof e === t, { isArray: M } = Array, K = se("undefined");
function Ct(t) {
  return t !== null && !K(t) && t.constructor !== null && !K(t.constructor) && _(t.constructor.isBuffer) && t.constructor.isBuffer(t);
}
const ze = x("ArrayBuffer");
function _t(t) {
  let e;
  return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? e = ArrayBuffer.isView(t) : e = t && t.buffer && ze(t.buffer), e;
}
const xt = se("string"), _ = se("function"), We = se("number"), ie = (t) => t !== null && typeof t == "object", Ut = (t) => t === !0 || t === !1, Q = (t) => {
  if (re(t) !== "object")
    return !1;
  const e = Ae(t);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in t) && !(Symbol.iterator in t);
}, kt = x("Date"), Lt = x("File"), Pt = x("Blob"), It = x("FileList"), Nt = (t) => ie(t) && _(t.pipe), vt = (t) => {
  let e;
  return t && (typeof FormData == "function" && t instanceof FormData || _(t.append) && ((e = re(t)) === "formdata" || // detect form-data instance
  e === "object" && _(t.toString) && t.toString() === "[object FormData]"));
}, Bt = x("URLSearchParams"), [Dt, Ft, Mt, qt] = ["ReadableStream", "Request", "Response", "Headers"].map(x), Ht = (t) => t.trim ? t.trim() : t.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function z(t, e, { allOwnKeys: n = !1 } = {}) {
  if (t === null || typeof t > "u")
    return;
  let r, s;
  if (typeof t != "object" && (t = [t]), M(t))
    for (r = 0, s = t.length; r < s; r++)
      e.call(null, t[r], r, t);
  else {
    const i = n ? Object.getOwnPropertyNames(t) : Object.keys(t), o = i.length;
    let a;
    for (r = 0; r < o; r++)
      a = i[r], e.call(null, t[a], a, t);
  }
}
function Je(t, e) {
  e = e.toLowerCase();
  const n = Object.keys(t);
  let r = n.length, s;
  for (; r-- > 0; )
    if (s = n[r], e === s.toLowerCase())
      return s;
  return null;
}
const N = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : window, Ge = (t) => !K(t) && t !== N;
function me() {
  const { caseless: t } = Ge(this) && this || {}, e = {}, n = (r, s) => {
    const i = t && Je(e, s) || s;
    Q(e[i]) && Q(r) ? e[i] = me(e[i], r) : Q(r) ? e[i] = me({}, r) : M(r) ? e[i] = r.slice() : e[i] = r;
  };
  for (let r = 0, s = arguments.length; r < s; r++)
    arguments[r] && z(arguments[r], n);
  return e;
}
const jt = (t, e, n, { allOwnKeys: r } = {}) => (z(e, (s, i) => {
  n && _(s) ? t[i] = Ke(s, n) : t[i] = s;
}, { allOwnKeys: r }), t), Vt = (t) => (t.charCodeAt(0) === 65279 && (t = t.slice(1)), t), $t = (t, e, n, r) => {
  t.prototype = Object.create(e.prototype, r), t.prototype.constructor = t, Object.defineProperty(t, "super", {
    value: e.prototype
  }), n && Object.assign(t.prototype, n);
}, Kt = (t, e, n, r) => {
  let s, i, o;
  const a = {};
  if (e = e || {}, t == null) return e;
  do {
    for (s = Object.getOwnPropertyNames(t), i = s.length; i-- > 0; )
      o = s[i], (!r || r(o, t, e)) && !a[o] && (e[o] = t[o], a[o] = !0);
    t = n !== !1 && Ae(t);
  } while (t && (!n || n(t, e)) && t !== Object.prototype);
  return e;
}, zt = (t, e, n) => {
  t = String(t), (n === void 0 || n > t.length) && (n = t.length), n -= e.length;
  const r = t.indexOf(e, n);
  return r !== -1 && r === n;
}, Wt = (t) => {
  if (!t) return null;
  if (M(t)) return t;
  let e = t.length;
  if (!We(e)) return null;
  const n = new Array(e);
  for (; e-- > 0; )
    n[e] = t[e];
  return n;
}, Jt = /* @__PURE__ */ ((t) => (e) => t && e instanceof t)(typeof Uint8Array < "u" && Ae(Uint8Array)), Gt = (t, e) => {
  const r = (t && t[Symbol.iterator]).call(t);
  let s;
  for (; (s = r.next()) && !s.done; ) {
    const i = s.value;
    e.call(t, i[0], i[1]);
  }
}, Xt = (t, e) => {
  let n;
  const r = [];
  for (; (n = t.exec(e)) !== null; )
    r.push(n);
  return r;
}, Qt = x("HTMLFormElement"), Yt = (t) => t.toLowerCase().replace(
  /[-_\s]([a-z\d])(\w*)/g,
  function(n, r, s) {
    return r.toUpperCase() + s;
  }
), Ue = (({ hasOwnProperty: t }) => (e, n) => t.call(e, n))(Object.prototype), Zt = x("RegExp"), Xe = (t, e) => {
  const n = Object.getOwnPropertyDescriptors(t), r = {};
  z(n, (s, i) => {
    let o;
    (o = e(s, i, t)) !== !1 && (r[i] = o || s);
  }), Object.defineProperties(t, r);
}, en = (t) => {
  Xe(t, (e, n) => {
    if (_(t) && ["arguments", "caller", "callee"].indexOf(n) !== -1)
      return !1;
    const r = t[n];
    if (_(r)) {
      if (e.enumerable = !1, "writable" in e) {
        e.writable = !1;
        return;
      }
      e.set || (e.set = () => {
        throw Error("Can not rewrite read-only method '" + n + "'");
      });
    }
  });
}, tn = (t, e) => {
  const n = {}, r = (s) => {
    s.forEach((i) => {
      n[i] = !0;
    });
  };
  return M(t) ? r(t) : r(String(t).split(e)), n;
}, nn = () => {
}, rn = (t, e) => t != null && Number.isFinite(t = +t) ? t : e;
function sn(t) {
  return !!(t && _(t.append) && t[Symbol.toStringTag] === "FormData" && t[Symbol.iterator]);
}
const on = (t) => {
  const e = new Array(10), n = (r, s) => {
    if (ie(r)) {
      if (e.indexOf(r) >= 0)
        return;
      if (!("toJSON" in r)) {
        e[s] = r;
        const i = M(r) ? [] : {};
        return z(r, (o, a) => {
          const u = n(o, s + 1);
          !K(u) && (i[a] = u);
        }), e[s] = void 0, i;
      }
    }
    return r;
  };
  return n(t, 0);
}, an = x("AsyncFunction"), ln = (t) => t && (ie(t) || _(t)) && _(t.then) && _(t.catch), Qe = ((t, e) => t ? setImmediate : e ? ((n, r) => (N.addEventListener("message", ({ source: s, data: i }) => {
  s === N && i === n && r.length && r.shift()();
}, !1), (s) => {
  r.push(s), N.postMessage(n, "*");
}))(`axios@${Math.random()}`, []) : (n) => setTimeout(n))(
  typeof setImmediate == "function",
  _(N.postMessage)
), cn = typeof queueMicrotask < "u" ? queueMicrotask.bind(N) : typeof process < "u" && process.nextTick || Qe, l = {
  isArray: M,
  isArrayBuffer: ze,
  isBuffer: Ct,
  isFormData: vt,
  isArrayBufferView: _t,
  isString: xt,
  isNumber: We,
  isBoolean: Ut,
  isObject: ie,
  isPlainObject: Q,
  isReadableStream: Dt,
  isRequest: Ft,
  isResponse: Mt,
  isHeaders: qt,
  isUndefined: K,
  isDate: kt,
  isFile: Lt,
  isBlob: Pt,
  isRegExp: Zt,
  isFunction: _,
  isStream: Nt,
  isURLSearchParams: Bt,
  isTypedArray: Jt,
  isFileList: It,
  forEach: z,
  merge: me,
  extend: jt,
  trim: Ht,
  stripBOM: Vt,
  inherits: $t,
  toFlatObject: Kt,
  kindOf: re,
  kindOfTest: x,
  endsWith: zt,
  toArray: Wt,
  forEachEntry: Gt,
  matchAll: Xt,
  isHTMLForm: Qt,
  hasOwnProperty: Ue,
  hasOwnProp: Ue,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors: Xe,
  freezeMethods: en,
  toObjectSet: tn,
  toCamelCase: Yt,
  noop: nn,
  toFiniteNumber: rn,
  findKey: Je,
  global: N,
  isContextDefined: Ge,
  isSpecCompliantForm: sn,
  toJSONObject: on,
  isAsyncFn: an,
  isThenable: ln,
  setImmediate: Qe,
  asap: cn
};
function m(t, e, n, r, s) {
  Error.call(this), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack, this.message = t, this.name = "AxiosError", e && (this.code = e), n && (this.config = n), r && (this.request = r), s && (this.response = s, this.status = s.status ? s.status : null);
}
l.inherits(m, Error, {
  toJSON: function() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: l.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
});
const Ye = m.prototype, Ze = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL"
  // eslint-disable-next-line func-names
].forEach((t) => {
  Ze[t] = { value: t };
});
Object.defineProperties(m, Ze);
Object.defineProperty(Ye, "isAxiosError", { value: !0 });
m.from = (t, e, n, r, s, i) => {
  const o = Object.create(Ye);
  return l.toFlatObject(t, o, function(u) {
    return u !== Error.prototype;
  }, (a) => a !== "isAxiosError"), m.call(o, t.message, e, n, r, s), o.cause = t, o.name = t.name, i && Object.assign(o, i), o;
};
const un = null;
function ye(t) {
  return l.isPlainObject(t) || l.isArray(t);
}
function et(t) {
  return l.endsWith(t, "[]") ? t.slice(0, -2) : t;
}
function ke(t, e, n) {
  return t ? t.concat(e).map(function(s, i) {
    return s = et(s), !n && i ? "[" + s + "]" : s;
  }).join(n ? "." : "") : e;
}
function dn(t) {
  return l.isArray(t) && !t.some(ye);
}
const fn = l.toFlatObject(l, {}, null, function(e) {
  return /^is[A-Z]/.test(e);
});
function oe(t, e, n) {
  if (!l.isObject(t))
    throw new TypeError("target must be an object");
  e = e || new FormData(), n = l.toFlatObject(n, {
    metaTokens: !0,
    dots: !1,
    indexes: !1
  }, !1, function(y, p) {
    return !l.isUndefined(p[y]);
  });
  const r = n.metaTokens, s = n.visitor || d, i = n.dots, o = n.indexes, u = (n.Blob || typeof Blob < "u" && Blob) && l.isSpecCompliantForm(e);
  if (!l.isFunction(s))
    throw new TypeError("visitor must be a function");
  function c(h) {
    if (h === null) return "";
    if (l.isDate(h))
      return h.toISOString();
    if (!u && l.isBlob(h))
      throw new m("Blob is not supported. Use a Buffer instead.");
    return l.isArrayBuffer(h) || l.isTypedArray(h) ? u && typeof Blob == "function" ? new Blob([h]) : Buffer.from(h) : h;
  }
  function d(h, y, p) {
    let b = h;
    if (h && !p && typeof h == "object") {
      if (l.endsWith(y, "{}"))
        y = r ? y : y.slice(0, -2), h = JSON.stringify(h);
      else if (l.isArray(h) && dn(h) || (l.isFileList(h) || l.endsWith(y, "[]")) && (b = l.toArray(h)))
        return y = et(y), b.forEach(function(S, k) {
          !(l.isUndefined(S) || S === null) && e.append(
            // eslint-disable-next-line no-nested-ternary
            o === !0 ? ke([y], k, i) : o === null ? y : y + "[]",
            c(S)
          );
        }), !1;
    }
    return ye(h) ? !0 : (e.append(ke(p, y, i), c(h)), !1);
  }
  const f = [], g = Object.assign(fn, {
    defaultVisitor: d,
    convertValue: c,
    isVisitable: ye
  });
  function w(h, y) {
    if (!l.isUndefined(h)) {
      if (f.indexOf(h) !== -1)
        throw Error("Circular reference detected in " + y.join("."));
      f.push(h), l.forEach(h, function(b, R) {
        (!(l.isUndefined(b) || b === null) && s.call(
          e,
          b,
          l.isString(R) ? R.trim() : R,
          y,
          g
        )) === !0 && w(b, y ? y.concat(R) : [R]);
      }), f.pop();
    }
  }
  if (!l.isObject(t))
    throw new TypeError("data must be an object");
  return w(t), e;
}
function Le(t) {
  const e = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(t).replace(/[!'()~]|%20|%00/g, function(r) {
    return e[r];
  });
}
function Te(t, e) {
  this._pairs = [], t && oe(t, this, e);
}
const tt = Te.prototype;
tt.append = function(e, n) {
  this._pairs.push([e, n]);
};
tt.toString = function(e) {
  const n = e ? function(r) {
    return e.call(this, r, Le);
  } : Le;
  return this._pairs.map(function(s) {
    return n(s[0]) + "=" + n(s[1]);
  }, "").join("&");
};
function hn(t) {
  return encodeURIComponent(t).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
function nt(t, e, n) {
  if (!e)
    return t;
  const r = n && n.encode || hn;
  l.isFunction(n) && (n = {
    serialize: n
  });
  const s = n && n.serialize;
  let i;
  if (s ? i = s(e, n) : i = l.isURLSearchParams(e) ? e.toString() : new Te(e, n).toString(r), i) {
    const o = t.indexOf("#");
    o !== -1 && (t = t.slice(0, o)), t += (t.indexOf("?") === -1 ? "?" : "&") + i;
  }
  return t;
}
class Pe {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(e, n, r) {
    return this.handlers.push({
      fulfilled: e,
      rejected: n,
      synchronous: r ? r.synchronous : !1,
      runWhen: r ? r.runWhen : null
    }), this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(e) {
    this.handlers[e] && (this.handlers[e] = null);
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    this.handlers && (this.handlers = []);
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(e) {
    l.forEach(this.handlers, function(r) {
      r !== null && e(r);
    });
  }
}
const rt = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1
}, pn = typeof URLSearchParams < "u" ? URLSearchParams : Te, mn = typeof FormData < "u" ? FormData : null, yn = typeof Blob < "u" ? Blob : null, gn = {
  isBrowser: !0,
  classes: {
    URLSearchParams: pn,
    FormData: mn,
    Blob: yn
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
}, Oe = typeof window < "u" && typeof document < "u", ge = typeof navigator == "object" && navigator || void 0, En = Oe && (!ge || ["ReactNative", "NativeScript", "NS"].indexOf(ge.product) < 0), bn = typeof WorkerGlobalScope < "u" && // eslint-disable-next-line no-undef
self instanceof WorkerGlobalScope && typeof self.importScripts == "function", wn = Oe && window.location.href || "http://localhost", Rn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv: Oe,
  hasStandardBrowserEnv: En,
  hasStandardBrowserWebWorkerEnv: bn,
  navigator: ge,
  origin: wn
}, Symbol.toStringTag, { value: "Module" })), T = {
  ...Rn,
  ...gn
};
function Sn(t, e) {
  return oe(t, new T.classes.URLSearchParams(), Object.assign({
    visitor: function(n, r, s, i) {
      return T.isNode && l.isBuffer(n) ? (this.append(r, n.toString("base64")), !1) : i.defaultVisitor.apply(this, arguments);
    }
  }, e));
}
function An(t) {
  return l.matchAll(/\w+|\[(\w*)]/g, t).map((e) => e[0] === "[]" ? "" : e[1] || e[0]);
}
function Tn(t) {
  const e = {}, n = Object.keys(t);
  let r;
  const s = n.length;
  let i;
  for (r = 0; r < s; r++)
    i = n[r], e[i] = t[i];
  return e;
}
function st(t) {
  function e(n, r, s, i) {
    let o = n[i++];
    if (o === "__proto__") return !0;
    const a = Number.isFinite(+o), u = i >= n.length;
    return o = !o && l.isArray(s) ? s.length : o, u ? (l.hasOwnProp(s, o) ? s[o] = [s[o], r] : s[o] = r, !a) : ((!s[o] || !l.isObject(s[o])) && (s[o] = []), e(n, r, s[o], i) && l.isArray(s[o]) && (s[o] = Tn(s[o])), !a);
  }
  if (l.isFormData(t) && l.isFunction(t.entries)) {
    const n = {};
    return l.forEachEntry(t, (r, s) => {
      e(An(r), s, n, 0);
    }), n;
  }
  return null;
}
function On(t, e, n) {
  if (l.isString(t))
    try {
      return (e || JSON.parse)(t), l.trim(t);
    } catch (r) {
      if (r.name !== "SyntaxError")
        throw r;
    }
  return (n || JSON.stringify)(t);
}
const W = {
  transitional: rt,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [function(e, n) {
    const r = n.getContentType() || "", s = r.indexOf("application/json") > -1, i = l.isObject(e);
    if (i && l.isHTMLForm(e) && (e = new FormData(e)), l.isFormData(e))
      return s ? JSON.stringify(st(e)) : e;
    if (l.isArrayBuffer(e) || l.isBuffer(e) || l.isStream(e) || l.isFile(e) || l.isBlob(e) || l.isReadableStream(e))
      return e;
    if (l.isArrayBufferView(e))
      return e.buffer;
    if (l.isURLSearchParams(e))
      return n.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), e.toString();
    let a;
    if (i) {
      if (r.indexOf("application/x-www-form-urlencoded") > -1)
        return Sn(e, this.formSerializer).toString();
      if ((a = l.isFileList(e)) || r.indexOf("multipart/form-data") > -1) {
        const u = this.env && this.env.FormData;
        return oe(
          a ? { "files[]": e } : e,
          u && new u(),
          this.formSerializer
        );
      }
    }
    return i || s ? (n.setContentType("application/json", !1), On(e)) : e;
  }],
  transformResponse: [function(e) {
    const n = this.transitional || W.transitional, r = n && n.forcedJSONParsing, s = this.responseType === "json";
    if (l.isResponse(e) || l.isReadableStream(e))
      return e;
    if (e && l.isString(e) && (r && !this.responseType || s)) {
      const o = !(n && n.silentJSONParsing) && s;
      try {
        return JSON.parse(e);
      } catch (a) {
        if (o)
          throw a.name === "SyntaxError" ? m.from(a, m.ERR_BAD_RESPONSE, this, null, this.response) : a;
      }
    }
    return e;
  }],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: T.classes.FormData,
    Blob: T.classes.Blob
  },
  validateStatus: function(e) {
    return e >= 200 && e < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
l.forEach(["delete", "get", "head", "post", "put", "patch"], (t) => {
  W.headers[t] = {};
});
const Cn = l.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]), _n = (t) => {
  const e = {};
  let n, r, s;
  return t && t.split(`
`).forEach(function(o) {
    s = o.indexOf(":"), n = o.substring(0, s).trim().toLowerCase(), r = o.substring(s + 1).trim(), !(!n || e[n] && Cn[n]) && (n === "set-cookie" ? e[n] ? e[n].push(r) : e[n] = [r] : e[n] = e[n] ? e[n] + ", " + r : r);
  }), e;
}, Ie = Symbol("internals");
function V(t) {
  return t && String(t).trim().toLowerCase();
}
function Y(t) {
  return t === !1 || t == null ? t : l.isArray(t) ? t.map(Y) : String(t);
}
function xn(t) {
  const e = /* @__PURE__ */ Object.create(null), n = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let r;
  for (; r = n.exec(t); )
    e[r[1]] = r[2];
  return e;
}
const Un = (t) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(t.trim());
function ue(t, e, n, r, s) {
  if (l.isFunction(r))
    return r.call(this, e, n);
  if (s && (e = n), !!l.isString(e)) {
    if (l.isString(r))
      return e.indexOf(r) !== -1;
    if (l.isRegExp(r))
      return r.test(e);
  }
}
function kn(t) {
  return t.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (e, n, r) => n.toUpperCase() + r);
}
function Ln(t, e) {
  const n = l.toCamelCase(" " + e);
  ["get", "set", "has"].forEach((r) => {
    Object.defineProperty(t, r + n, {
      value: function(s, i, o) {
        return this[r].call(this, e, s, i, o);
      },
      configurable: !0
    });
  });
}
let C = class {
  constructor(e) {
    e && this.set(e);
  }
  set(e, n, r) {
    const s = this;
    function i(a, u, c) {
      const d = V(u);
      if (!d)
        throw new Error("header name must be a non-empty string");
      const f = l.findKey(s, d);
      (!f || s[f] === void 0 || c === !0 || c === void 0 && s[f] !== !1) && (s[f || u] = Y(a));
    }
    const o = (a, u) => l.forEach(a, (c, d) => i(c, d, u));
    if (l.isPlainObject(e) || e instanceof this.constructor)
      o(e, n);
    else if (l.isString(e) && (e = e.trim()) && !Un(e))
      o(_n(e), n);
    else if (l.isHeaders(e))
      for (const [a, u] of e.entries())
        i(u, a, r);
    else
      e != null && i(n, e, r);
    return this;
  }
  get(e, n) {
    if (e = V(e), e) {
      const r = l.findKey(this, e);
      if (r) {
        const s = this[r];
        if (!n)
          return s;
        if (n === !0)
          return xn(s);
        if (l.isFunction(n))
          return n.call(this, s, r);
        if (l.isRegExp(n))
          return n.exec(s);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(e, n) {
    if (e = V(e), e) {
      const r = l.findKey(this, e);
      return !!(r && this[r] !== void 0 && (!n || ue(this, this[r], r, n)));
    }
    return !1;
  }
  delete(e, n) {
    const r = this;
    let s = !1;
    function i(o) {
      if (o = V(o), o) {
        const a = l.findKey(r, o);
        a && (!n || ue(r, r[a], a, n)) && (delete r[a], s = !0);
      }
    }
    return l.isArray(e) ? e.forEach(i) : i(e), s;
  }
  clear(e) {
    const n = Object.keys(this);
    let r = n.length, s = !1;
    for (; r--; ) {
      const i = n[r];
      (!e || ue(this, this[i], i, e, !0)) && (delete this[i], s = !0);
    }
    return s;
  }
  normalize(e) {
    const n = this, r = {};
    return l.forEach(this, (s, i) => {
      const o = l.findKey(r, i);
      if (o) {
        n[o] = Y(s), delete n[i];
        return;
      }
      const a = e ? kn(i) : String(i).trim();
      a !== i && delete n[i], n[a] = Y(s), r[a] = !0;
    }), this;
  }
  concat(...e) {
    return this.constructor.concat(this, ...e);
  }
  toJSON(e) {
    const n = /* @__PURE__ */ Object.create(null);
    return l.forEach(this, (r, s) => {
      r != null && r !== !1 && (n[s] = e && l.isArray(r) ? r.join(", ") : r);
    }), n;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([e, n]) => e + ": " + n).join(`
`);
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(e) {
    return e instanceof this ? e : new this(e);
  }
  static concat(e, ...n) {
    const r = new this(e);
    return n.forEach((s) => r.set(s)), r;
  }
  static accessor(e) {
    const r = (this[Ie] = this[Ie] = {
      accessors: {}
    }).accessors, s = this.prototype;
    function i(o) {
      const a = V(o);
      r[a] || (Ln(s, o), r[a] = !0);
    }
    return l.isArray(e) ? e.forEach(i) : i(e), this;
  }
};
C.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
l.reduceDescriptors(C.prototype, ({ value: t }, e) => {
  let n = e[0].toUpperCase() + e.slice(1);
  return {
    get: () => t,
    set(r) {
      this[n] = r;
    }
  };
});
l.freezeMethods(C);
function de(t, e) {
  const n = this || W, r = e || n, s = C.from(r.headers);
  let i = r.data;
  return l.forEach(t, function(a) {
    i = a.call(n, i, s.normalize(), e ? e.status : void 0);
  }), s.normalize(), i;
}
function it(t) {
  return !!(t && t.__CANCEL__);
}
function q(t, e, n) {
  m.call(this, t ?? "canceled", m.ERR_CANCELED, e, n), this.name = "CanceledError";
}
l.inherits(q, m, {
  __CANCEL__: !0
});
function ot(t, e, n) {
  const r = n.config.validateStatus;
  !n.status || !r || r(n.status) ? t(n) : e(new m(
    "Request failed with status code " + n.status,
    [m.ERR_BAD_REQUEST, m.ERR_BAD_RESPONSE][Math.floor(n.status / 100) - 4],
    n.config,
    n.request,
    n
  ));
}
function Pn(t) {
  const e = /^([-+\w]{1,25})(:?\/\/|:)/.exec(t);
  return e && e[1] || "";
}
function In(t, e) {
  t = t || 10;
  const n = new Array(t), r = new Array(t);
  let s = 0, i = 0, o;
  return e = e !== void 0 ? e : 1e3, function(u) {
    const c = Date.now(), d = r[i];
    o || (o = c), n[s] = u, r[s] = c;
    let f = i, g = 0;
    for (; f !== s; )
      g += n[f++], f = f % t;
    if (s = (s + 1) % t, s === i && (i = (i + 1) % t), c - o < e)
      return;
    const w = d && c - d;
    return w ? Math.round(g * 1e3 / w) : void 0;
  };
}
function Nn(t, e) {
  let n = 0, r = 1e3 / e, s, i;
  const o = (c, d = Date.now()) => {
    n = d, s = null, i && (clearTimeout(i), i = null), t.apply(null, c);
  };
  return [(...c) => {
    const d = Date.now(), f = d - n;
    f >= r ? o(c, d) : (s = c, i || (i = setTimeout(() => {
      i = null, o(s);
    }, r - f)));
  }, () => s && o(s)];
}
const te = (t, e, n = 3) => {
  let r = 0;
  const s = In(50, 250);
  return Nn((i) => {
    const o = i.loaded, a = i.lengthComputable ? i.total : void 0, u = o - r, c = s(u), d = o <= a;
    r = o;
    const f = {
      loaded: o,
      total: a,
      progress: a ? o / a : void 0,
      bytes: u,
      rate: c || void 0,
      estimated: c && a && d ? (a - o) / c : void 0,
      event: i,
      lengthComputable: a != null,
      [e ? "download" : "upload"]: !0
    };
    t(f);
  }, n);
}, Ne = (t, e) => {
  const n = t != null;
  return [(r) => e[0]({
    lengthComputable: n,
    total: t,
    loaded: r
  }), e[1]];
}, ve = (t) => (...e) => l.asap(() => t(...e)), vn = T.hasStandardBrowserEnv ? /* @__PURE__ */ ((t, e) => (n) => (n = new URL(n, T.origin), t.protocol === n.protocol && t.host === n.host && (e || t.port === n.port)))(
  new URL(T.origin),
  T.navigator && /(msie|trident)/i.test(T.navigator.userAgent)
) : () => !0, Bn = T.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(t, e, n, r, s, i) {
      const o = [t + "=" + encodeURIComponent(e)];
      l.isNumber(n) && o.push("expires=" + new Date(n).toGMTString()), l.isString(r) && o.push("path=" + r), l.isString(s) && o.push("domain=" + s), i === !0 && o.push("secure"), document.cookie = o.join("; ");
    },
    read(t) {
      const e = document.cookie.match(new RegExp("(^|;\\s*)(" + t + ")=([^;]*)"));
      return e ? decodeURIComponent(e[3]) : null;
    },
    remove(t) {
      this.write(t, "", Date.now() - 864e5);
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
function Dn(t) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(t);
}
function Fn(t, e) {
  return e ? t.replace(/\/?\/$/, "") + "/" + e.replace(/^\/+/, "") : t;
}
function at(t, e, n) {
  let r = !Dn(e);
  return t && (r || n == !1) ? Fn(t, e) : e;
}
const Be = (t) => t instanceof C ? { ...t } : t;
function B(t, e) {
  e = e || {};
  const n = {};
  function r(c, d, f, g) {
    return l.isPlainObject(c) && l.isPlainObject(d) ? l.merge.call({ caseless: g }, c, d) : l.isPlainObject(d) ? l.merge({}, d) : l.isArray(d) ? d.slice() : d;
  }
  function s(c, d, f, g) {
    if (l.isUndefined(d)) {
      if (!l.isUndefined(c))
        return r(void 0, c, f, g);
    } else return r(c, d, f, g);
  }
  function i(c, d) {
    if (!l.isUndefined(d))
      return r(void 0, d);
  }
  function o(c, d) {
    if (l.isUndefined(d)) {
      if (!l.isUndefined(c))
        return r(void 0, c);
    } else return r(void 0, d);
  }
  function a(c, d, f) {
    if (f in e)
      return r(c, d);
    if (f in t)
      return r(void 0, c);
  }
  const u = {
    url: i,
    method: i,
    data: i,
    baseURL: o,
    transformRequest: o,
    transformResponse: o,
    paramsSerializer: o,
    timeout: o,
    timeoutMessage: o,
    withCredentials: o,
    withXSRFToken: o,
    adapter: o,
    responseType: o,
    xsrfCookieName: o,
    xsrfHeaderName: o,
    onUploadProgress: o,
    onDownloadProgress: o,
    decompress: o,
    maxContentLength: o,
    maxBodyLength: o,
    beforeRedirect: o,
    transport: o,
    httpAgent: o,
    httpsAgent: o,
    cancelToken: o,
    socketPath: o,
    responseEncoding: o,
    validateStatus: a,
    headers: (c, d, f) => s(Be(c), Be(d), f, !0)
  };
  return l.forEach(Object.keys(Object.assign({}, t, e)), function(d) {
    const f = u[d] || s, g = f(t[d], e[d], d);
    l.isUndefined(g) && f !== a || (n[d] = g);
  }), n;
}
const lt = (t) => {
  const e = B({}, t);
  let { data: n, withXSRFToken: r, xsrfHeaderName: s, xsrfCookieName: i, headers: o, auth: a } = e;
  e.headers = o = C.from(o), e.url = nt(at(e.baseURL, e.url, e.allowAbsoluteUrls), t.params, t.paramsSerializer), a && o.set(
    "Authorization",
    "Basic " + btoa((a.username || "") + ":" + (a.password ? unescape(encodeURIComponent(a.password)) : ""))
  );
  let u;
  if (l.isFormData(n)) {
    if (T.hasStandardBrowserEnv || T.hasStandardBrowserWebWorkerEnv)
      o.setContentType(void 0);
    else if ((u = o.getContentType()) !== !1) {
      const [c, ...d] = u ? u.split(";").map((f) => f.trim()).filter(Boolean) : [];
      o.setContentType([c || "multipart/form-data", ...d].join("; "));
    }
  }
  if (T.hasStandardBrowserEnv && (r && l.isFunction(r) && (r = r(e)), r || r !== !1 && vn(e.url))) {
    const c = s && i && Bn.read(i);
    c && o.set(s, c);
  }
  return e;
}, Mn = typeof XMLHttpRequest < "u", qn = Mn && function(t) {
  return new Promise(function(n, r) {
    const s = lt(t);
    let i = s.data;
    const o = C.from(s.headers).normalize();
    let { responseType: a, onUploadProgress: u, onDownloadProgress: c } = s, d, f, g, w, h;
    function y() {
      w && w(), h && h(), s.cancelToken && s.cancelToken.unsubscribe(d), s.signal && s.signal.removeEventListener("abort", d);
    }
    let p = new XMLHttpRequest();
    p.open(s.method.toUpperCase(), s.url, !0), p.timeout = s.timeout;
    function b() {
      if (!p)
        return;
      const S = C.from(
        "getAllResponseHeaders" in p && p.getAllResponseHeaders()
      ), O = {
        data: !a || a === "text" || a === "json" ? p.responseText : p.response,
        status: p.status,
        statusText: p.statusText,
        headers: S,
        config: t,
        request: p
      };
      ot(function(P) {
        n(P), y();
      }, function(P) {
        r(P), y();
      }, O), p = null;
    }
    "onloadend" in p ? p.onloadend = b : p.onreadystatechange = function() {
      !p || p.readyState !== 4 || p.status === 0 && !(p.responseURL && p.responseURL.indexOf("file:") === 0) || setTimeout(b);
    }, p.onabort = function() {
      p && (r(new m("Request aborted", m.ECONNABORTED, t, p)), p = null);
    }, p.onerror = function() {
      r(new m("Network Error", m.ERR_NETWORK, t, p)), p = null;
    }, p.ontimeout = function() {
      let k = s.timeout ? "timeout of " + s.timeout + "ms exceeded" : "timeout exceeded";
      const O = s.transitional || rt;
      s.timeoutErrorMessage && (k = s.timeoutErrorMessage), r(new m(
        k,
        O.clarifyTimeoutError ? m.ETIMEDOUT : m.ECONNABORTED,
        t,
        p
      )), p = null;
    }, i === void 0 && o.setContentType(null), "setRequestHeader" in p && l.forEach(o.toJSON(), function(k, O) {
      p.setRequestHeader(O, k);
    }), l.isUndefined(s.withCredentials) || (p.withCredentials = !!s.withCredentials), a && a !== "json" && (p.responseType = s.responseType), c && ([g, h] = te(c, !0), p.addEventListener("progress", g)), u && p.upload && ([f, w] = te(u), p.upload.addEventListener("progress", f), p.upload.addEventListener("loadend", w)), (s.cancelToken || s.signal) && (d = (S) => {
      p && (r(!S || S.type ? new q(null, t, p) : S), p.abort(), p = null);
    }, s.cancelToken && s.cancelToken.subscribe(d), s.signal && (s.signal.aborted ? d() : s.signal.addEventListener("abort", d)));
    const R = Pn(s.url);
    if (R && T.protocols.indexOf(R) === -1) {
      r(new m("Unsupported protocol " + R + ":", m.ERR_BAD_REQUEST, t));
      return;
    }
    p.send(i || null);
  });
}, Hn = (t, e) => {
  const { length: n } = t = t ? t.filter(Boolean) : [];
  if (e || n) {
    let r = new AbortController(), s;
    const i = function(c) {
      if (!s) {
        s = !0, a();
        const d = c instanceof Error ? c : this.reason;
        r.abort(d instanceof m ? d : new q(d instanceof Error ? d.message : d));
      }
    };
    let o = e && setTimeout(() => {
      o = null, i(new m(`timeout ${e} of ms exceeded`, m.ETIMEDOUT));
    }, e);
    const a = () => {
      t && (o && clearTimeout(o), o = null, t.forEach((c) => {
        c.unsubscribe ? c.unsubscribe(i) : c.removeEventListener("abort", i);
      }), t = null);
    };
    t.forEach((c) => c.addEventListener("abort", i));
    const { signal: u } = r;
    return u.unsubscribe = () => l.asap(a), u;
  }
}, jn = function* (t, e) {
  let n = t.byteLength;
  if (n < e) {
    yield t;
    return;
  }
  let r = 0, s;
  for (; r < n; )
    s = r + e, yield t.slice(r, s), r = s;
}, Vn = async function* (t, e) {
  for await (const n of $n(t))
    yield* jn(n, e);
}, $n = async function* (t) {
  if (t[Symbol.asyncIterator]) {
    yield* t;
    return;
  }
  const e = t.getReader();
  try {
    for (; ; ) {
      const { done: n, value: r } = await e.read();
      if (n)
        break;
      yield r;
    }
  } finally {
    await e.cancel();
  }
}, De = (t, e, n, r) => {
  const s = Vn(t, e);
  let i = 0, o, a = (u) => {
    o || (o = !0, r && r(u));
  };
  return new ReadableStream({
    async pull(u) {
      try {
        const { done: c, value: d } = await s.next();
        if (c) {
          a(), u.close();
          return;
        }
        let f = d.byteLength;
        if (n) {
          let g = i += f;
          n(g);
        }
        u.enqueue(new Uint8Array(d));
      } catch (c) {
        throw a(c), c;
      }
    },
    cancel(u) {
      return a(u), s.return();
    }
  }, {
    highWaterMark: 2
  });
}, ae = typeof fetch == "function" && typeof Request == "function" && typeof Response == "function", ct = ae && typeof ReadableStream == "function", Kn = ae && (typeof TextEncoder == "function" ? /* @__PURE__ */ ((t) => (e) => t.encode(e))(new TextEncoder()) : async (t) => new Uint8Array(await new Response(t).arrayBuffer())), ut = (t, ...e) => {
  try {
    return !!t(...e);
  } catch {
    return !1;
  }
}, zn = ct && ut(() => {
  let t = !1;
  const e = new Request(T.origin, {
    body: new ReadableStream(),
    method: "POST",
    get duplex() {
      return t = !0, "half";
    }
  }).headers.has("Content-Type");
  return t && !e;
}), Fe = 64 * 1024, Ee = ct && ut(() => l.isReadableStream(new Response("").body)), ne = {
  stream: Ee && ((t) => t.body)
};
ae && ((t) => {
  ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((e) => {
    !ne[e] && (ne[e] = l.isFunction(t[e]) ? (n) => n[e]() : (n, r) => {
      throw new m(`Response type '${e}' is not supported`, m.ERR_NOT_SUPPORT, r);
    });
  });
})(new Response());
const Wn = async (t) => {
  if (t == null)
    return 0;
  if (l.isBlob(t))
    return t.size;
  if (l.isSpecCompliantForm(t))
    return (await new Request(T.origin, {
      method: "POST",
      body: t
    }).arrayBuffer()).byteLength;
  if (l.isArrayBufferView(t) || l.isArrayBuffer(t))
    return t.byteLength;
  if (l.isURLSearchParams(t) && (t = t + ""), l.isString(t))
    return (await Kn(t)).byteLength;
}, Jn = async (t, e) => {
  const n = l.toFiniteNumber(t.getContentLength());
  return n ?? Wn(e);
}, Gn = ae && (async (t) => {
  let {
    url: e,
    method: n,
    data: r,
    signal: s,
    cancelToken: i,
    timeout: o,
    onDownloadProgress: a,
    onUploadProgress: u,
    responseType: c,
    headers: d,
    withCredentials: f = "same-origin",
    fetchOptions: g
  } = lt(t);
  c = c ? (c + "").toLowerCase() : "text";
  let w = Hn([s, i && i.toAbortSignal()], o), h;
  const y = w && w.unsubscribe && (() => {
    w.unsubscribe();
  });
  let p;
  try {
    if (u && zn && n !== "get" && n !== "head" && (p = await Jn(d, r)) !== 0) {
      let O = new Request(e, {
        method: "POST",
        body: r,
        duplex: "half"
      }), L;
      if (l.isFormData(r) && (L = O.headers.get("content-type")) && d.setContentType(L), O.body) {
        const [P, J] = Ne(
          p,
          te(ve(u))
        );
        r = De(O.body, Fe, P, J);
      }
    }
    l.isString(f) || (f = f ? "include" : "omit");
    const b = "credentials" in Request.prototype;
    h = new Request(e, {
      ...g,
      signal: w,
      method: n.toUpperCase(),
      headers: d.normalize().toJSON(),
      body: r,
      duplex: "half",
      credentials: b ? f : void 0
    });
    let R = await fetch(h);
    const S = Ee && (c === "stream" || c === "response");
    if (Ee && (a || S && y)) {
      const O = {};
      ["status", "statusText", "headers"].forEach((Ce) => {
        O[Ce] = R[Ce];
      });
      const L = l.toFiniteNumber(R.headers.get("content-length")), [P, J] = a && Ne(
        L,
        te(ve(a), !0)
      ) || [];
      R = new Response(
        De(R.body, Fe, P, () => {
          J && J(), y && y();
        }),
        O
      );
    }
    c = c || "text";
    let k = await ne[l.findKey(ne, c) || "text"](R, t);
    return !S && y && y(), await new Promise((O, L) => {
      ot(O, L, {
        data: k,
        headers: C.from(R.headers),
        status: R.status,
        statusText: R.statusText,
        config: t,
        request: h
      });
    });
  } catch (b) {
    throw y && y(), b && b.name === "TypeError" && /fetch/i.test(b.message) ? Object.assign(
      new m("Network Error", m.ERR_NETWORK, t, h),
      {
        cause: b.cause || b
      }
    ) : m.from(b, b && b.code, t, h);
  }
}), be = {
  http: un,
  xhr: qn,
  fetch: Gn
};
l.forEach(be, (t, e) => {
  if (t) {
    try {
      Object.defineProperty(t, "name", { value: e });
    } catch {
    }
    Object.defineProperty(t, "adapterName", { value: e });
  }
});
const Me = (t) => `- ${t}`, Xn = (t) => l.isFunction(t) || t === null || t === !1, dt = {
  getAdapter: (t) => {
    t = l.isArray(t) ? t : [t];
    const { length: e } = t;
    let n, r;
    const s = {};
    for (let i = 0; i < e; i++) {
      n = t[i];
      let o;
      if (r = n, !Xn(n) && (r = be[(o = String(n)).toLowerCase()], r === void 0))
        throw new m(`Unknown adapter '${o}'`);
      if (r)
        break;
      s[o || "#" + i] = r;
    }
    if (!r) {
      const i = Object.entries(s).map(
        ([a, u]) => `adapter ${a} ` + (u === !1 ? "is not supported by the environment" : "is not available in the build")
      );
      let o = e ? i.length > 1 ? `since :
` + i.map(Me).join(`
`) : " " + Me(i[0]) : "as no adapter specified";
      throw new m(
        "There is no suitable adapter to dispatch the request " + o,
        "ERR_NOT_SUPPORT"
      );
    }
    return r;
  },
  adapters: be
};
function fe(t) {
  if (t.cancelToken && t.cancelToken.throwIfRequested(), t.signal && t.signal.aborted)
    throw new q(null, t);
}
function qe(t) {
  return fe(t), t.headers = C.from(t.headers), t.data = de.call(
    t,
    t.transformRequest
  ), ["post", "put", "patch"].indexOf(t.method) !== -1 && t.headers.setContentType("application/x-www-form-urlencoded", !1), dt.getAdapter(t.adapter || W.adapter)(t).then(function(r) {
    return fe(t), r.data = de.call(
      t,
      t.transformResponse,
      r
    ), r.headers = C.from(r.headers), r;
  }, function(r) {
    return it(r) || (fe(t), r && r.response && (r.response.data = de.call(
      t,
      t.transformResponse,
      r.response
    ), r.response.headers = C.from(r.response.headers))), Promise.reject(r);
  });
}
const ft = "1.8.4", le = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((t, e) => {
  le[t] = function(r) {
    return typeof r === t || "a" + (e < 1 ? "n " : " ") + t;
  };
});
const He = {};
le.transitional = function(e, n, r) {
  function s(i, o) {
    return "[Axios v" + ft + "] Transitional option '" + i + "'" + o + (r ? ". " + r : "");
  }
  return (i, o, a) => {
    if (e === !1)
      throw new m(
        s(o, " has been removed" + (n ? " in " + n : "")),
        m.ERR_DEPRECATED
      );
    return n && !He[o] && (He[o] = !0, console.warn(
      s(
        o,
        " has been deprecated since v" + n + " and will be removed in the near future"
      )
    )), e ? e(i, o, a) : !0;
  };
};
le.spelling = function(e) {
  return (n, r) => (console.warn(`${r} is likely a misspelling of ${e}`), !0);
};
function Qn(t, e, n) {
  if (typeof t != "object")
    throw new m("options must be an object", m.ERR_BAD_OPTION_VALUE);
  const r = Object.keys(t);
  let s = r.length;
  for (; s-- > 0; ) {
    const i = r[s], o = e[i];
    if (o) {
      const a = t[i], u = a === void 0 || o(a, i, t);
      if (u !== !0)
        throw new m("option " + i + " must be " + u, m.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (n !== !0)
      throw new m("Unknown option " + i, m.ERR_BAD_OPTION);
  }
}
const Z = {
  assertOptions: Qn,
  validators: le
}, U = Z.validators;
let v = class {
  constructor(e) {
    this.defaults = e, this.interceptors = {
      request: new Pe(),
      response: new Pe()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(e, n) {
    try {
      return await this._request(e, n);
    } catch (r) {
      if (r instanceof Error) {
        let s = {};
        Error.captureStackTrace ? Error.captureStackTrace(s) : s = new Error();
        const i = s.stack ? s.stack.replace(/^.+\n/, "") : "";
        try {
          r.stack ? i && !String(r.stack).endsWith(i.replace(/^.+\n.+\n/, "")) && (r.stack += `
` + i) : r.stack = i;
        } catch {
        }
      }
      throw r;
    }
  }
  _request(e, n) {
    typeof e == "string" ? (n = n || {}, n.url = e) : n = e || {}, n = B(this.defaults, n);
    const { transitional: r, paramsSerializer: s, headers: i } = n;
    r !== void 0 && Z.assertOptions(r, {
      silentJSONParsing: U.transitional(U.boolean),
      forcedJSONParsing: U.transitional(U.boolean),
      clarifyTimeoutError: U.transitional(U.boolean)
    }, !1), s != null && (l.isFunction(s) ? n.paramsSerializer = {
      serialize: s
    } : Z.assertOptions(s, {
      encode: U.function,
      serialize: U.function
    }, !0)), n.allowAbsoluteUrls !== void 0 || (this.defaults.allowAbsoluteUrls !== void 0 ? n.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls : n.allowAbsoluteUrls = !0), Z.assertOptions(n, {
      baseUrl: U.spelling("baseURL"),
      withXsrfToken: U.spelling("withXSRFToken")
    }, !0), n.method = (n.method || this.defaults.method || "get").toLowerCase();
    let o = i && l.merge(
      i.common,
      i[n.method]
    );
    i && l.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      (h) => {
        delete i[h];
      }
    ), n.headers = C.concat(o, i);
    const a = [];
    let u = !0;
    this.interceptors.request.forEach(function(y) {
      typeof y.runWhen == "function" && y.runWhen(n) === !1 || (u = u && y.synchronous, a.unshift(y.fulfilled, y.rejected));
    });
    const c = [];
    this.interceptors.response.forEach(function(y) {
      c.push(y.fulfilled, y.rejected);
    });
    let d, f = 0, g;
    if (!u) {
      const h = [qe.bind(this), void 0];
      for (h.unshift.apply(h, a), h.push.apply(h, c), g = h.length, d = Promise.resolve(n); f < g; )
        d = d.then(h[f++], h[f++]);
      return d;
    }
    g = a.length;
    let w = n;
    for (f = 0; f < g; ) {
      const h = a[f++], y = a[f++];
      try {
        w = h(w);
      } catch (p) {
        y.call(this, p);
        break;
      }
    }
    try {
      d = qe.call(this, w);
    } catch (h) {
      return Promise.reject(h);
    }
    for (f = 0, g = c.length; f < g; )
      d = d.then(c[f++], c[f++]);
    return d;
  }
  getUri(e) {
    e = B(this.defaults, e);
    const n = at(e.baseURL, e.url, e.allowAbsoluteUrls);
    return nt(n, e.params, e.paramsSerializer);
  }
};
l.forEach(["delete", "get", "head", "options"], function(e) {
  v.prototype[e] = function(n, r) {
    return this.request(B(r || {}, {
      method: e,
      url: n,
      data: (r || {}).data
    }));
  };
});
l.forEach(["post", "put", "patch"], function(e) {
  function n(r) {
    return function(i, o, a) {
      return this.request(B(a || {}, {
        method: e,
        headers: r ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url: i,
        data: o
      }));
    };
  }
  v.prototype[e] = n(), v.prototype[e + "Form"] = n(!0);
});
let Yn = class ht {
  constructor(e) {
    if (typeof e != "function")
      throw new TypeError("executor must be a function.");
    let n;
    this.promise = new Promise(function(i) {
      n = i;
    });
    const r = this;
    this.promise.then((s) => {
      if (!r._listeners) return;
      let i = r._listeners.length;
      for (; i-- > 0; )
        r._listeners[i](s);
      r._listeners = null;
    }), this.promise.then = (s) => {
      let i;
      const o = new Promise((a) => {
        r.subscribe(a), i = a;
      }).then(s);
      return o.cancel = function() {
        r.unsubscribe(i);
      }, o;
    }, e(function(i, o, a) {
      r.reason || (r.reason = new q(i, o, a), n(r.reason));
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason)
      throw this.reason;
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(e) {
    if (this.reason) {
      e(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(e) : this._listeners = [e];
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(e) {
    if (!this._listeners)
      return;
    const n = this._listeners.indexOf(e);
    n !== -1 && this._listeners.splice(n, 1);
  }
  toAbortSignal() {
    const e = new AbortController(), n = (r) => {
      e.abort(r);
    };
    return this.subscribe(n), e.signal.unsubscribe = () => this.unsubscribe(n), e.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let e;
    return {
      token: new ht(function(s) {
        e = s;
      }),
      cancel: e
    };
  }
};
function Zn(t) {
  return function(n) {
    return t.apply(null, n);
  };
}
function er(t) {
  return l.isObject(t) && t.isAxiosError === !0;
}
const we = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511
};
Object.entries(we).forEach(([t, e]) => {
  we[e] = t;
});
function pt(t) {
  const e = new v(t), n = Ke(v.prototype.request, e);
  return l.extend(n, v.prototype, e, { allOwnKeys: !0 }), l.extend(n, e, null, { allOwnKeys: !0 }), n.create = function(s) {
    return pt(B(t, s));
  }, n;
}
const E = pt(W);
E.Axios = v;
E.CanceledError = q;
E.CancelToken = Yn;
E.isCancel = it;
E.VERSION = ft;
E.toFormData = oe;
E.AxiosError = m;
E.Cancel = E.CanceledError;
E.all = function(e) {
  return Promise.all(e);
};
E.spread = Zn;
E.isAxiosError = er;
E.mergeConfig = B;
E.AxiosHeaders = C;
E.formToJSON = (t) => st(l.isHTMLForm(t) ? new FormData(t) : t);
E.getAdapter = dt.getAdapter;
E.HttpStatusCode = we;
E.default = E;
const {
  Axios: ir,
  AxiosError: or,
  CanceledError: ar,
  isCancel: lr,
  CancelToken: cr,
  VERSION: ur,
  all: dr,
  Cancel: fr,
  isAxiosError: hr,
  spread: pr,
  toFormData: mr,
  AxiosHeaders: yr,
  HttpStatusCode: gr,
  formToJSON: Er,
  getAdapter: br,
  mergeConfig: wr
} = E, Re = E.create({
  baseURL: "https://app.posthog.com"
});
Re.interceptors.request.use((t) => (t.data = {
  ...t.data,
  api_key: "phc_eM9Ie4T0FvMBXIi5Dg0A9z6L2cT5Y0jY0zsJTQkYB6v"
}, t));
const he = {
  capture: (t, e) => Re.post("/capture", {
    event: t,
    properties: e
  }),
  merge: (t, e) => Re.post("/capture", {
    event: "$merge_dangerously",
    distinct_id: e,
    properties: {
      alias: t
    }
  })
}, $ = "village.distinct_id";
class F {
  static getDistinctId() {
    let e = localStorage.getItem($);
    if (e) return e;
    const n = Tt();
    return localStorage.setItem($, n), n;
  }
  static setUserId(e) {
    const n = localStorage.getItem($);
    n && n !== e && he.merge(n, e), localStorage.setItem($, e);
  }
  static removeUserId() {
    localStorage.removeItem($);
  }
  static trackButtonClick({ type: e, module: n, url: r, partnerKey: s }) {
    he.capture("PaaS Button Clicked", {
      type: e,
      module: n,
      url: r,
      partnerKey: s,
      distinct_id: this.getDistinctId(),
      $current_url: window.location.href
    });
  }
  static trackButtonRender({ partnerKey: e }) {
    he.capture("PaaS Button Rendered", {
      partnerKey: e,
      distinct_id: this.getDistinctId(),
      $current_url: window.location.href
    });
  }
}
class tr {
  constructor(e) {
    this.app = e, this.listenerMap = /* @__PURE__ */ new WeakMap(), this.syncUrlElements = /* @__PURE__ */ new Map(), this.elementsWithListeners = /* @__PURE__ */ new Set();
  }
  // Restored original handleDataUrl
  handleDataUrl(e, n) {
    this.removeListener(e), this.syncUrlElements.set(e, n);
    const r = () => {
      F.trackButtonClick({
        type: "paths",
        url: n,
        partnerKey: this.app.partnerKey
      }), this.app.url = n, this.app.module = null, this.app.renderIframe();
    };
    this.listenerMap.set(e, r), e.addEventListener("click", r), this.elementsWithListeners.add(e), this.app.initializeButtonState(e), this.app.token && this.app.checkPathsAndUpdateButton(e, n);
  }
  // Restored original handleModule (primarily for SYNC onboarding click)
  handleModule(e, n) {
    if (this.syncUrlElements.delete(e), !Object.values(X).includes(n)) {
      console.warn(`Invalid module type: ${n}`);
      return;
    }
    this.removeListener(e);
    const r = () => {
      try {
        F.trackButtonClick({
          type: "onboarding",
          // Assuming non-url module is onboarding
          module: n,
          partnerKey: this.app.partnerKey
        }), this.app.url = null, this.app.module = n, this.app.renderIframe();
      } catch (s) {
        $e(s, {
          additionalInfo: {
            function: "handleModule (click)",
            moduleValue: n,
            element: e
          }
        });
      }
    };
    this.listenerMap.set(e, r), e.addEventListener("click", r), this.elementsWithListeners.add(e);
  }
  removeListener(e) {
    const n = this.listenerMap.get(e);
    n && e.removeEventListener("click", n), this.syncUrlElements.delete(e), this.elementsWithListeners.delete(e);
  }
  // Method to get tracked elements for refresh
  getSyncUrlElements() {
    return this.syncUrlElements;
  }
  // Method to get all tracked elements for destroy cleanup
  getAllElementsWithListeners() {
    return this.elementsWithListeners;
  }
}
class nr {
  constructor(e, n) {
    this.partnerKey = e, this.userReference = null, this.token = I.get("village.token"), this.config = n, this.url = null, this.module = null, this.iframe = null, this.observer = null, this.inlineSearchIframes = /* @__PURE__ */ new Map(), this.messageHandlers = new Et(this), this.moduleHandlers = new tr(this), this.apiUrl = "http://localhost:8000", this.hasRenderedButton = !1;
  }
  async init() {
    this.setupMessageHandlers(), this.setupMutationObserver(), this.scanExistingElements(), this.getUser();
  }
  setupMessageHandlers() {
    window.addEventListener("message", (e) => {
      this.messageHandlers.handle(e);
    });
  }
  setupMutationObserver() {
    this.observer = new MutationObserver(this.handleMutations.bind(this)), this.observer.observe(document.body, {
      childList: !0,
      subtree: !0,
      attributes: !0,
      characterData: !0,
      characterDataOldValue: !0
    });
  }
  handleMutations(e) {
    e.forEach((n) => {
      n.type === "attributes" ? this.handleAttributeChange(n) : n.type === "childList" && this.handleNewElements(n);
    });
  }
  // Handle attribute changes on existing elements
  handleAttributeChange(e) {
    const n = e.target, r = e.attributeName;
    (r === H || r === j) && this.addListenerToElement(n);
  }
  // Handle new elements added to the DOM
  handleNewElements(e) {
    e.addedNodes.forEach((n) => {
      if (n.nodeType !== Node.ELEMENT_NODE) return;
      if (this.hasVillageAttributes(n)) {
        this.addListenerToElement(n);
        return;
      }
      const r = `[${H}], [${j}]`;
      n.querySelectorAll(r).forEach(this.addListenerToElement.bind(this));
    });
  }
  // Check if an element has any village attributes
  hasVillageAttributes(e) {
    return e.hasAttribute(H) || e.hasAttribute(j);
  }
  async addListenerToElement(e) {
    const n = e.getAttribute(H), r = e.getAttribute(j);
    if (r === X.SEARCH) {
      const s = {
        partnerKey: this.partnerKey,
        userReference: this.userReference,
        token: this.token
      }, i = mt(e, s);
      this.inlineSearchIframes.set(e, i);
    } else
      this.inlineSearchIframes.delete(e), n && !r ? this.moduleHandlers.handleDataUrl(e, n) : this.moduleHandlers.handleModule(
        e,
        r || X.SYNC
      ), this.hasRenderedButton || (this.hasRenderedButton = !0, F.trackButtonRender({ partnerKey: this.partnerKey }));
  }
  async getUser() {
    const e = I.get("village.token");
    if (e)
      try {
        const { data: n } = await E.get(`${this.apiUrl}/user`, {
          headers: { "x-access-token": e, "app-public-key": this.partnerKey }
        });
        if (!(n != null && n.id)) throw new Error("No user ID");
        const r = `${n == null ? void 0 : n.id}`;
        F.setUserId(r);
      } catch {
        this.token = null, I.remove("village.token"), F.removeUserId();
      }
  }
  handleOAuthRequest() {
    const e = "http://localhost:3000/widget/oauth", n = new URLSearchParams();
    this.partnerKey && n.append("partnerKey", this.partnerKey), this.userReference && n.append("userReference", this.userReference);
    const r = n.toString() ? `${e}?${n.toString()}` : e;
    window.open(r, "paas-oauth", "popup=true,width=500,height=600");
  }
  handleOAuthSuccess(e) {
    I.set("village.token", e.token, { secure: !0, expires: 60 }), this.token = e.token, this._refreshInlineSearchIframes(), this.refreshSyncUrlElements(), this.renderIframe();
  }
  _refreshInlineSearchIframes() {
    this.inlineSearchIframes.forEach((e, n) => {
      if (e && e.contentWindow) {
        const r = {
          partnerKey: this.partnerKey,
          userReference: this.userReference,
          token: this.token,
          module: X.SEARCH
        };
        e.src = Se(r);
      }
    });
  }
  handleOAuthError(e) {
    alert("Sorry, something went wrong with your login");
  }
  handleRemoveIframe() {
    this.url = null, this.module = null, this.renderIframe();
  }
  handleIframeLoaded() {
    this.iframe && this.iframe.hideSpinner();
  }
  scanExistingElements() {
    document.querySelectorAll(
      `[${H}], [${j}]`
    ).forEach(this.addListenerToElement.bind(this));
  }
  async checkPaths(e) {
    var n, r;
    if (!this.token) return null;
    try {
      const { data: s } = await E.post(
        `${this.apiUrl}/paths-check`,
        { url: e },
        {
          headers: {
            "x-access-token": this.token,
            "app-public-key": this.partnerKey
          }
        }
      );
      return s;
    } catch (s) {
      return ((r = (n = s == null ? void 0 : s.response) == null ? void 0 : n.data) == null ? void 0 : r.auth) === !1 && (I.remove("village.token"), this.token = null), null;
    }
  }
  getButtonChildren(e) {
    const n = e.querySelector(
      '[village-paths-availability="found"]'
    ), r = e.querySelector(
      '[village-paths-availability="not-found"]'
    ), s = e.querySelector(
      '[village-paths-availability="loading"]'
    );
    return { foundElement: n, notFoundElement: r, loadingElement: s };
  }
  initializeButtonState(e) {
    const { foundElement: n, notFoundElement: r, loadingElement: s } = this.getButtonChildren(e);
    if (!this.token) {
      n && (n.style.display = "none"), r && (r.style.display = "inline-flex"), s && (s.style.display = "none");
      return;
    }
    n && (n.style.display = "none"), r && (r.style.display = "none"), s && (s.style.display = "inline-flex");
  }
  async checkPathsAndUpdateButton(e, n) {
    try {
      const r = await this.checkPaths(n);
      this.updateButtonContent(e, r == null ? void 0 : r.relationship);
    } catch (r) {
      $e(r, {
        additionalInfo: {
          function: "checkPathsAndUpdateButton",
          url: n,
          element: e
        }
      }), this.updateButtonContent(e, null);
    }
  }
  addFacePilesAndCount(e, n) {
    const r = e.querySelector(
      '[village-paths-data="facepiles"]'
    );
    r && (r.innerHTML = `${n.paths.avatars.slice(0, 3).map(
      (i) => `<img src="${i}" onerror="this.src='https://randomuser.me/api/portraits/thumb/women/75.jpg';this.classList.add('village-facepiler-avatar-not-found')" />`
    ).join("")}`);
    const s = e.querySelector(
      '[village-paths-data="count"]'
    );
    s && (s.innerHTML = n.paths.count);
  }
  updateButtonContent(e, n) {
    const { foundElement: r, notFoundElement: s, loadingElement: i } = this.getButtonChildren(e);
    i && (i.style.display = "none"), n ? (r && (r.style.display = "inline-flex", this.addFacePilesAndCount(r, n)), s && (s.style.display = "none")) : (r && (r.style.display = "none"), s && (s.style.display = "inline-flex"));
  }
  renderIframe() {
    this.iframe || (this.iframe = new yt()), this.iframe.update({
      partnerKey: this.partnerKey,
      userReference: this.userReference,
      token: this.token,
      url: this.url,
      module: this.module,
      config: this.config
    }), this.iframe.render(document.body);
  }
  setUserReference(e, n = null) {
    return new Promise((r, s) => {
      try {
        this.userReference = e, this.renderIframe(), n != null && n.team && this.upsertTeam(n.team), r();
      } catch (i) {
        s(i);
      }
    });
  }
  async upsertTeam(e) {
    if (!(!this.token || !e))
      try {
        await E.post(
          `${this.apiUrl}/v1/teams/upsert`,
          { teamId: e.id, teamName: e.name },
          {
            params: { partnerKey: this.partnerKey },
            headers: { "x-access-token": this.token }
          }
        );
      } catch (n) {
        console.error(
          "[VILLAGE-PAAS] Failed to link user to team:",
          n.message
        );
      }
  }
  destroy() {
    this.observer && (this.observer.disconnect(), this.observer = null), this.inlineSearchIframes.forEach((n, r) => {
      n.parentNode === r && r.removeChild(n);
    }), this.inlineSearchIframes.clear(), this.moduleHandlers.getAllElementsWithListeners().forEach((n) => {
      this.moduleHandlers.removeListener(n);
    }), this.iframe && this.iframe.element && this.iframe.element.parentNode && this.iframe.element.parentNode.removeChild(this.iframe.element), this.iframe && this.iframe.spinner && this.iframe.spinner.parentNode && this.iframe.spinner.parentNode.removeChild(this.iframe.spinner), this.iframe = null;
  }
  // New method placeholder
  refreshSyncUrlElements() {
    this.moduleHandlers.getSyncUrlElements().forEach((n, r) => {
      this.initializeButtonState(r), this.checkPathsAndUpdateButton(r, n);
    });
  }
  async logout() {
    try {
      this.token && await E.get(`${this.apiUrl}/logout`, {
        headers: {
          "x-access-token": this.token,
          "app-public-key": this.partnerKey
        }
      });
    } catch {
    }
    I.remove("village.token"), this.token = null, F.removeUserId(), this.refreshSyncUrlElements(), this._refreshInlineSearchIframes();
  }
}
const D = {
  /** Fired when a CTA (e.g. button) is clicked */
  pathCtaClicked: "village.path.cta.clicked",
  /** Fired when the list of CTAs is updated */
  pathsCtaUpdated: "village.paths_cta.updated",
  /** Fired after user graph is successfully synced */
  userSynced: "village.user.synced",
  /** Fired when user graph sync fails */
  userSyncFailed: "village.user.sync.failed",
  /** Fired when OAuth popup is opened */
  oauthStarted: "village.oauth.started",
  /** Fired when OAuth login completes successfully */
  oauthSuccess: "village.oauth.success",
  /** Fired when OAuth login fails or is canceled */
  oauthError: "village.oauth.error",
  /** Fired when a general error occurs inside the widget */
  widgetError: "village.widget.error",
  /** Fired when the widget (App) is fully initialized and ready */
  widgetReady: "village.widget.ready"
}, ee = {};
function je(t, e) {
  (ee[t] ?? (ee[t] = [])).push(e);
}
function Ve(t, e) {
  if (typeof t != "string") {
    console.warn(
      `[Village] Event name must be a string. Received: ${typeof t}`
    );
    return;
  }
  const n = ee[t];
  n ? n.forEach((s) => {
    try {
      s(e);
    } catch (i) {
      console.error(
        `[Village] Error in listener for "${t}":`,
        i
      );
    }
  }) : console.warn(`[Village] No listeners registered for event: ${t}`, e);
  const r = { source: "VillageSDK", type: t, payload: e };
  try {
    window.postMessage(r, "*");
  } catch (s) {
    console.warn(
      `[Village] Failed to postMessage to window for event "${t}":`,
      s
    );
  }
  if (window.parent && window.parent !== window)
    try {
      window.parent.postMessage(r, "*");
    } catch (s) {
      console.warn(
        `[Village] Failed to postMessage to parent for event "${t}":`,
        s
      );
    }
}
(function(t) {
  function e() {
    const s = {}, i = {
      q: [],
      _config: {
        paths_cta: []
      },
      _partnerKey: null,
      _userReference: null,
      _app: null,
      _initialized: !1,
      /** Replace the entire CTA list */
      updatePathsCTA(o = []) {
        var a;
        return i._config.paths_cta = Array.isArray(o) ? o : [], (a = i.broadcast) == null || a.call(i, D.pathsCtaUpdated, i._config.paths_cta), i;
      },
      /** Add a single CTA object on the fly */
      addPathCTA(o) {
        var a;
        return o && typeof o.label == "string" && o.callback ? (i._config.paths_cta.push(o), (a = i.broadcast) == null || a.call(i, D.pathsCtaUpdated, i._config.paths_cta)) : console.warn("[Village] Invalid CTA object:", o), i;
      },
      off(o, a) {
        s[o] && (s[o] = s[o].filter((u) => u !== a));
      },
      on: je,
      emit: Ve,
      dispatch(o, a) {
        try {
          t.dispatchEvent(new CustomEvent(o, { detail: a }));
        } catch (u) {
          console.warn(`[Village] Failed to dispatch CustomEvent in current window for "${o}":`, u);
        }
      },
      broadcast(o, a) {
        var u, c;
        (u = i.emit) == null || u.call(i, o, a), (c = i.dispatch) == null || c.call(i, o, a);
      },
      _processQueue: function() {
        for (; i.q.length > 0; ) {
          var o = i.q.shift(), a = o[0], u = o.slice(1);
          typeof i[a] == "function" && i[a].apply(i, ...u);
        }
      },
      init(o, a) {
        if (i._initialized) return i;
        if (!o) throw new Error("Village: Partner key is required");
        return i._partnerKey = o, i._config = {
          ...a,
          paths_cta: []
          // placeholder, will be filled below (if any)
        }, i._initialized = !0, i._renderWidget(), Array.isArray(a == null ? void 0 : a.paths_cta) && a.paths_cta.length && i.updatePathsCTA(a.paths_cta), i;
      },
      identify: function(o, a) {
        return i._initialized ? new Promise((u, c) => {
          i._userReference = o, i._app.setUserReference(o, a).then(() => u()).catch((d) => c(d));
        }) : (i.q.push(["identify", o, a]), Promise.resolve());
      },
      logout: function() {
        if (!i._initialized) {
          i.q.push(["logout"]);
          return;
        }
        i._app && i._app.logout();
      },
      _renderWidget: function() {
        return new Promise((o, a) => {
          var u;
          try {
            i._app || (i._app = new nr(i._partnerKey, i._config)), i._app.init(), (u = i.broadcast) == null || u.call(i, D.widgetReady, {
              partnerKey: i._partnerKey,
              userReference: i._userReference
            }), o();
          } catch (c) {
            a(c);
          }
        });
      },
      // ✅ Expor CTAs
      getPathsCTA() {
        return i._config.paths_cta || [];
      },
      executeCallback(o) {
        const a = i.getPathsCTA();
        for (let u = 0; u < a.length; u++) {
          const c = a[u];
          if (c.callback && o.index == u)
            return c.callback(o), !0;
          console.log("getPathsCTA not execute", u, c);
        }
        console.log("📨 Relay received:", o), t !== t.parent && t.parent.postMessage(o, "*");
      }
    };
    return i.authorize = i.identify, i;
  }
  const n = t.Village, r = (n == null ? void 0 : n.q) || [];
  t.Village = e(), t.Village.on = je, t.Village.emit = Ve, t.Village.q = r.concat(t.Village.q), t.Village._processQueue(), t.Village.on(D.widgetReady, ({ partnerKey: s, userReference: i }) => {
    console.log("✅ Village widget is ready");
  }), t.Village.on(D.pathCtaClicked, (s) => {
    t.Village.executeCallback(s);
  }), t.__village_message_listener_attached__ || (console.log("✅ __village_message_listener_attached__"), t.addEventListener("message", (s) => {
    const i = s.data;
    !i || i.source !== "VillageSDK" || i.type === D.pathCtaClicked && t.Village.executeCallback(i.payload);
  }), t.__village_message_listener_attached__ = !0);
})(window);
