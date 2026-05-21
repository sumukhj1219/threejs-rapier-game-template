uniform float uProgress;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    
    // Sample texture displacement
    vec4 noise = texture2D(uTexture, vUv);
    
    // Displace z position upwards slightly depending on explosion timeline
    vec3 transformed = position;
    transformed.z += noise.r * (1.0 - uProgress) * 0.5;

    vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
}