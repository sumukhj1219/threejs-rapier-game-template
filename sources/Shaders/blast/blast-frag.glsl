uniform vec3 uColorBright; 
uniform vec3 uColorMid;    
uniform vec3 uColorDark;  

uniform float uStrength;  
uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

void main() {
    float noise = texture2D(uTexture, vUv).r;
    
    float life = noise * uStrength;

    float smokeMask = smoothstep(0.15, 0.25, life);
    float fireMask  = smoothstep(0.45, 0.52, life);
    float coreMask  = smoothstep(0.75, 0.82, life);
    
    vec3 finalColor = uColorDark; 
    
    finalColor = mix(finalColor, uColorMid, fireMask);
    finalColor = mix(finalColor, uColorBright, coreMask);

    if (fireMask > 0.1) {
        finalColor *= 1.5;
    }

    float alpha = smoothstep(0.12, 0.2, life) * uStrength;

    gl_FragColor = vec4(finalColor, alpha);
}