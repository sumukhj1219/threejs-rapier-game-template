uniform vec3 uColorBright; // Set to Yellow (#ffe600)
uniform vec3 uColorMid;    // Set to Orange/Red (#ff3c00)
uniform vec3 uColorDark;   // Set to Deep Crimson (#8a0000)

uniform float uProgress;  
uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

void main() {
    vec2 movingUv = vUv + vec2(uTime * 0.15, uTime * 0.1);
    float noise = texture2D(uTexture, movingUv).r;
    
    // Control the crisp erosion over the timeline
    float threshold = (1.0 - uProgress) * 1.3;
    float value = noise * threshold;

    // Hard step bands for vector graphic cel-shading look
    float edgeMask = step(0.15, value);
    float midMask  = step(0.45, value);
    float coreMask  = step(0.75, value);
    
    // Cascade color mixing
    vec3 finalColor = uColorDark; 
    finalColor = mix(finalColor, uColorMid, midMask);
    finalColor = mix(finalColor, uColorBright, coreMask);

    // Punch up the yellow core brightness so it feels hot and instantaneous
    if (coreMask > 0.5) {
        finalColor *= 1.8;
    }

    // High-contrast alpha cutout
    float alpha = edgeMask * (1.0 - uProgress);

    gl_FragColor = vec4(finalColor, alpha);
}