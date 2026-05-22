uniform vec3 uColorBright;
uniform vec3 uColorMid;
uniform vec3 uColorDark;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vec2 uv = vUv - vec2(0.5);
    float dist = length(uv);
    vec4 noise = texture2D(uTexture, vUv * 2.5 + vec2(uTime * 0.22, uTime * 0.15));

    float pulse = sin((dist - uProgress * 0.6) * 24.0 + noise.r * 6.0);
    float ring = smoothstep(0.14 + uProgress * 0.18, 0.13 + uProgress * 0.18, dist);
    float glow = smoothstep(0.3, 0.05, abs(dist - (0.25 + uProgress * 0.3)));

    float alpha = ring * glow * (1.0 - uProgress) * (0.6 + noise.r * 0.4);
    vec3 ringColor = mix(uColorMid, uColorBright, pulse * 0.5 + 0.5);
    vec3 color = mix(uColorDark, ringColor, glow) * (0.9 + noise.g * 0.4);

    gl_FragColor = vec4(color, alpha);
}
