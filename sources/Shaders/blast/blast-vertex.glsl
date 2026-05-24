uniform sampler2D uTexture;
uniform sampler2D uSpikeTexture;
uniform float uTime;
uniform float uStrength; 

varying vec2 vUv;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
    vUv = uv;
    
    vec4 baseNoise = texture2D(uTexture, vUv + vec2(uTime * 0.15, uTime * 0.1));
    vec4 spikeNoise = texture2D(uSpikeTexture, vUv + vec2(uTime * -0.2, uTime * 0.15));

    float combinedNoise = baseNoise.r * spikeNoise.r;

    float cleanSpikes = smoothstep(0.35, 0.85, combinedNoise);

    float sharpSpikes = pow(cleanSpikes, 1.0) * 2.0; 

    vec3 displacedPosition = position + normalize(position) * sharpSpikes * uStrength;
    
    vPosition = displacedPosition;
    vDisplacement = cleanSpikes; 

    vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
}