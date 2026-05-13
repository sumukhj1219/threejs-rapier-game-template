uniform vec3 uColorBright;
uniform vec3 uColorDark;
uniform float uStrength;
uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
    vec4 noise = texture2D(uTexture, vUv);
    vec3 brightness = vec3(242/255, 223/255, 12/255);
    
    vec3 finalColor = uColorBright + uStrength + brightness * noise.r;
    
    gl_FragColor = noise * vec4(finalColor, 1.0);
}