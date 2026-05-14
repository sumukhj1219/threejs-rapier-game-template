uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

void main() {
    float dist = length(vUv - vec2(0.5));
    vec4 noise = texture2D(uTexture, vUv);

    float radius = 0.5 * sin(uTime * 2.0);
    float thickness = 0.075;

    float alpha = smoothstep(radius + thickness, radius, dist) - smoothstep(radius, radius - thickness, dist);
    alpha *= noise.r;

    vec3 color = vec3(0.1, 0.1, 0.1) * alpha;

    gl_FragColor = vec4(color, alpha);
}