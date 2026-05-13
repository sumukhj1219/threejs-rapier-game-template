uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vPosition = position;

    vec4 noise = texture2D(uTexture, vUv);

    vec4 modelPosition = modelMatrix * vec4(position, 1.0) ;
    vec4 viewPosition = viewMatrix * modelPosition * noise.r * 0.5 ;
    vec4 projectedPosition = projectionMatrix * viewPosition - noise * 0.75 * sin(uTime);

    gl_Position = projectedPosition;
}   