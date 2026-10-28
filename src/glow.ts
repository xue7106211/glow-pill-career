// Raw WebGL glow pill: one fullscreen-quad fragment pass.
// Opaque black-glass stadium, liquid light pooled along its bottom edge,
// and a "surge" uniform that pushes the light up the glass on each phrase swap.
type RGB = [number, number, number]

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

const FRAG = `
precision highp float;
uniform vec2 uRes;      // canvas px
uniform vec2 uSize;     // pill size px
uniform float uTime;
uniform float uSurge;   // 0..1, decays after swap
uniform float uPress;   // 0..1 hover/press
uniform vec3 uColA;     // current accent
uniform vec3 uColB;     // previous accent
uniform float uMix;     // A/B crossfade

float sdStadium(vec2 p, vec2 b){
  float r = b.y;
  vec2 q = vec2(max(abs(p.x) - (b.x - r), 0.0), p.y);
  return length(q) - r;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 p = frag - uRes*0.5;               // px, y up
  vec2 b = uSize*0.5;
  float d = sdStadium(p, b);
  vec3 col = mix(uColB, uColA, uMix);
  float t = uTime;

  // normalized coords inside pill: v=0 bottom edge, 1 top edge
  float v = (p.y + b.y) / (2.0*b.y);
  float u = p.x / b.x;

  // liquid surface height: low pool + surge, with slow waves
  float wave = (fbm(vec2(u*2.2 + t*0.25, t*0.18)) - 0.5) * 0.22;
  float level = 0.20 + 0.10*uPress + uSurge*0.95 + wave*(0.6+uSurge);
  float edgeFall = 1.0 - 0.35*smoothstep(0.55, 1.0, abs(u));   // pooled toward middle
  level *= edgeFall;
  float liquid = smoothstep(level + 0.22, level - 0.18, v);
  // inner caustic shimmer
  float caus = fbm(vec2(u*5.0 - t*0.6, v*3.0 + t*0.4));
  vec3 light = col * (0.55 + 0.9*caus) * liquid;
  light += vec3(1.0) * pow(liquid, 6.0) * 0.18 * (1.0 + uSurge); // hot core near bottom

  // black glass body
  vec3 glass = vec3(0.012, 0.012, 0.016);
  // top specular sheen
  float sheen = smoothstep(0.62, 0.98, v) * (1.0 - smoothstep(0.75, 1.0, abs(u))) * 0.07;
  // rim: thin bright edge, brighter where light pools
  float rim = smoothstep(1.6, 0.0, abs(d + 0.8));
  vec3 rimCol = mix(vec3(0.16), col*1.2 + 0.15, clamp(liquid*1.4 + 0.15, 0.0, 1.0));

  vec3 inside = glass + light*(0.85 + 0.15*(1.0-v)) + sheen;
  inside += rim * rimCol * 0.9;

  float a = smoothstep(1.0, -1.0, d);
  // outer bloom leaking below and around
  float bloomD = max(d, 0.0);
  float under = smoothstep(b.y*1.6, -b.y*0.4, -p.y + b.y*0.2); // biased downward
  float bloom = exp(-bloomD / (14.0 + 26.0*uSurge)) * (0.30 + 0.55*uSurge) * (0.35 + 0.65*under);
  vec3 outside = col * bloom;

  vec3 c = mix(outside, inside, a);
  float alpha = max(a, clamp(bloom*1.6, 0.0, 1.0));
  // premultiplied output
  gl_FragColor = vec4(c, alpha);
}
`

export type GlowHandle = {
  surge: (to: RGB) => void
  setPress: (v: number) => void
  setStatic: (v: boolean) => void
  dispose: () => void
}

export function createGlow(canvas: HTMLCanvasElement, initial: RGB, isStatic: boolean): GlowHandle | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true })
  if (!gl) return null
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
    return s
  }
  let prog: WebGLProgram
  try {
    prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  } catch {
    return null
  }
  gl.useProgram(prog)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const U = (n: string) => gl.getUniformLocation(prog, n)
  const uRes = U('uRes'), uSize = U('uSize'), uTime = U('uTime'), uSurge = U('uSurge')
  const uPress = U('uPress'), uColA = U('uColA'), uColB = U('uColB'), uMix = U('uMix')

  let colA: RGB = initial, colB: RGB = initial
  let mixV = 1, surgeV = 0, pressV = 0, pressTarget = 0
  let stat = isStatic
  let raf = 0, last = performance.now(), time = 0

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!stat) time += dt
    surgeV *= Math.exp(-dt * 1.9)
    mixV = Math.min(1, mixV + dt * 2.2)
    pressV += (pressTarget - pressV) * Math.min(1, dt * 8)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    gl.viewport(0, 0, canvas.width, canvas.height)
    const pill = canvas.parentElement!.querySelector('.pill') as HTMLElement
    const pw = (pill?.offsetWidth || w * 0.6) * dpr, ph = (pill?.offsetHeight || 64) * dpr
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform2f(uSize, pw, ph)
    gl.uniform1f(uTime, time)
    gl.uniform1f(uSurge, stat ? 0 : surgeV)
    gl.uniform1f(uPress, pressV)
    gl.uniform3fv(uColA, colA)
    gl.uniform3fv(uColB, colB)
    gl.uniform1f(uMix, mixV)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return {
    surge(to) {
      colB = colA.map((c, i) => c * mixV + colB[i] * (1 - mixV)) as RGB
      colA = to
      mixV = 0
      surgeV = stat ? 0 : 1
    },
    setPress(v) { pressTarget = v },
    setStatic(v) { stat = v },
    dispose() { cancelAnimationFrame(raf) },
  }
}
