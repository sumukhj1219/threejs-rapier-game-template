uniform vec3 uColorBright; 
uniform vec3 uColorDark;   
uniform float uStrength;  
uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

void main() {
    float noise = texture2D(uTexture, vUv).r;
    
    float life = noise * uStrength;

    vec3 neonRed = vec3(1.0, 0.0, 0.2);
    vec3 neonYellow = vec3(1.0, 0.9, 0.1);
    vec3 neonWhite = vec3(1.0, 1.0, 1.0);
    
    float outerGlowMask = smoothstep(0.0, 0.5, life);
    float innerGlowMask = smoothstep(0.4, 0.7, life);
    float coreMask = smoothstep(0.7, 1.0, life);

    vec3 finalColor = mix(vec3(0.0), neonRed, outerGlowMask);
    finalColor = mix(finalColor, neonYellow, innerGlowMask);
    finalColor = mix(finalColor, neonWhite, coreMask);

    finalColor *= 1.2; 

    float alpha = smoothstep(0.1, 0.4, life) * uStrength;

    gl_FragColor = vec4(finalColor, alpha);
}