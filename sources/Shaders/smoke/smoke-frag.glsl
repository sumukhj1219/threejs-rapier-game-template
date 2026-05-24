uniform sampler2D uSmokeTexture;
uniform float uTime;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vec2 centeredUv = vUv - vec2(0.5);
    float dist = length(centeredUv);

    float radialAlpha = smoothstep(0.5, 0.1, dist);

    vec4 smokeNoise1 = texture2D(uSmokeTexture, vUv + vec2(uTime * 0.05, uTime * 0.03));
    vec4 smokeNoise2 = texture2D(uSmokeTexture, vUv * 0.8 - vec2(uTime * 0.02, uTime * 0.04));
    float combinedNoise = (smokeNoise1.r + smokeNoise2.g) * 0.5;

    float alphaMask = radialAlpha * combinedNoise;
    
    alphaMask *= smoothstep(1.0, 0.6, uProgress);

    vec3 ashColor = vec3(0.15, 0.15, 0.16);     
    vec3 emberColor = vec3(1.0, 0.35, 0.05);    
    
    float fireIntensity = smoothstep(0.7, 0.1, uProgress) * smoothstep(0.4, 0.0, dist);
    vec3 finalColor = mix(ashColor, emberColor, fireIntensity * combinedNoise);

    if (alphaMask < 0.01) discard;

    gl_FragColor = vec4(finalColor, alphaMask * 0.8);
}