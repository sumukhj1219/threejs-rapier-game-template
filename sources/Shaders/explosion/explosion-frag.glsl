uniform float uTime;
varying vec2 vUv;
varying float vDissolveMask;

void main() {
    vec2 centerUv = vUv * 10.0 - 1.0;
    float centerGlow = 1.0 - length(centerUv);
    centerGlow = smoothstep(0.0, 0.8, centerGlow); 

    vec3 coreWhite = vec3(9.0, 5.0, 4.0); 
    vec3 midYellow = vec3(10.0, 1.8, 0.3);  
    vec3 edgeOrange = vec3(1.5, 0.3, 0.0); 
    
    float dissolveThreshold = uTime * 0.9; 
    if (vDissolveMask < dissolveThreshold) {
        discard; 
    }

    float colorMix = smoothstep(dissolveThreshold, dissolveThreshold + 0.3, vDissolveMask);
    vec3 finalColor = mix(edgeOrange, midYellow, colorMix);

    float flashIntensity = (1.0 - uTime) * 2.5;
    finalColor += coreWhite * centerGlow * flashIntensity;

    gl_FragColor = vec4(finalColor, 1.0);
}