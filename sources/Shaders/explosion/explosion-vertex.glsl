uniform sampler2D uBaseTexture;

varying vec2 vUv;

void main() {
    vec4 noise = texture2D(uBaseTexture, uv);

    vec3 newPosition = position;
    newPosition += normal * noise.r * 1.0;
    newPosition += step(0.9, noise.r) * normal * 2.0;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

    vUv = uv;
}