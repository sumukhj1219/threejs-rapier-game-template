uniform float uProgress;
uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

void main() {
    vUv = uv;
    
    vec3 localPos = position;
    vec3 normalDir = normalize(localPos);

    vec2 noiseUv = vec2(vUv.x * 4.0 + uTime * 0.16, vUv.y * 2.5 - uTime * 0.12);
    float baseNoise = texture2D(uTexture, noiseUv).r;
    float detailNoise = texture2D(uTexture, noiseUv * 2.2 + vec2(12.34, -4.13)).r;
    float longitudinalNoise = texture2D(uTexture, vec2(localPos.z * 3.5 + uTime * 0.08, vUv.x * 2.0)).g;

    float combinedNoise = mix(baseNoise, detailNoise, 0.5) * 0.8 + longitudinalNoise * 0.35;
    combinedNoise = pow(combinedNoise, 1.25);

    float axisFactor = smoothstep(0.0, 1.0, localPos.z);
    float spikeLength = axisFactor * (4.5 + combinedNoise * 4.0) * (1.0 - uProgress);
    float jitter = sin(localPos.z * 20.0 + combinedNoise * 7.2) * 0.22;

    vec3 displacedPosition = localPos + normalDir * spikeLength * (0.8 + jitter);
    displacedPosition += normalDir * longitudinalNoise * 0.5 * (1.0 - uProgress);

    vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    
    gl_Position = projectionMatrix * viewPosition;
}