// The confidence filter: an edge-preserving skin smoothing plus a light,
// warm grade, run on the GPU so it keeps up with the camera on a phone.
//
// Smoothing is a bilateral blur (neighbours that look alike are averaged,
// edges are kept) limited to skin-coloured pixels by a soft YCbCr skin mask —
// so eyes, lips, hair and the background stay sharp. The YCbCr skin ranges
// hold across light and dark skin tones far better than RGB thresholds.

export type FilterSettings = {
  preset: "off" | "soft" | "glow" | "custom"
  smooth: number // 0..1
  light: number // 0..1
  warmth: number // 0..1
}

export const FILTER_PRESETS: Record<Exclude<FilterSettings["preset"], "custom">, Omit<FilterSettings, "preset">> = {
  off: { smooth: 0, light: 0, warmth: 0 },
  soft: { smooth: 0.45, light: 0.25, warmth: 0.25 },
  glow: { smooth: 0.75, light: 0.5, warmth: 0.45 },
}

export const DEFAULT_FILTER: FilterSettings = { preset: "soft", ...FILTER_PRESETS.soft }

export const filterActive = (f: FilterSettings) => f.smooth > 0.01 || f.light > 0.01 || f.warmth > 0.01

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_texel;
uniform float u_smooth;
uniform float u_light;
uniform float u_warmth;
varying vec2 v_uv;

float skinMask(vec3 c) {
  float y = dot(c, vec3(0.299, 0.587, 0.114));
  float cb = 0.5 + dot(c, vec3(-0.168736, -0.331264, 0.5));
  float cr = 0.5 + dot(c, vec3(0.5, -0.418688, -0.081312));
  // Soft box around the classic skin cluster (Cb 77..127, Cr 133..173 of 255).
  float mcb = smoothstep(0.28, 0.32, cb) * (1.0 - smoothstep(0.50, 0.54, cb));
  float mcr = smoothstep(0.50, 0.54, cr) * (1.0 - smoothstep(0.68, 0.72, cr));
  float my = smoothstep(0.05, 0.12, y);
  return mcb * mcr * my;
}

void main() {
  vec3 center = texture2D(u_tex, v_uv).rgb;
  vec3 color = center;

  if (u_smooth > 0.001) {
    vec3 sum = center;
    float wsum = 1.0;
    float radius = 1.0 + u_smooth * 5.0;
    for (int ring = 1; ring <= 2; ring++) {
      float r = radius * float(ring) * 0.5;
      for (int i = 0; i < 12; i++) {
        float a = float(i) * 0.5235988 + float(ring) * 0.26;
        vec2 off = vec2(cos(a), sin(a)) * r * u_texel;
        vec3 s = texture2D(u_tex, v_uv + off).rgb;
        vec3 d = s - center;
        float w = exp(-dot(d, d) * 90.0) * (ring == 1 ? 1.0 : 0.7);
        sum += s * w;
        wsum += w;
      }
    }
    vec3 smoothed = sum / wsum;
    float mask = skinMask(center);
    color = mix(center, smoothed, mask * u_smooth);
  }

  // Lift shadows gently, then a touch of brightness and warmth.
  color = pow(color, vec3(1.0 - u_light * 0.18));
  color += u_light * 0.035;
  color.r += u_warmth * 0.03;
  color.b -= u_warmth * 0.03;
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, 1.0 + u_light * 0.06);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`

export class BeautyFilter {
  private gl: WebGLRenderingContext | null = null
  private program: WebGLProgram | null = null
  private tex: WebGLTexture | null = null
  private loc: { texel: WebGLUniformLocation | null; smooth: WebGLUniformLocation | null; light: WebGLUniformLocation | null; warmth: WebGLUniformLocation | null } | null =
    null
  readonly canvas: HTMLCanvasElement
  failed = false

  constructor() {
    this.canvas = document.createElement("canvas")
  }

  private init(): boolean {
    if (this.gl) return true
    if (this.failed) return false
    const gl = this.canvas.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false })
    if (!gl) {
      this.failed = true
      return false
    }
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const program = gl.createProgram()
    if (!vs || !fs || !program) {
      this.failed = true
      return false
    }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.failed = true
      return false
    }
    gl.useProgram(program)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(program, "a_pos")
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    this.gl = gl
    this.program = program
    this.tex = tex
    this.loc = {
      texel: gl.getUniformLocation(program, "u_texel"),
      smooth: gl.getUniformLocation(program, "u_smooth"),
      light: gl.getUniformLocation(program, "u_light"),
      warmth: gl.getUniformLocation(program, "u_warmth"),
    }
    return true
  }

  // Returns the filtered frame, or null to draw the raw camera instead.
  process(video: HTMLVideoElement, f: FilterSettings): HTMLCanvasElement | null {
    if (!filterActive(f) || video.readyState < 2 || video.videoWidth === 0) return null
    if (!this.init()) return null
    const gl = this.gl!
    // Work at up to 1280 px wide: plenty for a face, light on the GPU.
    const k = Math.min(1, 1280 / video.videoWidth)
    const w = Math.round(video.videoWidth * k)
    const h = Math.round(video.videoHeight * k)
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    gl.viewport(0, 0, w, h)
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video)
    } catch {
      return null
    }
    const l = this.loc!
    gl.uniform2f(l.texel, 1 / w, 1 / h)
    gl.uniform1f(l.smooth, f.smooth)
    gl.uniform1f(l.light, f.light)
    gl.uniform1f(l.warmth, f.warmth)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    return this.canvas
  }
}
