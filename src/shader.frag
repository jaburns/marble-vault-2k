uniform highp mat4 g;

highp vec2 writeFloat(highp float a)
{
    a = (a + 1.) / 2.;
    return vec2(
        floor(a*255.) / 255.,
        fract(255. * a)
    );
}

highp float readFloat(highp vec2 a)
{
    return (a.x/255. + a.y/255./255.) * 2. - 1.;
}

void main()
{
    highp vec2 coord = gl_FragCoord.xy;
    highp vec2 pos = vec2(readFloat(g[1].xy), readFloat(g[1].zw));
    highp vec2 vel = vec2(readFloat(g[2].xy), readFloat(g[2].zw));

    bool left  = mod(g[0].z,      2.) > .9;
    bool right = mod(g[0].z / 2., 2.) > .9;
    bool up    = mod(g[0].z / 4., 2.) > .9;
    bool down  = mod(g[0].z / 8., 2.) > .9;
    highp float seed = floor(g[0].z / 16.) / 999.;

// Rendering

    highp vec2 m = (coord - g[0].xy * .5) / g[0].y;

    m -= pos;

    highp vec3 col = length(m) > .1 ? vec3(0) : vec3(.714,.376,.706);
    highp float x = max((6.*length(m-vec2(.04))) + .9,0.);
    col *= 1./x/x;
    gl_FragColor = vec4(col,1);

// State update

    if (coord.y < 1. && coord.x < 4.)
    {
        if (left)  vel.x -= 0.1;
        if (right) vel.x += 0.1;
        if (up)    vel.y += 0.1;
        if (down)  vel.y -= 0.1;

        pos += 0.01 * vel;
        vel *= 0.95;

        gl_FragColor = vec4(writeFloat(seed), 0, 0);

        if (coord.x < 2.) {
            gl_FragColor = vec4(writeFloat(pos.x), writeFloat(pos.y)); // g[1]
        }
        else if (coord.x < 3.) {
            gl_FragColor = vec4(writeFloat(vel.x), writeFloat(vel.y)); // g[2]
        }
    }
}