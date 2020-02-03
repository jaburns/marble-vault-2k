uniform highp mat4 g;

highp vec2 writeFloat(highp float a) {
    a = (a + 1.) / 2.;
    return vec2(
        floor(a*255.) / 255.,
        fract(255. * a)
    );
}

highp float readFloat(highp vec2 a) {
    return (a.x/255. + a.y/255./255.) * 2. - 1.;
}

void main() {
    highp vec2 pos = gl_FragCoord.xy;

    bool left = mod(g[0].z, 2.) > 0.;
    bool right = g[0].z > 1.9;

    if (pos.y < 1. && pos.x < 4.) {
        highp vec2 pos = vec2(readFloat(g[1].xy), readFloat(g[1].zw));
        if (left) pos.x += 0.001;
        if (right) pos.x -= 0.001;
        gl_FragColor = vec4(writeFloat(pos.x), writeFloat(-1.));
    } else {
        highp vec2 m = (pos - g[0].xy * .5) / g[0].y;
        highp vec2 pos = vec2(readFloat(g[1].xy), readFloat(g[1].zw));
        m.x += pos.x;

        highp vec3 col = length(m) > .1 ? vec3(0) : left ? vec3(1,0,0) : right ? vec3(0,1,0) : vec3(1);
        highp float x = max((6.*length(m-vec2(.04))) + .9,0.);
        col *= 1./x/x;
        gl_FragColor = vec4(col,1);
    }
}