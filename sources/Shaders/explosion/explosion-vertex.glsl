uniform sampler2D uBaseTexture;
uniform float uTime;
uniform float uGrowth;
uniform float uSpikeLength;
uniform float uRandomSeed; 

varying vec2 vUv;
varying float vDissolveMask;

void main() {
    vUv = uv + vec2(uRandomSeed * 12.34, uRandomSeed * 56.78); 
    
    vec4 noise = texture2D(uBaseTexture, vUv);
    vec3 newPosition = position;

    float spikeCutoff = step(0.85, noise.r);
    
    newPosition += normal * (spikeCutoff * uSpikeLength * uTime);

    newPosition += normal * (uTime * uGrowth);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

    vDissolveMask = noise.r;
}