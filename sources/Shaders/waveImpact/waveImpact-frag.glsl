uniform sampler2D uTexture;
uniform float uTime;
uniform float uProgress; 

varying vec2 vUv;

void main() {
    vec2 centeredUv = vUv - vec2(0.5);

    vec4 noise = texture2D(uTexture, vUv + vec2(uTime * 0.1, uTime * -0.05));
    
    float distortedDist = length(centeredUv) - (noise.r * 0.12);

    float maxRadius = 0.75;
    float radius = uProgress * maxRadius;
    float thickness = 0.08 * (1.0 - uProgress); 

    float innerEdge = smoothstep(radius - thickness, radius, distortedDist);
    float outerEdge = smoothstep(radius + thickness, radius, distortedDist);
    float alphaMask = innerEdge * outerEdge;

  
    alphaMask *= smoothstep(1.0, 0.4, uProgress);

    vec3 hotColor = vec3(1.0, 0.5, 0.1);
    vec3 coolColor = vec3(1.0, 0.0, 0.0); 
    
    vec3 finalColor = mix(coolColor, hotColor, noise.r * 1.5);

    if (alphaMask < 0.01) discard;

    gl_FragColor = vec4(finalColor * alphaMask * 2.0, alphaMask);
}