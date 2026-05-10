uniform vec3 uColor;
uniform float uStrength;

varying vec2 vUv;

void main() {
    float dist = distance(vUv, vec2(0.5));

    float mask = 0.05 / dist;
    mask -= 0.01;    
    vec3 finalColor = uColor * mask * uStrength;
    
    gl_FragColor = vec4(finalColor, mask);
}