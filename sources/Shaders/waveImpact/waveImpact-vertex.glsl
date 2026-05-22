uniform float uProgress;
uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vPosition = position;

    vec2 centered = uv - vec2(0.5);
    float radius = length(centered);
    vec4 noise = texture2D(uTexture, uv * 2.8 + vec2(uTime * 0.15, -uTime * 0.12));

    vec3 transformed = position;
    float pulse = sin(radius * 20.0 - uProgress * 8.0 + uTime * 2.8) * 0.1;
    transformed.z += noise.r * (1.0 - uProgress) * 0.8 + pulse * (1.0 - uProgress);
    transformed.xy += normalize(centered) * noise.g * 0.32 * (1.0 - uProgress);

    vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
}
