uniform vec3 uColorBright; 
uniform vec3 uColorDark;   
uniform float uStrength;  
uniform sampler2D uTexture;

uniform float uBloom; 

varying vec2 vUv;

void main() {
    float noise = texture2D(uTexture, vUv).r;
    
    float life = noise * uStrength;

    vec3 colorWhite  = vec3(1.0, 1.0, 0.9);  
    vec3 colorYellow = vec3(1.0, 0.8, 0.0) * uBloom; 
    vec3 colorOrange = uColorBright;          
    vec3 colorRed    = uColorDark * uBloom;        
    vec3 colorGray   = vec3(0.1, 0.1, 0.1);   
    
    float yellowMask = smoothstep(0.6, 0.65, life);
    float orangeMask = smoothstep(0.4, 0.45, life);
    float redMask    = smoothstep(0.25, 0.3, life);
    float grayMask   = smoothstep(0.1, 0.15, life);

    vec3 finalColor = colorGray;
    
    finalColor = mix(finalColor, colorRed,    redMask);
    finalColor = mix(finalColor, colorOrange, orangeMask);
    finalColor = mix(finalColor, colorYellow, yellowMask);
    
    float whiteMask = smoothstep(0.75, 0.8, life);
    finalColor = mix(finalColor, colorWhite, whiteMask);

    float alpha = grayMask;

    gl_FragColor = vec4(finalColor, alpha);
}