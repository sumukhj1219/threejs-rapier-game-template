uniform vec3 uColorBright;
uniform vec3 uColorMid;
uniform vec3 uColorDark;

uniform float uProgress;
uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

void main() {
    vec2 movingUv = vUv * 2.3 + vec2(uTime * 0.18, -uTime * 0.12);
    float noise = texture2D(uTexture, movingUv).r;
    float noise2 = texture2D(uTexture, vUv * 3.1 + vec2(uTime * 0.1)).r;
    float combined = mix(noise, noise2, 0.45);

    float threshold = (1.0 - uProgress) * 1.15;
    float value = combined * threshold;

    float darkMid = smoothstep(0.18, 0.45, value);
    float midBright = smoothstep(0.45, 0.75, value);
    vec3 baseColor = mix(uColorDark, uColorMid, darkMid);
    vec3 finalColor = mix(baseColor, uColorBright, midBright);

    float brightness = 1.0 + midBright * 1.0 * (1.0 - uProgress);
    finalColor *= brightness;

    float glow = smoothstep(0.08, 0.22, value) * (1.0 - uProgress);
    float alpha = smoothstep(0.08, 0.38, value) * glow;

    gl_FragColor = vec4(finalColor, alpha);
}