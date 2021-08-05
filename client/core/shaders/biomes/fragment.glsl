uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor; 
uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;
varying vec3 vColor;


void main()
{
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);

    color *= vColor;

    gl_FragColor = vec4(color, 1.0);
}