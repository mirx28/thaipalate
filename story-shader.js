export const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uSpread;
  varying vec2 vUv;

  float hash(vec2 p) {
    vec3 p2 = vec3(p.xy, 1.0);
    return fract(sin(dot(p2, vec3(37.1, 61.7, 12.4))) * 3758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    value += noise(p * 1.0) * 0.5;
    value += noise(p * 2.0) * 0.25;
    value += noise(p * 4.0) * 0.125;
    return value;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 centeredUv = (vUv - 0.5) * vec2(aspect, 1.0);
    float dissolveEdge = vUv.y - uProgress * 1.2;
    float noiseValue = fbm(centeredUv * 15.0);
    float distanceFromEdge = dissolveEdge + noiseValue * uSpread;
    float pixelSize = 1.0 / uResolution.y;
    float alpha = 1.0 - smoothstep(-pixelSize, pixelSize, distanceFromEdge);

    gl_FragColor = vec4(uColor, alpha);
  }
`;