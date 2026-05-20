uniform sampler2D uBaseTexture;

varying vec2 vUv;

void main() {

    vec4 noise = texture2D(uBaseTexture, vUv) * 0.5;
    vec4 extraNoise = texture2D(uBaseTexture, vUv * 2.0) * 0.5;

    float combinedNoise = (noise.r + extraNoise.r) / 2.0;
    float dissolve = smoothstep(0.01, 0.6, combinedNoise);

    vec3 color = mix(vec3(1.0,0.5,0.0), vec3(1.0,1.0,0.0), dissolve);

    gl_FragColor = vec4(color, 1.0);
}