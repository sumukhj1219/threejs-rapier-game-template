uniform float uTime;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vec3 transformed = position;

    float riseEffect = uProgress * 1.5;
    transformed.y += riseEffect;

    vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    vPosition = transformed;
    gl_Position = projectedPosition;
}