uniform float uProgress;
uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
    vUv = uv;
    
    vec3 localPos = position;
    vec3 normalDir = normalize(localPos);

    float noise = texture2D(uTexture, vUv).r;

    float spikeFactor = pow(abs(sin(localPos.x * 12.0) * cos(localPos.y * 12.0) * sin(localPos.z * 12.0)), 3.0);
    
    float spikeLength = spikeFactor * 4.0 * (1.0 - uProgress);
    
    vec3 displacedPosition = localPos + normalDir * spikeLength * noise;

    vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    
    gl_Position = projectionMatrix * viewPosition;
}