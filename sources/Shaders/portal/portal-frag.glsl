uniform sampler2D uTexture;

varying vec2 vUv;
varying vec2 vAnimatedUv; 

void main() {
    vec2 center = vec2(0.5, 0.5);
    float distanceToCenter = distance(vUv, center);

    vec4 noise = texture2D(uTexture, vAnimatedUv);

    float distortedRadius = 0.6 + (noise.r * 0.1);

    if (distanceToCenter > distortedRadius) {
        discard;
    }
    
    float alpha = smoothstep(distortedRadius, distortedRadius - 0.01, distanceToCenter);

    vec4 textureColor = texture2D(uTexture, vUv);

    gl_FragColor = vec4(vec3(1.0), textureColor.a * alpha);
}